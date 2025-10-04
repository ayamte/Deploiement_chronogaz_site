const Depot = require('../models/Depot');  
  
// Récupérer tous les dépôts  
exports.getAllDepots = async (req, res) => {  
  try {  
    const depots = await Depot.find({ actif: true })  
      .sort({ short_name: 1 });  
      
    res.status(200).json({  
      success: true,  
      count: depots.length,  
      data: depots  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer un dépôt par ID  
exports.getDepotById = async (req, res) => {  
  try {  
    const depot = await Depot.findById(req.params.id);  
      
      
    if (!depot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Dépôt non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: depot  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer un nouveau dépôt  
exports.createDepot = async (req, res) => {  
  try {  
    const depot = await Depot.create(req.body);  
      
    const populatedDepot = await Depot.findById(depot._id); 
      
    res.status(201).json({  
      success: true,  
      data: populatedDepot  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Un dépôt avec cette référence existe déjà'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour un dépôt  
exports.updateDepot = async (req, res) => {  
  try {  
    const depot = await Depot.findByIdAndUpdate(  
      req.params.id,  
      req.body,  
      { new: true, runValidators: true }  
    );  
      
    if (!depot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Dépôt non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: depot  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Un dépôt avec cette référence existe déjà'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer un dépôt (désactivation logique)  
exports.deleteDepot = async (req, res) => {  
  try {  
    const depot = await Depot.findByIdAndUpdate(  
      req.params.id,  
      { actif: false },  
      { new: true }  
    );  
      
    if (!depot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Dépôt non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Dépôt désactivé avec succès',  
      data: depot  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Rechercher des dépôts  
exports.searchDepots = async (req, res) => {  
  try {  
    const { q } = req.query;  
      
    if (!q) {  
      return res.status(400).json({  
        success: false,  
        error: 'Paramètre de recherche manquant'  
      });  
    }  
  
    const depots = await Depot.find({  
      $or: [  
        { reference: { $regex: q, $options: 'i' } },  
        { short_name: { $regex: q, $options: 'i' } },  
        { long_name: { $regex: q, $options: 'i' } },  
        { description: { $regex: q, $options: 'i' } }  
      ],  
      actif: true  
    });  
      
    res.status(200).json({  
      success: true,  
      count: depots.length,  
      data: depots  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};