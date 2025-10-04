const express = require('express');  
const router = express.Router();  
const depotEntryLineController = require('../controllers/depotEntryLineController');  
  
// Routes pour les lignes d'entrée de dépôt  
router.post('/', depotEntryLineController.addDepotEntryLine);  
router.get('/bl/:blFrsId', depotEntryLineController.getDepotEntryLinesByBL);  
router.put('/:id', depotEntryLineController.updateDepotEntryLine);  
router.delete('/:id', depotEntryLineController.deleteDepotEntryLine);  
  
module.exports = router;