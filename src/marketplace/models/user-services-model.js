import db from '../../models/db.js'

/**
 * Retrieve all active marketplace service categories.
 */
export async function getActiveServiceCategories() {
  const sql = `
    SELECT
      service_category_id,
      category_name,
      description,
      slug
    FROM service_categories
    WHERE is_active = TRUE
    ORDER BY category_name ASC
  `

  const result = await db.query(sql)

  return result.rows
}

/**
 * Register a service for the authenticated provider.
 *
 * New services are always submitted with pending approval.
 * Approval status is deliberately not accepted from the caller.
 */
export async function createUserService({
  user_id,
  service_category_id,
  service_name,
  description,
  location = null,
  service_area = null
}) {
  const parsedUserId = Number(user_id)
  const parsedCategoryId = Number(service_category_id)

  if (
    !Number.isInteger(parsedUserId) ||
    parsedUserId <= 0
  ) {
    throw new Error('A valid provider user ID is required.')
  }

  if (
    !Number.isInteger(parsedCategoryId) ||
    parsedCategoryId <= 0
  ) {
    throw new Error('A valid service category is required.')
  }

  const cleanServiceName =
    typeof service_name === 'string'
      ? service_name.trim()
      : ''

  const cleanDescription =
    typeof description === 'string'
      ? description.trim()
      : ''

  const cleanLocation =
    typeof location === 'string' && location.trim()
      ? location.trim()
      : null

  const cleanServiceArea =
    typeof service_area === 'string' && service_area.trim()
      ? service_area.trim()
      : null

  if (!cleanServiceName) {
    throw new Error('Service name is required.')
  }

  if (!cleanDescription) {
    throw new Error('Service description is required.')
  }

  // Confirm that the selected category exists and is active.
  const categoryCheck = await db.query(
    `
      SELECT service_category_id
      FROM service_categories
      WHERE service_category_id = $1
        AND is_active = TRUE
    `,
    [parsedCategoryId]
  )

  if (categoryCheck.rows.length === 0) {
    throw new Error('The selected service category is unavailable.')
  }

  // Approval status is assigned by the server, never by the provider.
  const sql = `
    INSERT INTO user_services (
      user_id,
      service_category_id,
      service_name,
      description,
      location,
      service_area,
      availability_status,
      approval_status,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'available', 'pending', TRUE)
    RETURNING
      user_service_id,
      user_id,
      service_category_id,
      service_name,
      description,
      location,
      service_area,
      availability_status,
      approval_status,
      is_active,
      created_at
  `

  const values = [
    parsedUserId,
    parsedCategoryId,
    cleanServiceName,
    cleanDescription,
    cleanLocation,
    cleanServiceArea
  ]

  const result = await db.query(sql, values)

  if (result.rows.length === 0) {
    throw new Error('The service could not be registered.')
  }

  return result.rows[0]
}

/**
 * Retrieve services submitted by one provider.
 */
export async function getServicesByProvider(userId) {
  const parsedUserId = Number(userId)

  if (
    !Number.isInteger(parsedUserId) ||
    parsedUserId <= 0
  ) {
    throw new Error('A valid provider user ID is required.')
  }

  const sql = `
    SELECT
      us.user_service_id,
      us.service_category_id,
      sc.category_name,
      us.service_name,
      us.description,
      us.location,
      us.service_area,
      us.availability_status,
      us.approval_status,
      us.is_active,
      us.created_at,
      us.updated_at
    FROM user_services us
    INNER JOIN service_categories sc
      ON sc.service_category_id = us.service_category_id
    WHERE us.user_id = $1
    ORDER BY
      us.created_at DESC,
      us.user_service_id DESC
  `

  const result = await db.query(sql, [parsedUserId])

  return result.rows
}
