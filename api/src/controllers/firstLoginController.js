const User = require('../models/User');  
const { hashPassword, comparePassword } = require('../utils/password');  
  
const changeFirstLoginPassword = async (req, res) => {  
  try {  
    const userId = req.user._id;  
    const { currentPassword, newPassword } = req.body;  
  
    // Validation  
    if (!currentPassword || !newPassword) {  
      return res.status(400).json({  
        success: false,  
        message: 'Mot de passe actuel et nouveau mot de passe requis'  
      });  
    }  
  
    if (newPassword.length < 8) {  
      return res.status(400).json({  
        success: false,  
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'  
      });  
    }  
  
    // Récupérer l'utilisateur  
    const user = await User.findById(userId);  
    if (!user) {  
      return res.status(404).json({  
        success: false,  
        message: 'Utilisateur non trouvé'  
      });  
    }  
  
    // Vérifier que l'utilisateur a bien un mot de passe temporaire  
    if (!user.password_temporary && !user.first_login) {  
      return res.status(400).json({  
        success: false,  
        message: 'Changement de mot de passe non requis'  
      });  
    }  
  
    // Vérifier le mot de passe actuel  
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);  
    if (!isCurrentPasswordValid) {  
      return res.status(400).json({  
        success: false,  
        message: 'Mot de passe actuel incorrect'  
      });  
    }  
  
    // Vérifier que le nouveau mot de passe est différent de l'ancien  
    const isSamePassword = await comparePassword(newPassword, user.password_hash);  
    if (isSamePassword) {  
      return res.status(400).json({  
        success: false,  
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'  
      });  
    }  
  
    // Hacher le nouveau mot de passe  
    const newPasswordHash = await hashPassword(newPassword);  
  
    // Mettre à jour le mot de passe et marquer comme non temporaire  
    await User.findByIdAndUpdate(userId, {  
      password_hash: newPasswordHash,  
      password_temporary: false,  
      first_login: false  
    });  
  
    res.json({  
      success: true,  
      message: 'Mot de passe modifié avec succès'  
    });  
  
  } catch (error) {  
    console.error('Erreur lors du changement de mot de passe obligatoire:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur'  
    });  
  }  
};  
  
module.exports = { changeFirstLoginPassword };