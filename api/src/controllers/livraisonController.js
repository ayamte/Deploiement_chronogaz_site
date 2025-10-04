const Livraison = require('../models/Livraison');    
const LivraisonLine = require('../models/LivraisonLine');    
const Planification = require('../models/Planification');    
const Command = require('../models/Commande');    
const UserAddress = require('../models/UserAddress');
const CommandeLine = require('../models/CommandeLine');    
const mongoose = require('mongoose');    
    
// Démarrer une livraison depuis une planification    
const startLivraison = async (req, res) => {    
  try {    
    const { planificationId } = req.params;    
    const { latitude, longitude, details } = req.body;    
    
    console.log('🚀 [DEBUG] Démarrage livraison pour planification:', planificationId);
    
    const planification = await Planification.findById(planificationId)    
      .populate('commande_id')    
      .populate('trucks_id')    
      .populate('livreur_employee_id');    
    
    if (!planification) {    
      return res.status(404).json({    
        success: false,    
        message: 'Planification non trouvée'    
      });    
    }    
    
    // Vérifier l'état de la planification
    if (planification.etat !== 'PLANIFIE') {
      return res.status(400).json({
        success: false,
        message: `Impossible de démarrer une livraison pour une planification "${planification.etat}"`
      });
    }
    
    console.log('📋 [DEBUG] Planification trouvée:', {
      id: planification._id,
      etat: planification.etat,
      livreur: planification.livreur_employee_id,
      camion: planification.trucks_id?.matricule
    });
    
    //Gérer le cas de livraison existante avec notification
    const livraisonExistante = await Livraison.findOne({ planification_id: planificationId });
    if (livraisonExistante) {
      console.log('⚠️ [DEBUG] Livraison existante trouvée:', livraisonExistante._id);

      //  Mettre à jour le statut de la commande pour livraison existante
      const Commande = require('../models/Commande');
      await Commande.findByIdAndUpdate(planification.commande_id._id, {
        statut: 'EN_COURS'
      });
      console.log('✅ [DEBUG] Statut commande existante mis à jour vers EN_COURS');

      // Envoyer quand même la notification WebSocket pour livraison existante
      if (req.io) {
        const deliveryStartedData = {
          orderId: planification.commande_id._id,
          deliveryId: livraisonExistante._id,
          planificationId: planificationId,
          status: 'EN_COURS',
          message: 'Livraison existante activée',
          timestamp: new Date().toISOString()
        };

        req.io.emit('delivery_started', deliveryStartedData);
        req.io.emit('status_updated', {
          orderId: planification.commande_id._id,
          deliveryId: livraisonExistante._id,
          status: 'EN_COURS',
          timestamp: new Date().toISOString()
        });

        // Envoyer aussi order_status_updated pour mettre à jour le statut de commande
        req.io.emit('order_status_updated', {
          orderId: planification.commande_id._id,
          status: 'EN_COURS',
          timestamp: new Date().toISOString()
        });

        console.log('📤 [WebSocket] Notifications pour livraison existante envoyées:', deliveryStartedData);
      }

      return res.status(200).json({
        success: true,
        message: 'Livraison existante activée',
        data: livraisonExistante
      });
    }
    
    // Récupérer le chauffeur du camion si pas assigné à la planification
    let livreurId = planification.livreur_employee_id?._id;
    if (!livreurId && planification.trucks_id?.driver) {
      livreurId = planification.trucks_id.driver;
      console.log('🚛 [DEBUG] Chauffeur récupéré depuis le camion:', livreurId);
    }
    
    if (!livreurId) {
      return res.status(400).json({
        success: false,
        message: 'Aucun chauffeur assigné à cette planification ou au camion'
      });
    }
    
    console.log('👤 [DEBUG] Chauffeur final pour la livraison:', livreurId);
    
    // Créer la livraison    
    const nouvelleLivraison = new Livraison({    
      planification_id: planificationId,    
      date: new Date(),    
      livreur_employee_id: livreurId,    
      trucks_id: planification.trucks_id._id,    
      etat: 'EN_COURS',    
      latitude,    
      longitude,    
      details,    
      total: planification.commande_id.montant_total,    
      total_ttc: planification.commande_id.montant_total,    
      total_tva: 0    
    });    
    
    await nouvelleLivraison.save();
    console.log('✅ [DEBUG] Livraison créée avec ID:', nouvelleLivraison._id);

    //  Mettre à jour explicitement le statut de la commande
    const Commande = require('../models/Commande');
    await Commande.findByIdAndUpdate(planification.commande_id._id, {
      statut: 'EN_COURS'
    });
    console.log('✅ [DEBUG] Statut commande mis à jour vers EN_COURS');
    // La synchronisation avec la commande se fait automatiquement via le middleware
    
    // Copier les lignes de commande vers les lignes de livraison    
    const lignesCommande = await CommandeLine.find({     
      commande_id: planification.commande_id._id     
    });    
    
    const lignesLivraison = lignesCommande.map(ligne => ({    
      livraison_id: nouvelleLivraison._id,    
      quantity: ligne.quantity,    
      price: ligne.price,    
      product_id: ligne.product_id,    
      UM_id: ligne.UM_id,    
      total_ligne: ligne.quantity * ligne.price    
    }));    
    
    await LivraisonLine.insertMany(lignesLivraison);
    console.log('✅ [DEBUG] Lignes de livraison créées:', lignesLivraison.length);

    // Notifier le client via WebSocket qu'une livraison a été créée
    if (req.io) {
      const deliveryStartedData = {
        orderId: planification.commande_id._id,
        deliveryId: nouvelleLivraison._id,
        planificationId: planificationId,
        status: 'EN_COURS',
        message: 'Livraison démarrée',
        timestamp: new Date().toISOString()
      };

      //  Notifier avec plusieurs événements pour compatibilité
      req.io.emit('delivery_started', deliveryStartedData);
      req.io.emit('status_updated', {
        orderId: planification.commande_id._id,
        deliveryId: nouvelleLivraison._id,
        status: 'EN_COURS',
        timestamp: new Date().toISOString()
      });

      // Envoyer aussi order_status_updated pour mettre à jour le statut de commande
      req.io.emit('order_status_updated', {
        orderId: planification.commande_id._id,
        status: 'EN_COURS',
        timestamp: new Date().toISOString()
      });

      console.log('📤 [WebSocket] Toutes notifications envoyées:', {
        delivery_started: deliveryStartedData,
        order_status_updated: 'EN_COURS'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Livraison démarrée avec succès',
      data: nouvelleLivraison
    });
    
  } catch (error) {    
    console.error('❌ Erreur lors du démarrage de la livraison:', error);    
    res.status(500).json({    
      success: false,    
      message: error.message    
    });    
  }    
};    
    
//Terminer une livraison avec validation des états
const completeLivraison = async (req, res) => {    
  try {    
    const { id } = req.params;    
    const {     
      etat,     
      latitude,     
      longitude,  
      details,    
      signature_client,    
      photo_livraison,    
      commentaires_livreur,    
      commentaires_client,    
      evaluation_client    
    } = req.body;    
    
    if (!mongoose.Types.ObjectId.isValid(id)) {    
      return res.status(400).json({    
        success: false,    
        message: 'ID de livraison invalide'    
      });    
    }    
    
    const livraison = await Livraison.findById(id)    
      .populate('planification_id');    
    
    if (!livraison) {    
      return res.status(404).json({    
        success: false,    
        message: 'Livraison non trouvée'    
      });    
    }    
    
    //  Vérifier l'état actuel de la livraison
    if (livraison.etat !== 'EN_COURS') {    
      return res.status(400).json({    
        success: false,    
        message: `Impossible de terminer une livraison avec l'état "${livraison.etat}"`    
      });    
    }    

    // Valider les nouveaux états autorisés
    const etatsAutorises = ['LIVRE', 'ECHEC', 'ANNULE'];
    const nouvelEtat = etat || 'LIVRE';
    
    if (!etatsAutorises.includes(nouvelEtat)) {
      return res.status(400).json({
        success: false,
        message: `État "${nouvelEtat}" non autorisé. États valides: ${etatsAutorises.join(', ')}`
      });
    }
    
    // Mettre à jour la livraison    
    const updateData = {    
      etat: nouvelEtat,    
      latitude: latitude || livraison.latitude,    
      longitude: longitude || livraison.longitude,    
      details: details || livraison.details,    
      signature_client: signature_client || livraison.signature_client,    
      photo_livraison: photo_livraison || livraison.photo_livraison,    
      commentaires_livreur: commentaires_livreur || livraison.commentaires_livreur,    
      commentaires_client: commentaires_client || livraison.commentaires_client,    
      evaluation_client: evaluation_client || livraison.evaluation_client    
    };    
    
    const livraisonMiseAJour = await Livraison.findByIdAndUpdate(    
      id,     
      updateData,     
      { new: true }    
    );    

    //  Mettre à jour l'état de la planification (optionnel)
    const planification = await Planification.findById(livraison.planification_id._id);  
    if (planification && ['ANNULE', 'ECHEC'].includes(nouvelEtat)) {  
      planification.etat = nouvelEtat === 'ECHEC' ? 'ANNULE' : 'ANNULE';  
      planification.raison_annulation = details || `Livraison ${nouvelEtat.toLowerCase()}`;  
      await planification.save();  
}

    if (req.io) {  
      req.io.emit('order_status_updated', {  
        orderId: livraison.planification_id.commande_id,  
        status: nouvelEtat  
      });  
    }
    
    res.status(200).json({    
      success: true,    
      message: `Livraison ${nouvelEtat.toLowerCase()} avec succès`,    
      data: livraisonMiseAJour    
    });    
    
  } catch (error) {    
    console.error('Erreur lors de la finalisation de la livraison:', error);    
    res.status(500).json({    
      success: false,    
      message: error.message    
    });    
  }    
};    
    
// Obtenir toutes les livraisons avec validation des états
const getLivraisons = async (req, res) => {    
  try {    
    const { page = 1, limit = 20, etat, planificationId, livreur_employee_id } = req.query;    
    const skip = (parseInt(page) - 1) * parseInt(limit);    
        
    const filter = {};    
    
    // Validation des états autorisés
    if (etat && etat !== 'all') {      
      const etatsAutorises = ['EN_COURS', 'LIVRE', 'ANNULE', 'ECHEC'];
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
    
    if (planificationId) {      
      filter.planification_id = planificationId;      
    }    
    if (livreur_employee_id) {   
      filter.livreur_employee_id = livreur_employee_id;      
    }   
    
    const livraisons = await Livraison.find(filter)    
      .populate({    
        path: 'planification_id',    
        populate: [    
          {    
            path: 'commande_id',    
            select: 'numero_commande date_commande montant_total details statut',    
            populate: [    
              {    
                path: 'customer_id',    
                select: 'customer_code type_client physical_user_id',    
                populate: {    
                  path: 'physical_user_id',    
                  select: 'first_name last_name telephone_principal'    
                }    
              },    
              {    
                path: 'address_id',    
                select: 'street latitude longitude type_adresse',    
                populate: {    
                  path: 'city_id',    
                  select: 'name code'    
                }    
              }    
            ]    
          },    
          {    
            path: 'trucks_id',    
            select: 'matricule marque'    
          },    
          {    
            path: 'livreur_employee_id',    
            select: 'matricule fonction physical_user_id',    
            populate: {    
              path: 'physical_user_id',    
              select: 'first_name last_name'    
            }    
          }    
        ]    
      })    
      .sort({ date: -1 })    
      .skip(skip)    
      .limit(parseInt(limit));  
  
    // Récupérer les lignes pour chaque livraison  
    for (let livraison of livraisons) {    
      if (livraison.planification_id?.commande_id?._id) {    
        const lignes = await CommandeLine.find({     
          commande_id: livraison.planification_id.commande_id._id     
        })    
        .populate('product_id', 'ref long_name short_name brand')    
        .populate('UM_id', 'unitemesure');    
            
        livraison.planification_id.commande_id.lignes = lignes;    
      }    
    }  
    
    const count = await Livraison.countDocuments(filter);    
    
    res.status(200).json({    
      success: true,    
      count,    
      data: livraisons,    
      pagination: {    
        current_page: parseInt(page),    
        total_pages: Math.ceil(count / parseInt(limit)),    
        total_items: count,    
        items_per_page: parseInt(limit)    
      }    
    });    
    
  } catch (error) {    
    console.error('Erreur lors de la récupération des livraisons:', error);    
    res.status(500).json({    
      success: false,    
      message: error.message    
    });    
  }    
};    
    
// Obtenir une livraison par ID (reste identique)
const getLivraisonById = async (req, res) => {    
  try {    
    const { id } = req.params;    
    
    if (!mongoose.Types.ObjectId.isValid(id)) {    
      return res.status(400).json({    
        success: false,    
        message: 'ID de livraison invalide'    
      });    
    }    
    
    const livraison = await Livraison.findById(id)    
      .populate({    
        path: 'planification_id',    
              populate: [      
          {      
            path: 'commande_id',      
            populate: {      
              path: 'customer_id',      
              select: 'customer_code type_client'      
            }      
          },      
          {      
            path: 'trucks_id',      
            select: 'matricule marque capacite'      
          },      
          {      
            path: 'livreur_employee_id',      
            select: 'matricule fonction physical_user_id',      
            populate: {      
              path: 'physical_user_id',      
              select: 'first_name last_name telephone_principal'      
            }      
          }      
        ]      
      });      
      
    if (!livraison) {      
      return res.status(404).json({      
        success: false,      
        message: 'Livraison non trouvée'      
      });      
    }      
      
    // Récupérer les lignes de livraison      
    const lignesLivraison = await LivraisonLine.find({ livraison_id: id })      
      .populate('product_id', 'ref long_name short_name brand')      
      .populate('UM_id', 'unitemesure');      
      
    res.status(200).json({      
      success: true,      
      data: {      
        livraison,      
        lignes: lignesLivraison      
      }      
    });      
      
  } catch (error) {      
    console.error('Erreur lors de la récupération de la livraison:', error);      
    res.status(500).json({      
      success: false,      
      message: error.message      
    });      
  }      
};      
      
// Mettre à jour les lignes de livraison avec validation  
const updateLivraisonLines = async (req, res) => {      
  try {      
    const { id } = req.params;      
    const { lignes } = req.body;      
      
    if (!mongoose.Types.ObjectId.isValid(id)) {      
      return res.status(400).json({      
        success: false,      
        message: 'ID de livraison invalide'      
      });      
    }      
      
    const livraison = await Livraison.findById(id);      
    if (!livraison) {      
      return res.status(404).json({      
        success: false,      
        message: 'Livraison non trouvée'      
      });      
    }      
  
    // Vérifier que la livraison peut être modifiée  
    if (livraison.etat !== 'EN_COURS') {  
      return res.status(400).json({  
        success: false,  
        message: `Impossible de modifier les lignes d'une livraison avec l'état "${livraison.etat}"`  
      });  
    }  
      
    // Supprimer les anciennes lignes      
    await LivraisonLine.deleteMany({ livraison_id: id });      
      
    //  Validation des états de ligne autorisés  
    const etatsLigneAutorises = ['LIVRE', 'ECHEC', 'ANNULE'];  
      
    // Créer les nouvelles lignes avec validation  
    const nouvellesLignes = lignes.map(ligne => {  
      const etatLigne = ligne.etat_ligne || 'LIVRE';  
        
      if (!etatsLigneAutorises.includes(etatLigne)) {  
        throw new Error(`État de ligne "${etatLigne}" non autorisé. États valides: ${etatsLigneAutorises.join(', ')}`);  
      }  
        
      return {  
        livraison_id: id,      
        quantity: ligne.quantity,      
        price: ligne.price,      
        product_id: ligne.product_id,      
        UM_id: ligne.UM_id,      
        total_ligne: ligne.quantity * ligne.price,      
        etat_ligne: etatLigne  
      };  
    });      
      
    await LivraisonLine.insertMany(nouvellesLignes);      
      
    // Recalculer le total de la livraison      
    const nouveauTotal = nouvellesLignes.reduce((total, ligne) => total + ligne.total_ligne, 0);      
    livraison.total = nouveauTotal;      
    livraison.total_ttc = nouveauTotal;      
    await livraison.save();      
      
    res.status(200).json({      
      success: true,      
      message: 'Lignes de livraison mises à jour avec succès',      
      data: { livraison, lignes: nouvellesLignes }      
    });      
      
  } catch (error) {      
    console.error('Erreur lors de la mise à jour des lignes:', error);      
    res.status(500).json({      
      success: false,      
      message: error.message      
    });      
  }      
};      
  
//  Fonction pour obtenir les statistiques des livraisons  
const getLivraisonsStats = async (req, res) => {  
  try {  
    // Statistiques par état  
    const etatStats = await Livraison.aggregate([  
      {  
        $group: {  
          _id: '$etat',  
          count: { $sum: 1 }  
        }  
      }  
    ]);  
  
    // Livraisons d'aujourd'hui  
    const today = new Date();  
    today.setHours(0, 0, 0, 0);  
    const tomorrow = new Date(today);  
    tomorrow.setDate(tomorrow.getDate() + 1);  
  
    const livraisonsAujourdhui = await Livraison.countDocuments({  
      date: {  
        $gte: today,  
        $lt: tomorrow  
      }  
    });  
  
    // Livraisons en cours  
    const livraisonsEnCours = await Livraison.countDocuments({  
      etat: 'EN_COURS'  
    });  
  
    // Total des livraisons  
    const totalLivraisons = await Livraison.countDocuments();  
  
    // Statistiques par chauffeur (top 5)  
    const chauffeurStats = await Livraison.aggregate([  
      {  
        $group: {  
          _id: '$livreur_employee_id',  
          count: { $sum: 1 },  
          livrees: {  
            $sum: {  
              $cond: [{ $eq: ['$etat', 'LIVRE'] }, 1, 0]  
            }  
          }  
        }  
      },  
      {  
        $sort: { count: -1 }  
      },  
      {  
        $limit: 5  
      },  
      {  
        $lookup: {  
          from: 'employes',  
          localField: '_id',  
          foreignField: '_id',  
          as: 'chauffeur'  
        }  
      }  
    ]);  
  
    res.status(200).json({  
      success: true,  
      data: {  
        totalLivraisons,  
        livraisonsAujourdhui,  
        livraisonsEnCours,  
        repartitionParEtat: etatStats,  
        topChauffeurs: chauffeurStats  
      }  
    });  
  
  } catch (error) {  
    console.error('❌ Erreur récupération statistiques livraisons:', error);  
    res.status(500).json({  
      success: false,  
      message: error.message  
    });  
  }  
};  
  
//Fonction pour annuler une livraison  
const cancelLivraison = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const { raison_annulation } = req.body;  
  
    if (!mongoose.Types.ObjectId.isValid(id)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID de livraison invalide'  
      });  
    }  
  
    const livraison = await Livraison.findById(id)  
      .populate('planification_id');  
  
    if (!livraison) {  
      return res.status(404).json({  
        success: false,  
        message: 'Livraison non trouvée'  
      });  
    }  
  
    //  Vérifier que la livraison peut être annulée  
    if (livraison.etat !== 'EN_COURS') {  
      return res.status(400).json({  
        success: false,  
        message: `Impossible d'annuler une livraison avec l'état "${livraison.etat}"`  
      });  
    }  
  
    // Mettre à jour la livraison  
    livraison.etat = 'ANNULE';  
    livraison.details = `${livraison.details || ''}\nRaison d'annulation: ${raison_annulation || 'Livraison annulée'}`;  
    await livraison.save();  
    // La synchronisation avec la commande se fait automatiquement via le middleware  
  
    // Mettre à jour la planification si nécessaire  
    const planification = await Planification.findById(livraison.planification_id._id);  
    if (planification && planification.etat === 'PLANIFIE') {  
      planification.etat = 'ANNULE';  
      planification.raison_annulation = raison_annulation || 'Livraison annulée';  
      await planification.save();  
    }  
  
    res.status(200).json({  
      success: true,  
      message: 'Livraison annulée avec succès',  
      data: livraison  
    });  
  
  } catch (error) {  
    console.error('❌ Erreur annulation livraison:', error);  
    res.status(500).json({  
      success: false,  
      message: error.message  
    });  
  }  
};  

