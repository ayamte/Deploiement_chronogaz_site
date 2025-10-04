const Planification = require('../models/Planification');    
const CommandeLine = require('../models/CommandeLine');    
const mongoose = require('mongoose');    
    
// Obtenir toutes les planifications avec filtres simplifiés  
const getPlanifications = async (req, res) => {    
  try {    
    const { page = 1, limit = 20, etat, livreur_employee_id, trucks_id, dateFrom, dateTo, priority } = req.query;    
    const skip = (parseInt(page) - 1) * parseInt(limit);    
        
    const filter = {};    
      
    //  Validation des états autorisés selon la nouvelle architecture  
    if (etat && etat !== 'all') {    
      const etatsAutorises = ['PLANIFIE', 'ANNULE'];  
      const etatUpper = etat.toUpperCase();  
        
      if (etatsAutorises.includes(etatUpper)) {  
        filter.etat = etatUpper;  
      } else {  
        return res.status(400).json({  
          success: false,  
          message: `État "${etat}" non autorisé. États valides: ${etatsAutorises.join(', ')}`  
        });  
      }  
    }    
      
    if (livreur_employee_id) {    
      filter.livreur_employee_id = livreur_employee_id;    
    } else if (trucks_id) {  
      filter.trucks_id = trucks_id;  
    }  
      
    if (priority && priority !== 'all') {    
      const prioritesAutorisees = ['low', 'medium', 'high', 'urgent'];  
      if (prioritesAutorisees.includes(priority)) {  
        filter.priority = priority;  
      } else {  
        return res.status(400).json({  
          success: false,  
          message: `Priorité "${priority}" non autorisée. Priorités valides: ${prioritesAutorisees.join(', ')}`  
        });  
      }  
    }    
      
    if (dateFrom || dateTo) {    
      filter.delivery_date = {};    
      if (dateFrom) {    
        filter.delivery_date.$gte = new Date(dateFrom);    
      }    
      if (dateTo) {    
        filter.delivery_date.$lte = new Date(dateTo);    
      }    
    }    
  
    console.log('🔍 [DEBUG] Filtres appliqués:', filter);  
    
    const planifications = await Planification.find(filter)    
      .populate({    
        path: 'commande_id',    
        populate: [    
          {    
            path: 'customer_id',    
            populate: [    
              { path: 'physical_user_id' },    
              { path: 'moral_user_id' }    
            ]    
          },    
          {    
            path: 'address_id',    
            populate: { path: 'city_id' }    
          }    
        ]    
      })    
      .populate('trucks_id')    
      .populate({    
        path: 'livreur_employee_id',    
        populate: { path: 'physical_user_id' }    
      })    
      .populate({    
        path: 'accompagnateur_id',    
        populate: { path: 'physical_user_id' }    
      })    
      .sort({ delivery_date: 1 })    
      .skip(skip)    
      .limit(parseInt(limit));    
  
    console.log('📋 [DEBUG] Planifications trouvées:', planifications.length);  
    
    // Enrichir avec les lignes de commande    
    const planificationsComplete = await Promise.all(    
      planifications.map(async (planification) => {    
        const lignes = await CommandeLine.find({     
          commande_id: planification.commande_id._id     
        })    
        .populate('product_id', 'ref long_name short_name brand prix')    
        .populate('UM_id', 'unitemesure');    
    
        return {    
          ...planification.toObject(),    
          lignes    
        };    
      })    
    );    
    
    const count = await Planification.countDocuments(filter);   
     
    
    res.status(200).json({    
      success: true,    
      count,    
      data: planificationsComplete,    
      pagination: {    
        current_page: parseInt(page),    
        total_pages: Math.ceil(count / parseInt(limit)),    
        total_items: count,    
        items_per_page: parseInt(limit)    
      }    
    });    
    
  } catch (error) {    
    console.error('Erreur récupération planifications:', error);    
    res.status(500).json({    
      success: false,    
      message: error.message    
    });    
  }    
};    
    
