import {
  getAllCategories,
  getCategoryById,
  getProjectsByCategoryId
} from '../models/categories.js'


const showCategoriesPage = async (req, res) => {
  const categories = await getAllCategories()
  const title = 'Service Categories'

  res.render('categories', {
    title,
    categories
  })
}


/* Display one service project category */
const showCategoryDetailsPage = async (req, res) => {
  const categoryId = req.params.id

  const category = await getCategoryById(categoryId)

  if (!category) {
    return res.status(404).render('error', {
      title: 'Category Not Found',
      message: 'The requested service project category could not be found.'
    })
  }

  const projects = await getProjectsByCategoryId(categoryId)

  res.render('category', {
    title: category.category_name,
    category,
    projects
  })
}


export {
  showCategoriesPage,
  showCategoryDetailsPage
}