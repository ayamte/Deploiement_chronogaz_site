const express = require('express');  
const router = express.Router();  
const evaluationController = require('../controllers/evaluationController');  
const { authenticateToken } = require('../middleware/authMiddleware'); 
  
// Toutes les routes nécessitent une authentification  
router.use(authenticateToken); 
  
// POST /api/evaluations - Créer une évaluation  
router.post('/', evaluationController.createEvaluation);  
  
// GET /api/evaluations/livraison/:livraisonId - Récupérer évaluation par livraison  
router.get('/livraison/:livraisonId', evaluationController.getEvaluationByLivraison);  
  
// GET /api/evaluations/client - Récupérer toutes les évaluations du client connecté  
router.get('/client', evaluationController.getClientEvaluations);  
  
module.exports = router;