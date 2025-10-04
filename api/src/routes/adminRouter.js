const express = require('express');  
const { getClients, getEmployees, updateUser, deleteUser, createUser, getClientsWithAddresses, getStats } = require('../controllers/adminController');  
const { requireAdmin } = require('../middleware/adminAuthMiddleware');  
  
const router = express.Router();  
  
// Routes pour lister  
router.get('/clients', requireAdmin, getClients);  
router.get('/employees', requireAdmin, getEmployees);  
router.get('/clients-with-addresses', requireAdmin, getClientsWithAddresses);
  
// Routes pour gérer les utilisateurs  
router.post('/users', requireAdmin, createUser);  
router.put('/users/:userId', requireAdmin, updateUser);  
router.delete('/users/:userId', requireAdmin, deleteUser);  

//Dashboard
router.get('/stats', requireAdmin, getStats); 
  
module.exports = router;