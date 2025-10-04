const express = require('express');  
const {   
  getProfile,   
  updateProfile,   
  getAllUsers,   
  getUserById,   
  updateUserStatus,   
  deleteUser,   
  getUserStats   
} = require('../controllers/userController');  
const { authenticateToken } = require('../middleware/authMiddleware');  
const { requireAdmin } = require('../middleware/adminAuthMiddleware');  
const { changePassword } = require('../controllers/passwordController');  
const { changeFirstLoginPassword } = require('../controllers/firstLoginController');  
  
const router = express.Router();  
  
// Routes pour le profil utilisateur connecté  
router.get('/profile', authenticateToken, getProfile);  
router.put('/profile', authenticateToken, updateProfile);  
  
// Routes pour la gestion des mots de passe  
router.put('/change-password', authenticateToken, changePassword);  
router.put('/first-login-password', authenticateToken, changeFirstLoginPassword);  
  
// Routes administratives pour la gestion des utilisateurs  
router.get('/', requireAdmin, getAllUsers);  
router.get('/stats', requireAdmin, getUserStats);  
router.get('/:id', requireAdmin, getUserById);  
router.put('/:id/status', requireAdmin, updateUserStatus);  
router.delete('/:id', requireAdmin, deleteUser);  
  
module.exports = router;