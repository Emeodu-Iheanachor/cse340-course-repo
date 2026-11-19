import db from '../../models/db.js'


/**
 * Get all services awaiting administrator approval.
 *
 * Includes provider and service category information.
 */
export async function getPendingServices() {

    const sql = `
        SELECT
            us.user_service_id,
            us.user_id,
            us.service_category_id,
            us.service_name,
            us.description,
            us.location,
            us.service_area,
            us.availability_status,
            us.approval_status,
            us.is_active,
            us.created_at,

            u.name AS provider_name,
            u.email AS provider_email,

            sc.category_name

        FROM user_services us

        INNER JOIN users u
            ON us.user_id = u.user_id

        INNER JOIN service_categories sc
            ON us.service_category_id = sc.service_category_id

        WHERE us.approval_status = 'pending'

        ORDER BY us.created_at ASC
    `

    const result = await db.query(sql)

    return result.rows
}



/**
 * Get all marketplace services for administrator management.
 *
 * Includes provider and category information.
 * Displays every approval status.
 *
 * This function only retrieves information.
 * It does not modify any service records.
 */
export async function getAllManagedServices() {

    const sql = `
        SELECT
            us.user_service_id,
            us.user_id,
            us.service_category_id,
            us.service_name,
            us.description,
            us.location,
            us.service_area,
            us.availability_status,
            us.approval_status,
            us.is_active,
            us.created_at,
            us.updated_at,

            u.name AS provider_name,
            u.email AS provider_email,

            sc.category_name

        FROM user_services us

        INNER JOIN users u
            ON us.user_id = u.user_id

        INNER JOIN service_categories sc
            ON us.service_category_id = sc.service_category_id

        ORDER BY
            CASE us.approval_status
                WHEN 'pending' THEN 1
                WHEN 'approved' THEN 2
                WHEN 'suspended' THEN 3
                WHEN 'rejected' THEN 4
                WHEN 'cancelled' THEN 5
                ELSE 6
            END,

            us.updated_at DESC
    `

    const result = await db.query(sql)

    return result.rows
}


/**
 * Get an individual service submission.
 *
 * Includes provider and category information.
 */
export async function getServiceById(serviceId) {

    const id = Number(serviceId)

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('Invalid service ID.')
    }

    const sql = `
        SELECT
            us.user_service_id,
            us.user_id,
            us.service_category_id,
            us.service_name,
            us.description,
            us.location,
            us.service_area,
            us.availability_status,
            us.approval_status,
            us.is_active,
            us.created_at,
            us.updated_at,

            u.name AS provider_name,
            u.email AS provider_email,

            sc.category_name

        FROM user_services us

        INNER JOIN users u
            ON us.user_id = u.user_id

        INNER JOIN service_categories sc
            ON us.service_category_id = sc.service_category_id

        WHERE us.user_service_id = $1
    `

    const result = await db.query(sql, [id])

    return result.rows[0] || null
}


/**
 * Approve or reject a pending service.
 *
 * The service update and activity log insertion
 * are committed together in one PostgreSQL transaction.
 *
 * Only services with a current approval_status
 * of 'pending' can be reviewed.
 */
export async function reviewService({
    serviceId,
    adminId,
    decision,
    ip_address = null,
    user_agent = null
}) {

    const id = Number(serviceId)
    const administratorId = Number(adminId)

    const allowedDecisions = [
        'approved',
        'rejected'
    ]

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('Invalid service ID.')
    }

    if (
        !Number.isSafeInteger(administratorId) ||
        administratorId <= 0
    ) {
        throw new Error('Invalid administrator ID.')
    }

    if (!allowedDecisions.includes(decision)) {
        throw new Error('Invalid service approval decision.')
    }

    const client = await db.connect()

    try {

        await client.query('BEGIN')

        // Lock the service record while it is being reviewed.
        const serviceResult = await client.query(
            `
                SELECT
                    user_service_id,
                    user_id,
                    service_name,
                    approval_status

                FROM user_services

                WHERE user_service_id = $1

                FOR UPDATE
            `,
            [id]
        )

        const service = serviceResult.rows[0]

        if (!service) {
            throw new Error('Service submission not found.')
        }

        if (service.approval_status !== 'pending') {
            throw new Error(
                'This service has already been reviewed.'
            )
        }

        // Update the service approval status.
        const updateResult = await client.query(
            `
                UPDATE user_services

                SET
                    approval_status = $1,
                    updated_at = NOW()

                WHERE user_service_id = $2
                  AND approval_status = 'pending'

                RETURNING
                    user_service_id,
                    service_name,
                    approval_status,
                    updated_at
            `,
            [decision, id]
        )

        if (updateResult.rowCount !== 1) {
            throw new Error(
                'Unable to update the service approval status.'
            )
        }

        const updatedService = updateResult.rows[0]

        // Record the administrator's decision.
        const action =
            decision === 'approved'
                ? 'SERVICE_APPROVED'
                : 'SERVICE_REJECTED'

        const description =
            `Administrator ${administratorId} changed service "${service.service_name}" (ID: ${id}) from pending to ${decision}.`

        await client.query(
            `
                INSERT INTO activity_logs (
                    user_id,
                    action,
                    description,
                    ip_address,
                    user_agent
                )

                VALUES ($1, $2, $3, $4, $5)
            `,
            [
                administratorId,
                action,
                description,
                ip_address,
                user_agent
            ]
        )

        // Commit both operations together.
        await client.query('COMMIT')

        return updatedService

    } catch (error) {

        try {
            await client.query('ROLLBACK')
        } catch (rollbackError) {
            console.error(
                'Service review rollback failed:',
                rollbackError.message
            )
        }

        throw error

    } finally {

        client.release()

    }
}


