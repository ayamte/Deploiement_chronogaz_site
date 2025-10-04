const express = require('express');  
const router = express.Router();  
const stockLineController = require('../controllers/stockLineController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
  
router.get('/depot/:stockDepotId', stockLineController.getStockLinesByDepot);  
router.post('/', authenticateToken, stockLineController.createStockLine);  
router.put('/:id', authenticateToken, stockLineController.updateStockLine);  
router.delete('/:id', authenticateToken, stockLineController.deleteStockLine);  
  
module.exports = router;