const getLivraisonTracking = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID avec mongoose
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de livraison invalide'
      });
    }

    // Population pour récupérer toutes les données nécessaires
    const livraison = await Livraison.findById(id)
      .populate({
        path: 'planification_id',
        populate: [
          {
            path: 'commande_id',
            populate: [
              { path: 'address_id' },
              { path: 'customer_id', select: 'customer_code type_client physical_user_id moral_user_id' }
            ]
          },
          {
            path: 'livreur_employee_id',
            populate: {
              path: 'physical_user_id',
              select: 'first_name last_name _id'
            }
          }
        ]
      });

    if (!livraison) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée'
      });
    }

    const planification = livraison.planification_id;
    if (!planification) {
      return res.status(404).json({
        success: false,
        message: 'Planification associée non trouvée'
      });
    }

    let dernierePosition = null;
    const physicalUserId = planification.livreur_employee_id?.physical_user_id?._id;

    if (physicalUserId) {
      // Requête simplifiée et conversion en ObjectId
      const livePosition = await UserAddress.findOne({
        physical_user_id: new mongoose.Types.ObjectId(physicalUserId),
        is_principal: false, // Votre Mongo shell a confirmé ce champ
      })
      .populate('address_id', 'latitude longitude createdAt');

      if (livePosition && livePosition.address_id) {
        dernierePosition = {
          latitude: livePosition.address_id.latitude,
          longitude: livePosition.address_id.longitude,
          timestamp: livePosition.address_id.createdAt,
        };
      }
    }
    
    // Construire l'objet de réponse pour le frontend
    const trackingData = {
      livraison_id: livraison._id,
      planification_id: planification._id,
      statut_livraison: livraison.etat,
      destination: planification.commande_id.address_id,
      client: planification.commande_id.customer_id,
      livreur: planification.livreur_employee_id,
      date_planifiee: planification.date_planifiee,
      date_livraison: livraison.updatedAt,
      derniere_position: dernierePosition,
    };

    res.status(200).json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du suivi:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};   
module.exports = {      
  startLivraison,      
  completeLivraison,      
  getLivraisons,      
  getLivraisonById,      
  updateLivraisonLines,  
  getLivraisonsStats,  
  cancelLivraison,
  getLivraisonTracking 
};

