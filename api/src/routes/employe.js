const express = require('express');
const router = express.Router();
const { getEmployeesByFunction} = require('../controllers/employeeController');

// Route pour obtenir uniquement les chauffeurs
router.get('/:fonction', getEmployeesByFunction);


module.exports = router;