/**
 * Manage an existing service's approval status.
 *
 * Supported transitions:
 *
 * approved  -> suspended
 * approved  -> cancelled
 * suspended -> approved
 * suspended -> cancelled
 *
 * All changes and activity logs are committed
 * together in one PostgreSQL transaction.
 */
export async function manageServiceStatus({
    serviceId,
    adminId,
    newStatus,
    reason = null,
    ip_address = null,
    user_agent = null
}) {

    const id = Number(serviceId)
    const administratorId = Number(adminId)

    const allowedTransitions = {
        approved: [
            'suspended',
            'cancelled'
        ],

        suspended: [
            'approved',
            'cancelled'
        ]
    }

    const actionMap = {
        suspended: 'SERVICE_SUSPENDED',
        cancelled: 'SERVICE_CANCELLED',
        approved: 'SERVICE_REINSTATED'
    }

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('Invalid service ID.')
    }

    if (
        !Number.isSafeInteger(administratorId) ||
        administratorId <= 0
    ) {
        throw new Error('Invalid administrator ID.')
    }

    if (!Object.hasOwn(actionMap, newStatus)) {
        throw new Error('Invalid service management action.')
    }

    const cleanedReason =
        typeof reason === 'string'
            ? reason.trim()
            : ''

    if (
        ['suspended', 'cancelled'].includes(newStatus) &&
        !cleanedReason
    ) {
        throw new Error(
            'A reason is required to suspend or cancel a service.'
        )
    }

    if (cleanedReason.length > 1000) {
        throw new Error(
            'The reason cannot exceed 1000 characters.'
        )
    }

    const client = await db.connect()

    try {

        await client.query('BEGIN')

        // Lock the service to prevent conflicting status changes.
        const serviceResult = await client.query(
            `
                SELECT
                    user_service_id,
                    service_name,
                    approval_status,
                    availability_status,
                    is_active

                FROM user_services

                WHERE user_service_id = $1

                FOR UPDATE
            `,
            [id]
        )

        const service = serviceResult.rows[0]

        if (!service) {
            throw new Error('Service not found.')
        }

        const currentStatus = service.approval_status

        const permittedStatuses =
            allowedTransitions[currentStatus] || []

        if (!permittedStatuses.includes(newStatus)) {
            throw new Error(
                `Cannot change service status from ${currentStatus} to ${newStatus}.`
            )
        }

        // Reinstate only listings that remain active and available.
        if (
            newStatus === 'approved' &&
            (
                service.availability_status !== 'available' ||
                !service.is_active
            )
        ) {
            throw new Error(
                'This service cannot be reinstated because its listing is inactive or unavailable. Review its listing settings first.'
            )
        }

        // Update the service status.
        const updateResult = await client.query(
            `
                UPDATE user_services

                SET
                    approval_status = $1,
                    updated_at = NOW()

                WHERE user_service_id = $2

                RETURNING
                    user_service_id,
                    service_name,
                    approval_status,
                    availability_status,
                    is_active,
                    updated_at
            `,
            [newStatus, id]
        )

        if (updateResult.rowCount !== 1) {
            throw new Error(
                'Unable to update the service status.'
            )
        }

        const updatedService = updateResult.rows[0]

        // Record the administrator's action and status transition.
        const action = actionMap[newStatus]

        const descriptionParts = [
            `Administrator ${administratorId}`,
            `changed service "${service.service_name}" (ID: ${id})`,
            `from ${currentStatus} to ${newStatus}.`
        ]

        if (cleanedReason) {
            descriptionParts.push(
                `Reason: ${cleanedReason}`
            )
        }

        const description = descriptionParts.join(' ')

        await client.query(
            `
                INSERT INTO activity_logs (
                    user_id,
                    action,
                    description,
                    ip_address,
                    user_agent
                )

                VALUES ($1, $2, $3, $4, $5)
            `,
            [
                administratorId,
                action,
                description,
                ip_address,
                user_agent
            ]
        )

        // Commit status update and activity record together.
        await client.query('COMMIT')

        return {
            ...updatedService,
            previous_status: currentStatus
        }

    } catch (error) {

        try {
            await client.query('ROLLBACK')
        } catch (rollbackError) {
            console.error(
                'Service status rollback failed:',
                rollbackError.message
            )
        }

        throw error

    } finally {

        client.release()

    }
}