// Obtenir une planification par ID (reste identique)  
const getPlanificationById = async (req, res) => {    
  try {    
    const { id } = req.params;    
        
    if (!mongoose.Types.ObjectId.isValid(id)) {    
      return res.status(400).json({    
        success: false,    
        message: 'ID de planification invalide'    
      });    
    }    
    
    const planification = await Planification.findById(id)    
      .populate({    
        path: 'commande_id',    
        populate: [    
          { path: 'customer_id', populate: [{ path: 'physical_user_id' }, { path: 'moral_user_id' }] },    
          { path: 'address_id', populate: { path: 'city_id' } }    
        ]    
      })    
      .populate('trucks_id')    
      .populate({ path: 'livreur_employee_id', populate: { path: 'physical_user_id' } })    
      .populate({ path: 'accompagnateur_id', populate: { path: 'physical_user_id' } });    
    
    if (!planification) {    
      return res.status(404).json({    
        success: false,    
        message: 'Planification non trouvée'    
      });    
    }    
    
    const lignes = await CommandeLine.find({     
      commande_id: planification.commande_id._id     
    })    
    .populate('product_id', 'ref long_name short_name brand prix')    
    .populate('UM_id', 'unitemesure');    
    
    res.status(200).json({    
      success: true,    
      data: {    
        ...planification.toObject(),    
        lignes    
      }    
    });    
    
  } catch (error) {    
    console.error('Erreur récupération planification:', error);    
    res.status(500).json({    
      success: false,    
      message: error.message    
    });    
  }    
};    
  
// Fonction pour créer une planification avec validation  
const createPlanification = async (req, res) => {  
  try {  
    const { commande_id, truck_id, priority, delivery_date, livreur_employee_id, accompagnateur_id } = req.body;  
  
    if (!commande_id || !truck_id || !delivery_date) {  
      return res.status(400).json({  
        success: false,  
        message: 'commande_id, truck_id et delivery_date sont requis'  
      });  
    }  
  
    // Vérifier que la commande est dans un état planifiable  
    const Command = require('../models/Commande');  
    const commande = await Command.findById(commande_id);  
      
    if (!commande) {  
      return res.status(404).json({  
        success: false,  
        message: 'Commande non trouvée'  
      });  
    }  
  
    //  Vérifier les états autorisés pour la planification  
    const etatsAutorisesPlanning = ['CONFIRMEE', 'ASSIGNEE'];  
    if (!etatsAutorisesPlanning.includes(commande.statut)) {  
      return res.status(400).json({  
        success: false,  
        message: `Impossible de planifier une commande avec le statut "${commande.statut}"`  
      });  
    }  
  
    const existingPlanification = await Planification.findOne({ commande_id });  
    if (existingPlanification) {  
      return res.status(400).json({  
        success: false,  
        message: 'Cette commande est déjà planifiée'  
      });  
    }  
  
    // Validation de la priorité  
    const prioritesAutorisees = ['low', 'medium', 'high', 'urgent'];  
    const finalPriority = priority || 'medium';  
    if (!prioritesAutorisees.includes(finalPriority)) {  
      return res.status(400).json({  
        success: false,  
        message: `Priorité "${priority}" non autorisée. Priorités valides: ${prioritesAutorisees.join(', ')}`  
      });  
    }  
  
    let finalLivreurId = livreur_employee_id;  
    if (!finalLivreurId) {  
      try {  
        console.log('🚛 [DEBUG] Tentative d\'auto-assignation du chauffeur...');  
        const Truck = require('../models/Truck');  
        const truck = await Truck.findById(truck_id).populate('driver');  
          
        if (truck && truck.driver) {  
          finalLivreurId = truck.driver._id;  
          console.log('✅ [DEBUG] Chauffeur auto-assigné:', finalLivreurId);  
        } else {  
          console.log('⚠️ [DEBUG] Aucun chauffeur trouvé pour ce camion');  
        }  
      } catch (error) {  
        console.error('❌ [ERROR] Erreur lors de la récupération du chauffeur du camion:', error);  
      }  
    }  
  
    const planification = new Planification({  
      commande_id,  
      trucks_id: truck_id,  
      delivery_date: new Date(delivery_date),  
      priority: finalPriority,  
      livreur_employee_id: finalLivreurId,  
      accompagnateur_id: accompagnateur_id || null,  
      etat: 'PLANIFIE'  
    });  
  
    await planification.save();  
  
    const populatedPlanification = await Planification.findById(planification._id)  
      .populate({  
        path: 'commande_id',  
        populate: [  
          {  
            path: 'customer_id',  
            populate: [  
              { path: 'physical_user_id' },  
              { path: 'moral_user_id' }  
            ]  
          },  
          {  
            path: 'address_id',  
            populate: { path: 'city_id' }  
          }  
        ]  
      })  
      .populate('trucks_id')  
      .populate({  
        path: 'livreur_employee_id',  
        populate: { path: 'physical_user_id' }  
      })  
      .populate({  
        path: 'accompagnateur_id',  
        populate: { path: 'physical_user_id' }  
      });  

    if (req.io) {  
      req.io.emit('new_assignment', {  
        employeeId: populatedPlanification.livreur_employee_id._id,  
        orderId: populatedPlanification.commande_id._id,  
        orderNumber: populatedPlanification.commande_id.numero_commande  
      });  
    }        
  
    res.status(201).json({  
      success: true,  
      message: 'Planification créée avec succès',  
      data: populatedPlanification  
    });  
  
  } catch (error) {  
    console.error('❌ Erreur création planification:', error);  
    res.status(500).json({  
      success: false,  
      message: error.message  
    });  
  }  
};  
  
