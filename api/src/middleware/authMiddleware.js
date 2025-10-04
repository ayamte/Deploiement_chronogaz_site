const jwt = require('jsonwebtoken');      
const User = require('../models/User');      
const PhysicalUser = require('../models/PhysicalUser');      
const MoralUser = require('../models/MoralUser');      
const Customer = require('../models/Customer');      
const Employe = require('../models/Employe');      
      
const authenticateToken = async (req, res, next) => {      
  const authHeader = req.headers['authorization'];      
  const token = authHeader && authHeader.split(' ')[1];      
      
  if (!token) {      
    return res.status(401).json({      
      success: false,      
      message: 'Token d\'accès requis'      
    });      
  }      
      
  try {      
    const decoded = jwt.verify(token, process.env.JWT_SECRET);      
    const user = await User.findById(decoded.userId)      
      .populate('role_id', 'code nom');      
            
    if (!user) {      
      return res.status(401).json({      
        success: false,      
        message: 'Token invalide'      
      });      
    }      
    
    // Récupérer les informations PhysicalUser et MoralUser  
    const physicalUser = await PhysicalUser.findOne({ user_id: user._id });    
    const moralUser = await MoralUser.findOne({ user_id: user._id });    
      
    // Vérification du statut selon le rôle  
    if (user.role_id.code === 'CLIENT') {    
      const customer = await Customer.findOne({    
        $or: [{ physical_user_id: physicalUser?._id }, { moral_user_id: moralUser?._id }]    
      });    
      if (customer && customer.statut !== 'ACTIF') {    
        return res.status(401).json({    
          success: false,    
          message: 'Compte client suspendu'    
        });    
      }    
    } else if (user.role_id.code === 'EMPLOYE' || user.role_id.code === 'EMPLOYE_MAGASIN') {    
      const employe = await Employe.findOne({ physical_user_id: physicalUser._id });    
      if (employe && employe.statut !== 'ACTIF') {    
        return res.status(401).json({    
          success: false,    
          message: 'Employé indisponible'    
        });    
      }    
    }  
    
    // Ajouter les informations MoralUser si c'est une entreprise    
    if (moralUser) {    
      user.moral_user_id = moralUser._id;    
    }    
      
    req.user = user;      
    next();      
  } catch (error) {      
    return res.status(403).json({      
      success: false,      
      message: 'Token invalide'      
    });      
  }      
};      
      
module.exports = { authenticateToken };