import db from './db.js'


/* =========================================================
   CREATE ACTIVITY LOG

   Records activities performed by users.

   Activity records are stored permanently in PostgreSQL,
   independently of user sessions.

   Parameters:
   - user_id
   - action
   - description
   - ip_address
   - user_agent
========================================================= */

export const createActivityLog = async ({
  user_id = null,
  action,
  description = null,
  ip_address = null,
  user_agent = null
}) => {

  /* Validate activity action */

  if (
    !action ||
    typeof action !== 'string' ||
    !action.trim()
  ) {
    throw new Error(
      'An activity action is required.'
    )
  }


  /* Prepare PostgreSQL query */

  const query = `
    INSERT INTO activity_logs (
      user_id,
      action,
      description,
      ip_address,
      user_agent
    )

    VALUES ($1, $2, $3, $4, $5)

    RETURNING
      activity_id,
      user_id,
      action,
      description,
      ip_address,
      user_agent,
      created_at
  `


  /* Prepare query values */

  const values = [
    user_id,
    action.trim().toUpperCase(),
    description,
    ip_address,
    user_agent
  ]


  /* Execute query */

  const result = await db.query(
    query,
    values
  )


  if (result.rows.length === 0) {
    throw new Error(
      'Failed to create activity log.'
    )
  }


  /* Optional SQL logging */

  if (process.env.ENABLE_SQL_LOGGING === 'true') {

    console.log(
      'Activity recorded:',
      result.rows[0].action
    )

  }


  return result.rows[0]
}


/* =========================================================
   GET ACTIVITY LOGS

   Retrieves activity history from PostgreSQL.

   Includes:
   - User name
   - User email
   - Activity action
   - Activity description
   - IP address
   - User agent
   - Date and time

   Supports:
   - Pagination
   - Action filtering
   - User filtering
========================================================= */

export const getActivityLogs = async ({
  page = 1,
  limit = 20,
  action = null,
  userId = null
} = {}) => {

  /* =====================================================
     VALIDATE PAGINATION
  ===================================================== */

  const requestedPage = Number.parseInt(
    page,
    10
  )

  const requestedLimit = Number.parseInt(
    limit,
    10
  )

  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1

  const pageLimit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20

  const offset = (
    currentPage - 1
  ) * pageLimit


  /* =====================================================
     VALIDATE ACTION FILTER
  ===================================================== */

  const actionFilter =
    typeof action === 'string' && action.trim()
      ? action.trim().toUpperCase()
      : null


  /* =====================================================
     VALIDATE USER FILTER
  ===================================================== */

  let userIdFilter = null

  if (userId !== null && userId !== undefined && userId !== '') {

    const parsedUserId = Number(userId)

    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0
    ) {
      throw new Error(
        'Invalid user ID filter.'
      )
    }

    userIdFilter = parsedUserId
  }


  /* =====================================================
     BUILD ACTIVITY HISTORY QUERY
  ===================================================== */

  let query = `
    SELECT
      al.activity_id,
      al.user_id,
      u.name AS user_name,
      u.email AS user_email,
      al.action,
      al.description,
      al.ip_address,
      al.user_agent,
      al.created_at

    FROM activity_logs AS al

    LEFT JOIN users AS u
      ON al.user_id = u.user_id

    WHERE 1 = 1
  `

  const values = []


  /* =====================================================
     FILTER BY ACTIVITY ACTION
  ===================================================== */

  if (actionFilter) {

    values.push(actionFilter)

    query += `
      AND al.action = $${values.length}
    `
  }


  /* =====================================================
     FILTER BY USER ID
  ===================================================== */

  if (userIdFilter !== null) {

    values.push(userIdFilter)

    query += `
      AND al.user_id = $${values.length}
    `
  }


  /* =====================================================
     ORDER ACTIVITY RECORDS
  ===================================================== */

  query += `
    ORDER BY
      al.created_at DESC,
      al.activity_id DESC
  `


  /* =====================================================
     APPLY PAGINATION
  ===================================================== */

  values.push(pageLimit)

  query += `
    LIMIT $${values.length}
  `

  values.push(offset)

  query += `
    OFFSET $${values.length}
  `


  /* =====================================================
     EXECUTE ACTIVITY HISTORY QUERY
  ===================================================== */

  const result = await db.query(
    query,
    values
  )


  /* =====================================================
     COUNT TOTAL MATCHING ACTIVITY RECORDS
  ===================================================== */

  let countQuery = `
    SELECT COUNT(*) AS total

    FROM activity_logs AS al

    WHERE 1 = 1
  `

  const countValues = []


  /* Apply the same action filter */

  if (actionFilter) {

    countValues.push(actionFilter)

    countQuery += `
      AND al.action = $${countValues.length}
    `
  }


  /* Apply the same user filter */

  if (userIdFilter !== null) {

    countValues.push(userIdFilter)

    countQuery += `
      AND al.user_id = $${countValues.length}
    `
  }


  /* Execute count query */

  const countResult = await db.query(
    countQuery,
    countValues
  )

  const total = Number(
    countResult.rows[0].total
  )


  /* =====================================================
     CALCULATE PAGINATION INFORMATION
  ===================================================== */

  const totalPages = Math.ceil(
    total / pageLimit
  )


  /* =====================================================
     RETURN ACTIVITY DATA
  ===================================================== */

  return {

    activities: result.rows,

    total,

    page: currentPage,

    limit: pageLimit,

    totalPages

  }
}


/* =========================================================
   GET ACTIVITY STATISTICS

   Retrieves activity statistics for administrators.

   Statistics:
   - Total activities
   - Users with recorded activity
   - Today's activities
   - Total logins
   - Total logouts
   - Total registrations
========================================================= */

export const getActivityStatistics = async () => {

  const query = `
    SELECT

      COUNT(*) AS total_activities,

      COUNT(DISTINCT user_id)
        AS active_users,

      COUNT(*) FILTER (
        WHERE created_at >= CURRENT_DATE
      ) AS activities_today,

      COUNT(*) FILTER (
        WHERE action = 'LOGIN'
      ) AS total_logins,

      COUNT(*) FILTER (
        WHERE action = 'LOGOUT'
      ) AS total_logouts,

      COUNT(*) FILTER (
        WHERE action IN ('REGISTER', 'REGISTRATION')
      ) AS total_registrations

    FROM activity_logs
  `


  const result = await db.query(query)

  return result.rows[0]
}


/* =========================================================
   GET ACTIVITIES BY USER

   Retrieves the activity history of an individual user.

   This function can support future user activity
   monitoring and account administration features.
========================================================= */

export const getActivitiesByUser = async (userId) => {

  const parsedUserId = Number(userId)

  if (
    !Number.isInteger(parsedUserId) ||
    parsedUserId <= 0
  ) {
    throw new Error(
      'A valid user ID is required.'
    )
  }


  const query = `
    SELECT
      activity_id,
      user_id,
      action,
      description,
      ip_address,
      user_agent,
      created_at

    FROM activity_logs

    WHERE user_id = $1

    ORDER BY
      created_at DESC,
      activity_id DESC
  `


  const result = await db.query(
    query,
    [parsedUserId]
  )


  return result.rows
}