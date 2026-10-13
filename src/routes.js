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
   CREATE ROUTER
========================================================= */

const router = express.Router()


/* =========================================================
   PUBLIC AUTHENTICATION ROUTES
========================================================= */

/* Display registration form */
router.get(
  '/register',
  showUserRegistrationForm
)

/* Process registration */
router.post(
  '/register',
  processUserRegistrationForm
)

/* Display login form */
router.get(
  '/login',
  showLoginForm
)

/* Process login */
router.post(
  '/login',
  processLoginForm
)


/* =========================================================
   LOGOUT
   Only authenticated users can log out.
   POST is used because logout changes session state.
========================================================= */

router.post(
  '/logout',
  requireLogin,
  processLogout
)


/* =========================================================
   PROTECTED DASHBOARD
========================================================= */

router.get(
  '/dashboard',
  requireLogin,
  showDashboard
)


/* =========================================================
   ADMIN-ONLY USERS PAGE
========================================================= */

router.get(
  '/users',
  requireLogin,
  requireRole('admin'),
  showUsersPage
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
   ORGANIZATIONS
   Listing and details are public.
========================================================= */

/* Display all organizations */
router.get(
  '/organizations',
  showOrganizationsPage
)

/* Display organization details */
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
  requireLogin,
  requireRole('admin'),
  showNewOrganizationForm
)

/* Process new organization */
router.post(
  '/new-organization',
  requireLogin,
  requireRole('admin'),
  organizationValidation,
  processNewOrganizationForm
)

/* Display organization edit form */
router.get(
  '/edit-organization/:id',
  requireLogin,
  requireRole('admin'),
  showEditOrganizationForm
)

/* Process organization update */
router.post(
  '/edit-organization/:id',
  requireLogin,
  requireRole('admin'),
  organizationValidation,
  processEditOrganizationForm
)


/* =========================================================
   SERVICE PROJECTS
   Listing and details are public.
========================================================= */

/* Display all service projects */
router.get(
  '/projects',
  showProjectsPage
)

/* Display service project details */
router.get(
  '/project/:id',
  showProjectDetailsPage
)


/* ---------------------------------------------------------
   W06 VOLUNTEER FUNCTIONALITY
   Only logged-in users can volunteer or withdraw.
--------------------------------------------------------- */

/* Register the logged-in user as a volunteer */
router.post(
  '/project/:id/volunteer',
  requireLogin,
  processVolunteerSignup
)

/* Remove the logged-in user's volunteer registration */
router.post(
  '/project/:id/unvolunteer',
  requireLogin,
  processVolunteerWithdrawal
)


/* ---------------------------------------------------------
   ADMIN-ONLY SERVICE PROJECT ROUTES
--------------------------------------------------------- */

/* Display new project form */
router.get(
  '/new-project',
  requireLogin,
  requireRole('admin'),
  showNewProjectForm
)

/* Process new project */
router.post(
  '/new-project',
  requireLogin,
  requireRole('admin'),
  projectValidation,
  processNewProjectForm
)

/* Display project edit form */
router.get(
  '/edit-project/:id',
  requireLogin,
  requireRole('admin'),
  showEditProjectForm
)

/* Process project update */
router.post(
  '/edit-project/:id',
  requireLogin,
  requireRole('admin'),
  projectValidation,
  processEditProjectForm
)


/* =========================================================
   SERVICE PROJECT CATEGORIES
   Listing and details are public.
========================================================= */

/* Display all categories */
router.get(
  '/categories',
  showCategoriesPage
)

/* Display category details */
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
  requireLogin,
  requireRole('admin'),
  showNewCategoryForm
)

/* Process new category */
router.post(
  '/new-category',
  requireLogin,
  requireRole('admin'),
  categoryValidation,
  processNewCategoryForm
)

/* Display category edit form */
router.get(
  '/edit-category/:id',
  requireLogin,
  requireRole('admin'),
  showEditCategoryForm
)

/* Process category update */
router.post(
  '/edit-category/:id',
  requireLogin,
  requireRole('admin'),
  categoryValidation,
  processEditCategoryForm
)


/* =========================================================
   ASSIGN CATEGORIES TO SERVICE PROJECT
   Only administrators can assign categories.
========================================================= */

/* Display category assignment form */
router.get(
  '/assign-categories/:projectId',
  requireLogin,
  requireRole('admin'),
  showAssignCategoriesForm
)

/* Process category assignments */
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
