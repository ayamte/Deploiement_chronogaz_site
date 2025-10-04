const express = require('express');  
const {  
  startLivraison,  
  completeLivraison,  
  getLivraisons,  
  getLivraisonById,  
  updateLivraisonLines,
  getLivraisonTracking  
} = require('../controllers/livraisonController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
const { requireAdmin } = require('../middleware/adminAuthMiddleware');  
  
const router = express.Router();  
  
// Routes de consultation (authentifiées)  
router.get('/', authenticateToken, getLivraisons);  
router.get('/:id', authenticateToken, getLivraisonById);  
  
// Routes de gestion des livraisons (authentifiées)  
router.post('/start/:planificationId', authenticateToken, startLivraison);  
router.put('/:id/complete', authenticateToken, completeLivraison);  
router.put('/:id/lines', authenticateToken, updateLivraisonLines);  
router.get('/:id/track', authenticateToken, getLivraisonTracking);

  
module.exports = router;