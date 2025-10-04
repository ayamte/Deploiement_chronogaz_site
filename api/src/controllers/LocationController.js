const mongoose = require('mongoose');  
const City = require('../models/City');  
const Address = require('../models/Address');  
  
// Récupérer toutes les villes actives  
const getCities = async (req, res) => {  
  try {  
    const cities = await City.find({ actif: true }).sort({ name: 1 });  
    res.status(200).json({   
      success: true,   
      message: 'Villes récupérées avec succès',  
      data: cities   
    });  
  } catch (error) {  
    console.error('Erreur récupération villes:', error);  
    res.status(500).json({   
      success: false,   
      message: 'Erreur serveur lors de la récupération des villes',  
      error: error.message   
    });  
  }  
};  
  
// Créer une nouvelle ville  
const createCity = async (req, res) => {  
  try {  
    const { name, code, latitude, longitude, actif = true } = req.body;  
  
    // Validation des champs requis  
    if (!name) {  
      return res.status(400).json({  
        success: false,  
        message: 'Le nom de la ville est requis'  
      });  
    }  
  
    // Vérifier si la ville existe déjà  
    const existingCity = await City.findOne({   
      $or: [  
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },  
        { code: code }  
      ]  
    });  
  
    if (existingCity) {  
      return res.status(400).json({  
        success: false,  
        message: 'Cette ville existe déjà'  
      });  
    }  
  
    const cityData = {  
      name,  
      actif  
    };  
  
    if (code) cityData.code = code;  
    if (latitude) cityData.latitude = parseFloat(latitude);  
    if (longitude) cityData.longitude = parseFloat(longitude);  
  
    const city = await City.create(cityData);  
      
    res.status(201).json({   
      success: true,   
      message: 'Ville créée avec succès',  
      data: city   
    });  
  } catch (error) {  
    console.error('Erreur création ville:', error);  
    if (error.code === 11000) {  
      return res.status(400).json({   
        success: false,   
        message: 'Cette ville existe déjà'   
      });  
    }  
    res.status(500).json({   
      success: false,   
      message: 'Erreur serveur lors de la création de la ville',  
      error: error.message   
    });  
  }  
};  
  
// Récupérer une ville par ID  
const getCityById = async (req, res) => {  
  try {  
    const { id } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID de ville invalide'  
      });  
    }  
  
    const city = await City.findById(id);  
      
    if (!city) {  
      return res.status(404).json({  
        success: false,  
        message: 'Ville non trouvée'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      message: 'Ville récupérée avec succès',  
      data: city  
    });  
  } catch (error) {  
    console.error('Erreur récupération ville:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la récupération de la ville',  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour une ville  
const updateCity = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const updateData = req.body;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID de ville invalide'  
      });  
    }  
  
    // Vérifier que la ville existe  
    const existingCity = await City.findById(id);  
    if (!existingCity) {  
      return res.status(404).json({  
        success: false,  
        message: 'Ville non trouvée'  
      });  
    }  
  
    // Vérifier l'unicité si le nom ou code change  
    if (updateData.name || updateData.code) {  
      const duplicateQuery = {  
        _id: { $ne: id }  
      };  
  
      if (updateData.name) {  
        duplicateQuery.name = { $regex: new RegExp(`^${updateData.name}$`, 'i') };  
      }  
      if (updateData.code) {  
        duplicateQuery.code = updateData.code;  
      }  
  
      const duplicate = await City.findOne(duplicateQuery);  
      if (duplicate) {  
        return res.status(400).json({  
          success: false,  
          message: 'Une ville avec ce nom ou code existe déjà'  
        });  
      }  
    }  
  
    // Convertir les coordonnées en nombres si fournies  
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);  
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);  
  
    const city = await City.findByIdAndUpdate(  
      id,   
      updateData,   
      { new: true, runValidators: true }  
    );  
  
    res.status(200).json({   
      success: true,   
      message: 'Ville mise à jour avec succès',  
      data: city   
    });  
  } catch (error) {  
    console.error('Erreur mise à jour ville:', error);  
    res.status(500).json({   
      success: false,   
      message: 'Erreur serveur lors de la mise à jour de la ville',  
      error: error.message   
    });  
  }  
};  
  
