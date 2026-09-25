
import {
  getAllCategories,
  getCategoryById,
  getProjectsByCategoryId,
  getCategoriesByServiceProjectId,
  updateCategoryAssignments
} from '../models/categories.js'

import {
  getProjectDetails
} from '../models/projects.js'


// =========================================================
// DISPLAY ALL SERVICE PROJECT CATEGORIES
// =========================================================

const showCategoriesPage = async (req, res, next) => {
  try {
    const categories = await getAllCategories()

    const title = 'Service Categories'

    res.render('categories', {
      title,
      categories
    })
  } catch (error) {
    next(error)
  }
}


// =========================================================
// DISPLAY ONE SERVICE PROJECT CATEGORY
// =========================================================

const showCategoryDetailsPage = async (req, res, next) => {
  try {
    const categoryId = req.params.id

    const category = await getCategoryById(categoryId)

    if (!category) {
      return res.status(404).render('error', {
        title: 'Category Not Found',
        message:
          'The requested service project category could not be found.'
      })
    }

    const projects = await getProjectsByCategoryId(categoryId)

    res.render('category', {
      title: category.category_name,
      category,
      projects
    })
  } catch (error) {
    next(error)
  }
}


// =========================================================
// DISPLAY ASSIGN CATEGORIES FORM
// =========================================================

const showAssignCategoriesForm = async (req, res, next) => {
  try {
    const projectId = req.params.projectId

    // Get the project being edited.
    const projectDetails = await getProjectDetails(projectId)

    if (!projectDetails) {
      return res.status(404).render('error', {
        title: 'Project Not Found',
        message:
          'The requested service project could not be found.'
      })
    }

    // Get every available category.
    const categories = await getAllCategories()

    // Get categories currently assigned to this project.
    const assignedCategories =
      await getCategoriesByServiceProjectId(projectId)

    const title = 'Assign Categories to Project'

    res.render('assign-categories', {
      title,
      projectId,
      projectDetails,
      categories,
      assignedCategories
    })
  } catch (error) {
    next(error)
  }
}


// =========================================================
// PROCESS ASSIGN CATEGORIES FORM
// =========================================================

const processAssignCategoriesForm = async (req, res, next) => {
  try {
    const projectId = req.params.projectId

    /*
     * When no checkbox is selected, Express will not create
     * req.body.categoryIds. Therefore, default to an empty
     * array so all existing assignments are removed.
     */
    let selectedCategoryIds = req.body.categoryIds || []

    /*
     * When only one checkbox is selected, Express may provide
     * a single string instead of an array. Convert it to an array.
     */
    if (!Array.isArray(selectedCategoryIds)) {
      selectedCategoryIds = [selectedCategoryIds]
    }

    /*
     * Convert checkbox values from strings to integers.
     * Remove anything that is not a valid integer.
     */
    selectedCategoryIds = selectedCategoryIds
      .map(id => Number.parseInt(id, 10))
      .filter(id => Number.isInteger(id))

    /*
     * Update the project's category assignments.
     */
    await updateCategoryAssignments(
      projectId,
      selectedCategoryIds
    )

    /*
     * Display a success message after the update.
     */
    req.flash(
      'success',
      'Project categories updated successfully.'
    )

    /*
     * Return to the project details page.
     */
    res.redirect(`/project/${projectId}`)
  } catch (error) {
    next(error)
  }
}


// =========================================================
// EXPORTS
// =========================================================

export {
  showCategoriesPage,
  showCategoryDetailsPage,
  showAssignCategoriesForm,
  processAssignCategoriesForm
}