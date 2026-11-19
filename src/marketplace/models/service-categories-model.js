import db from '../../models/db.js'

/**
 * Get all active service categories and their
 * approved, available service counts.
 */
export async function getAllServiceCategories() {
  const sql = `
    SELECT
      sc.service_category_id,
      sc.category_name,
      sc.description,
      sc.slug,
      COUNT(us.user_service_id)::INTEGER AS service_count
    FROM service_categories sc
    LEFT JOIN user_services us
      ON us.service_category_id = sc.service_category_id
      AND us.approval_status = 'approved'
      AND us.availability_status = 'available'
      AND us.is_active = TRUE
    WHERE sc.is_active = TRUE
    GROUP BY
      sc.service_category_id,
      sc.category_name,
      sc.description,
      sc.slug
    ORDER BY sc.category_name ASC
  `

  const result = await db.query(sql)

  return result.rows
}

/**
 * Get one active service category by its slug.
 */
export async function getServiceCategoryBySlug(slug) {
  const sql = `
    SELECT
      sc.service_category_id,
      sc.category_name,
      sc.description,
      sc.slug,
      COUNT(us.user_service_id)::INTEGER AS service_count
    FROM service_categories sc
    LEFT JOIN user_services us
      ON us.service_category_id = sc.service_category_id
      AND us.approval_status = 'approved'
      AND us.availability_status = 'available'
      AND us.is_active = TRUE
    WHERE sc.slug = $1
      AND sc.is_active = TRUE
    GROUP BY
      sc.service_category_id,
      sc.category_name,
      sc.description,
      sc.slug
  `

  const result = await db.query(sql, [slug])

  return result.rows[0] || null
}

/**
 * Get approved, available services belonging to an active category.
 *
 * Only active services from approved providers are returned.
 */
export async function getServicesByCategorySlug(slug) {
  const sql = `
    SELECT
      us.user_service_id,
      us.user_id,
      us.service_category_id,
      us.organization_id,
      us.service_name,
      us.description,
      us.location,
      us.service_area,
      us.availability_status,
      us.created_at,
      u.name AS provider_name
    FROM user_services us
    INNER JOIN service_categories sc
      ON sc.service_category_id = us.service_category_id
    INNER JOIN users u
      ON u.user_id = us.user_id
    WHERE sc.slug = $1
      AND sc.is_active = TRUE
      AND us.approval_status = 'approved'
      AND us.availability_status = 'available'
      AND us.is_active = TRUE
    ORDER BY
      us.created_at DESC,
      us.service_name ASC
  `

  const result = await db.query(sql, [slug])

  return result.rows
}
