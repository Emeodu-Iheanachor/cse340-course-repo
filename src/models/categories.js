import db from './db.js';

/**
 * Get all categories from the database
 * @returns {Promise<Array>} Array of category objects
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