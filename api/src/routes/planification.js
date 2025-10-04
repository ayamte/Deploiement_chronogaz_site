const express = require('express');    
const {   
  getPlanifications,   
  getPlanificationById,  
  createPlanification,  
  cancelPlanificationByCommande  
} = require('../controllers/planificationController');    
const { authenticateToken } = require('../middleware/authMiddleware');    
    
const router = express.Router();    
    
// GET /api/planifications    
router.get('/', authenticateToken, getPlanifications);    
    
// GET /api/planifications/:id    
router.get('/:id', authenticateToken, getPlanificationById);  
  
// Créer une planification (assigner un camion)  
router.post('/', authenticateToken, createPlanification);  
  
// Utiliser le bon nom de fonction  
router.delete('/commande/:commandeId', authenticateToken, cancelPlanificationByCommande);  
    
module.exports = router;