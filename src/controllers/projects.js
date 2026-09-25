import {
  getUpcomingProjects,
  getProjectDetails,
  getCategoriesByProjectId,
  createProject,
  updateProject
} from '../models/projects.js'

import { getAllOrganizations } from '../models/organizations.js'

import { body, validationResult } from 'express-validator'


const NUMBER_OF_UPCOMING_PROJECTS = 5


/* =========================================================
   PROJECT VALIDATION RULES
========================================================= */
const projectValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required.')
    .isLength({ min: 3, max: 200 })
    .withMessage(
      'Project title must be between 3 and 200 characters.'
    ),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Project description is required.')
    .isLength({ max: 1000 })
    .withMessage(
      'Project description must be less than 1000 characters.'
    ),

  body('startDate')
    .notEmpty()
    .withMessage('Project start date is required.')
    .isISO8601()
    .withMessage(
      'Project start date must be a valid date.'
    ),

  body('endDate')
    .notEmpty()
    .withMessage('Project end date is required.')
    .isISO8601()
    .withMessage(
      'Project end date must be a valid date.'
    ),

  body('organizationId')
    .notEmpty()
    .withMessage('Organization is required.')
    .isInt()
    .withMessage(
      'Organization must be a valid organization ID.'
    )
]


/* =========================================================
   DISPLAY UPCOMING SERVICE PROJECTS
========================================================= */
const showProjectsPage = async (req, res, next) => {
  try {
    const projects = await getUpcomingProjects(
      NUMBER_OF_UPCOMING_PROJECTS
    )

    res.render('projects', {
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
const showProjectDetailsPage = async (req, res, next) => {
  try {
    const projectId = req.params.id

    const project = await getProjectDetails(projectId)

    if (!project) {
      return res.status(404).render('error', {
        title: 'Project Not Found',
        message:
          'The requested service project could not be found.'
      })
    }

    const categories =
      await getCategoriesByProjectId(projectId)

    res.render('project', {
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
const showNewProjectForm = async (req, res, next) => {
  try {
    const organizations = await getAllOrganizations()

    res.render('new-project', {
      title: 'Add New Service Project',
      organizations
    })
  } catch (error) {
    next(error)
  }
}


/* =========================================================
   PROCESS NEW PROJECT FORM
========================================================= */
const processNewProjectForm = async (req, res, next) => {
  const {
    title,
    description,
    startDate,
    endDate,
    organizationId
  } = req.body


  /* Check validation errors */
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    errors.array().forEach((error) => {
      req.flash('error', error.msg)
    })

    return res.redirect('/new-project')
  }


  try {
    const newProjectId = await createProject(
      title,
      description,
      startDate,
      endDate,
      organizationId
    )

    console.log(
      'New service project created:',
      newProjectId
    )

    req.flash(
      'success',
      'New service project created successfully!'
    )

    /* Return to the project list */
    return res.redirect('/projects')
  } catch (error) {
    console.error(
      'Error creating new service project:',
      error
    )

    req.flash(
      'error',
      'There was an error creating the service project.'
    )

    return res.redirect('/new-project')
  }
}


/* =========================================================
   DISPLAY EDIT PROJECT FORM
========================================================= */
const showEditProjectForm = async (req, res, next) => {
  try {
    const projectId = req.params.id

    /* Get the existing project information */
    const project = await getProjectDetails(projectId)

    if (!project) {
      return res.status(404).render('error', {
        title: 'Project Not Found',
        message:
          'The requested service project could not be found.'
      })
    }

    /* Get all organizations for the dropdown */
    const organizations = await getAllOrganizations()

    res.render('update-project', {
      title: 'Edit Service Project',
      project,
      organizations
    })
  } catch (error) {
    next(error)
  }
}


/* =========================================================
   PROCESS EDIT PROJECT FORM
========================================================= */
const processEditProjectForm = async (req, res, next) => {
  const projectId = req.params.id

  const {
    title,
    description,
    startDate,
    endDate,
    organizationId
  } = req.body


  /* Check validation errors */
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    errors.array().forEach((error) => {
      req.flash('error', error.msg)
    })

    return res.redirect(`/edit-project/${projectId}`)
  }


  try {
    await updateProject(
      projectId,
      title,
      description,
      startDate,
      endDate,
      organizationId
    )

    console.log(
      'Service project updated:',
      projectId
    )

    req.flash(
      'success',
      'Service project updated successfully!'
    )

    /* Return to the updated project */
    return res.redirect(`/project/${projectId}`)
  } catch (error) {
    console.error(
      'Error updating service project:',
      error
    )

    req.flash(
      'error',
      'There was an error updating the service project.'
    )

    return res.redirect(`/edit-project/${projectId}`)
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