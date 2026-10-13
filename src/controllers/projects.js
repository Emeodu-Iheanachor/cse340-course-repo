import {
  getUpcomingProjects,
  getProjectDetails,
  getCategoriesByProjectId,
  createProject,
  updateProject
} from '../models/projects.js'

import {
  getAllOrganizations
} from '../models/organizations.js'

import {
  addVolunteer,
  removeVolunteer,
  isVolunteer
} from '../models/volunteer-model.js'

import {
  body,
  validationResult
} from 'express-validator'


/* =========================================================
   PROJECT CONFIGURATION
========================================================= */

const NUMBER_OF_UPCOMING_PROJECTS = 5


/* =========================================================
   PROJECT VALIDATION RULES
========================================================= */

const projectValidation = [

  body('title')
    .trim()
    .notEmpty()
    .withMessage(
      'Project title is required.'
    )
    .isLength({
      min: 3,
      max: 200
    })
    .withMessage(
      'Project title must be between 3 and 200 characters.'
    ),

  body('description')
    .trim()
    .notEmpty()
    .withMessage(
      'Project description is required.'
    )
    .isLength({
      max: 1000
    })
    .withMessage(
      'Project description must be no more than 1000 characters.'
    ),

  body('location')
    .trim()
    .notEmpty()
    .withMessage(
      'Project location is required.'
    )
    .isLength({
      min: 2,
      max: 200
    })
    .withMessage(
      'Project location must be between 2 and 200 characters.'
    ),

  body('start_date')
    .notEmpty()
    .withMessage(
      'Project start date is required.'
    )
    .isISO8601({
      strict: true
    })
    .withMessage(
      'Project start date must be a valid date.'
    ),

  body('end_date')
    .notEmpty()
    .withMessage(
      'Project end date is required.'
    )
    .isISO8601({
      strict: true
    })
    .withMessage(
      'Project end date must be a valid date.'
    )
    .custom((endDate, { req }) => {

      const startDate = req.body.start_date

      if (
        startDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
        /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
        endDate < startDate
      ) {
        throw new Error(
          'Project end date must be on or after the start date.'
        )
      }

      return true
    }),

  body('organization_id')
    .notEmpty()
    .withMessage(
      'Organization is required.'
    )
    .isInt({
      min: 1
    })
    .withMessage(
      'Organization must be a valid organization ID.'
    )
]


/* =========================================================
   DISPLAY UPCOMING SERVICE PROJECTS
========================================================= */

const showProjectsPage = async (
  req,
  res,
  next
) => {

  try {

    const projects =
      await getUpcomingProjects(
        NUMBER_OF_UPCOMING_PROJECTS
      )

    return res.render('projects', {
      title: 'Upcoming Service Projects',
      projects
    })

  } catch (error) {

    return next(error)

  }
}


/* =========================================================
   DISPLAY ONE SERVICE PROJECT
========================================================= */

const showProjectDetailsPage = async (
  req,
  res,
  next
) => {

  try {

    const projectId = Number.parseInt(
      req.params.id,
      10
    )

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    const project =
      await getProjectDetails(projectId)

    if (!project) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    const categories =
      await getCategoriesByProjectId(
        projectId
      )

    /* -----------------------------------------------------
       CHECK VOLUNTEER STATUS
    ----------------------------------------------------- */

    let volunteering = false

    const user = req.session?.user || null

    if (user) {

      volunteering = await isVolunteer(
        user.user_id,
        projectId
      )

    }

    return res.render('project', {
      title: project.title,
      project,
      categories,
      volunteering,
      user
    })

  } catch (error) {

    return next(error)

  }
}


/* =========================================================
   REGISTER AS A VOLUNTEER
========================================================= */

