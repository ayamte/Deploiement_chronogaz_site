const mongoose = require('mongoose');  
const bcrypt = require('bcryptjs');  
const User = require('../models/User');  
const PhysicalUser = require('../models/PhysicalUser');  
const MoralUser = require('../models/MoralUser');  
const Customer = require('../models/Customer');  
const Employe = require('../models/Employe');  
const Address = require('../models/Address');  
const UserAddress = require('../models/UserAddress');  
const City = require('../models/City');  
const Role = require('../models/Role');  
  
// Récupérer le profil utilisateur complet  
const getProfile = async (req, res) => {  
  try {  
    const userId = req.user._id;  
    const user = req.user;  
  
    let profileData = {  
      id: user._id,  
      email: user.email,  
      role: user.role_id.code,  
      statut: user.statut,  
      last_login: user.last_login,  
      first_login: user.first_login  
    };  
  
    // Récupérer les informations utilisateur physique  
    const physicalUser = await PhysicalUser.findOne({ user_id: userId });  
  
    if (physicalUser) {  
      profileData.profile = {  
        type: 'PHYSIQUE',  
        email: user.email,  
        first_name: physicalUser.first_name,  
        last_name: physicalUser.last_name,  
        civilite: physicalUser.civilite,  
        cin: physicalUser.cin,  
        telephone_principal: physicalUser.telephone_principal  
      };  
  
      // Récupérer les adresses liées  
      const userAddresses = await UserAddress.find({   
        physical_user_id: physicalUser._id   
      }).populate({  
        path: 'address_id',  
        populate: { path: 'city_id', select: 'name code' }  
      });  
  
      profileData.addresses = userAddresses.map(ua => ({  
        ...ua.address_id.toObject(),  
        is_principal: ua.is_principal  
      }));  
  
      // Si c'est un client, récupérer les infos client  
      if (user.role_id.code === 'CLIENT') {  
        const customer = await Customer.findOne({ physical_user_id: physicalUser._id });  
      if (customer) {  
        profileData.customer_info = {  
          customer_id: customer._id,  // ✅ Ajouter cette ligne  
          customer_code: customer.customer_code,  
          type_client: customer.type_client,  
          credit_limite: customer.credit_limite,  
          credit_utilise: customer.credit_utilise,  
          date_inscription: customer.date_inscription,  
          statut: customer.statut  
        };  
       }
      }  
  
      // Si c'est un employé, récupérer les infos employé  
      if (user.role_id.code === 'EMPLOYE' || user.role_id.code === 'EMPLOYE_MAGASIN') {  
        const employe = await Employe.findOne({ physical_user_id: physicalUser._id });  
        if (employe) {  
          profileData.employee_info = {  
            _id: employe._id,
            matricule: employe.matricule,  
            fonction: employe.fonction,  
            date_embauche: employe.date_embauche,  
            cnss: employe.cnss,  
            salaire_base: employe.salaire_base,  
            statut: employe.statut  
          };  
        }  
      }  
    }  
  
    // Récupérer les informations utilisateur moral  
    const moralUser = await MoralUser.findOne({ user_id: userId });  
  
    if (moralUser) {  
      profileData.profile = {  
        type: 'MORAL',  
        email: user.email,  
        raison_sociale: moralUser.raison_sociale,  
        ice: moralUser.ice,  
        patente: moralUser.patente,  
        rc: moralUser.rc,  
        ville_rc: moralUser.ville_rc,  
        forme_juridique: moralUser.forme_juridique,  
        secteur_activite: moralUser.secteur_activite,  
        telephone_principal: moralUser.telephone_principal  
      };  
  
      // Récupérer les adresses liées  
      const userAddresses = await UserAddress.find({   
        moral_user_id: moralUser._id   
      }).populate({  
        path: 'address_id',  
        populate: { path: 'city_id', select: 'name code' }  
      });  
  
      profileData.addresses = userAddresses.map(ua => ({  
        ...ua.address_id.toObject(),  
        is_principal: ua.is_principal  
      }));  
  
      // Si c'est un client moral, récupérer les infos client  
      if (user.role_id.code === 'CLIENT') {  
      const customer = await Customer.findOne({ moral_user_id: moralUser._id });  
      if (customer) {  
        profileData.customer_info = {  
          customer_id: customer._id,  // ✅ AJOUTER cette ligne  
          customer_code: customer.customer_code,  
          type_client: customer.type_client,  
          credit_limite: customer.credit_limite,  
          credit_utilise: customer.credit_utilise,  
          date_inscription: customer.date_inscription,  
          statut: customer.statut  
        };  
      }  
}
    }  
  
    res.json({  
      success: true,  
      message: 'Profil récupéré avec succès',  
      data: profileData  
    });  
  } catch (error) {  
    console.error('Erreur lors de la récupération du profil:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour le profil utilisateur  
const updateProfile = async (req, res) => {  
  try {  
    const userId = req.user._id;  
    const user = req.user;  
    const { profile, customer_info, password } = req.body;  
  
    let updatedData = {};  
  
    // Mettre à jour l'email si fourni  
    if (profile?.email && profile.email !== user.email) {  
      // Vérifier que l'email n'est pas déjà utilisé  
      const existingUser = await User.findOne({   
        email: profile.email,   
        _id: { $ne: userId }   
      });  
        
      if (existingUser) {  
        return res.status(400).json({  
          success: false,  
          message: 'Cet email est déjà utilisé'  
        });  
      }  
  
      await User.findByIdAndUpdate(userId, { email: profile.email });  
      updatedData.email = profile.email;  
    }  
  
    // Mettre à jour le mot de passe si fourni  
    if (password) {  
      if (password.length < 8) {  
        return res.status(400).json({  
          success: false,  
          message: 'Le mot de passe doit contenir au moins 8 caractères'  
        });  
      }  
  
      const hashedPassword = await bcrypt.hash(password, 10);  
      await User.findByIdAndUpdate(userId, { password_hash: hashedPassword });  
      updatedData.password_updated = true;  
    }  
  
    // Mettre à jour selon le type d'utilisateur  
    const physicalUser = await PhysicalUser.findOne({ user_id: userId });  
    if (physicalUser && profile) {  
      const allowedFields = [  
        'first_name', 'last_name', 'civilite',   
        'cin', 'telephone_principal'  
      ];  
  
      const updateFields = {};  
      allowedFields.forEach(field => {  
        if (profile[field] !== undefined) {  
          updateFields[field] = profile[field];  
        }  
      });  
  
      if (Object.keys(updateFields).length > 0) {  
        const updatedPhysicalUser = await PhysicalUser.findOneAndUpdate(  
          { user_id: userId },  
          updateFields,  
          { new: true, runValidators: true }  
        );  
  
        updatedData.profile = {  
          type: 'PHYSIQUE',  
          ...updatedPhysicalUser.toObject()  
        };  
      }  
  
      // Mettre à jour les infos client si applicable  
      if (user.role_id.code === 'CLIENT' && customer_info) {  
        const customer = await Customer.findOne({ physical_user_id: physicalUser._id });  
        if (customer) {  
          const customerUpdateFields = {};  
            
          // Seuls certains champs peuvent être mis à jour par le client  
          const allowedCustomerFields = ['telephone_secondaire'];  
          allowedCustomerFields.forEach(field => {  
            if (customer_info[field] !== undefined) {  
              customerUpdateFields[field] = customer_info[field];  
            }  
          });  
  
          if (Object.keys(customerUpdateFields).length > 0) {  
            const updatedCustomer = await Customer.findOneAndUpdate(  
              { physical_user_id: physicalUser._id },  
              customerUpdateFields,  
              { new: true }  
            );  
            updatedData.customer_info = updatedCustomer;  
          }  
        }  
      }  
    }  
  
    // Gérer les utilisateurs moraux  
    const moralUser = await MoralUser.findOne({ user_id: userId });  
    if (moralUser && profile) {  
      const allowedFields = [  
        'raison_sociale', 'ice', 'patente', 'rc', 'ville_rc',  
        'forme_juridique', 'secteur_activite', 'telephone_principal'  
      ];  
  
      const updateFields = {};  
      allowedFields.forEach(field => {  
        if (profile[field] !== undefined) {  
          updateFields[field] = profile[field];  
        }  
      });  
  
      if (Object.keys(updateFields).length > 0) {  
        const updatedMoralUser = await MoralUser.findOneAndUpdate(  
          { user_id: userId },  
          updateFields,  
          { new: true, runValidators: true }  
        );  
  
        updatedData.profile = {  
          type: 'MORAL',  
          ...updatedMoralUser.toObject()  
        };  
      }  
  
      // Mettre à jour les infos client moral si applicable  
      if (user.role_id.code === 'CLIENT' && customer_info) {  
        const customer = await Customer.findOne({ moral_user_id: moralUser._id });  
        if (customer) {  
          const customerUpdateFields = {};  
            
          const allowedCustomerFields = ['telephone_secondaire'];  
          allowedCustomerFields.forEach(field => {  
            if (customer_info[field] !== undefined) {  
              customerUpdateFields[field] = customer_info[field];  
            }  
          });  
  
          if (Object.keys(customerUpdateFields).length > 0) {  
            const updatedCustomer = await Customer.findOneAndUpdate(  
              { moral_user_id: moralUser._id },  
              customerUpdateFields,  
              { new: true }  
            );  
            updatedData.customer_info = updatedCustomer;  
          }  
        }  
      }  
    }  
  
    res.json({  
      success: true,  
      message: 'Profil mis à jour avec succès',  
      data: updatedData  
    });  
  
  } catch (error) {  
    console.error('Erreur lors de la mise à jour du profil:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer tous les utilisateurs (admin seulement)  
const getAllUsers = async (req, res) => {  
  try {  
    const { page = 1, limit = 10, role, statut, search } = req.query;  
    const skip = (page - 1) * limit;  
  
    // Construire le filtre de recherche  
    let matchQuery = {};  
      
    if (role) {  
      const roleDoc = await Role.findOne({ code: role });  
      if (roleDoc) {  
        matchQuery.role_id = roleDoc._id;  
      }  
    }  
  
    if (statut) {  
      matchQuery.statut = statut;  
    }  
  
    if (search) {  
      matchQuery.email = { $regex: search, $options: 'i' };  
    }  
  
    const users = await User.find(matchQuery)  
      .populate('role_id', 'code nom')  
      .sort({ createdAt: -1 })  
      .skip(skip)  
      .limit(parseInt(limit));  
  
    const total = await User.countDocuments(matchQuery);  
  
    // Enrichir avec les informations de profil  
    const enrichedUsers = await Promise.all(users.map(async (user) => {  
      let userProfile = {  
        id: user._id,  
        email: user.email,  
        role: user.role_id.code,  
        statut: user.statut,  
        last_login: user.last_login,  
        createdAt: user.createdAt  
      };  
  
      // Récupérer les infos physiques ou morales  
      const physicalUser = await PhysicalUser.findOne({ user_id: user._id });  
      if (physicalUser) {  
        userProfile.profile = {  
          type: 'PHYSIQUE',  
          first_name: physicalUser.first_name,  
          last_name: physicalUser.last_name,  
          telephone_principal: physicalUser.telephone_principal  
        };  
      } else {  
        const moralUser = await MoralUser.findOne({ user_id: user._id });  
        if (moralUser) {  
          userProfile.profile = {  
            type: 'MORAL',  
            raison_sociale: moralUser.raison_sociale,  
            telephone_principal: moralUser.telephone_principal  
          };  
        }  
      }  
  
      return userProfile;  
    }));  
  
    res.json({  
      success: true,  
      message: 'Utilisateurs récupérés avec succès',  
      data: {  
        users: enrichedUsers,  
        pagination: {  
          current_page: parseInt(page),  
          total_pages: Math.ceil(total / limit),  
          total_items: total,  
          items_per_page: parseInt(limit)  
        }  
      }  
    });  
  
  } catch (error) {  
    console.error('Erreur lors de la récupération des utilisateurs:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer un utilisateur par ID (admin seulement)  
const getUserById = async (req, res) => {  
  try {  
    const { id } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID utilisateur invalide'  
      });  
    }  
  
    const user = await User.findById(id).populate('role_id', 'code nom');  
  
    if (!user) {  
      return res.status(404).json({  
        success: false,  
        message: 'Utilisateur non trouvé'  
      });  
    }  
  
    let userProfile = {  
      id: user._id,  
      email: user.email,  
      role: user.role_id.code,  
      statut: user.statut,  
      last_login: user.last_login,  
      email_verified: user.email_verified,  
      createdAt: user.createdAt,  
      updatedAt: user.updatedAt  
    };  
  
    // Récupérer les informations détaillées selon le type  
    const physicalUser = await PhysicalUser.findOne({ user_id: user._id });  
    if (physicalUser) {  
      userProfile.profile = {  
        type: 'PHYSIQUE',  
        first_name: physicalUser.first_name,  
        last_name: physicalUser.last_name,  
        civilite: physicalUser.civilite,  
        cin: physicalUser.cin,  
        telephone_principal: physicalUser.telephone_principal  
      };  
  
      // Récupérer les adresses  
      const userAddresses = await UserAddress.find({   
        physical_user_id: physicalUser._id   
      }).populate({  
        path: 'address_id',  
        populate: { path: 'city_id', select: 'name code' }  
      });  
  
      userProfile.addresses = userAddresses.map(ua => ({  
        ...ua.address_id.toObject(),  
        is_principal: ua.is_principal  
      }));  
  
      // Infos client ou employé  
      if (user.role_id.code === 'CLIENT') {  
        const customer = await Customer.findOne({ physical_user_id: physicalUser._id });  
        if (customer) {  
          userProfile.customer_info = customer;  
        }  
      } else if (user.role_id.code === 'EMPLOYE' || user.role_id.code === 'EMPLOYE_MAGASIN') {  
        const employe = await Employe.findOne({ physical_user_id: physicalUser._id });  
        if (employe) {  
          userProfile.employee_info = employe;  
        }  
      }  
    }  
  
    const moralUser = await MoralUser.findOne({ user_id: user._id });  
    if (moralUser) {  
      userProfile.profile = {  
        type: 'MORAL',  
        raison_sociale: moralUser.raison_sociale,  
        ice: moralUser.ice,  
        patente: moralUser.patente,  
        rc: moralUser.rc,  
        ville_rc: moralUser.ville_rc,  
        forme_juridique: moralUser.forme_juridique,  
        secteur_activite: moralUser.secteur_activite,  
        telephone_principal: moralUser.telephone_principal  
      };  
  
      // Récupérer les adresses  
      const userAddresses = await UserAddress.find({   
        moral_user_id: moralUser._id   
      }).populate({  
        path: 'address_id',  
        populate: { path: 'city_id', select: 'name code' }  
      });  
  
      userProfile.addresses = userAddresses.map(ua => ({  
        ...ua.address_id.toObject(),  
        is_principal: ua.is_principal  
      }));  
  
      // Infos client moral  
      if (user.role_id.code === 'CLIENT') {  
        const customer = await Customer.findOne({ moral_user_id: moralUser._id });  
        if (customer) {  
          userProfile.customer_info = customer;  
        }  
      }  
    }  
  
    res.json({  
      success: true,  
      message: 'Utilisateur récupéré avec succès',  
      data: userProfile  
    });  
  
  } catch (error) {  
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour le statut d'un utilisateur (admin seulement)  
const updateUserStatus = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const { statut } = req.body;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID utilisateur invalide'  
      });  
    }  
  
    const validStatuts = ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'];  
    if (!validStatuts.includes(statut)) {  
      return res.status(400).json({  
        success: false,  
        message: 'Statut invalide'  
      });  
    }  
  
    const user = await User.findByIdAndUpdate(  
      id,  
      { statut },  
      { new: true, runValidators: true }  
    ).populate('role_id', 'code nom');  
  
    if (!user) {  
      return res.status(404).json({  
        success: false,  
        message: 'Utilisateur non trouvé'  
      });  
    }  
  
    res.json({  
      success: true,  
      message: 'Statut utilisateur mis à jour avec succès',  
      data: {  
        id: user._id,  
        email: user.email,  
        statut: user.statut,  
        role: user.role_id.code  
      }  
    });  
  
  } catch (error) {  
    console.error('Erreur lors de la mise à jour du statut:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
// Supprimer un utilisateur (soft delete - admin seulement)  
const deleteUser = async (req, res) => {  
  try {  
    const { id } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID utilisateur invalide'  
      });  
    }  
  
    // Vérifier que l'utilisateur existe  
    const user = await User.findById(id);  
    if (!user) {  
      return res.status(404).json({  
        success: false,  
        message: 'Utilisateur non trouvé'  
      });  
    }  
  
    // Empêcher la suppression de son propre compte  
    if (user._id.toString() === req.user._id.toString()) {  
      return res.status(400).json({  
        success: false,  
        message: 'Vous ne pouvez pas supprimer votre propre compte'  
      });  
    }  
  
    // Soft delete - marquer comme inactif  
    await User.findByIdAndUpdate(id, { statut: 'INACTIF' });  
  
    res.json({  
      success: true,  
      message: 'Utilisateur supprimé avec succès'  
    });  
  
  } catch (error) {  
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer les statistiques des utilisateurs (admin seulement)  
const getUserStats = async (req, res) => {  
  try {  
    const totalUsers = await User.countDocuments();  
    const activeUsers = await User.countDocuments({ statut: 'ACTIF' });  
    const pendingUsers = await User.countDocuments({ statut: 'EN_ATTENTE' });  
    const suspendedUsers = await User.countDocuments({ statut: 'SUSPENDU' });  
  
    // Statistiques par rôle  
    const roleStats = await User.aggregate([  
      { $lookup: { from: 'roles', localField: 'role_id', foreignField: '_id', as: 'role' } },  
      { $unwind: '$role' },  
      { $group: { _id: '$role.code', count: { $sum: 1 } } },  
      { $sort: { count: -1 } }  
    ]);  
  
    // Utilisateurs récents (derniers 30 jours)  
    const thirtyDaysAgo = new Date();  
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  
    const recentUsers = await User.countDocuments({   
      createdAt: { $gte: thirtyDaysAgo }   
    });  
  
    res.json({  
      success: true,  
      message: 'Statistiques récupérées avec succès',  
      data: {  
        total: totalUsers,  
        active: activeUsers,  
        pending: pendingUsers,  
        suspended: suspendedUsers,  
        recent: recentUsers,  
        byRole: roleStats  
      }  
    });  
  
  } catch (error) {  
    console.error('Erreur lors de la récupération des statistiques:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur interne du serveur',  
      error: error.message  
    });  
  }  
};  
  
module.exports = {  
  getProfile,  
  updateProfile,  
  getAllUsers,  
  getUserById,  
  updateUserStatus,  
  deleteUser,  
  getUserStats  
};