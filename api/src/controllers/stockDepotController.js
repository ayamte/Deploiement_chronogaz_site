const StockDepot = require('../models/StockDepot');  
const StockLine = require('../models/StockLine');  
const Depot = require('../models/Depot');  
  
// Récupérer tous les inventaires  
exports.getAllStockDepots = async (req, res) => {  
  try {  
    const { depot, archive } = req.query;  
      
    let filter = {};  
    if (depot) filter.depot_id = depot;  
    if (archive !== undefined) filter.archive = archive === 'true';  
      
    const stockDepots = await StockDepot.find(filter)  
      .populate('depot_id', 'reference short_name long_name address')  
      .sort({ stock_date: -1 });  
      
    res.status(200).json({  
      success: true,  
      count: stockDepots.length,  
      data: stockDepots  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer un inventaire par ID  
exports.getStockDepotById = async (req, res) => {  
  try {  
    const stockDepot = await StockDepot.findById(req.params.id)  
      .populate('depot_id', 'reference short_name long_name address');  
      
    if (!stockDepot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Inventaire non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: stockDepot  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer un nouvel inventaire  
exports.createStockDepot = async (req, res) => {  
  try {  
    const { depot_id, description } = req.body;  
      
    // Vérifier que le dépôt existe  
    const depot = await Depot.findById(depot_id);  
    if (!depot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Dépôt non trouvé'  
      });  
    }  

    // Vérifier qu'il n'existe pas déjà un inventaire actif pour ce dépôt  
    const existingActiveInventory = await StockDepot.findOne({  
      depot_id,  
      archive: false  
    });  
      
    if (existingActiveInventory) {  
      return res.status(400).json({  
        success: false,  
        error: 'Un inventaire actif existe déjà pour ce dépôt. Veuillez l\'archiver avant d\'en créer un nouveau.'  
      });  
}
      
    const stockDepot = await StockDepot.create({  
      depot_id,  
      description,  
      stock_date: new Date()  
    });  
      
    const populatedStockDepot = await StockDepot.findById(stockDepot._id)  
      .populate('depot_id', 'reference short_name long_name address');  
      
    res.status(201).json({  
      success: true,  
      data: populatedStockDepot  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour un inventaire  
exports.updateStockDepot = async (req, res) => {  
  try {  
    const stockDepot = await StockDepot.findByIdAndUpdate(  
      req.params.id,  
      req.body,  
      { new: true, runValidators: true }  
    ).populate('depot_id', 'reference short_name long_name address');  
      
    if (!stockDepot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Inventaire non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: stockDepot  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Archiver un inventaire  
exports.archiveStockDepot = async (req, res) => {  
  try {  
    const stockDepot = await StockDepot.findByIdAndUpdate(  
      req.params.id,  
      { archive: true },  
      { new: true }  
    ).populate('depot_id', 'reference short_name long_name address');  
      
    if (!stockDepot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Inventaire non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Inventaire archivé avec succès',  
      data: stockDepot  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};