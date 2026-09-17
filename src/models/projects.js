import db from './db.js'

// Get all service projects
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
    FROM service_project sp
    JOIN organization o
      ON sp.organization_id = o.organization_id
    ORDER BY sp.start_date ASC
  `

  const result = await db.query(query)
  return result.rows
}

// Get service projects for a specific organization
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

  const queryParams = [organizationId]
  const result = await db.query(query, queryParams)

  return result.rows
}

// Export the model functions
export {
  getAllProjects,
  getProjectsByOrganizationId
}