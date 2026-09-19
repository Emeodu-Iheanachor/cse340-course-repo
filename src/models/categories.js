import db from './db.js';

/**
 * Get all service project categories.
 * @returns {Promise<Array>} List of categories
 */
const getAllCategories = async () => {
    const query = `
        SELECT category_id, category_name
        FROM public.category
        ORDER BY category_name ASC;
    `;

    const result = await db.query(query);

    return result.rows;
};


/**
 * Get a single category by its ID.
 * @param {number} categoryId - The category ID
 * @returns {Promise<Object|undefined>} The category
 */
const getCategoryById = async (categoryId) => {
    const query = `
        SELECT category_id, category_name
        FROM public.category
        WHERE category_id = $1;
    `;

    const result = await db.query(query, [categoryId]);

    return result.rows[0];
};


/**
 * Get all service projects for a category.
 * @param {number} categoryId - The category ID
 * @returns {Promise<Array>} List of service projects
 */
const getProjectsByCategoryId = async (categoryId) => {
    const query = `
        SELECT
            sp.project_id,
            sp.title,
            sp.description,
            sp.start_date,
            sp.end_date,
            sp.organization_id,
            o.name AS organization_name
        FROM public.service_project AS sp
        JOIN public.project_category AS pc
            ON sp.project_id = pc.project_id
        JOIN public.organization AS o
            ON sp.organization_id = o.organization_id
        WHERE pc.category_id = $1
        ORDER BY sp.start_date ASC;
    `;

    const result = await db.query(query, [categoryId]);

    return result.rows;
};


export {
    getAllCategories,
    getCategoryById,
    getProjectsByCategoryId
};