const processVolunteerSignup = async (
  req,
  res,
  next
) => {

  try {

    const projectId = Number.parseInt(
      req.params.id,
      10
    )

    /* -----------------------------------------------------
       VALIDATE PROJECT ID
    ----------------------------------------------------- */

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       VERIFY THAT THE PROJECT EXISTS
    ----------------------------------------------------- */

    const project =
      await getProjectDetails(projectId)

    if (!project) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       GET THE LOGGED-IN USER
    ----------------------------------------------------- */

    const userId =
      req.session.user.user_id

    /* -----------------------------------------------------
       PREVENT DUPLICATE VOLUNTEER REGISTRATIONS
    ----------------------------------------------------- */

    const alreadyVolunteering =
      await isVolunteer(
        userId,
        projectId
      )

    if (alreadyVolunteering) {

      req.flash(
        'notice',
        'You are already volunteering for this project.'
      )

      return res.redirect(
        `/project/${projectId}`
      )
    }

    /* -----------------------------------------------------
       ADD VOLUNTEER REGISTRATION
    ----------------------------------------------------- */

    const volunteer =
      await addVolunteer(
        userId,
        projectId
      )

    if (!volunteer) {

      req.flash(
        'notice',
        'You are already volunteering for this project.'
      )

      return res.redirect(
        `/project/${projectId}`
      )
    }

    /* -----------------------------------------------------
       SUCCESS MESSAGE
    ----------------------------------------------------- */

    req.flash(
      'success',
      'You have successfully signed up to volunteer for this project!'
    )

    return res.redirect(
      `/project/${projectId}`
    )

  } catch (error) {

    console.error(
      'Error registering volunteer:',
      error
    )

    return next(error)

  }
}


/* =========================================================
   WITHDRAW FROM A SERVICE PROJECT
========================================================= */

const processVolunteerWithdrawal = async (
  req,
  res,
  next
) => {

  try {

    const projectId = Number.parseInt(
      req.params.id,
      10
    )

    /* -----------------------------------------------------
       VALIDATE PROJECT ID
    ----------------------------------------------------- */

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       VERIFY THAT THE PROJECT EXISTS
    ----------------------------------------------------- */

    const project =
      await getProjectDetails(projectId)

    if (!project) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       GET THE LOGGED-IN USER
    ----------------------------------------------------- */

    const userId =
      req.session.user.user_id

    /* -----------------------------------------------------
       REMOVE VOLUNTEER REGISTRATION
    ----------------------------------------------------- */

    const removedVolunteer =
      await removeVolunteer(
        userId,
        projectId
      )

    if (!removedVolunteer) {

      req.flash(
        'notice',
        'You are not currently volunteering for this project.'
      )

      return res.redirect(
        `/project/${projectId}`
      )
    }

    /* -----------------------------------------------------
       SUCCESS MESSAGE
    ----------------------------------------------------- */

    req.flash(
      'success',
      'You have successfully withdrawn from this service project.'
    )

    return res.redirect(
      `/project/${projectId}`
    )

  } catch (error) {

    console.error(
      'Error withdrawing volunteer:',
      error
    )

    return next(error)

  }
}


/* =========================================================
   DISPLAY NEW PROJECT FORM
========================================================= */

const showNewProjectForm = async (
  req,
  res,
  next
) => {

  try {

    const organizations =
      await getAllOrganizations()

    return res.render('new-project', {
      title: 'Add New Service Project',
      organizations,
      errors: []
    })

  } catch (error) {

    return next(error)

  }
}


/* =========================================================
   PROCESS NEW PROJECT FORM
========================================================= */

