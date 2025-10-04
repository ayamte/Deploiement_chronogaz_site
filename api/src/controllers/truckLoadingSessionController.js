const TruckLoadingSession = require('../models/TruckLoadingSession');
const Truck = require('../models/Truck');
const Depot = require('../models/Depot');

// Récupérer toutes les sessions de chargement
exports.getAllLoadingSessions = async (req, res) => {
  try {
    const { truck_id, depot_id, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (truck_id) filter.truck_id = truck_id;
    if (depot_id) filter.depot_id = depot_id;
    if (status) filter.status = status;
    
    const sessions = await TruckLoadingSession.find(filter)
      .populate('truck_id', 'matricule modele capacite')
      .populate('depot_id', 'reference short_name long_name address')
      .sort({ loading_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await TruckLoadingSession.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Récupérer une session par ID
exports.getLoadingSessionById = async (req, res) => {
  try {
    const session = await TruckLoadingSession.findById(req.params.id)
      .populate('truck_id', 'matricule modele capacite')
      .populate('depot_id', 'reference short_name long_name address')
      .populate('products.product_id', 'short_name long_name ref');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session de chargement non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Récupérer la session active pour un camion
exports.getActiveLoadingSessionByTruck = async (req, res) => {
  try {
    const { truckId } = req.params;
    
    const session = await TruckLoadingSession.findOne({
      truck_id: truckId,
      status: 'completed' // Session terminée mais pas encore déchargée
    })
      .populate('truck_id', 'matricule modele capacite')
      .populate('depot_id', 'reference short_name long_name address')
      .populate('products.product_id', 'short_name long_name ref')
      .sort({ loading_date: -1 });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Aucune session de chargement active trouvée pour ce camion'
      });
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Créer une nouvelle session de chargement
exports.createLoadingSession = async (req, res) => {
  try {
    const {
      truck_id,
      depot_id,
      chauffeur_id,
      loading_date,
      products,
      total_weight,
      total_volume,
      notes,
      stock_depot_id
    } = req.body;
    
    // Vérifier que le camion existe
    const truck = await Truck.findById(truck_id);
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Camion non trouvé'
      });
    }
    
    // Vérifier que le dépôt existe
    const depot = await Depot.findById(depot_id);
    if (!depot) {
      return res.status(404).json({
        success: false,
        error: 'Dépôt non trouvé'
      });
    }
    
    // Vérifier qu'il n'y a pas déjà une session en cours pour ce camion
    const existingSession = await TruckLoadingSession.findOne({
      truck_id,
      status: 'in-progress'
    });
    
    if (existingSession) {
      return res.status(400).json({
        success: false,
        error: 'Une session de chargement en cours existe déjà pour ce camion'
      });
    }
    
    // Marquer les anciennes sessions completed comme unloaded si elles ne le sont pas déjà
    await TruckLoadingSession.updateMany(
      { 
        truck_id, 
        status: 'completed' 
      },
      { 
        status: 'unloaded',
        unloaded_at: new Date()
      }
    );
    
    const session = await TruckLoadingSession.create({
      truck_id,
      depot_id,
      chauffeur_id,
      loading_date: loading_date || new Date(),
      status: 'completed',
      products: products || [],
      total_weight: total_weight || 0,
      total_volume: total_volume || 0,
      notes,
      stock_depot_id,
      completed_at: new Date()
    });
    
    const populatedSession = await TruckLoadingSession.findById(session._id)
      .populate('truck_id', 'matricule modele capacite')
      .populate('depot_id', 'reference short_name long_name address');
    
    res.status(201).json({
      success: true,
      data: populatedSession
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Mettre à jour une session de chargement
exports.updateLoadingSession = async (req, res) => {
  try {
    const session = await TruckLoadingSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('truck_id', 'matricule modele capacite')
      .populate('depot_id', 'reference short_name long_name address');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session de chargement non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Marquer une session comme déchargée
exports.completeUnloading = async (req, res) => {
  try {
    const session = await TruckLoadingSession.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'unloaded',
        unloaded_at: new Date()
      },
      { new: true }
    )
      .populate('truck_id', 'matricule modele capacite')
      .populate('depot_id', 'reference short_name long_name address');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session de chargement non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Session marquée comme déchargée',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Supprimer une session de chargement
exports.deleteLoadingSession = async (req, res) => {
  try {
    const session = await TruckLoadingSession.findByIdAndDelete(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session de chargement non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Session de chargement supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
