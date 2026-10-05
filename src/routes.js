import express from 'express'


/* =========================================================
   USER CONTROLLERS
========================================================= */

import {
  requireLogin,
  requireRole,
  showDashboard,
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
   MAKE CURRENT URL AVAILABLE TO ALL EJS VIEWS
========================================================= */

router.use((req, res, next) => {
  res.locals.currentPath = req.path

  next()
})


/* =========================================================
   USER REGISTRATION
========================================================= */

/* Display user registration form */
router.get(
  '/register',
  showUserRegistrationForm
)


/* Process user registration form */
router.post(
  '/register',
  processUserRegistrationForm
)


/* =========================================================
   USER AUTHENTICATION
========================================================= */

/* Display login form */
router.get(
  '/login',
  showLoginForm
)


/* Process login form */
router.post(
  '/login',
  processLoginForm
)


/* Process logout */
router.get(
  '/logout',
  processLogout
)


/* =========================================================
   PROTECTED USER DASHBOARD
========================================================= */

/*
 * The requireLogin middleware runs first.
 * If the user is not logged in, they are redirected to /login.
 * If the user is logged in, showDashboard is executed.
 */
router.get(
  '/dashboard',
  requireLogin,
  showDashboard
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

/* Display all organizations */
router.get(
  '/organizations',
  showOrganizationsPage
)


/* Display one organization */
router.get(
  '/organization/:id',
  showOrganizationDetailsPage
)


/* ---------------------------------------------------------
   ADMIN-ONLY ORGANIZATION ROUTES
--------------------------------------------------------- */

/* Display new organization form */
router.get(
  '/new-organization',
  requireRole('admin'),
  showNewOrganizationForm
)


/* Process new organization form */
router.post(
  '/new-organization',
  requireRole('admin'),
  organizationValidation,
  processNewOrganizationForm
)


/* Display edit organization form */
router.get(
  '/edit-organization/:id',
  requireRole('admin'),
  showEditOrganizationForm
)


/* Process edit organization form */
router.post(
  '/edit-organization/:id',
  requireRole('admin'),
  organizationValidation,
  processEditOrganizationForm
)


/* =========================================================
   SERVICE PROJECTS
========================================================= */

/* Display upcoming service projects */
router.get(
  '/projects',
  showProjectsPage
)


/* Display one service project */
router.get(
  '/project/:id',
  showProjectDetailsPage
)


/* ---------------------------------------------------------
   ADMIN-ONLY SERVICE PROJECT ROUTES
--------------------------------------------------------- */

/* Display new service project form */
router.get(
  '/new-project',
  requireRole('admin'),
  showNewProjectForm
)


/* Process new service project form */
router.post(
  '/new-project',
  requireRole('admin'),
  projectValidation,
  processNewProjectForm
)


/* Display edit service project form */
router.get(
  '/edit-project/:id',
  requireRole('admin'),
  showEditProjectForm
)


/* Process edit service project form */
router.post(
  '/edit-project/:id',
  requireRole('admin'),
  projectValidation,
  processEditProjectForm
)


/* =========================================================
   SERVICE PROJECT CATEGORIES
========================================================= */

/* Display all service project categories */
router.get(
  '/categories',
  showCategoriesPage
)


/* Display one service project category */
router.get(
  '/category/:id',
  showCategoryDetailsPage
)


/* ---------------------------------------------------------
   ADMIN-ONLY CATEGORY ROUTES
--------------------------------------------------------- */

/* Display new category form */
router.get(
  '/new-category',
  requireRole('admin'),
  showNewCategoryForm
)


/* Process new category form */
router.post(
  '/new-category',
  requireRole('admin'),
  categoryValidation,
  processNewCategoryForm
)


/* Display edit category form */
router.get(
  '/edit-category/:id',
  requireRole('admin'),
  showEditCategoryForm
)


/* Process edit category form */
router.post(
  '/edit-category/:id',
  requireRole('admin'),
  categoryValidation,
  processEditCategoryForm
)


/* =========================================================
   ASSIGN CATEGORIES TO SERVICE PROJECT
========================================================= */

/* ---------------------------------------------------------
   ADMIN-ONLY CATEGORY ASSIGNMENT ROUTES
--------------------------------------------------------- */

/* Display assign categories form */
router.get(
  '/assign-categories/:projectId',
  requireRole('admin'),
  showAssignCategoriesForm
)


/* Process category assignments */
router.post(
  '/assign-categories/:projectId',
  requireRole('admin'),
  processAssignCategoriesForm
)


/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router
