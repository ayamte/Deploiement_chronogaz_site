const crypto = require('crypto');  
const User = require('../models/User');  
const { hashPassword } = require('../utils/password');  
const { sendPasswordResetEmail } = require('../services/emailService');  
  
const forgotPassword = async (req, res) => {  
  try {  
    const { email } = req.body;  
  
    if (!email) {  
      return res.status(400).json({  
        success: false,  
        message: 'Email requis'  
      });  
    }  
  
    // Trouver l'utilisateur  
    const user = await User.findOne({ email });  
    if (!user) {  
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité  
      return res.json({  
        success: true,  
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation'  
      });  
    }  
  
    // Générer un token de reset  
    const resetToken = crypto.randomBytes(32).toString('hex');  
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 heure  
  
    // Sauvegarder le token dans la base de données  
    await User.findByIdAndUpdate(user._id, {  
      reset_token: resetToken,  
      reset_token_expires: resetTokenExpires  
    });  
  
    // Envoyer l'email  
    await sendPasswordResetEmail(email, resetToken);  
  
    res.json({  
      success: true,  
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation'  
    });  
  
  } catch (error) {  
    console.error('Erreur forgot password:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur'  
    });  
  }  
};  
  
const resetPassword = async (req, res) => {  
  try {  
    const { token, newPassword } = req.body;  
  
    if (!token || !newPassword) {  
      return res.status(400).json({  
        success: false,  
        message: 'Token et nouveau mot de passe requis'  
      });  
    }  
  
    if (newPassword.length < 8) {  
      return res.status(400).json({  
        success: false,  
        message: 'Le mot de passe doit contenir au moins 8 caractères'  
      });  
    }  
  
    // Trouver l'utilisateur avec le token valide  
    const user = await User.findOne({  
      reset_token: token,  
      reset_token_expires: { $gt: new Date() }  
    });  
  
    if (!user) {  
      return res.status(400).json({  
        success: false,  
        message: 'Token invalide ou expiré'  
      });  
    }  
  
    // Hacher le nouveau mot de passe  
    const hashedPassword = await hashPassword(newPassword);  
  
    // Mettre à jour le mot de passe et supprimer le token  
    await User.findByIdAndUpdate(user._id, {  
      password_hash: hashedPassword,  
      reset_token: null,  
      reset_token_expires: null,  
      password_temporary: false,  
      first_login: false   
  }); 
  
    res.json({  
      success: true,  
      message: 'Mot de passe réinitialisé avec succès'  
    });  
  
  } catch (error) {  
    console.error('Erreur reset password:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur'  
    });  
  }  
};  
  
module.exports = { forgotPassword, resetPassword };