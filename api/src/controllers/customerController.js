const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const PhysicalUser = require('../models/PhysicalUser');
const MoralUser = require('../models/MoralUser');
const User = require('../models/User');
const Role = require('../models/Role');
const UserAddress = require('../models/UserAddress');
const Address = require('../models/Address');
const City = require('../models/City');

// Récupérer les adresses d'un client 
const getClientAddresses = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findById(customerId).lean();
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé."
      });
    }
    
    let userInfo = {};
    let addresses = [];
    
    if (customer.type_client === 'PHYSIQUE' && customer.physical_user_id) {
      const physicalUser = await PhysicalUser.findById(customer.physical_user_id).lean();
      
      if (!physicalUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Utilisateur physique non trouvé." 
        });
      }
      
      userInfo = {
        type: 'PHYSIQUE',
        nom_complet: `${physicalUser.civilite} ${physicalUser.first_name} ${physicalUser.last_name}`,
        telephone: physicalUser.telephone || physicalUser.telephone_principal || ''
      };
      
      const userAddresses = await UserAddress.find({ physical_user_id: physicalUser._id })
        .populate({
          path: 'address_id',
          populate: {
            path: 'city_id',
            select: 'name code'
          }
        })
        .lean();
      
      addresses = userAddresses.map(userAddr => {
        const addr = userAddr.address_id;
        return {
          _id: addr._id,
          type_adresse: userAddr.is_principal ? 'DOMICILE' : 'AUTRE',
          numappt: addr.numappt || '',
          numimmeuble: addr.numimmeuble || '',
          street: addr.street || '',
          city: addr.city_id,
          postal_code: addr.postal_code || '',
          telephone: physicalUser.telephone || physicalUser.telephone_principal || '',
          latitude: addr.latitude,
          longitude: addr.longitude,
          is_principal: userAddr.is_principal
        };
      });
      
    } else if (customer.type_client === 'MORAL' && customer.moral_user_id) {
      const moralUser = await MoralUser.findById(customer.moral_user_id).lean();
      
      if (!moralUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Utilisateur moral non trouvé." 
        });
      }
      
      userInfo = {
        type: 'MORAL',
        raison_sociale: moralUser.raison_sociale,
        telephone: moralUser.telephone || moralUser.telephone_principal || ''
      };
      
      const userAddresses = await UserAddress.find({ moral_user_id: moralUser._id })
        .populate({
          path: 'address_id',
          populate: {
            path: 'city_id',
            select: 'name code'
          }
        })
        .lean();
      
      addresses = userAddresses.map(userAddr => {
        const addr = userAddr.address_id;
        return {
          _id: addr._id,
          type_adresse: userAddr.is_principal ? 'SIÈGE SOCIAL' : 'AUTRE',
          numappt: addr.numappt || '',
          numimmeuble: addr.numimmeuble || '',
          street: addr.street || '',
          city: addr.city_id,
          postal_code: addr.postal_code || '',
          telephone: moralUser.telephone || moralUser.telephone_principal || '',
          latitude: addr.latitude,
          longitude: addr.longitude,
          is_principal: userAddr.is_principal
        };
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Client invalide ou type inconnu." 
      });
    }
    
    res.status(200).json({
      success: true,
      customer_code: customer.customer_code,
      user: userInfo,
      addresses: addresses
    });
    
  } catch (error) {
    console.error('Erreur getClientAddresses:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Récupérer un client par ID 
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id)
      .populate('physical_user_id')
      .populate('moral_user_id');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Client récupéré avec succès',
      data: customer
    });
  } catch (err) {
    console.error('Erreur lors de récupération de client:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche de client',
      error: err.message
    });
  }
};

