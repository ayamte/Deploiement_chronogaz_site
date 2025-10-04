const express = require('express');  
const {   
  getCities,  
  createCity,  
  getCityById,  
  updateCity,  
  deleteCity,  
  searchCities,  
  getCitiesStats,  
  geocodeAddress  
} = require('../controllers/LocationController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
const { requireAdmin } = require('../middleware/adminAuthMiddleware');  
  
const router = express.Router();  
  
// Routes publiques pour les villes  
router.get('/cities', getCities);  
router.get('/cities/search', searchCities);  
router.get('/cities/:id', getCityById);  
  
// Routes administratives pour la gestion des villes  
router.post('/cities', requireAdmin, createCity);  
router.put('/cities/:id', requireAdmin, updateCity);  
router.delete('/cities/:id', requireAdmin, deleteCity);  
  
// Routes pour les statistiques et utilitaires  
router.get('/cities/stats/overview', requireAdmin, getCitiesStats);  
router.post('/geocode', authenticateToken, geocodeAddress);  
  
module.exports = router;