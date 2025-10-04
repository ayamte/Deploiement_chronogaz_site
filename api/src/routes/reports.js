const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Routes pour les rapports et statistiques
router.get('/dashboard', reportController.getDashboardStats);
router.get('/inventory', reportController.getInventoryReport);
router.get('/stock-movements', reportController.getStockMovements);
router.get('/truck-utilization', reportController.getTruckUtilizationReport);
router.get('/maintenance', reportController.getMaintenanceReport);
router.get('/export/products', reportController.exportProductsCSV);

module.exports = router;
