const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminMiddleware = require('../Middlewares/adminMiddleware');
const userMiddleware = require('../Middlewares/userMiddleware');

router.get('/chercheurs', adminMiddleware, userController.getChercheurs);
router.get('/chercheurs/:id', userMiddleware , userController.getChercheur);
router.post('/chercheurs', adminMiddleware, userController.createChercheur);
router.patch('/chercheurs/:id/activate', adminMiddleware, userController.activateChercheur);
router.patch('/chercheurs/:id/deactivate', adminMiddleware, userController.deactivateChercheur);
router.post('/login', userController.login);
router.post('/logout/:id', userController.logout);
router.get('/validate-token', userController.validateToken);
router.get('/codeCentres',adminMiddleware , userController.getAllCodeCentres);

module.exports = router;
