const express = require('express');  
const {   
  getClientAddresses,  
  getClientById,  
  getAllClients,  
  createPhysicalClient,  
  createMoralClient,  
  updateClient,  
  deleteClient,  
  getClientStats  
} = require('../controllers/customerController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
const { requireAdmin } = require('../middleware/adminAuthMiddleware');  
  
const router = express.Router();  
  
// Routes publiques (avec authentification basique)  
router.get('/:id', authenticateToken, getClientById);  
router.get('/:id/addresses', authenticateToken, getClientAddresses);  
  
// Routes administratives pour la gestion des clients  
router.get('/', requireAdmin, getAllClients);  
router.get('/stats/overview', requireAdmin, getClientStats);  
  
// Routes de création de clients (admin seulement)  
router.post('/physical', requireAdmin, createPhysicalClient);  
router.post('/moral', requireAdmin, createMoralClient);  
  
// Routes de mise à jour et suppression (admin seulement)  
router.put('/:id', requireAdmin, updateClient);  
router.delete('/:id', requireAdmin, deleteClient);  
  
module.exports = router;