import express from 'express'

import {
  showOrganizationsPage,
  showOrganizationDetailsPage
} from './controllers/organizations.js'

import {
  showProjectsPage,
  showProjectDetailsPage
} from './controllers/projects.js'

import {
  showCategoriesPage
} from './controllers/categories.js'


const router = express.Router()


/* Make the current URL available to all EJS views */
router.use((req, res, next) => {
  res.locals.currentPath = req.path
  next()
})


/* Home */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Service Network'
  })
})


/* Organizations */
router.get(
  '/organizations',
  showOrganizationsPage
)


/* Organization details */
router.get(
  '/organization/:id',
  showOrganizationDetailsPage
)


/* Upcoming service projects */
router.get(
  '/projects',
  showProjectsPage
)


/* Service project details */
router.get(
  '/project/:id',
  showProjectDetailsPage
)


/* Service project categories */
router.get(
  '/categories',
  showCategoriesPage
)


export default router