// Fonction pour annuler une planification (au lieu de supprimer)  
const cancelPlanificationByCommande = async (req, res) => {  
  try {  
    const { commandeId } = req.params;  
    const { raison_annulation } = req.body;  
  
    if (!mongoose.Types.ObjectId.isValid(commandeId)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID de commande invalide'  
      });  
    }  
  
    const planification = await Planification.findOne({ commande_id: commandeId });  
  
    if (!planification) {  
      return res.status(404).json({  
        success: false,  
        message: 'Aucune planification trouvée pour cette commande'  
      });  
    }  
  
    //  Vérifier que la planification peut être annulée  
    if (planification.etat === 'ANNULE') {  
      return res.status(400).json({  
        success: false,  
        message: 'Cette planification est déjà annulée'  
      });  
    }  
  
    // Vérifier s'il y a une livraison en cours  
    const Livraison = require('../models/Livraison');  
    const livraison = await Livraison.findOne({  
      planification_id: planification._id,  
      etat: 'EN_COURS'  
    });  
  
    if (livraison) {  
      return res.status(400).json({  
        success: false,  
        message: 'Impossible d\'annuler une planification avec une livraison en cours'  
      });  
    }  
  
    // Marquer comme annulée au lieu de supprimer  
    planification.etat = 'ANNULE';  
    planification.raison_annulation = raison_annulation || 'Planification annulée';  
    await planification.save();   
  
    res.status(200).json({  
      success: true,  
      message: 'Planification annulée avec succès'  
    });  
  
  } catch (error) {  
    console.error('Erreur annulation planification:', error);  
    res.status(500).json({  
      success: false,  
      message: error.message  
    });  
  }  
};  
  