// Récupérer tous les clients avec pagination et filtres
const getAllClients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type_client, 
      statut, 
      search 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Construire le filtre de recherche
    let matchQuery = {};
    
    if (type_client) {
      matchQuery.type_client = type_client;
    }
    
    if (statut) {
      matchQuery.statut = statut;
    }
    
    // Recherche par nom ou email
    let searchQuery = {};
    if (search) {
      const physicalUsers = await PhysicalUser.find({
        $or: [
          { first_name: { $regex: search, $options: 'i' } },
          { last_name: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const moralUsers = await MoralUser.find({
        raison_sociale: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const physicalIds = physicalUsers.map(u => u._id);
      const moralIds = moralUsers.map(u => u._id);
      
      searchQuery = {
        $or: [
          { physical_user_id: { $in: physicalIds } },
          { moral_user_id: { $in: moralIds } },
          { customer_code: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const finalQuery = { ...matchQuery, ...searchQuery };
    
    const customers = await Customer.find(finalQuery)
      .populate({
        path: 'physical_user_id',
        populate: {
          path: 'user_id',
          select: 'email'
        }
      })
      .populate({
        path: 'moral_user_id',
        populate: {
          path: 'user_id',
          select: 'email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Customer.countDocuments(finalQuery);
    
    // Enrichir les données client
    const enrichedCustomers = customers.map(customer => {
      let clientData = {
        _id: customer._id,
        customer_code: customer.customer_code,
        type_client: customer.type_client,
        statut: customer.statut,
        date_inscription: customer.date_inscription,
        credit_limite: customer.credit_limite,
        credit_utilise: customer.credit_utilise
      };
      
      if (customer.physical_user_id) {
        clientData.profile = {
          type: 'PHYSIQUE',
          first_name: customer.physical_user_id.first_name,
          last_name: customer.physical_user_id.last_name,
          civilite: customer.physical_user_id.civilite,
          telephone_principal: customer.physical_user_id.telephone_principal,
          email: customer.physical_user_id.user_id?.email
        };
      } else if (customer.moral_user_id) {
        clientData.profile = {
          type: 'MORAL',
          raison_sociale: customer.moral_user_id.raison_sociale,
          ice: customer.moral_user_id.ice,
          telephone_principal: customer.moral_user_id.telephone_principal,
          email: customer.moral_user_id.user_id?.email
        };
      }
      
      return clientData;
    });
    
    res.json({
      success: true,
      message: 'Clients récupérés avec succès',
      data: {
        customers: enrichedCustomers,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Créer un nouveau client physique
const createPhysicalClient = async (req, res) => {
  try {
    const { profile } = req.body;
    
    // Validation des champs requis
    if (!profile?.first_name || !profile?.last_name || !profile?.civilite || !profile?.email) {
      return res.status(400).json({
        success: false,
        message: 'Prénom, nom, civilité et email sont requis'
      });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: profile.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }
    
    // Créer l'utilisateur de base
    const roleClient = await Role.findOne({ code: 'CLIENT' });
    if (!roleClient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rôle CLIENT non trouvé' 
      });
    }
    
    const defaultPassword = 'ChronoGaz2024';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const newUser = new User({  
      email: profile.email,  
      password_hash: hashedPassword,  
      role_id: roleClient._id,  
      statut: 'ACTIF',  
      password_temporary: true,  
      first_login: true,  
      created_by_admin: true  
    });
    await newUser.save();
    
    // Créer le PhysicalUser
    const physicalUser = new PhysicalUser({
      user_id: newUser._id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      civilite: profile.civilite,
      telephone_principal: profile.telephone_principal,
      cin: profile.cin,
      city_id: profile.city_id || null
    });
    await physicalUser.save();
    
    // Créer le Customer
    const customer_code = `CLI-P${Date.now()}`;
    const customer = new Customer({
      customer_code,
      type_client: 'PHYSIQUE',
      physical_user_id: physicalUser._id,
      statut: 'ACTIF',
      credit_limite: profile.credit_limite || 0
    });
    await customer.save();
    
    // Récupérer le client créé avec toutes les relations
    const populatedCustomer = await Customer.findById(customer._id)
      .populate({
        path: 'physical_user_id',
        populate: [
          {
            path: 'user_id',
            select: 'email'
          },
          {
            path: 'city_id',
            select: 'name code'
          }
        ]
      });
    
    res.status(201).json({
      success: true,
      message: 'Client physique créé avec succès',
      data: populatedCustomer
    });
    
  } catch (error) {
    console.error('Erreur création client physique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du client',
      error: error.message
    });
  }
};

// Créer un nouveau client moral 
const createMoralClient = async (req, res) => {  
  try {  
    const { profile } = req.body;  
      
    // Validation des champs requis  
    if (!profile?.raison_sociale || !profile?.email) {  
      return res.status(400).json({  
        success: false,  
        message: 'Raison sociale et email sont requis'  
      });  
    }  
      
    // Vérifier si l'email existe déjà  
    const existingUser = await User.findOne({ email: profile.email });  
    if (existingUser) {  
      return res.status(400).json({  
        success: false,  
        message: 'Un utilisateur avec cet email existe déjà'  
      });  
    }  
      
    // Créer l'utilisateur de base  
    const roleClient = await Role.findOne({ code: 'CLIENT' });  
    if (!roleClient) {  
      return res.status(400).json({   
        success: false,   
        message: 'Rôle CLIENT non trouvé'   
      });  
    }  
      
    const defaultPassword = 'ChronoGaz2024';  
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);  
      
    const newUser = new User({  
      email: profile.email,  
      password_hash: hashedPassword,  
      role_id: roleClient._id,  
      statut: 'ACTIF',  
      password_temporary: true,  
      first_login: true,
      created_by_admin: true        
    }); 
    await newUser.save();  
      
    // Créer le MoralUser  
    const moralUser = new MoralUser({  
      user_id: newUser._id,  
      raison_sociale: profile.raison_sociale,  
      ice: profile.ice,  
      patente: profile.patente,  
      rc: profile.rc,  
      ville_rc: profile.ville_rc,  
      forme_juridique: profile.forme_juridique,  
      secteur_activite: profile.secteur_activite,  
      telephone_principal: profile.telephone_principal,  
      city_id: profile.city_id || null  
    });  
    await moralUser.save();  
      
    // Créer le Customer  
    const customer_code = `CLI-M${Date.now()}`;  
    const customer = new Customer({  
      customer_code,  
      type_client: 'MORAL',  
      moral_user_id: moralUser._id,  
      statut: 'ACTIF',  
      credit_limite: profile.credit_limite || 0  
    });  
    await customer.save();  
      
    // Récupérer le client créé avec toutes les relations  
    const populatedCustomer = await Customer.findById(customer._id)  
      .populate({  
        path: 'moral_user_id',  
        populate: [  
          {  
            path: 'user_id',  
            select: 'email'  
          },  
          {  
            path: 'city_id',  
            select: 'name code'  
          }  
        ]  
      });  
      
    res.status(201).json({  
      success: true,  
      message: 'Client moral créé avec succès',  
      data: populatedCustomer  
    });  
      
  } catch (error) {  
    console.error('Erreur création client moral:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la création du client',  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour un client  
const updateClient = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const { profile, statut } = req.body;  
      
    const customer = await Customer.findById(id)  
      .populate('physical_user_id')  
      .populate('moral_user_id');  
      
    if (!customer) {  
      return res.status(404).json({  
        success: false,  
        message: 'Client non trouvé'  
      });  
    }  
      
    // Mettre à jour le statut du Customer  
    if (statut && ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'].includes(statut)) {  
      await Customer.findByIdAndUpdate(id, { statut });  
    }  
      
    // Mettre à jour l'email dans User si fourni  
    if (profile?.email) {  
      const userId = customer.physical_user_id?.user_id || customer.moral_user_id?.user_id;  
      if (userId) {  
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
      }  
    }  
      
    // Mettre à jour le profile selon le type  
    if (profile) {  
      const profileUpdate = { ...profile };  
      delete profileUpdate.email; 
        
      if (customer.type_client === 'PHYSIQUE' && customer.physical_user_id) {  
        await PhysicalUser.findByIdAndUpdate(customer.physical_user_id._id, profileUpdate);  
      } else if (customer.type_client === 'MORAL' && customer.moral_user_id) {  
        await MoralUser.findByIdAndUpdate(customer.moral_user_id._id, profileUpdate);  
      }  
    }  
      
    // Récupérer le client mis à jour  
    const updatedCustomer = await Customer.findById(id)  
      .populate({  
        path: 'physical_user_id',  
        populate: [  
          { path: 'user_id', select: 'email' },  
          { path: 'city_id', select: 'name code' }  
        ]  
      })  
      .populate({  
        path: 'moral_user_id',  
        populate: [  
          { path: 'user_id', select: 'email' },  
          { path: 'city_id', select: 'name code' }  
        ]  
      });  
      
    res.json({  
      success: true,  
      message: 'Client mis à jour avec succès',  
      data: updatedCustomer  
    });  
      
  } catch (error) {  
    console.error('Erreur mise à jour client:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la mise à jour du client',  
      error: error.message  
    });  
  }  
};  
  
// Supprimer un client  
const deleteClient = async (req, res) => {  
  try {  
    const { id } = req.params;  
      
    const customer = await Customer.findById(id);  
    if (!customer) {  
      return res.status(404).json({  
        success: false,  
        message: 'Client non trouvé'  
      });  
    }  
      
    // Supprimer les données liées  
    if (customer.physical_user_id) {  
      const physicalUser = await PhysicalUser.findById(customer.physical_user_id);  
      if (physicalUser) {  
        await User.findByIdAndDelete(physicalUser.user_id);  
        await PhysicalUser.findByIdAndDelete(customer.physical_user_id);  
      }  
    }  
      
    if (customer.moral_user_id) {  
      const moralUser = await MoralUser.findById(customer.moral_user_id);  
      if (moralUser) {  
        await User.findByIdAndDelete(moralUser.user_id);  
        await MoralUser.findByIdAndDelete(customer.moral_user_id);  
      }  
    }  
      
    await Customer.findByIdAndDelete(id);  
      
    res.json({  
      success: true,  
      message: 'Client supprimé avec succès'  
    });  
      
  } catch (error) {  
    console.error('Erreur suppression client:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la suppression du client',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer les statistiques des clients  
const getClientStats = async (req, res) => {  
  try {  
    const totalClients = await Customer.countDocuments();  
    const activeClients = await Customer.countDocuments({ statut: 'ACTIF' });  
    const physicalClients = await Customer.countDocuments({ type_client: 'PHYSIQUE' });  
    const moralClients = await Customer.countDocuments({ type_client: 'MORAL' });  
      
    // Clients récents (derniers 30 jours)  
    const thirtyDaysAgo = new Date();  
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  
    const recentClients = await Customer.countDocuments({   
      createdAt: { $gte: thirtyDaysAgo }   
    });  
      
    res.json({  
      success: true,  
      message: 'Statistiques récupérées avec succès',  
      data: {  
        total: totalClients,  
        active: activeClients,  
        physical: physicalClients,  
        moral: moralClients,  
        recent: recentClients  
      }  
    });  
      
  } catch (error) {  
    console.error('Erreur statistiques clients:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la récupération des statistiques',  
      error: error.message  
    });  
  }  
};  
  
module.exports = {  
  getClientAddresses,  
  getClientById,  
  getAllClients,  
  createPhysicalClient,  
  createMoralClient,  
  updateClient,  
  deleteClient,  
  getClientStats  
};