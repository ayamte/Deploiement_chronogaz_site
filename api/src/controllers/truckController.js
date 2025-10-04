const Truck = require('../models/Truck');  
const Employe = require('../models/Employe');  
const multer = require('multer');  
  
// Configuration multer pour l'upload d'images  
const storage = multer.memoryStorage();  
const upload = multer({  
  storage: storage,  
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB  
  fileFilter: (req, file, cb) => {  
    if (file.mimetype.startsWith('image/')) {  
      cb(null, true);  
    } else {  
      cb(new Error('Seules les images sont autorisées'), false);  
    }  
  }  
});  
  
// Récupérer tous les camions  
exports.getAllTrucks = async (req, res) => {  
  try {  
    const { status, brand, fuel } = req.query;  
      
    let filter = {};  
    if (status) filter.status = status;  
    if (brand) filter.brand = brand;  
    if (fuel) filter.fuel = fuel;  
  
    const trucks = await Truck.find(filter)  
      .populate({  
        path: 'driver',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name email phone'  
        }  
      })  
      .populate({  
        path: 'accompagnant',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name email phone'  
        }  
      })  
      .sort({ matricule: 1 });  
      
    res.status(200).json({  
      success: true,  
      count: trucks.length,  
      data: trucks  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer un camion par ID  
exports.getTruckById = async (req, res) => {  
  try {  
    const truck = await Truck.findById(req.params.id)  
      .populate({  
        path: 'driver',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name email phone'  
        }  
      })  
      .populate({  
        path: 'accompagnant',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name email phone'  
        }  
      });  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: truck  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer un nouveau camion  
exports.createTruck = async (req, res) => {  
  try {  
    const truckData = { ...req.body };  
      
    // Validation des employés assignés  
    if (truckData.driver) {  
      const driver = await Employe.findById(truckData.driver);  
      if (!driver || driver.fonction !== 'CHAUFFEUR') {  
        return res.status(400).json({  
          success: false,  
          error: 'Le chauffeur assigné doit être un employé avec la fonction CHAUFFEUR'  
        });  
      }  
    }  
      
    if (truckData.accompagnant) {  
      const accompagnant = await Employe.findById(truckData.accompagnant);  
      if (!accompagnant || accompagnant.fonction !== 'ACCOMPAGNANT') {  
        return res.status(400).json({  
          success: false,  
          error: 'L\'accompagnant assigné doit être un employé avec la fonction ACCOMPAGNANT'  
        });  
      }  
    }  
      
    // Ajouter l'image si elle existe  
    if (req.file) {  
      truckData.image = req.file.buffer;  
    }  
  
    const truck = await Truck.create(truckData);  
      
    // Populate les données pour la réponse  
    const populatedTruck = await Truck.findById(truck._id)  
      .populate({  
        path: 'driver',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name email phone'  
        }  
      })  
      .populate({  
        path: 'accompagnant',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name email phone'  
        }  
      });  
      
    res.status(201).json({  
      success: true,  
      data: populatedTruck  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Un camion avec ce matricule existe déjà'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour un camion  
exports.updateTruck = async (req, res) => {  
  try {  
    const updateData = { ...req.body };  
      
    // Validation des employés assignés  
    if (updateData.driver) {  
      const driver = await Employe.findById(updateData.driver);  
      if (!driver || driver.fonction !== 'CHAUFFEUR') {  
        return res.status(400).json({  
          success: false,  
          error: 'Le chauffeur assigné doit être un employé avec la fonction CHAUFFEUR'  
        });  
      }  
    }  
      
    if (updateData.accompagnant) {  
      const accompagnant = await Employe.findById(updateData.accompagnant);  
      if (!accompagnant || accompagnant.fonction !== 'ACCOMPAGNANT') {  
        return res.status(400).json({  
          success: false,  
          error: 'L\'accompagnant assigné doit être un employé avec la fonction ACCOMPAGNANT'  
        });  
      }  
    }  
      
    // Ajouter l'image si elle existe  
    if (req.file) {  
      updateData.image = req.file.buffer;  
    }  
  
    const truck = await Truck.findByIdAndUpdate(  
      req.params.id,  
      updateData,  
      { new: true, runValidators: true }  
    ).populate({  
      path: 'driver',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    }).populate({  
      path: 'accompagnant',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    });  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: truck  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Un camion avec ce matricule existe déjà'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer un camion (soft delete)  
exports.deleteTruck = async (req, res) => {  
  try {  
    const truck = await Truck.findByIdAndUpdate(  
      req.params.id,  
      { status: 'Hors service' },  
      { new: true }  
    );  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Camion mis hors service avec succès',  
      data: truck  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour le statut d'un camion  
exports.updateTruckStatus = async (req, res) => {  
  try {  
    const { status } = req.body;  
      
    const truck = await Truck.findByIdAndUpdate(  
      req.params.id,  
      { status },  
      { new: true, runValidators: true }  
    ).populate({  
      path: 'driver',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    }).populate({  
      path: 'accompagnant',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    });  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: truck  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
}; 


exports.assignDriver = async (req, res) => {  
  try {  
    const { driverId } = req.body;  
      
    // Validation de l'employé  
    if (driverId) {  
      const driver = await Employe.findById(driverId);  
      if (!driver || driver.fonction !== 'CHAUFFEUR') {  
        return res.status(400).json({  
          success: false,  
          error: 'Le chauffeur assigné doit être un employé avec la fonction CHAUFFEUR'  
        });  
      }  
    }  
      
    const truck = await Truck.findByIdAndUpdate(  
      req.params.id,  
      { driver: driverId },  
      { new: true, runValidators: true }  
    ).populate({  
      path: 'driver',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    }).populate({  
      path: 'accompagnant',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    });  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: truck  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Assigner un accompagnant à un camion  
exports.assignAccompagnant = async (req, res) => {  
  try {  
    const { accompagnantId } = req.body;  
      
    // Validation de l'employé  
    if (accompagnantId) {  
      const accompagnant = await Employe.findById(accompagnantId);  
      if (!accompagnant || accompagnant.fonction !== 'ACCOMPAGNANT') {  
        return res.status(400).json({  
          success: false,  
          error: 'L\'accompagnant assigné doit être un employé avec la fonction ACCOMPAGNANT'  
        });  
      }  
    }  
      
    const truck = await Truck.findByIdAndUpdate(  
      req.params.id,  
      { accompagnant: accompagnantId },  
      { new: true, runValidators: true }  
    ).populate({  
      path: 'driver',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    }).populate({  
      path: 'accompagnant',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    });  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: truck  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer les camions par région  
exports.getTrucksByRegion = async (req, res) => {  
  try {  
    const { region } = req.params;  
      
    const trucks = await Truck.find({   
      region,   
      status: { $ne: 'Hors service' }  
    })  
    .populate({  
      path: 'driver',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    })  
    .populate({  
      path: 'accompagnant',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    })  
    .sort({ status: 1, matricule: 1 });  
      
    res.status(200).json({  
      success: true,  
      count: trucks.length,  
      data: trucks  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer les camions nécessitant une maintenance  
exports.getMaintenanceDueTrucks = async (req, res) => {  
  try {  
    const trucks = await Truck.find({ status: 'En maintenance' })  
    .populate({  
      path: 'driver',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    })  
    .populate({  
      path: 'accompagnant',  
      populate: {  
        path: 'physical_user_id',  
        select: 'first_name last_name email phone'  
      }  
    });  
      
    res.status(200).json({  
      success: true,  
      count: trucks.length,  
      data: trucks  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour le kilométrage  
exports.updateMileage = async (req, res) => {  
  try {  
    const { mileage } = req.body;  
      
    const truck = await Truck.findByIdAndUpdate(  
      req.params.id,  
      { mileage },  
      { new: true, runValidators: true }  
    );  
      
    if (!truck) {  
      return res.status(404).json({  
        success: false,  
        error: 'Camion non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: truck  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};
  
exports.upload = upload;