// Supprimer une ville (soft delete)  
const deleteCity = async (req, res) => {  
  try {  
    const { id } = req.params;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID de ville invalide'  
      });  
    }  
  
    // Vérifier que la ville existe  
    const existingCity = await City.findById(id);  
    if (!existingCity) {  
      return res.status(404).json({  
        success: false,  
        message: 'Ville non trouvée'  
      });  
    }  
  
    // Vérifier si la ville est utilisée dans des adresses  
    const addressCount = await Address.countDocuments({   
      city_id: id,   
      actif: true   
    });  
  
    if (addressCount > 0) {  
      return res.status(400).json({  
        success: false,  
        message: `Impossible de supprimer cette ville car elle est utilisée dans ${addressCount} adresse(s)`  
      });  
    }  
  
    // Soft delete - marquer comme inactive  
    const city = await City.findByIdAndUpdate(  
      id,   
      { actif: false },   
      { new: true }  
    );  
  
    res.status(200).json({   
      success: true,   
      message: 'Ville supprimée avec succès',  
      data: city  
    });  
  } catch (error) {  
    console.error('Erreur suppression ville:', error);  
    res.status(500).json({   
      success: false,   
      message: 'Erreur serveur lors de la suppression de la ville',  
      error: error.message   
    });  
  }  
};  
  
// Rechercher des villes par nom  
const searchCities = async (req, res) => {  
  try {  
    const { q } = req.query;  
  
    if (!q || q.trim().length < 2) {  
      return res.status(400).json({  
        success: false,  
        message: 'Le terme de recherche doit contenir au moins 2 caractères'  
      });  
    }  
  
    const cities = await City.find({  
      name: { $regex: new RegExp(q.trim(), 'i') },  
      actif: true  
    })  
    .sort({ name: 1 })  
    .limit(20);  
  
    res.status(200).json({  
      success: true,  
      message: 'Recherche effectuée avec succès',  
      data: cities  
    });  
  } catch (error) {  
    console.error('Erreur recherche villes:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la recherche',  
      error: error.message  
    });  
  }  
};  
  
// Récupérer les statistiques des villes  
const getCitiesStats = async (req, res) => {  
  try {  
    const totalCities = await City.countDocuments({ actif: true });  
    const inactiveCities = await City.countDocuments({ actif: false });  
      
    // Statistiques des adresses par ville  
    const addressStats = await Address.aggregate([  
      { $match: { actif: true } },  
      { $group: { _id: '$city_id', count: { $sum: 1 } } },  
      { $lookup: { from: 'cities', localField: '_id', foreignField: '_id', as: 'city' } },  
      { $unwind: '$city' },  
      { $project: { cityName: '$city.name', addressCount: '$count' } },  
      { $sort: { addressCount: -1 } },  
      { $limit: 10 }  
    ]);  
  
    res.status(200).json({  
      success: true,  
      message: 'Statistiques récupérées avec succès',  
      data: {  
        totalCities,  
        inactiveCities,  
        topCitiesByAddresses: addressStats  
      }  
    });  
  } catch (error) {  
    console.error('Erreur statistiques villes:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la récupération des statistiques',  
      error: error.message  
    });  
  }  
};  
  
// Géocoder une adresse (fonction utilitaire)  
const geocodeAddress = async (req, res) => {  
  try {  
    const { address } = req.body;  
  
    if (!address) {  
      return res.status(400).json({  
        success: false,  
        message: 'Adresse requise pour le géocodage'  
      });  
    }  
  
      
    res.status(200).json({  
      success: true,  
      message: 'Géocodage non implémenté',  
      data: {  
        address,  
        coordinates: null,  
        note: 'Service de géocodage à implémenter'  
      }  
    });  
  } catch (error) {  
    console.error('Erreur géocodage:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors du géocodage',  
      error: error.message  
    });  
  }  
};  
  
module.exports = {  
  getCities,  
  createCity,  
  getCityById,  
  updateCity,  
  deleteCity,  
  searchCities,  
  getCitiesStats,  
  geocodeAddress  
};