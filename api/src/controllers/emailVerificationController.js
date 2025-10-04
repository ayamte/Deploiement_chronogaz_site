const User = require('../models/User');  
const PhysicalUser = require('../models/PhysicalUser');  
const MoralUser = require('../models/MoralUser');  
const Customer = require('../models/Customer');  
const crypto = require('crypto');  
const { sendVerificationEmail } = require('../services/emailService');  
  
const verifyEmail = async (req, res) => {  
  try {  
    const { email, code } = req.body;  
  
    if (!email || !code) {  
      return res.status(400).json({  
        success: false,  
        message: 'Email et code de vérification requis'  
      });  
    }  
  
    // Normaliser l'email pour la vérification  
    const normalizedEmail = email.toLowerCase().trim();  
      
    // Trouver l'utilisateur avec le code valide    
    const user = await User.findOne({    
      email: normalizedEmail,    
      verification_code: code,    
      verification_code_expires: { $gt: new Date() }    
    });
  
    if (!user) {  
      return res.status(400).json({  
        success: false,  
        message: 'Code de vérification invalide ou expiré'  
      });  
    }  
  
    // Activer le compte User  
    await User.findByIdAndUpdate(user._id, {  
      statut: 'ACTIF',  
      email_verified: true,  
      verification_code: null,  
      verification_code_expires: null  
    });  
  
    // Synchroniser le statut Customer - Trouver le type d'utilisateur  
    const physicalUser = await PhysicalUser.findOne({ user_id: user._id });  
    const moralUser = await MoralUser.findOne({ user_id: user._id });  
  
    // Activer aussi le Customer associé  
    const customer = await Customer.findOne({  
      $or: [  
        { physical_user_id: physicalUser?._id },  
        { moral_user_id: moralUser?._id }  
      ]  
    });  
  
    if (customer) {  
      await Customer.findByIdAndUpdate(customer._id, { statut: 'ACTIF' });  
    }  
  
    res.json({  
      success: true,  
      message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.'  
    });  
  
  } catch (error) {  
    console.error('Erreur vérification email:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur'  
    });  
  }  
};  
  
const resendVerificationCode = async (req, res) => {  
  try {  
    const { email } = req.body;  
  
    const user = await User.findOne({ email, statut: 'EN_ATTENTE' });  
    if (!user) {  
      return res.status(404).json({  
        success: false,  
        message: 'Utilisateur non trouvé ou déjà vérifié'  
      });  
    }  
  
    // Générer un nouveau code  
    const verificationCode = crypto.randomInt(100000, 999999).toString();  
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);  
  
    await User.findByIdAndUpdate(user._id, {  
      verification_code: verificationCode,  
      verification_code_expires: verificationExpires  
    });  
  
    await sendVerificationEmail(email, verificationCode);  
  
    res.json({  
      success: true,  
      message: 'Nouveau code de vérification envoyé'  
    });  
  
  } catch (error) {  
    console.error('Erreur renvoi code:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur'  
    });  
  }  
};  
  
module.exports = { verifyEmail, resendVerificationCode };