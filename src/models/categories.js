import pool from './db.js';

/**

 * Get all service project categories
 * @returns {Promise<Array>} List of categories
 */
export async function getAllCategories() {
    try {
        const [rows] = await pool.query(`
            SELECT
                category_id,
                category_name,
                description
            FROM categories
            ORDER BY category_name ASC
        `);

        return rows;
    } catch (error) {
        console.error('Error retrieving categories:', error);
        throw error;
    }
}