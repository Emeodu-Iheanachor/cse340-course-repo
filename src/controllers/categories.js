import {
  getAllCategories,
  getCategoryById,
  getProjectsByCategoryId,
  getCategoriesByServiceProjectId,
  createCategory,
  updateCategory,
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
    const categoryId = Number.parseInt(req.params.id, 10)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).render('error', {
        title: 'Category Not Found',
        message:
          'The requested service project category could not be found.'
      })
    }

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
// DISPLAY NEW CATEGORY FORM
// =========================================================

const showNewCategoryForm = (req, res) => {
  res.render('new-category', {
    title: 'Create New Category',
    errors: [],
    categoryName: ''
  })
}


// =========================================================
// VALIDATE CATEGORY
// =========================================================

const validateCategory = (categoryName) => {
  const errors = []

  const name =
    typeof categoryName === 'string'
      ? categoryName.trim()
      : ''

  // Server-side required validation.
  if (!name) {
    errors.push('Category name is required.')
  }

  // Server-side minimum validation.
  else if (name.length < 3) {
    errors.push(
      'Category name must be at least 3 characters long.'
    )
  }

  // Server-side maximum validation.
  else if (name.length > 100) {
    errors.push(
      'Category name must not exceed 100 characters.'
    )
  }

  return {
    errors,
    categoryName: name
  }
}


// =========================================================
// PROCESS NEW CATEGORY FORM
// =========================================================

const processNewCategoryForm = async (req, res, next) => {
  const {
    errors,
    categoryName
  } = validateCategory(req.body.category_name)

  if (errors.length > 0) {
    return res.status(400).render('new-category', {
      title: 'Create New Category',
      errors,
      categoryName
    })
  }

  try {
    const category = await createCategory(categoryName)

    if (!category) {
      const error = new Error(
        'The category could not be created.'
      )

      return next(error)
    }

    req.flash(
      'success',
      'Service category created successfully.'
    )

    res.redirect('/categories')
  } catch (error) {
    next(error)
  }
}


// =========================================================
// DISPLAY EDIT CATEGORY FORM
// =========================================================

const showEditCategoryForm = async (req, res, next) => {
  try {
    const categoryId = Number.parseInt(req.params.id, 10)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).render('error', {
        title: 'Category Not Found',
        message:
          'The requested service project category could not be found.'
      })
    }

    const category = await getCategoryById(categoryId)

    if (!category) {
      return res.status(404).render('error', {
        title: 'Category Not Found',
        message:
          'The requested service project category could not be found.'
      })
    }

    res.render('edit-category', {
      title: 'Edit Category',
      category,
      errors: []
    })
  } catch (error) {
    next(error)
  }
}


// =========================================================
// PROCESS EDIT CATEGORY FORM
// =========================================================

const processEditCategoryForm = async (req, res, next) => {
  const categoryId = Number.parseInt(req.params.id, 10)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(404).render('error', {
      title: 'Category Not Found',
      message:
        'The requested service project category could not be found.'
    })
  }

  const {
    errors,
    categoryName
  } = validateCategory(req.body.category_name)

  if (errors.length > 0) {
    return res.status(400).render('edit-category', {
      title: 'Edit Category',
      errors,
      category: {
        category_id: categoryId,
        category_name: categoryName
      }
    })
  }

  try {
    const category = await updateCategory(
      categoryId,
      categoryName
    )

    if (!category) {
      return res.status(404).render('error', {
        title: 'Category Not Found',
        message:
          'The requested service project category could not be found.'
      })
    }

    req.flash(
      'success',
      'Service category updated successfully.'
    )

    res.redirect(`/category/${categoryId}`)
  } catch (error) {
    next(error)
  }
}


// =========================================================
// DISPLAY ASSIGN CATEGORIES FORM
// =========================================================

const showAssignCategoriesForm = async (req, res, next) => {
  try {
    const projectId = Number.parseInt(
      req.params.projectId,
      10
    )

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(404).render('error', {
        title: 'Project Not Found',
        message:
          'The requested service project could not be found.'
      })
    }

    // Get the project being edited.
    const projectDetails =
      await getProjectDetails(projectId)

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

const processAssignCategoriesForm = async (
  req,
  res,
  next
) => {
  try {
    const projectId = Number.parseInt(
      req.params.projectId,
      10
    )

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(404).render('error', {
        title: 'Project Not Found',
        message:
          'The requested service project could not be found.'
      })
    }

    /*
     * When no checkbox is selected, Express will not create
     * req.body.categoryIds. Therefore, default to an empty
     * array so all existing assignments are removed.
     */
    let selectedCategoryIds =
      req.body.categoryIds || []

    /*
     * When only one checkbox is selected, Express may provide
     * a single string instead of an array. Convert it to an array.
     */
    if (!Array.isArray(selectedCategoryIds)) {
      selectedCategoryIds = [
        selectedCategoryIds
      ]
    }

    /*
     * Convert checkbox values from strings to integers.
     */
    selectedCategoryIds = selectedCategoryIds
      .map(id => Number.parseInt(id, 10))
      .filter(id => Number.isInteger(id) && id > 0)

    /*
     * Update the project's category assignments.
     */
    await updateCategoryAssignments(
      projectId,
      selectedCategoryIds
    )

    /*
     * Display a success message.
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

  showNewCategoryForm,
  processNewCategoryForm,

  showEditCategoryForm,
  processEditCategoryForm,

  showAssignCategoriesForm,
  processAssignCategoriesForm
}