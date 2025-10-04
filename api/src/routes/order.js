const express = require('express');    
const {     
  getCommands,    
  getCommandById,    
  getCommandsByCustomerId,    
  createCommand,    
  updateCommandById,    
  updateCommandStatus,    
  cancelPlanification, 
  cancelOrder,    
  deleteCommandById,    
  getCommandsStats,    
  getCommandsStatsByCustomer,
  getSalesData     
} = require('../controllers/orderController');    
const { authenticateToken } = require('../middleware/authMiddleware');    
const { requireAdmin } = require('../middleware/adminAuthMiddleware');    
    
const router = express.Router();    
    
// Routes de consultation (authentifiées)    
router.get('/', authenticateToken, getCommands);    
router.get('/stats', authenticateToken, getCommandsStats);    
router.get('/customer/:customerId/stats', authenticateToken, getCommandsStatsByCustomer);    
router.get('/customer/:customerId', authenticateToken, getCommandsByCustomerId);    
router.get('/:id', authenticateToken, getCommandById);    
    
// Routes de création et modification (authentifiées)    
router.post('/', authenticateToken, createCommand);    
router.put('/:id', authenticateToken, updateCommandById);    
router.put('/:id/status', authenticateToken, updateCommandStatus);    
router.put('/:id/cancel', authenticateToken, cancelOrder);    
router.put('/:id/cancel-planification', authenticateToken, cancelPlanification); 

    
// Routes administratives (admin seulement)    
router.delete('/:id', requireAdmin, deleteCommandById);    

//Dashboard 
router.post('/sales-data', authenticateToken, getSalesData); 
    
module.exports = router;