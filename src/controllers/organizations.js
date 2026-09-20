import {
getAllOrganizations,
getOrganizationDetails
} from '../models/organizations.js'

import {
getProjectsByOrganizationId
} from '../models/projects.js'

// Display all organizations
const showOrganizationsPage = async (req, res) => {

const organizations = await getAllOrganizations()

res.render('organizations', {
title: 'Our Partner Organizations',
organizations
})
}

// Display one organization and its service projects
const showOrganizationDetailsPage = async (req, res) => {

const organizationId = req.params.id

const organizationDetails =
await getOrganizationDetails(organizationId)

const projects =
await getProjectsByOrganizationId(organizationId)

res.render('organization', {
title: organizationDetails
? organizationDetails.name
: 'Organization Not Found',

organizationDetails,
projects

})
}

// Export controller functions
export {
showOrganizationsPage,
showOrganizationDetailsPage
}