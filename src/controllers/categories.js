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

import {
  body,
  validationResult
} from 'express-validator'


// =========================================================
// DISPLAY ALL SERVICE PROJECT CATEGORIES
// =========================================================

const showCategoriesPage = async (req, res, next) => {
  try {
    const categories = await getAllCategories()

    res.render('categories', {
      title: 'Service Categories',
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
    const categoryId = Number.parseInt(
      req.params.id,
      10
    )

    // Validate category ID.
    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      const error = new Error(
        'Category not found.'
      )

      error.status = 404

      return next(error)
    }

    // Get the selected category.
    const category =
      await getCategoryById(categoryId)

    if (!category) {
      const error = new Error(
        'Category not found.'
      )

      error.status = 404

      return next(error)
    }

    // Get projects assigned to this category.
    const projects =
      await getProjectsByCategoryId(categoryId)

    // Category details are displayed in category.ejs.
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
// DISPLAY CREATE CATEGORY FORM
// =========================================================

const showNewCategoryForm = (req, res) => {
  res.render('new-category', {
    title: 'Create New Category',
    errors: [],
    category: {
      category_name: ''
    }
  })
}


// =========================================================
// PROCESS CREATE CATEGORY FORM
// =========================================================

const processNewCategoryForm = async (
  req,
  res,
  next
) => {
  try {
    const errors = validationResult(req)

    const category = {
      category_name:
        req.body.category_name?.trim() || ''
    }

    // Redisplay form when validation fails.
    if (!errors.isEmpty()) {
      return res.status(400).render(
        'new-category',
        {
          title: 'Create New Category',
          errors: errors.array(),
          category
        }
      )
    }

    const newCategory = await createCategory(
      category.category_name
    )

    if (!newCategory) {
      const error = new Error(
        'Category could not be created.'
      )

      error.status = 500

      return next(error)
    }

    req.flash(
      'success',
      'Category was created successfully.'
    )

    return res.redirect('/categories')
  } catch (error) {
    next(error)
  }
}


// =========================================================
// DISPLAY EDIT CATEGORY FORM
// =========================================================

const showEditCategoryForm = async (
  req,
  res,
  next
) => {
  try {
    const categoryId = Number.parseInt(
      req.params.id,
      10
    )

    // Validate category ID.
    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      const error = new Error(
        'Category not found.'
      )

      error.status = 404

      return next(error)
    }

    // Get existing category information.
    const category =
      await getCategoryById(categoryId)

    if (!category) {
      const error = new Error(
        'Category not found.'
      )

      error.status = 404

      return next(error)
    }

    res.render('edit-category', {
      title: 'Edit Category',
      errors: [],
      category
    })
  } catch (error) {
    next(error)
  }
}


// =========================================================
// PROCESS EDIT CATEGORY FORM
// =========================================================

const processEditCategoryForm = async (
  req,
  res,
  next
) => {
  try {
    const categoryId = Number.parseInt(
      req.params.id,
      10
    )

    // Validate category ID.
    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      const error = new Error(
        'Category not found.'
      )

      error.status = 404

      return next(error)
    }

    const errors = validationResult(req)

    const category = {
      category_id: categoryId,
      category_name:
        req.body.category_name?.trim() || ''
    }

    // Redisplay form when validation fails.
    if (!errors.isEmpty()) {
      return res.status(400).render(
        'edit-category',
        {
          title: 'Edit Category',
          errors: errors.array(),
          category
        }
      )
    }

    const updatedCategory =
      await updateCategory(
        categoryId,
        category.category_name
      )

    if (!updatedCategory) {
      const error = new Error(
        'Category could not be updated.'
      )

      error.status = 404

      return next(error)
    }

    req.flash(
      'success',
      'Category was updated successfully.'
    )

    return res.redirect(
      `/category/${categoryId}`
    )
  } catch (error) {
    next(error)
  }
}


// =========================================================
// DISPLAY ASSIGN CATEGORIES FORM
// =========================================================

const showAssignCategoriesForm = async (
  req,
  res,
  next
) => {
  try {
    const projectId = Number.parseInt(
      req.params.projectId,
      10
    )

    // Validate project ID.
    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    // Get project details.
    const projectDetails =
      await getProjectDetails(projectId)

    if (!projectDetails) {
      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    // Get all available categories.
    const categories =
      await getAllCategories()

    // Get categories already assigned to this project.
    const assignedCategories =
      await getCategoriesByServiceProjectId(
        projectId
      )

    res.render('assign-categories', {
      title: 'Assign Categories to Project',
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

    // Validate project ID.
    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /*
     * If no checkbox is selected,
     * Express does not create categoryIds.
     */
    let selectedCategoryIds =
      req.body.categoryIds || []

    /*
     * If only one checkbox is selected,
     * Express provides a string instead of an array.
     */
    if (!Array.isArray(selectedCategoryIds)) {
      selectedCategoryIds = [
        selectedCategoryIds
      ]
    }

    /*
     * Convert checkbox values to integers
     * and remove invalid values.
     */
    selectedCategoryIds =
      selectedCategoryIds
        .map(id =>
          Number.parseInt(id, 10)
        )
        .filter(id =>
          Number.isInteger(id) &&
          id > 0
        )

    /*
     * Replace existing project-category
     * assignments with the selected categories.
     */
    await updateCategoryAssignments(
      projectId,
      selectedCategoryIds
    )

    req.flash(
      'success',
      'Project categories updated successfully.'
    )

    return res.redirect(
      `/project/${projectId}`
    )
  } catch (error) {
    next(error)
  }
}


// =========================================================
// CATEGORY VALIDATION
// =========================================================

const categoryValidation = [
  body('category_name')
    .trim()
    .notEmpty()
    .withMessage(
      'Category name is required.'
    )
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      'Category name must be between 3 and 100 characters.'
    )
]


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
  processAssignCategoriesForm,

  categoryValidation
}