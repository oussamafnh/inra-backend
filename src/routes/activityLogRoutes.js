const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const chercheurMiddleware = require('../Middlewares/chercheurMiddleware');
const userMiddleware = require('../Middlewares/userMiddleware');

router.post('/activity-log', chercheurMiddleware , activityLogController.addActivityLog);
router.get('/activity-log/check', chercheurMiddleware , activityLogController.checkActivityLog);
router.get('/user-logs',userMiddleware , activityLogController.getAllLogsForUser);
router.get('/last-7-days', userMiddleware , activityLogController.getLogsForLast7Days);
router.get('/last-15-days', userMiddleware , activityLogController.getLogsForLast15Days);
router.get('/total-hours-7-days', userMiddleware , activityLogController.getTotalHoursForLast7Days);

module.exports = router;
