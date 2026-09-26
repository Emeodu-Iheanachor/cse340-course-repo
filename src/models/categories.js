import db from './db.js'


/* =========================================================
   GET ALL CATEGORIES
========================================================= */

/**
 * Get all service project categories.
 *
 * @returns {Promise<Array>} List of categories
 */
const getAllCategories = async () => {
    const query = `
        SELECT
            category_id,
            category_name
        FROM public.category
        ORDER BY category_name ASC;
    `

    const result = await db.query(query)

    return result.rows
}


/* =========================================================
   GET ONE CATEGORY BY ID
========================================================= */

/**
 * Get a single category by its ID.
 *
 * @param {number} categoryId - The category ID
 * @returns {Promise<Object|undefined>} The category
 */
const getCategoryById = async (categoryId) => {
    const query = `
        SELECT
            category_id,
            category_name
        FROM public.category
        WHERE category_id = $1;
    `

    const result = await db.query(query, [categoryId])

    return result.rows[0]
}


/* =========================================================
   GET PROJECTS BY CATEGORY ID
========================================================= */

/**
 * Get all service projects for a category.
 *
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
        INNER JOIN public.project_category AS pc
            ON sp.project_id = pc.project_id
        INNER JOIN public.organization AS o
            ON sp.organization_id = o.organization_id
        WHERE pc.category_id = $1
        ORDER BY sp.start_date ASC;
    `

    const result = await db.query(query, [categoryId])

    return result.rows
}


/* =========================================================
   CREATE CATEGORY
========================================================= */

/**
 * Create a new service project category.
 *
 * @param {string} categoryName - The category name
 * @returns {Promise<Object|undefined>} The newly created category
 */
const createCategory = async (categoryName) => {
    const query = `
        INSERT INTO public.category (
            category_name
        )
        VALUES ($1)
        RETURNING
            category_id,
            category_name;
    `

    const result = await db.query(query, [categoryName])

    return result.rows[0]
}


/* =========================================================
   UPDATE CATEGORY
========================================================= */

/**
 * Update an existing service project category.
 *
 * @param {number} categoryId - The category ID
 * @param {string} categoryName - The updated category name
 * @returns {Promise<Object|undefined>} The updated category
 */
const updateCategory = async (
    categoryId,
    categoryName
) => {
    const query = `
        UPDATE public.category
        SET category_name = $1
        WHERE category_id = $2
        RETURNING
            category_id,
            category_name;
    `

    const result = await db.query(
        query,
        [
            categoryName,
            categoryId
        ]
    )

    return result.rows[0]
}


/* =========================================================
   GET CATEGORIES BY SERVICE PROJECT ID
========================================================= */

/**
 * Get all categories currently assigned to a service project.
 *
 * @param {number} projectId - The service project ID
 * @returns {Promise<Array>} List of assigned categories
 */
const getCategoriesByServiceProjectId = async (projectId) => {
    const query = `
        SELECT
            c.category_id,
            c.category_name
        FROM public.category AS c
        INNER JOIN public.project_category AS pc
            ON c.category_id = pc.category_id
        WHERE pc.project_id = $1
        ORDER BY c.category_name ASC;
    `

    const result = await db.query(query, [projectId])

    return result.rows
}


/* =========================================================
   ASSIGN CATEGORY TO PROJECT
========================================================= */

/**
 * Assign one category to a service project.
 *
 * This function is intentionally not exported because
 * it is only used internally by updateCategoryAssignments().
 *
 * @param {number} projectId - The service project ID
 * @param {number} categoryId - The category ID
 * @param {Object} client - PostgreSQL database client
 * @returns {Promise<void>}
 */
const assignCategoryToProject = async (
    projectId,
    categoryId,
    client = db
) => {
    const query = `
        INSERT INTO public.project_category (
            project_id,
            category_id
        )
        VALUES ($1, $2);
    `

    await client.query(
        query,
        [
            projectId,
            categoryId
        ]
    )
}


/* =========================================================
   UPDATE PROJECT CATEGORY ASSIGNMENTS
========================================================= */

/**
 * Update all category assignments for a service project.
 *
 * Existing assignments are removed first. The selected
 * categories are then inserted into project_category.
 *
 * A transaction is used so that either all changes succeed
 * or none of the changes are saved.
 *
 * @param {number} projectId - The service project ID
 * @param {Array<number>} categoryIds - Selected category IDs
 * @returns {Promise<void>}
 */
const updateCategoryAssignments = async (
    projectId,
    categoryIds = []
) => {
    const client = await db.connect()

    try {
        await client.query('BEGIN')

        /* Remove existing category assignments. */
        const deleteQuery = `
            DELETE FROM public.project_category
            WHERE project_id = $1;
        `

        await client.query(
            deleteQuery,
            [projectId]
        )

        /* Add the newly selected categories. */
        for (const categoryId of categoryIds) {
            await assignCategoryToProject(
                projectId,
                categoryId,
                client
            )
        }

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}


/* =========================================================
   EXPORT MODEL FUNCTIONS
========================================================= */

export {
    getAllCategories,
    getCategoryById,
    getProjectsByCategoryId,
    createCategory,
    updateCategory,
    getCategoriesByServiceProjectId,
    updateCategoryAssignments
}