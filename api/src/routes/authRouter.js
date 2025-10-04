const express = require('express');    
const jwt = require('jsonwebtoken');  
const { register, login, completeProfile } = require('../controllers/authController');  
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');    
const { verifyEmail, resendVerificationCode } = require('../controllers/emailVerificationController');    
const { authenticateToken } = require('../middleware/authMiddleware');   
const passport = require('passport');  
    
const router = express.Router();    
    
// Route d'inscription    
router.post('/register', register);    
    
// Route de connexion    
router.post('/login', login);    
  
// AJOUTÉ: Route de complétion de profil (protégée)  
router.post('/complete-profile', authenticateToken, completeProfile);  
  
router.post('/forgot-password', forgotPassword);    
router.post('/reset-password', resetPassword);  
  
// Routes de vérification d'email    
router.post('/verify-email', verifyEmail);    
router.post('/resend-verification', resendVerificationCode);  
  
router.get('/google',     
  passport.authenticate('google', { scope: ['profile', 'email'] })    
);    
  
router.get('/google/callback',    
  passport.authenticate('google', { session: false }),    
  async (req, res) => {    
    const token = jwt.sign(    
      {    
        userId: req.user._id,    
        email: req.user.email,    
        role: req.user.role_id.code,    
        profileComplete: req.user.profileComplete    
      },    
      process.env.JWT_SECRET,    
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }    
    );    
        
    // Redirection conditionnelle    
    if (req.user.profileComplete) {    
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);    
    } else {    
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&complete=true`);    
    }    
  }    
);  
  
module.exports = router;