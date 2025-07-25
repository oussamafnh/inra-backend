const express = require('express');
const ExportController = require('../controllers/exportController');
const router = express.Router();
const adminMiddleware = require('../Middlewares/adminMiddleware');
const userMiddleware = require('../Middlewares/userMiddleware');

router.get('/export-users', adminMiddleware, ExportController.exportUsers);
router.get('/month/:chercheur/:month', userMiddleware, ExportController.exportChercheurMonthlyReport);
router.get('/year/:chercheur/:year', userMiddleware, ExportController.exportChercheurYearlyReport);
router.get('/monthlyrecap/:chercheur/:year', userMiddleware, ExportController.exportChercheurYearlyActivitySummary);
router.get('/monthlygeneral/:month',adminMiddleware, ExportController.exportChercheurMonthlyGeneral);
router.get('/monthlygeneral/:month/:codeCentre',adminMiddleware, ExportController.exportChercheurMonthlyGeneral);
router.get('/yearlygeneral/:year',adminMiddleware, ExportController.exportChercheurYearlyGeneral);
router.get('/yearlygeneral/:year/:codeCentre',adminMiddleware, ExportController.exportChercheurYearlyGeneral);

module.exports = router;
