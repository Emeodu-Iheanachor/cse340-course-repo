import db from './db.js';

/**
 * Get all service projects from the database.
 * @returns {Promise<Array>} List of service projects
 */
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
        FROM public.service_project sp
        JOIN public.organization o
            ON sp.organization_id = o.organization_id
        ORDER BY sp.start_date;
    `;

    const result = await db.query(query);

    return result.rows;
};

export { getAllProjects };