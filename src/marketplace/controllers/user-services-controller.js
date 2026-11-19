import {
  getActiveServiceCategories,
  createUserService,
  getServicesByProvider
} from '../models/user-services-model.js'

import {
  createActivityLog
} from '../../models/activity-model.js'


/**
 * Display the provider service registration form.
 */
export async function showServiceRegistrationForm(req, res, next) {
  try {
    const categories = await getActiveServiceCategories()

    return res.render('marketplace/service-registration', {
      title: 'Register a Service',
      categories
    })

  } catch (error) {
    next(error)
  }
}


/**
 * Process a provider's service registration.
 *
 * The authenticated session determines the service owner.
 * Approval status is assigned by the model as pending.
 */
export async function processServiceRegistration(req, res, next) {
  try {
    const {
      service_category_id,
      service_name,
      description,
      location,
      service_area
    } = req.body

    // Validate required input types.
    if (
      typeof service_category_id !== 'string' ||
      typeof service_name !== 'string' ||
      typeof description !== 'string'
    ) {
      req.flash('error', 'Please complete all required fields.')

      return res.redirect('/marketplace/register-service')
    }

    // Validate required values.
    if (
      !service_category_id.trim() ||
      !service_name.trim() ||
      !description.trim()
    ) {
      req.flash('error', 'Please complete all required fields.')

      return res.redirect('/marketplace/register-service')
    }

    // Validate optional input types.
    if (
      (location !== undefined && typeof location !== 'string') ||
      (service_area !== undefined && typeof service_area !== 'string')
    ) {
      req.flash('error', 'Please provide valid service information.')

      return res.redirect('/marketplace/register-service')
    }

    // Validate service name length.
    if (service_name.trim().length < 3) {
      req.flash('error', 'Service name must contain at least 3 characters.')

      return res.redirect('/marketplace/register-service')
    }

    // Validate description length.
    if (description.trim().length < 20) {
      req.flash('error', 'Service description must contain at least 20 characters.')

      return res.redirect('/marketplace/register-service')
    }

    // Obtain provider identity exclusively from the authenticated session.
    const user = req.session.user

    const service = await createUserService({
      user_id: user.user_id,
      service_category_id,
      service_name,
      description,
      location,
      service_area
    })

    // Record successful submission.
    // Activity logging failure must not undo service registration.
    try {
      await createActivityLog({
        user_id: user.user_id,
        action: 'SERVICE_SUBMITTED',
        description: `User ${user.name} submitted service "${service.service_name}" for approval.`,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      })

    } catch (activityError) {
      console.error(
        'Service submission activity logging failed:',
        activityError
      )
    }

    req.flash(
      'success',
      'Your service has been submitted successfully and is awaiting administrator approval.'
    )

    return res.redirect('/marketplace/my-services')

  } catch (error) {
    console.error('Error registering provider service:', error)

    if (
      error.message === 'The selected service category is unavailable.'
    ) {
      req.flash('error', error.message)

      return res.redirect('/marketplace/register-service')
    }

    return next(error)
  }
}


/**
 * Display services submitted by the authenticated provider.
 */
export async function showMyServices(req, res, next) {
  try {
    const user = req.session.user

    const services = await getServicesByProvider(user.user_id)

    return res.render('marketplace/my-services', {
      title: 'My Services',
      services
    })

  } catch (error) {
    next(error)
  }
}
