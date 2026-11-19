import {
    getPendingServices,
    getAllManagedServices,
    getServiceById,
    reviewService,
    manageServiceStatus
} from '../models/admin-services-model.js'


/**
 * Display all services awaiting administrator approval.
 */
export async function showPendingServices(req, res) {

    try {

        const services = await getPendingServices()

        return res.render(
            'marketplace/admin/pending-services',
            {
                title: 'Marketplace Service Approvals',
                services
            }
        )

    } catch (error) {

        console.error(
            'Error loading pending services:',
            error
        )

        req.flash(
            'error',
            'Unable to load pending service submissions.'
        )

        return res.redirect('/dashboard')

    }
}



/**
 * Display all marketplace services for administrator management.
 */
export async function showManagedServices(req, res) {

    try {

        const services = await getAllManagedServices()

        return res.render(
            'marketplace/admin/manage-services',
            {
                title: 'Manage Marketplace Services',
                services
            }
        )

    } catch (error) {

        console.error(
            'Error loading marketplace services:',
            error
        )

        req.flash(
            'error',
            'Unable to load marketplace services.'
        )

        return res.redirect('/dashboard')

    }
}



/**
 * Display the details of an individual service submission.
 */
export async function showServiceDetails(req, res) {

    try {

        const serviceId = Number(req.params.id)

        if (
            !Number.isSafeInteger(serviceId) ||
            serviceId <= 0
        ) {
            req.flash('error', 'Invalid service submission.')

            return res.redirect('/marketplace/admin/services')
        }

        const service = await getServiceById(serviceId)

        if (!service) {

            req.flash(
                'error',
                'The requested service submission was not found.'
            )

            return res.redirect('/marketplace/admin/services')

        }

        return res.render(
            'marketplace/admin/service-details',
            {
                title: 'Review Service Submission',
                service
            }
        )

    } catch (error) {

        console.error(
            'Error loading service details:',
            error
        )

        req.flash(
            'error',
            'Unable to load the service submission.'
        )

        return res.redirect('/marketplace/admin/services')

    }
}


/**
 * Process an administrator's service approval decision.
 *
 * Administrator identity is obtained exclusively
 * from the authenticated session.
 */
async function processServiceDecision(req, res, decision) {

    try {

        const serviceId = Number(req.params.id)

        if (
            !Number.isSafeInteger(serviceId) ||
            serviceId <= 0
        ) {
            req.flash(
                'error',
                'Invalid service submission.'
            )

            return res.redirect('/marketplace/admin/services')
        }

        // Obtain administrator identity from the session.
        const admin = req.session.user

        const result = await reviewService({

            serviceId,

            adminId: admin.user_id,

            decision,

            ip_address: req.ip,

            user_agent: req.get('user-agent') || null

        })

        const message =
            decision === 'approved'
                ? `Service "${result.service_name}" has been approved successfully.`
                : `Service "${result.service_name}" has been rejected.`

        req.flash('success', message)

        return res.redirect('/marketplace/admin/services')

    } catch (error) {

        console.error(
            `Error processing service ${decision}:`,
            error
        )

        req.flash(
            'error',
            error.message === 'This service has already been reviewed.'
                ? error.message
                : 'Unable to process the service approval decision.'
        )

        return res.redirect('/marketplace/admin/services')

    }

}


/**
 * Approve a pending service.
 */
export async function approveService(req, res) {

    return processServiceDecision(
        req,
        res,
        'approved'
    )

}


/**
 * Reject a pending service.
 */
export async function rejectService(req, res) {

    return processServiceDecision(
        req,
        res,
        'rejected'
    )

}


/**
 * Process an administrator's service status-management action.
 *
 * Supported actions:
 * - Suspend an approved service.
 * - Cancel an approved service.
 * - Cancel a suspended service.
 * - Reinstate a suspended service.
 */
async function processServiceStatusChange(req, res, newStatus) {

    const serviceId = Number(req.params.id)

    if (
        !Number.isSafeInteger(serviceId) ||
        serviceId <= 0
    ) {
        req.flash('error', 'Invalid service ID.')

        return res.redirect('/marketplace/admin/services')
    }

    try {

        // Obtain administrator identity exclusively from the session.
        const admin = req.session.user

        const reason =
            typeof req.body?.reason === 'string'
                ? req.body.reason.trim()
                : ''

        const result = await manageServiceStatus({

            serviceId,

            adminId: admin.user_id,

            newStatus,

            reason,

            ip_address: req.ip,

            user_agent: req.get('user-agent') || null

        })

        const messages = {
            suspended: `Service "${result.service_name}" has been suspended successfully.`,

            cancelled: `Service "${result.service_name}" has been cancelled successfully.`,

            approved: `Service "${result.service_name}" has been reinstated successfully.`
        }

        req.flash(
            'success',
            messages[newStatus]
        )

        return res.redirect(
            `/marketplace/admin/services/${serviceId}`
        )

    } catch (error) {

        console.error(
            `Error changing service ${serviceId} status to ${newStatus}:`,
            error
        )

        const userErrors = [
            'Service not found.',
            'Invalid service ID.',
            'Invalid administrator ID.',
            'A reason is required to suspend or cancel a service.',
            'The reason cannot exceed 1000 characters.',
            'Cannot change service status from',
            'This service cannot be reinstated'
        ]

        const safeMessage = userErrors.some(message =>
            error.message.startsWith(message)
        )

            ? error.message

            : 'Unable to update the service status. Please try again.'

        req.flash('error', safeMessage)

        return res.redirect(
            `/marketplace/admin/services/${serviceId}`
        )

    }

}


/**
 * Suspend an approved service.
 */
export async function suspendService(req, res) {

    return processServiceStatusChange(
        req,
        res,
        'suspended'
    )

}


/**
 * Cancel an approved or suspended service.
 */
export async function cancelService(req, res) {

    return processServiceStatusChange(
        req,
        res,
        'cancelled'
    )

}


/**
 * Reinstate a suspended service.
 */
export async function reinstateService(req, res) {

    return processServiceStatusChange(
        req,
        res,
        'approved'
    )

}
