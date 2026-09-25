import {
  body,
  validationResult
} from 'express-validator'

import {
  getAllOrganizations,
  getOrganizationDetails,
  createOrganization,
  updateOrganization
} from '../models/organizations.js'

import {
  getProjectsByOrganizationId
} from '../models/projects.js'


// =========================================================
// ORGANIZATION FORM VALIDATION
// =========================================================

const organizationValidation = [

  // Organization name
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 3, max: 150 })
    .withMessage(
      'Organization name must be between 3 and 150 characters'
    )
    .escape(),

  // Organization description
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Organization description is required')
    .isLength({ max: 500 })
    .withMessage(
      'Organization description cannot exceed 500 characters'
    )
    .escape(),

  // Organization contact email
  body('contactEmail')
    .trim()
    .notEmpty()
    .withMessage('Contact email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
]


// =========================================================
// DISPLAY ALL ORGANIZATIONS
// =========================================================

const showOrganizationsPage = async (req, res) => {

  const organizations = await getAllOrganizations()

  res.render('organizations', {
    title: 'Our Partner Organizations',
    organizations
  })
}


// =========================================================
// DISPLAY ONE ORGANIZATION AND ITS SERVICE PROJECTS
// =========================================================

const showOrganizationDetailsPage = async (req, res) => {

  const organizationId = req.params.id

  const organizationDetails =
    await getOrganizationDetails(organizationId)

  // Handle organization not found
  if (!organizationDetails) {
    return res.status(404).render('errors/404', {
      title: 'Organization Not Found'
    })
  }

  const projects =
    await getProjectsByOrganizationId(organizationId)

  res.render('organization', {
    title: organizationDetails.name,
    organizationDetails,
    projects
  })
}


// =========================================================
// DISPLAY NEW ORGANIZATION FORM
// =========================================================

const showNewOrganizationForm = async (req, res) => {

  const title = 'Add New Organization'

  res.render('new-organization', {
    title
  })
}


// =========================================================
// PROCESS NEW ORGANIZATION FORM
// =========================================================

const processNewOrganizationForm = async (req, res) => {

  // Check for validation errors
  const results = validationResult(req)

  if (!results.isEmpty()) {

    results.array().forEach((error) => {
      req.flash('error', error.msg)
    })

    return res.redirect('/new-organization')
  }

  // Validation passed
  const {
    name,
    description,
    contactEmail
  } = req.body

  // Use the placeholder logo for all new organizations
  const logoFilename = 'placeholder-logo.png'

  const organizationId = await createOrganization(
    name,
    description,
    contactEmail,
    logoFilename
  )

  // Set success flash message
  req.flash(
    'success',
    'Organization added successfully!'
  )

  // Redirect to the newly created organization
  res.redirect(`/organization/${organizationId}`)
}


// =========================================================
// DISPLAY EDIT ORGANIZATION FORM
// =========================================================

const showEditOrganizationForm = async (req, res) => {

  const organizationId = req.params.id

  const organizationDetails =
    await getOrganizationDetails(organizationId)

  // Handle organization not found
  if (!organizationDetails) {
    return res.status(404).render('errors/404', {
      title: 'Page Not Found'
    })
  }

  const title = 'Edit Organization'

  res.render('edit-organization', {
    title,
    organizationDetails
  })
}


// =========================================================
// PROCESS EDIT ORGANIZATION FORM
// =========================================================

const processEditOrganizationForm = async (req, res) => {

  const organizationId = req.params.id

  const {
    name,
    description,
    contactEmail,
    logoFilename
  } = req.body

  // Check for validation errors
  const results = validationResult(req)

  if (!results.isEmpty()) {

    results.array().forEach((error) => {
      req.flash('error', error.msg)
    })

    return res.redirect(
      `/edit-organization/${organizationId}`
    )
  }

  // Update the organization
  await updateOrganization(
    organizationId,
    name,
    description,
    contactEmail,
    logoFilename
  )

  // Set success message
  req.flash(
    'success',
    'Organization updated successfully!'
  )

  // Return to organization details
  res.redirect(
    `/organization/${organizationId}`
  )
}


// =========================================================
// EXPORT CONTROLLER FUNCTIONS
// =========================================================

export {
  showOrganizationsPage,
  showOrganizationDetailsPage,
  showNewOrganizationForm,
  processNewOrganizationForm,
  showEditOrganizationForm,
  processEditOrganizationForm,
  organizationValidation
}
