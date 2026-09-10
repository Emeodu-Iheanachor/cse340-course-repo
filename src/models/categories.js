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

export { getAllCategories };