const express = require('express');  
const router = express.Router();  
const truckController = require('../controllers/truckController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
  
// Routes publiques (lecture seule)  
router.get('/', truckController.getAllTrucks);  
router.get('/:id', truckController.getTruckById);  
  
// Routes protégées (nécessitent authentification)  
router.post('/',   
  authenticateToken,  
  truckController.upload.single('image'),   
  truckController.createTruck  
);  
  
router.put('/:id',   
  authenticateToken,  
  truckController.upload.single('image'),   
  truckController.updateTruck  
);  
  
router.delete('/:id', authenticateToken, truckController.deleteTruck);  
  
// Routes spécialisées  
router.patch('/:id/status', authenticateToken, truckController.updateTruckStatus);  
router.patch('/:id/driver', authenticateToken, truckController.assignDriver);  
router.patch('/:id/accompagnant', authenticateToken, truckController.assignAccompagnant);  
  
// Routes par région (si nécessaire)  
router.get('/region/:region', truckController.getTrucksByRegion);  
router.get('/maintenance/due', truckController.getMaintenanceDueTrucks);  
router.patch('/:id/mileage', authenticateToken, truckController.updateMileage);  
  
module.exports = router;