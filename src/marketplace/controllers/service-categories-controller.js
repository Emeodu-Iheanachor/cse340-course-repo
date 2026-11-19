import {
  getAllServiceCategories,
  getServiceCategoryBySlug,
  getServicesByCategorySlug,
} from '../models/service-categories-model.js'

/**
 * Display all active marketplace service categories.
 */
export async function showServiceCategories(req, res, next) {
  try {
    const categories = await getAllServiceCategories()

    return res.render('marketplace/service-categories', {
      title: 'Marketplace Service Categories',
      categories,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Display one service category and its approved services.
 */
export async function showServiceCategory(req, res, next) {
  try {
    const { slug } = req.params

    // Retrieve the requested active category.
    const category = await getServiceCategoryBySlug(slug)

    // Handle categories that do not exist or are inactive.
    if (!category) {
      req.flash('error', 'The requested service category was not found.')
      return res.redirect('/marketplace/categories')
    }

    // Retrieve approved, available services in this category.
    const services = await getServicesByCategorySlug(slug)

    return res.render('marketplace/service-category', {
      title: category.category_name,
      category,
      services,
    })
  } catch (error) {
    next(error)
  }
}
