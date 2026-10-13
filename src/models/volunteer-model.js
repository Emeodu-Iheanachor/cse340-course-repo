import pool from './db.js'


/* =========================================================
   ADD VOLUNTEER
   Registers a user for a service project.
========================================================= */

export async function addVolunteer(userId, projectId) {
  const sql = `
    INSERT INTO project_volunteer (
      user_id,
      project_id
    )
    VALUES ($1, $2)
    ON CONFLICT (user_id, project_id)
    DO NOTHING
    RETURNING *
  `

  const result = await pool.query(
    sql,
    [userId, projectId]
  )

  return result.rows[0] ?? null
}


/* =========================================================
   REMOVE VOLUNTEER
   Removes a user's volunteer registration for a project.
========================================================= */

export async function removeVolunteer(userId, projectId) {
  const sql = `
    DELETE FROM project_volunteer
    WHERE user_id = $1
      AND project_id = $2
    RETURNING *
  `

  const result = await pool.query(
    sql,
    [userId, projectId]
  )

  return result.rows[0] ?? null
}


/* =========================================================
   GET PROJECTS BY VOLUNTEER
   Retrieves all service projects a user has volunteered for.
========================================================= */

export async function getProjectsByVolunteer(userId) {
  const sql = `
    SELECT
      sp.project_id,
      sp.title,
      sp.description,
      sp.location,
      sp.start_date,
      sp.end_date,
      sp.organization_id
    FROM project_volunteer AS pv
    INNER JOIN service_project AS sp
      ON pv.project_id = sp.project_id
    WHERE pv.user_id = $1
    ORDER BY sp.start_date ASC NULLS LAST
  `

  const result = await pool.query(
    sql,
    [userId]
  )

  return result.rows
}


/* =========================================================
   CHECK VOLUNTEER STATUS
   Checks whether a user has registered for a service project.
========================================================= */

export async function isVolunteer(userId, projectId) {
  const sql = `
    SELECT volunteer_id
    FROM project_volunteer
    WHERE user_id = $1
      AND project_id = $2
    LIMIT 1
  `

  const result = await pool.query(
    sql,
    [userId, projectId]
  )

  return result.rows.length > 0
}
