import express from 'express'

/* =========================================================
   USER CONTROLLERS
========================================================= */

import {
  requireLogin,
  requireRole,
  showDashboard,
  showUsersPage,
  showUserRegistrationForm,
  processUserRegistrationForm,
  showLoginForm,
  processLoginForm,
  processLogout
} from './controllers/users.js'


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
  showNewCategoryForm,
  processNewCategoryForm,
  showEditCategoryForm,
  processEditCategoryForm,
  showAssignCategoriesForm,
  processAssignCategoriesForm,
  categoryValidation
} from './controllers/categories.js'


/* =========================================================
   CREATE ROUTER
========================================================= */

const router = express.Router()


/* =========================================================
   CURRENT URL
========================================================= */

router.use((req, res, next) => {
  res.locals.currentPath = req.path
  next()
})


/* =========================================================
   USER REGISTRATION
========================================================= */

router.get(
  '/register',
  showUserRegistrationForm
)

router.post(
  '/register',
  processUserRegistrationForm
)


/* =========================================================
   USER LOGIN
========================================================= */

router.get(
  '/login',
  showLoginForm
)

router.post(
  '/login',
  processLoginForm
)


/* =========================================================
   USER LOGOUT
========================================================= */

router.post(
  '/logout',
  requireLogin,
  processLogout
)


/* =========================================================
   USER DASHBOARD
========================================================= */

router.get(
  '/dashboard',
  requireLogin,
  showDashboard
)


/* =========================================================
   ADMIN USERS PAGE
========================================================= */

router.get(
  '/users',
  requireLogin,
  requireRole('admin'),
  showUsersPage
)


/* =========================================================
   HOME
========================================================= */

router.get(
  '/',
  (req, res) => {
    res.render('index', {
      title: 'Service Network'
    })
  }
)


/* =========================================================
   ORGANIZATIONS
========================================================= */

/* Public organization listing */
router.get(
  '/organizations',
  showOrganizationsPage
)

/* Public organization details */
router.get(
  '/organization/:id',
  showOrganizationDetailsPage
)


/* ---------------------------------------------------------
   ADMIN-ONLY ORGANIZATION ROUTES
--------------------------------------------------------- */

/* Create organization - GET */
router.get(
  '/new-organization',
  requireLogin,
  requireRole('admin'),
  showNewOrganizationForm
)

/* Create organization - POST */
router.post(
  '/new-organization',
  requireLogin,
  requireRole('admin'),
  organizationValidation,
  processNewOrganizationForm
)

/* Edit organization - GET */
router.get(
  '/edit-organization/:id',
  requireLogin,
  requireRole('admin'),
  showEditOrganizationForm
)

/* Edit organization - POST */
router.post(
  '/edit-organization/:id',
  requireLogin,
  requireRole('admin'),
  organizationValidation,
  processEditOrganizationForm
)


/* =========================================================
   SERVICE PROJECTS
========================================================= */

/* Public project listing */
router.get(
  '/projects',
  showProjectsPage
)

/* Public project details */
router.get(
  '/project/:id',
  showProjectDetailsPage
)


/* ---------------------------------------------------------
   ADMIN-ONLY SERVICE PROJECT ROUTES
--------------------------------------------------------- */

/* Create project - GET */
router.get(
  '/new-project',
  requireLogin,
  requireRole('admin'),
  showNewProjectForm
)

/* Create project - POST */
router.post(
  '/new-project',
  requireLogin,
  requireRole('admin'),
  projectValidation,
  processNewProjectForm
)

/* Edit project - GET */
router.get(
  '/edit-project/:id',
  requireLogin,
  requireRole('admin'),
  showEditProjectForm
)

/* Edit project - POST */
router.post(
  '/edit-project/:id',
  requireLogin,
  requireRole('admin'),
  projectValidation,
  processEditProjectForm
)


/* =========================================================
   SERVICE PROJECT CATEGORIES
========================================================= */

/* Public category listing */
router.get(
  '/categories',
  showCategoriesPage
)

/* Public category details */
router.get(
  '/category/:id',
  showCategoryDetailsPage
)


/* ---------------------------------------------------------
   ADMIN-ONLY CATEGORY ROUTES
--------------------------------------------------------- */

/* Create category - GET */
router.get(
  '/new-category',
  requireLogin,
  requireRole('admin'),
  showNewCategoryForm
)

/* Create category - POST */
router.post(
  '/new-category',
  requireLogin,
  requireRole('admin'),
  categoryValidation,
  processNewCategoryForm
)

/* Edit category - GET */
router.get(
  '/edit-category/:id',
  requireLogin,
  requireRole('admin'),
  showEditCategoryForm
)

/* Edit category - POST */
router.post(
  '/edit-category/:id',
  requireLogin,
  requireRole('admin'),
  categoryValidation,
  processEditCategoryForm
)


/* =========================================================
   ASSIGN CATEGORIES TO SERVICE PROJECT
========================================================= */

/* Assign categories - GET */
router.get(
  '/assign-categories/:projectId',
  requireLogin,
  requireRole('admin'),
  showAssignCategoriesForm
)

/* Assign categories - POST */
router.post(
  '/assign-categories/:projectId',
  requireLogin,
  requireRole('admin'),
  processAssignCategoriesForm
)


/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router