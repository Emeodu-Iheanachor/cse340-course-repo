import {
  getAllProjects,
  getUpcomingProjects,
  getProjectDetails,
  getCategoriesByProjectId
} from '../models/projects.js'


const NUMBER_OF_UPCOMING_PROJECTS = 5


/* Display upcoming service projects */
const showProjectsPage = async (req, res) => {
  const projects = await getUpcomingProjects(
    NUMBER_OF_UPCOMING_PROJECTS
  )

  res.render('projects', {
    title: 'Upcoming Service Projects',
    projects
  })
}


/* Display one service project */
const showProjectDetailsPage = async (req, res) => {
  const projectId = req.params.id

  const project = await getProjectDetails(projectId)

  if (!project) {
    return res.status(404).render('error', {
      title: 'Project Not Found',
      message: 'The requested service project could not be found.'
    })
  }

  const categories = await getCategoriesByProjectId(projectId)

  res.render('project', {
    title: project.title,
    project,
    categories
  })
}


export {
  showProjectsPage,
  showProjectDetailsPage
}