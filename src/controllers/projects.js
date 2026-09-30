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
      'Project description must be less than 1000 characters.'
    ),

  body('start_date')
    .notEmpty()
    .withMessage(
      'Project start date is required.'
    )
    .isISO8601()
    .withMessage(
      'Project start date must be a valid date.'
    ),

  body('end_date')
    .notEmpty()
    .withMessage(
      'Project end date is required.'
    )
    .isISO8601()
    .withMessage(
      'Project end date must be a valid date.'
    ),

  body('organization_id')
    .notEmpty()
    .withMessage(
      'Organization is required.'
    )
    .isInt()
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

    next(error)

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

    return res.render('project', {
      title: project.title,
      project,
      categories
    })

  } catch (error) {

    next(error)

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

    next(error)

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
      start_date,
      end_date,
      organization_id
    } = req.body


    /* -----------------------------------------------------
       Check validation errors
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
       Create project
    ----------------------------------------------------- */

    const newProjectId =
      await createProject(
        title,
        description,
        start_date,
        end_date,
        organization_id
      )

    console.log(
      'New service project created:',
      newProjectId
    )


    /* -----------------------------------------------------
       Success message
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

    req.flash(
      'error',
      'There was an error creating the service project.'
    )

    return res.redirect(
      '/new-project'
    )
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
       Validate project ID
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
       Get existing project
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
       Get organizations for dropdown
    ----------------------------------------------------- */

    const organizations =
      await getAllOrganizations()


    /* -----------------------------------------------------
       Render EDIT project view

       IMPORTANT:
       The view is edit-project.ejs,
       not update-project.ejs.
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

    next(error)

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
       Validate project ID
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
       Get submitted form data

       These names MUST match:
       - projectValidation
       - new-project.ejs
       - edit-project.ejs
       - projects model
       - database columns
    ----------------------------------------------------- */

    const {
      title,
      description,
      start_date,
      end_date,
      organization_id
    } = req.body


    /* -----------------------------------------------------
       Check validation errors
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
       Update project
    ----------------------------------------------------- */

    const updatedProject =
      await updateProject(
        projectId,
        title,
        description,
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


    console.log(
      'Service project updated:',
      projectId
    )


    /* -----------------------------------------------------
       Success message
    ----------------------------------------------------- */

    req.flash(
      'success',
      'Service project updated successfully!'
    )


    /* -----------------------------------------------------
       Return to updated project
    ----------------------------------------------------- */

    return res.redirect(
      `/project/${projectId}`
    )

  } catch (error) {

    console.error(
      'Error updating service project:',
      error
    )

    req.flash(
      'error',
      'There was an error updating the service project.'
    )

    return res.redirect(
      `/edit-project/${req.params.id}`
    )
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

  projectValidation
}