const Um = require('../models/Um');  
  
// Récupérer toutes les unités de mesure  
exports.getAllUms = async (req, res) => {  
  try {  
    const ums = await Um.find().sort({ unitemesure: 1 });  
      
    res.status(200).json({  
      success: true,  
      count: ums.length,  
      data: ums  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer une unité de mesure par ID  
exports.getUmById = async (req, res) => {  
  try {  
    const um = await Um.findById(req.params.id);  
      
    if (!um) {  
      return res.status(404).json({  
        success: false,  
        error: 'Unité de mesure non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: um  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer une nouvelle unité de mesure  
exports.createUm = async (req, res) => {  
  try {  
    const { unitemesure } = req.body;  
      
    const um = await Um.create({ unitemesure });  
      
    res.status(201).json({  
      success: true,  
      data: um  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour une unité de mesure  
exports.updateUm = async (req, res) => {  
  try {  
    const um = await Um.findByIdAndUpdate(  
      req.params.id,  
      { unitemesure: req.body.unitemesure },  
      { new: true, runValidators: true }  
    );  
      
    if (!um) {  
      return res.status(404).json({  
        success: false,  
        error: 'Unité de mesure non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: um  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer une unité de mesure  
exports.deleteUm = async (req, res) => {  
  try {  
    const um = await Um.findByIdAndDelete(req.params.id);  
      
    if (!um) {  
      return res.status(404).json({  
        success: false,  
        error: 'Unité de mesure non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Unité de mesure supprimée avec succès'  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};