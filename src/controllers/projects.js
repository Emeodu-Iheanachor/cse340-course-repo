/* =========================================================
   SERVICE NETWORK
   PROJECT AND VOLUNTEER CONTROLLER

   Handles:
   - Displaying upcoming projects
   - Displaying individual projects
   - Volunteer registration
   - Volunteer withdrawal
   - Creating projects
   - Editing projects
   - Recording project and volunteer activities
========================================================= */


/* =========================================================
   IMPORT ACTIVITY LOGGING MODEL
========================================================= */

import {
  createActivityLog
} from '../models/activity-model.js'


/* =========================================================
   IMPORT PROJECT MODEL
========================================================= */

import {
  getUpcomingProjects,
  getProjectDetails,
  getCategoriesByProjectId,
  createProject,
  updateProject
} from '../models/projects.js'


/* =========================================================
   IMPORT ORGANIZATION MODEL
========================================================= */

import {
  getAllOrganizations
} from '../models/organizations.js'


/* =========================================================
   IMPORT VOLUNTEER MODEL
========================================================= */

import {
  addVolunteer,
  removeVolunteer,
  isVolunteer
} from '../models/volunteer-model.js'


/* =========================================================
   IMPORT EXPRESS VALIDATOR
========================================================= */

import {
  body,
  validationResult
} from 'express-validator'


/* =========================================================
   PROJECT CONFIGURATION
========================================================= */

const NUMBER_OF_UPCOMING_PROJECTS = 5


/* =========================================================
   RECORD PROJECT AND VOLUNTEER ACTIVITIES

   Records activities in PostgreSQL.

   Activity logging must never interrupt successful
   application operations if logging fails.
========================================================= */

const recordProjectActivity = async (
  req,
  action,
  description
) => {

  try {

    await createActivityLog({

      user_id:
        req.session?.user?.user_id ?? null,

      action,

      description,

      ip_address:
        req.ip || null,

      user_agent:
        req.get('user-agent') || null

    })

  } catch (error) {

    console.error(
      `Failed to record ${action} activity:`,
      error
    )

  }

}


/* =========================================================
   PROJECT VALIDATION RULES
========================================================= */

const projectValidation = [

  /* -------------------------------------------------------
     PROJECT TITLE
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     PROJECT DESCRIPTION
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     PROJECT LOCATION
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     PROJECT START DATE
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     PROJECT END DATE
  ------------------------------------------------------- */

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

      const startDate =
        req.body.start_date

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


  /* -------------------------------------------------------
     PROJECT ORGANIZATION
  ------------------------------------------------------- */

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
       GET PROJECT DETAILS
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
       GET PROJECT CATEGORIES
    ----------------------------------------------------- */

    const categories =
      await getCategoriesByProjectId(
        projectId
      )


    /* -----------------------------------------------------
       CHECK VOLUNTEER STATUS
    ----------------------------------------------------- */

    let volunteering = false

    const user =
      req.session?.user || null


    if (user) {

      volunteering =
        await isVolunteer(
          user.user_id,
          projectId
        )

    }


    /* -----------------------------------------------------
       RENDER PROJECT DETAILS
    ----------------------------------------------------- */

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
       RECORD SUCCESSFUL VOLUNTEER SIGNUP
    ----------------------------------------------------- */

    await recordProjectActivity(

      req,

      'VOLUNTEER_SIGNUP',

      `User signed up to volunteer for project: ${project.title} (Project ID: ${projectId}).`

    )


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
       RECORD SUCCESSFUL VOLUNTEER WITHDRAWAL
    ----------------------------------------------------- */

    await recordProjectActivity(

      req,

      'VOLUNTEER_WITHDRAW',

      `User withdrew from project: ${project.title} (Project ID: ${projectId}).`

    )


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


    /* -----------------------------------------------------
       RECORD SUCCESSFUL PROJECT CREATION
    ----------------------------------------------------- */

    if (newProjectId) {

      await recordProjectActivity(

        req,

        'PROJECT_CREATE',

        `Created service project: ${title} (Project ID: ${newProjectId}).`

      )

    }


    /* -----------------------------------------------------
       OPTIONAL SQL DEBUGGING
    ----------------------------------------------------- */

    if (
      process.env.ENABLE_SQL_LOGGING === 'true'
    ) {

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


    /* -----------------------------------------------------
       RECORD SUCCESSFUL PROJECT UPDATE
    ----------------------------------------------------- */

    await recordProjectActivity(

      req,

      'PROJECT_UPDATE',

      `Updated service project: ${title} (Project ID: ${projectId}).`

    )


    /* -----------------------------------------------------
       OPTIONAL SQL DEBUGGING
    ----------------------------------------------------- */

    if (
      process.env.ENABLE_SQL_LOGGING === 'true'
    ) {

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
