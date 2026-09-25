import express from 'express'


/* =========================================================
   ORGANIZATION CONTROLLERS
========================================================= */

import {
  showOrganizationsPage,
  showOrganizationDetailsPage,
  showNewOrganizationForm,
  processNewOrganizationForm,
  showEditOrganizationForm,
  processEditOrganizationForm,
  organizationValidation
} from './controllers/organizations.js'


/* =========================================================
   PROJECT CONTROLLERS
========================================================= */

import {
  showProjectsPage,
  showProjectDetailsPage,
  showNewProjectForm,
  processNewProjectForm,
  showEditProjectForm,
  processEditProjectForm,
  projectValidation
} from './controllers/projects.js'


/* =========================================================
   CATEGORY CONTROLLERS
========================================================= */

import {
  showCategoriesPage,
  showCategoryDetailsPage,
  showAssignCategoriesForm,
  processAssignCategoriesForm
} from './controllers/categories.js'


const router = express.Router()


/* =========================================================
   MAKE CURRENT URL AVAILABLE TO ALL EJS VIEWS
========================================================= */

router.use((req, res, next) => {
  res.locals.currentPath = req.path
  next()
})


/* =========================================================
   HOME
========================================================= */

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Service Network'
  })
})


/* =========================================================
   ORGANIZATIONS
========================================================= */

// Display all organizations
router.get(
  '/organizations',
  showOrganizationsPage
)


// Display one organization
router.get(
  '/organization/:id',
  showOrganizationDetailsPage
)


// Display new organization form
router.get(
  '/new-organization',
  showNewOrganizationForm
)


// Process new organization form
router.post(
  '/new-organization',
  organizationValidation,
  processNewOrganizationForm
)


// Display edit organization form
router.get(
  '/edit-organization/:id',
  showEditOrganizationForm
)


// Process edit organization form
router.post(
  '/edit-organization/:id',
  organizationValidation,
  processEditOrganizationForm
)


/* =========================================================
   SERVICE PROJECTS
========================================================= */

// Display upcoming service projects
router.get(
  '/projects',
  showProjectsPage
)


// Display one service project
router.get(
  '/project/:id',
  showProjectDetailsPage
)


// Display new service project form
router.get(
  '/new-project',
  showNewProjectForm
)


// Process new service project form
router.post(
  '/new-project',
  projectValidation,
  processNewProjectForm
)


// Display edit service project form
router.get(
  '/edit-project/:id',
  showEditProjectForm
)


// Process edit service project form
router.post(
  '/edit-project/:id',
  projectValidation,
  processEditProjectForm
)


/* =========================================================
   SERVICE PROJECT CATEGORIES
========================================================= */

// Display all service project categories
router.get(
  '/categories',
  showCategoriesPage
)


// Display one service project category
router.get(
  '/category/:id',
  showCategoryDetailsPage
)


/* =========================================================
   ASSIGN CATEGORIES TO SERVICE PROJECT
========================================================= */

// Display assign categories form
router.get(
  '/assign-categories/:projectId',
  showAssignCategoriesForm
)


// Process assign categories form
router.post(
  '/assign-categories/:projectId',
  processAssignCategoriesForm
)


/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router