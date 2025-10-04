const express = require('express');
const router = express.Router();
const {
  getAllLoadingSessions,
  getLoadingSessionById,
  getActiveLoadingSessionByTruck,
  createLoadingSession,
  updateLoadingSession,
  completeUnloading,
  deleteLoadingSession
} = require('../controllers/truckLoadingSessionController');

// Routes pour les sessions de chargement
router.get('/', getAllLoadingSessions);
router.get('/:id', getLoadingSessionById);
router.get('/truck/:truckId/active', getActiveLoadingSessionByTruck);
router.post('/', createLoadingSession);
router.put('/:id', updateLoadingSession);
router.patch('/:id/complete', completeUnloading);
router.patch('/:id/unload', completeUnloading);
router.delete('/:id', deleteLoadingSession);

module.exports = router;