const processNewProjectForm = async (
  req,
  res,
  next
) => {

  try {

    const {
      title,
      description,
      location,
      start_date,
      end_date,
      organization_id
    } = req.body

    /* -----------------------------------------------------
       CHECK VALIDATION ERRORS
    ----------------------------------------------------- */

    const errors =
      validationResult(req)

    if (!errors.isEmpty()) {

      errors.array().forEach(
        (error) => {
          req.flash(
            'error',
            error.msg
          )
        }
      )

      return res.redirect(
        '/new-project'
      )
    }

    /* -----------------------------------------------------
       CREATE PROJECT
    ----------------------------------------------------- */

    const newProjectId =
      await createProject(
        title,
        description,
        location,
        start_date,
        end_date,
        organization_id
      )

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
      console.log(
        'New service project created:',
        newProjectId
      )
    }

    /* -----------------------------------------------------
       SUCCESS MESSAGE
    ----------------------------------------------------- */

    req.flash(
      'success',
      'New service project created successfully!'
    )

    return res.redirect(
      '/projects'
    )

  } catch (error) {

    console.error(
      'Error creating new service project:',
      error
    )

    return next(error)

  }
}


/* =========================================================
   DISPLAY EDIT PROJECT FORM
========================================================= */

const showEditProjectForm = async (
  req,
  res,
  next
) => {

  try {

    const projectId =
      Number.parseInt(
        req.params.id,
        10
      )

    /* -----------------------------------------------------
       VALIDATE PROJECT ID
    ----------------------------------------------------- */

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       GET EXISTING PROJECT
    ----------------------------------------------------- */

    const project =
      await getProjectDetails(
        projectId
      )

    if (!project) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       GET ORGANIZATIONS FOR DROPDOWN
    ----------------------------------------------------- */

    const organizations =
      await getAllOrganizations()

    /* -----------------------------------------------------
       RENDER EDIT PROJECT VIEW
    ----------------------------------------------------- */

    return res.render(
      'edit-project',
      {
        title: 'Edit Service Project',
        project,
        organizations,
        errors: []
      }
    )

  } catch (error) {

    return next(error)

  }
}


/* =========================================================
   PROCESS EDIT PROJECT FORM
========================================================= */

const processEditProjectForm = async (
  req,
  res,
  next
) => {

  try {

    const projectId =
      Number.parseInt(
        req.params.id,
        10
      )

    /* -----------------------------------------------------
       VALIDATE PROJECT ID
    ----------------------------------------------------- */

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {

      const error = new Error(
        'Project not found.'
      )

      error.status = 404

      return next(error)
    }

    /* -----------------------------------------------------
       GET SUBMITTED FORM DATA
    ----------------------------------------------------- */

    const {
      title,
      description,
      location,
      start_date,
      end_date,
      organization_id
    } = req.body

    /* -----------------------------------------------------
       CHECK VALIDATION ERRORS
    ----------------------------------------------------- */

    const errors =
      validationResult(req)

    if (!errors.isEmpty()) {

      errors.array().forEach(
        (error) => {
          req.flash(
            'error',
            error.msg
          )
        }
      )

      return res.redirect(
        `/edit-project/${projectId}`
      )
    }

    /* -----------------------------------------------------
       UPDATE PROJECT
    ----------------------------------------------------- */

    const updatedProject =
      await updateProject(
        projectId,
        title,
        description,
        location,
        start_date,
        end_date,
        organization_id
      )

    if (!updatedProject) {

      const error = new Error(
        'Project could not be updated.'
      )

      error.status = 404

      return next(error)
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
      console.log(
        'Service project updated:',
        projectId
      )
    }

    /* -----------------------------------------------------
       SUCCESS MESSAGE
    ----------------------------------------------------- */

    req.flash(
      'success',
      'Service project updated successfully!'
    )

    /* -----------------------------------------------------
       RETURN TO UPDATED PROJECT
    ----------------------------------------------------- */

    return res.redirect(
      `/project/${projectId}`
    )

  } catch (error) {

    console.error(
      'Error updating service project:',
      error
    )

    return next(error)

  }
}


/* =========================================================
   EXPORT CONTROLLER FUNCTIONS
========================================================= */

export {
  showProjectsPage,
  showProjectDetailsPage,

  showNewProjectForm,
  processNewProjectForm,

  showEditProjectForm,
  processEditProjectForm,

  processVolunteerSignup,
  processVolunteerWithdrawal,

  projectValidation
}
