const mongoose = require('mongoose');  
const Address = require('../models/Address');  
const UserAddress = require('../models/UserAddress');  
const Customer = require('../models/Customer');  
const PhysicalUser = require('../models/PhysicalUser');  
const MoralUser = require('../models/MoralUser');  
const City = require('../models/City');  
  
// Créer une nouvelle adresse  
const createAddress = async (req, res) => {  
  try {  
    const {  
      user_id,  
      street,  
      numappt,  
      numimmeuble,  
      quartier,  
      postal_code,  
      city_id,  
      latitude,  
      longitude,  
      telephone,  
      instructions_livraison,  
      type_adresse,  
      is_principal  
    } = req.body;  
  
    // Validation des champs requis  
    if (!user_id || !street || !city_id) {  
      return res.status(400).json({  
        success: false,  
        message: 'user_id, street et city_id sont requis'  
      });  
    }  
  
    // Vérifier que la ville existe  
    const city = await City.findById(city_id);  
    if (!city) {  
      return res.status(400).json({  
        success: false,  
        message: 'Ville non trouvée'  
      });  
    }  
  
    // Créer la nouvelle adresse  
    const newAddress = new Address({  
      user_id,  
      street,  
      numappt,  
      numimmeuble,  
      quartier,  
      postal_code,  
      city_id,  
      latitude,  
      longitude,  
      telephone,  
      instructions_livraison,  
      type_adresse: type_adresse || 'LIVRAISON',  
      is_principal: is_principal || false  
    });  
  
    const savedAddress = await newAddress.save();  
  
    // Récupérer l'adresse avec les détails de la ville  
    const populatedAddress = await Address.findById(savedAddress._id)  
      .populate('city_id', 'name code');  
  
    res.status(201).json({  
      success: true,  
      message: 'Adresse créée avec succès',  
      data: populatedAddress  
    });  
  
  } catch (error) {  
    console.error('Erreur création adresse:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la création de l\'adresse',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer une adresse par ID  
const getAddressById = async (req, res) => {  
  try {  
    const { id } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID d\'adresse invalide'  
      });  
    }  
  
    const address = await Address.findById(id)  
      .populate('city_id', 'name code');  
  
    if (!address) {  
      return res.status(404).json({  
        success: false,  
        message: 'Adresse non trouvée'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      message: 'Adresse récupérée avec succès',  
      data: address  
    });  
  
  } catch (error) {  
    console.error('Erreur récupération adresse:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la récupération de l\'adresse',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer toutes les adresses d'un utilisateur  
const getUserAddresses = async (req, res) => {  
  try {  
    const { userId } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID utilisateur invalide'  
      });  
    }  
  
    const addresses = await Address.find({ user_id: userId, actif: true })  
      .populate('city_id', 'name code')  
      .sort({ is_principal: -1, createdAt: -1 });  
  
    res.status(200).json({  
      success: true,  
      message: 'Adresses récupérées avec succès',  
      data: addresses  
    });  
  
  } catch (error) {  
    console.error('Erreur récupération adresses utilisateur:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la récupération des adresses',  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour une adresse  
const updateAddress = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const updateData = req.body;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID d\'adresse invalide'  
      });  
    }  
  
    // Vérifier que l'adresse existe  
    const existingAddress = await Address.findById(id);  
    if (!existingAddress) {  
      return res.status(404).json({  
        success: false,  
        message: 'Adresse non trouvée'  
      });  
    }  
  
    // Si city_id est fourni, vérifier qu'elle existe  
    if (updateData.city_id) {  
      const city = await City.findById(updateData.city_id);  
      if (!city) {  
        return res.status(400).json({  
          success: false,  
          message: 'Ville non trouvée'  
        });  
      }  
    }  
  
    // Mettre à jour l'adresse  
    const updatedAddress = await Address.findByIdAndUpdate(  
      id,  
      updateData,  
      { new: true, runValidators: true }  
    ).populate('city_id', 'name code');  
  
    res.status(200).json({  
      success: true,  
      message: 'Adresse mise à jour avec succès',  
      data: updatedAddress  
    });  
  
  } catch (error) {  
    console.error('Erreur mise à jour adresse:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la mise à jour de l\'adresse',  
      error: error.message  
    });  
  }  
};  
  
// Supprimer une adresse (soft delete)  
const deleteAddress = async (req, res) => {  
  try {  
    const { id } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID d\'adresse invalide'  
      });  
    }  
  
    const address = await Address.findById(id);  
    if (!address) {  
      return res.status(404).json({  
        success: false,  
        message: 'Adresse non trouvée'  
      });  
    }  
  
    // Soft delete - marquer comme inactive  
    await Address.findByIdAndUpdate(id, { actif: false });  
  
    res.status(200).json({  
      success: true,  
      message: 'Adresse supprimée avec succès'  
    });  
  
  } catch (error) {  
    console.error('Erreur suppression adresse:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la suppression de l\'adresse',  
      error: error.message  
    });  
  }  
};  
  
// Créer une adresse et la lier à un client  
const createAddressForCustomer = async (req, res) => {  
  try {  
    const { customerId } = req.params;  
    const addressData = req.body;  
  
    // Vérifier que le client existe  
    const customer = await Customer.findById(customerId);  
    if (!customer) {  
      return res.status(404).json({  
        success: false,  
        message: 'Client non trouvé'  
      });  
    }  
  
    // Utiliser Casablanca par défaut si city_id n'est pas fourni  
    if (!addressData.city_id) {  
      const casablancaCity = await City.findOne({ name: 'Casablanca' });  
      if (casablancaCity) {  
        addressData.city_id = casablancaCity._id;  
      }  
    }  
  
    // Créer l'adresse  
    const newAddress = new Address({  
      ...addressData,  
      user_id: customerId  
    });  
  
    const savedAddress = await newAddress.save();  
  
    // Créer la liaison UserAddress  
    const userAddressData = {  
      address_id: savedAddress._id,  
      is_principal: addressData.is_principal || false  
    };  
  
    if (customer.type_client === 'PHYSIQUE') {  
      userAddressData.physical_user_id = customer.physical_user_id;  
    } else {  
      userAddressData.moral_user_id = customer.moral_user_id;  
    }  
  
    const userAddress = new UserAddress(userAddressData);  
    await userAddress.save();  
  
    // Récupérer l'adresse avec les détails  
    const populatedAddress = await Address.findById(savedAddress._id)  
      .populate('city_id', 'name code');  
  
    res.status(201).json({  
      success: true,  
      message: 'Adresse créée et liée au client avec succès',  
      data: populatedAddress  
    });  
  
  } catch (error) {  
    console.error('Erreur création adresse client:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la création de l\'adresse client',  
      error: error.message  
    });  
  }  
};  
  
module.exports = {  
  createAddress,  
  getAddressById,  
  getUserAddresses,  
  updateAddress,  
  deleteAddress,  
  createAddressForCustomer  
};