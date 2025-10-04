const express = require('express');  
const router = express.Router();  
const umController = require('../controllers/umController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
  
// Routes publiques  
router.get('/', umController.getAllUms);  
router.get('/:id', umController.getUmById);  
  
// Routes protégées  
router.post('/', authenticateToken, umController.createUm);  
router.put('/:id', authenticateToken, umController.updateUm);  
router.delete('/:id', authenticateToken, umController.deleteUm);  
  
module.exports = router;