// Fonction pour mettre à jour une planification  
const updatePlanification = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const { truck_id, delivery_date, priority, livreur_employee_id, accompagnateur_id } = req.body;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID de planification invalide'  
      });  
    }  
  
    const planification = await Planification.findById(id);  
    if (!planification) {  
      return res.status(404).json({  
        success: false,  
        message: 'Planification non trouvée'  
      });  
    }  
  
    // Vérifier que la planification peut être modifiée  
    if (planification.etat === 'ANNULE') {  
      return res.status(400).json({  
        success: false,  
        message: 'Impossible de modifier une planification annulée'  
      });  
    }  
  
    // Validation de la priorité si fournie  
    if (priority) {  
      const prioritesAutorisees = ['low', 'medium', 'high', 'urgent'];  
      if (!prioritesAutorisees.includes(priority)) {  
        return res.status(400).json({  
          success: false,  
          message: `Priorité "${priority}" non autorisée. Priorités valides: ${prioritesAutorisees.join(', ')}`  
        });  
      }  
    }  
  
    // Construire l'objet de mise à jour  
    const updateData = {};  
    if (truck_id) updateData.trucks_id = truck_id;  
    if (delivery_date) updateData.delivery_date = new Date(delivery_date);  
    if (priority) updateData.priority = priority;  
    if (livreur_employee_id) updateData.livreur_employee_id = livreur_employee_id;  
    if (accompagnateur_id !== undefined) updateData.accompagnateur_id = accompagnateur_id;  
  
    // Auto-assignation du chauffeur si un nouveau camion est spécifié  
    if (truck_id && !livreur_employee_id) {  
      try {  
        const Truck = require('../models/Truck');  
        const truck = await Truck.findById(truck_id).populate('driver');  
          
        if (truck && truck.driver) {  
          updateData.livreur_employee_id = truck.driver._id;  
          console.log('✅ [DEBUG] Chauffeur auto-assigné lors de la mise à jour:', truck.driver._id);  
        }  
      } catch (error) {  
        console.error('❌ [ERROR] Erreur lors de l\'auto-assignation du chauffeur:', error);  
      }  
    }  
  
    const planificationMiseAJour = await Planification.findByIdAndUpdate(  
      id,  
      updateData,  
      { new: true, runValidators: true }  
    ).populate({  
      path: 'commande_id',  
      populate: [  
        {  
          path: 'customer_id',  
          populate: [  
            { path: 'physical_user_id' },  
            { path: 'moral_user_id' }  
          ]  
        },  
        {  
          path: 'address_id',  
          populate: { path: 'city_id' }  
        }  
      ]  
    })  
    .populate('trucks_id')  
    .populate({  
      path: 'livreur_employee_id',  
      populate: { path: 'physical_user_id' }  
    })  
    .populate({  
      path: 'accompagnateur_id',  
      populate: { path: 'physical_user_id' }  
    });  
  
  
    res.status(200).json({  
      success: true,  
      message: 'Planification mise à jour avec succès',  
      data: planificationMiseAJour  
    });  
  
  } catch (error) {  
    console.error('❌ Erreur mise à jour planification:', error);  
    res.status(500).json({  
      success: false,  
      message: error.message  
    });  
  }  
};  
  
// Fonction pour obtenir les statistiques des planifications  
const getPlanificationStats = async (req, res) => {  
  try {  
    // Statistiques par état  
    const etatStats = await Planification.aggregate([  
      {  
        $group: {  
          _id: '$etat',  
          count: { $sum: 1 }  
        }  
      }  
    ]);  
  
    // Statistiques par priorité  
    const priorityStats = await Planification.aggregate([  
      {  
        $group: {  
          _id: '$priority',  
          count: { $sum: 1 }  
        }  
      }  
    ]);  
  
    // Planifications d'aujourd'hui  
    const today = new Date();  
    today.setHours(0, 0, 0, 0);  
    const tomorrow = new Date(today);  
    tomorrow.setDate(tomorrow.getDate() + 1);  
  
    const planificationsAujourdhui = await Planification.countDocuments({  
      delivery_date: {  
        $gte: today,  
        $lt: tomorrow  
      },  
      etat: 'PLANIFIE'  
    });  
  
    // Total des planifications  
    const totalPlanifications = await Planification.countDocuments();  
  
    res.status(200).json({  
      success: true,  
      data: {  
        totalPlanifications,  
        planificationsAujourdhui,  
        repartitionParEtat: etatStats,  
        repartitionParPriorite: priorityStats  
      }  
    });  
  
  } catch (error) {  
    console.error('❌ Erreur récupération statistiques planifications:', error);  
    res.status(500).json({  
      success: false,  
      message: error.message  
    });  
  }  
};  
  
module.exports = {    
  getPlanifications,    
  getPlanificationById,  
  createPlanification,  
  updatePlanification,  
  cancelPlanificationByCommande,  
  getPlanificationStats  
};