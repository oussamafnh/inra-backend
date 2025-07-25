const express = require('express');
const ProjetController = require('../controllers/ProjetController');
const adminMiddleware = require('../Middlewares/adminMiddleware');
const chercheurMiddleware = require('../Middlewares/chercheurMiddleware');
const userMiddleware = require('../Middlewares/userMiddleware');

const router = express.Router();

router.post('/megaprojet', adminMiddleware, ProjetController.createMegaprojet);
router.post('/axe', adminMiddleware, ProjetController.createAxe);
router.post('/activite', adminMiddleware, ProjetController.createActivite);
router.get('/megaprojets',userMiddleware , ProjetController.getMegaprojets);
router.get('/megaprojets/:megaprojet_id/axes', userMiddleware , ProjetController.getAxesByMegaprojet);
router.get('/megaprojets/axe/:axe_id/activites', userMiddleware , ProjetController.getActivitesByAxe);
router.get('/activite/:CodeActivite', userMiddleware , ProjetController.searchByCodeActivite);

router.put('/megaprojets/:id', adminMiddleware,ProjetController.editMegaProjet);
router.patch('/megaprojets/:id/toggle-status', adminMiddleware,ProjetController.toggleMegaProjetStatus);
router.delete('/megaprojets/:id', adminMiddleware,ProjetController.deleteMegaProjet);
router.put('/axes/:id', adminMiddleware,ProjetController.editAxes);
router.patch('/axes/:id/toggle-status', adminMiddleware,ProjetController.toggleAxesStatus);
router.delete('/axes/:id', adminMiddleware,ProjetController.deleteAxes);
router.put('/activites/:id', adminMiddleware,ProjetController.editActi);
router.patch('/activites/:id/toggle-status', adminMiddleware,ProjetController.toggleActiStatus);
router.delete('/activites/:id', adminMiddleware,ProjetController.deleteActi);

module.exports = router;
