import express from 'express'

import {
    requireLogin,
    requireRole
} from '../../middleware/auth.js'

import {
    showServiceCategories,
    showServiceCategory
} from '../controllers/service-categories-controller.js'

import {
    showServiceRegistrationForm,
    processServiceRegistration,
    showMyServices
} from '../controllers/user-services-controller.js'

import {
    showPendingServices,
    showManagedServices,
    showServiceDetails,
    approveService,
    rejectService,
    suspendService,
    cancelService,
    reinstateService
} from '../controllers/admin-services-controller.js'


const router = express.Router()


/* =========================================================
PUBLIC MARKETPLACE ROUTES
========================================================= */

// Marketplace homepage: list active service categories.
router.get('/', showServiceCategories)

// Display all active service categories.
router.get('/categories', showServiceCategories)

// Display one category using its slug.
router.get('/categories/:slug', showServiceCategory)


/* =========================================================
AUTHENTICATED PROVIDER ROUTES
========================================================= */

// Display the service registration form.
router.get(
    '/register-service',
    requireLogin,
    showServiceRegistrationForm
)

// Process a provider's service registration.
router.post(
    '/register-service',
    requireLogin,
    processServiceRegistration
)

// Display services submitted by the authenticated provider.
router.get(
    '/my-services',
    requireLogin,
    showMyServices
)


/* =========================================================
ADMINISTRATOR SERVICE APPROVAL ROUTES
========================================================= */

// Display all pending service submissions.
router.get(
    '/admin/services',
    requireLogin,
    requireRole('admin'),
    showPendingServices
)


// Display all marketplace services for administrator management.
router.get(
    '/admin/services/manage',
    requireLogin,
    requireRole('admin'),
    showManagedServices
)

// Display an individual service submission.
router.get(
    '/admin/services/:id',
    requireLogin,
    requireRole('admin'),
    showServiceDetails
)

// Approve a pending service.
router.post(
    '/admin/services/:id/approve',
    requireLogin,
    requireRole('admin'),
    approveService
)

// Reject a pending service.
router.post(
    '/admin/services/:id/reject',
    requireLogin,
    requireRole('admin'),
    rejectService
)


/* =========================================================
ADMINISTRATOR SERVICE MANAGEMENT ROUTES
========================================================= */

// Suspend an approved service.
router.post(
    '/admin/services/:id/suspend',
    requireLogin,
    requireRole('admin'),
    suspendService
)

// Cancel an approved or suspended service.
router.post(
    '/admin/services/:id/cancel',
    requireLogin,
    requireRole('admin'),
    cancelService
)

// Reinstate a suspended service.
router.post(
    '/admin/services/:id/reinstate',
    requireLogin,
    requireRole('admin'),
    reinstateService
)


export default router
