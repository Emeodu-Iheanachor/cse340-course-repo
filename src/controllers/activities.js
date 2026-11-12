
import {
  getActivityLogs,
  getActivityStatistics
} from '../models/activity-model.js'


/* =========================================================
   SHOW ACTIVITY HISTORY

   Administrator-only activity history page.

   Features:
   - Activity history
   - Activity statistics
   - Action filtering
   - User filtering
   - Pagination
========================================================= */

const showActivityHistory = async (req, res, next) => {
  try {

    /* =====================================================
       VALIDATE PAGINATION
    ===================================================== */

    const requestedPage = Number(req.query.page)

    const page =
      Number.isSafeInteger(requestedPage) &&
      requestedPage > 0
        ? requestedPage
        : 1


    /* =====================================================
       RETRIEVE ACTIVITY FILTERS
    ===================================================== */

    const action =
      typeof req.query.action === 'string'
        ? req.query.action.trim().toUpperCase()
        : ''

    const rawUserId =
      typeof req.query.userId === 'string'
        ? req.query.userId.trim()
        : ''

    const parsedUserId = Number(rawUserId)

    const userId =
      rawUserId !== '' &&
      Number.isSafeInteger(parsedUserId) &&
      parsedUserId > 0
        ? parsedUserId
        : null


    /* =====================================================
       RETRIEVE ACTIVITY RECORDS
    ===================================================== */

    const activityData = await getActivityLogs({
      page,
      limit: 20,
      action: action || null,
      userId
    })


    /* =====================================================
       RETRIEVE ACTIVITY STATISTICS
    ===================================================== */

    const statistics = await getActivityStatistics()


    /* =====================================================
       RENDER ACTIVITY HISTORY PAGE
    ===================================================== */

    return res.render('activities', {

      title: 'Activity History',

      activities: activityData.activities,

      statistics: {
        totalActivities: Number(
          statistics.total_activities
        ) || 0,

        todayActivities: Number(
          statistics.activities_today
        ) || 0,

        activeUsers: Number(
          statistics.active_users
        ) || 0,

        totalLogins: Number(
          statistics.total_logins
        ) || 0,

        totalLogouts: Number(
          statistics.total_logouts
        ) || 0,

        totalRegistrations: Number(
          statistics.total_registrations
        ) || 0
      },

      filters: {
        action,
        userId: rawUserId
      },

      pagination: {
        currentPage: activityData.page,
        totalPages: activityData.totalPages,
        total: activityData.total,
        limit: activityData.limit
      }

    })

  } catch (error) {

    console.error(
      'Error loading activity history:',
      error
    )

    return next(error)
  }
}


/* =========================================================
   EXPORT ACTIVITY CONTROLLERS
========================================================= */

export {
  showActivityHistory
}
