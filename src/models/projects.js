import db from './db.js'


/* =========================================================
   GET ALL SERVICE PROJECTS
========================================================= */
const getAllProjects = async () => {
  const query = `
    SELECT
      sp.project_id,
      sp.title,
      sp.description,
      sp.start_date,
      sp.end_date,
      sp.organization_id,
      o.name AS organization_name
    FROM service_project AS sp
    JOIN organization AS o
      ON sp.organization_id = o.organization_id
    ORDER BY sp.start_date ASC
  `

  const result = await db.query(query)

  return result.rows
}


/* =========================================================
   GET UPCOMING SERVICE PROJECTS
   Returns the next specified number of projects
========================================================= */
const getUpcomingProjects = async (numberOfProjects) => {
  const query = `
    SELECT
      sp.project_id,
      sp.title,
      sp.description,
      sp.start_date,
      sp.end_date,
      sp.organization_id,
      o.name AS organization_name
    FROM service_project AS sp
    JOIN organization AS o
      ON sp.organization_id = o.organization_id
    WHERE sp.start_date >= CURRENT_DATE
    ORDER BY sp.start_date ASC
    LIMIT $1
  `

  const result = await db.query(query, [numberOfProjects])

  return result.rows
}


/* =========================================================
   GET ONE SERVICE PROJECT BY ID
========================================================= */
const getProjectDetails = async (projectId) => {
  const query = `
    SELECT
      sp.project_id,
      sp.title,
      sp.description,
      sp.start_date,
      sp.end_date,
      sp.organization_id,
      o.name AS organization_name
    FROM service_project AS sp
    JOIN organization AS o
      ON sp.organization_id = o.organization_id
    WHERE sp.project_id = $1
  `

  const result = await db.query(query, [projectId])

  return result.rows[0]
}


/* =========================================================
   GET SERVICE PROJECTS FOR AN ORGANIZATION
========================================================= */
const getProjectsByOrganizationId = async (organizationId) => {
  const query = `
    SELECT
      project_id,
      organization_id,
      title,
      description,
      start_date,
      end_date
    FROM service_project
    WHERE organization_id = $1
    ORDER BY start_date ASC
  `

  const result = await db.query(query, [organizationId])

  return result.rows
}


/* =========================================================
   GET CATEGORIES ASSIGNED TO A SERVICE PROJECT
========================================================= */
const getCategoriesByProjectId = async (projectId) => {
  const query = `
    SELECT
      c.category_id,
      c.category_name
    FROM public.category AS c
    JOIN public.project_category AS pc
      ON c.category_id = pc.category_id
    WHERE pc.project_id = $1
    ORDER BY c.category_name ASC
  `

  const result = await db.query(query, [projectId])

  return result.rows
}


/* =========================================================
   CREATE A NEW SERVICE PROJECT
========================================================= */
const createProject = async (
  title,
  description,
  startDate,
  endDate,
  organizationId
) => {
  const query = `
    INSERT INTO service_project (
      title,
      description,
      start_date,
      end_date,
      organization_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING project_id
  `

  const queryParams = [
    title,
    description,
    startDate,
    endDate,
    organizationId
  ]

  const result = await db.query(query, queryParams)

  if (result.rows.length === 0) {
    throw new Error('Failed to create service project')
  }

  if (process.env.ENABLE_SQL_LOGGING === 'true') {
    console.log(
      'Created new service project with ID:',
      result.rows[0].project_id
    )
  }

  return result.rows[0].project_id
}


/* =========================================================
   UPDATE AN EXISTING SERVICE PROJECT
========================================================= */
const updateProject = async (
  projectId,
  title,
  description,
  startDate,
  endDate,
  organizationId
) => {
  const query = `
    UPDATE service_project
    SET
      title = $1,
      description = $2,
      start_date = $3,
      end_date = $4,
      organization_id = $5
    WHERE project_id = $6
    RETURNING
      project_id,
      title,
      description,
      start_date,
      end_date,
      organization_id
  `

  const queryParams = [
    title,
    description,
    startDate,
    endDate,
    organizationId,
    projectId
  ]

  const result = await db.query(query, queryParams)

  if (result.rows.length === 0) {
    throw new Error('Failed to update service project')
  }

  if (process.env.ENABLE_SQL_LOGGING === 'true') {
    console.log(
      'Updated service project with ID:',
      result.rows[0].project_id
    )
  }

  return result.rows[0]
}


/* =========================================================
   EXPORT MODEL FUNCTIONS
========================================================= */
export {
  getAllProjects,
  getUpcomingProjects,
  getProjectDetails,
  getProjectsByOrganizationId,
  getCategoriesByProjectId,
  createProject,
  updateProject
}