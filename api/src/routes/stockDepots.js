const express = require('express');  
const router = express.Router();  
const stockDepotController = require('../controllers/stockDepotController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
  
router.get('/', stockDepotController.getAllStockDepots);  
router.get('/:id', stockDepotController.getStockDepotById);  
router.post('/', authenticateToken, stockDepotController.createStockDepot);  
router.put('/:id', authenticateToken, stockDepotController.updateStockDepot);  
router.patch('/:id/archive', authenticateToken, stockDepotController.archiveStockDepot);  
  
module.exports = router;