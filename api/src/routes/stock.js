const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Routes pour les stocks
router.get('/', stockController.getAllStocks);
router.get('/alerts/low-stock', stockController.getLowStockAlerts);
router.get('/depot/:depot', stockController.getStockByDepot);
router.get('/:id', stockController.getStockById);
router.post('/', stockController.createStock);
router.post('/transfer', stockController.transferStock);
router.put('/:id', stockController.updateStock);
router.patch('/:id/quantity', stockController.updateStockQuantity);
router.delete('/:id', stockController.deleteStock);

module.exports = router;
