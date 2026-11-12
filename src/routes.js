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
  processVolunteerSignup,
  processVolunteerWithdrawal,
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
   ACTIVITY LOG CONTROLLERS
========================================================= */

import {
  showActivityHistory
} from './controllers/activities.js'


/* =========================================================
   CREATE ROUTER
========================================================= */

const router = express.Router()


/* =========================================================
   PUBLIC AUTHENTICATION ROUTES
========================================================= */

// Display registration form.
router.get(
  '/register',
  showUserRegistrationForm
)


// Process user registration.
router.post(
  '/register',
  processUserRegistrationForm
)


// Display login form.
router.get(
  '/login',
  showLoginForm
)


// Process user login.
router.post(
  '/login',
  processLoginForm
)


/* =========================================================
   LOGOUT
   Only authenticated users can log out.
========================================================= */

router.post(
  '/logout',
  requireLogin,
  processLogout
)


/* =========================================================
   PROTECTED USER DASHBOARD
   Only authenticated users can access their dashboard.
========================================================= */

router.get(
  '/dashboard',
  requireLogin,
  showDashboard
)


/* =========================================================
   ADMIN-ONLY USERS MANAGEMENT
   Only administrators can access the users page.
========================================================= */

router.get(
  '/users',
  requireLogin,
  requireRole('admin'),
  showUsersPage
)


/* =========================================================
   ADMIN-ONLY ACTIVITY HISTORY
   Only administrators can access activity logs.
========================================================= */

router.get(
  '/activity-logs',
  requireLogin,
  requireRole('admin'),
  showActivityHistory
)


/* =========================================================
   HOME PAGE
========================================================= */

router.get(
  '/',
  (req, res) => {

    return res.render('index', {
      title: 'Service Network'
    })

  }
)


/* =========================================================
   ORGANIZATION ROUTES
========================================================= */

// Display all organizations.
router.get(
  '/organizations',
  showOrganizationsPage
)


// Display organization details.
router.get(
  '/organization/:id',
  showOrganizationDetailsPage
)


/* =========================================================
   ADMIN-ONLY ORGANIZATION MANAGEMENT
========================================================= */

// Display new organization form.
router.get(
  '/new-organization',
  requireLogin,
  requireRole('admin'),
  showNewOrganizationForm
)


// Process new organization.
router.post(
  '/new-organization',
  requireLogin,
  requireRole('admin'),
  organizationValidation,
  processNewOrganizationForm
)


// Display organization edit form.
router.get(
  '/edit-organization/:id',
  requireLogin,
  requireRole('admin'),
  showEditOrganizationForm
)


// Process organization update.
router.post(
  '/edit-organization/:id',
  requireLogin,
  requireRole('admin'),
  organizationValidation,
  processEditOrganizationForm
)


/* =========================================================
   SERVICE PROJECT ROUTES
========================================================= */

// Display all service projects.
router.get(
  '/projects',
  showProjectsPage
)


// Display service project details.
router.get(
  '/project/:id',
  showProjectDetailsPage
)


/* =========================================================
   VOLUNTEER FUNCTIONALITY
   Only authenticated users can register or withdraw.
========================================================= */

// Register the logged-in user as a volunteer.
router.post(
  '/project/:id/volunteer',
  requireLogin,
  processVolunteerSignup
)


// Remove the logged-in user's volunteer registration.
router.post(
  '/project/:id/unvolunteer',
  requireLogin,
  processVolunteerWithdrawal
)


/* =========================================================
   ADMIN-ONLY SERVICE PROJECT MANAGEMENT
========================================================= */

// Display new project form.
router.get(
  '/new-project',
  requireLogin,
  requireRole('admin'),
  showNewProjectForm
)


// Process new project.
router.post(
  '/new-project',
  requireLogin,
  requireRole('admin'),
  projectValidation,
  processNewProjectForm
)


// Display project edit form.
router.get(
  '/edit-project/:id',
  requireLogin,
  requireRole('admin'),
  showEditProjectForm
)


// Process project update.
router.post(
  '/edit-project/:id',
  requireLogin,
  requireRole('admin'),
  projectValidation,
  processEditProjectForm
)


/* =========================================================
   SERVICE PROJECT CATEGORY ROUTES
========================================================= */

// Display all categories.
router.get(
  '/categories',
  showCategoriesPage
)


// Display category details.
router.get(
  '/category/:id',
  showCategoryDetailsPage
)


/* =========================================================
   ADMIN-ONLY CATEGORY MANAGEMENT
========================================================= */

// Display new category form.
router.get(
  '/new-category',
  requireLogin,
  requireRole('admin'),
  showNewCategoryForm
)


// Process new category.
router.post(
  '/new-category',
  requireLogin,
  requireRole('admin'),
  categoryValidation,
  processNewCategoryForm
)


// Display category edit form.
router.get(
  '/edit-category/:id',
  requireLogin,
  requireRole('admin'),
  showEditCategoryForm
)


// Process category update.
router.post(
  '/edit-category/:id',
  requireLogin,
  requireRole('admin'),
  categoryValidation,
  processEditCategoryForm
)


/* =========================================================
   ADMIN-ONLY CATEGORY ASSIGNMENT
   Assign categories to service projects.
========================================================= */

// Display category assignment form.
router.get(
  '/assign-categories/:projectId',
  requireLogin,
  requireRole('admin'),
  showAssignCategoriesForm
)


// Process category assignments.
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