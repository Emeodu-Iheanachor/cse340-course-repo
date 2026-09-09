import pool from './db.js';

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
        ORDER BY sp.start_date;
    `;

    const result = await pool.query(query);

    return result.rows;
};

export {
    getAllProjects
};