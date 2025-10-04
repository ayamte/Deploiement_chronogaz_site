const express = require('express');  
const {   
  createAddress,  
  getAddressById,  
  getUserAddresses,  
  updateAddress,  
  deleteAddress,  
  createAddressForCustomer  
} = require('../controllers/addressController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
const { requireAdmin } = require('../middleware/adminAuthMiddleware');  
  
const router = express.Router();  
  
// Routes de base pour les adresses (authentifiées)  
router.post('/', authenticateToken, createAddress);  
router.get('/:id', authenticateToken, getAddressById);  
router.put('/:id', authenticateToken, updateAddress);  
router.delete('/:id', authenticateToken, deleteAddress);  
  
// Routes pour les adresses utilisateur  
router.get('/user/:userId', authenticateToken, getUserAddresses);  
  
// Routes spécialisées pour les clients  
router.post('/customer/:customerId', authenticateToken, createAddressForCustomer);  
  
module.exports = router;