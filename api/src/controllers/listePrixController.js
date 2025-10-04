const ListePrix = require('../models/ListePrix');  
  
// Récupérer toutes les listes de prix  
exports.getAllListePrix = async (req, res) => {  
  try {  
    const { isactif, dateDebut, dateFin } = req.query;  
      
    let filter = {};  
    if (isactif !== undefined) filter.isactif = isactif === 'true';  
      
    if (dateDebut && dateFin) {  
      filter.$or = [  
        { dtdebut: { $gte: new Date(dateDebut), $lte: new Date(dateFin) } },  
        { dtfin: { $gte: new Date(dateDebut), $lte: new Date(dateFin) } }  
      ];  
    }  
      
    const listePrix = await ListePrix.find(filter).sort({ dtdebut: -1 });  
      
    res.status(200).json({  
      success: true,  
      count: listePrix.length,  
      data: listePrix  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer une liste de prix par ID  
exports.getListePrixById = async (req, res) => {  
  try {  
    const listePrix = await ListePrix.findById(req.params.id);  
      
    if (!listePrix) {  
      return res.status(404).json({  
        success: false,  
        error: 'Liste de prix non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: listePrix  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer une nouvelle liste de prix  
exports.createListePrix = async (req, res) => {  
  try {  
    const listePrix = await ListePrix.create(req.body);  
      
    res.status(201).json({  
      success: true,  
      data: listePrix  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Cet ID de liste de prix existe déjà'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour une liste de prix  
exports.updateListePrix = async (req, res) => {  
  try {  
    const listePrix = await ListePrix.findByIdAndUpdate(  
      req.params.id,  
      req.body,  
      { new: true, runValidators: true }  
    );  
      
    if (!listePrix) {  
      return res.status(404).json({  
        success: false,  
        error: 'Liste de prix non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: listePrix  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer une liste de prix  
exports.deleteListePrix = async (req, res) => {  
  try {  
    const listePrix = await ListePrix.findByIdAndDelete(req.params.id);  
      
    if (!listePrix) {  
      return res.status(404).json({  
        success: false,  
        error: 'Liste de prix non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Liste de prix supprimée avec succès'  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};

// Ajouter un prix à une liste
exports.addPrixToListe = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const { product_id, UM_id, prix } = req.body;  
  
    const listePrix = await ListePrix.findByIdAndUpdate(  
      id,  
      { $push: { prix: { product_id, UM_id, prix } } },  
      { new: true, runValidators: true }  
    ).populate('prix.product_id', 'ref short_name')  
     .populate('prix.UM_id', 'unitemesure');  
  
    if (!listePrix) {  
      return res.status(404).json({  
        success: false,  
        error: 'Liste de prix non trouvée'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      data: listePrix  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  

// Mettre à jour un prix dans une liste
exports.updatePrixInListe = async (req, res) => {
  try {
    const { id, prixId } = req.params;
    const { product_id, UM_id, prix } = req.body;

    const listePrix = await ListePrix.findOneAndUpdate(
      { _id: id, 'prix._id': prixId },
      { 
        $set: { 
          'prix.$.product_id': product_id,
          'prix.$.UM_id': UM_id,
          'prix.$.prix': prix
        }
      },
      { new: true, runValidators: true }
    ).populate('prix.product_id', 'ref short_name')
     .populate('prix.UM_id', 'unitemesure');

    if (!listePrix) {
      return res.status(404).json({
        success: false,
        error: 'Liste de prix ou prix non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: listePrix
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Supprimer un prix d'une liste
exports.removePrixFromListe = async (req, res) => {
  try {
    const { id, prixId } = req.params;

    const listePrix = await ListePrix.findByIdAndUpdate(
      id,
      { $pull: { prix: { _id: prixId } } },
      { new: true, runValidators: true }
    ).populate('prix.product_id', 'ref short_name')
     .populate('prix.UM_id', 'unitemesure');

    if (!listePrix) {
      return res.status(404).json({
        success: false,
        error: 'Liste de prix non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: listePrix,
      message: 'Prix supprimé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
  
// Récupérer les prix d'une liste  
exports.getPrixByListe = async (req, res) => {  
  try {  
    const listePrix = await ListePrix.findById(req.params.id)  
      .populate('prix.product_id', 'ref short_name long_name')  
      .populate('prix.UM_id', 'unitemesure');  
  
    if (!listePrix) {  
      return res.status(404).json({  
        success: false,  
        error: 'Liste de prix non trouvée'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      data: listePrix.prix  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};

// Récupérer tous les prix des listes de prix actives  
exports.getActivePrices = async (req, res) => {  
  try {  
    const today = new Date();  
      
    // Trouver les listes de prix actives et valides  
    const activeListePrix = await ListePrix.find({  
      isactif: true,  
      $or: [  
        { dtdebut: { $lte: today }, dtfin: { $gte: today } },  
        { dtdebut: { $lte: today }, dtfin: null }  
      ]  
    }).populate('prix.product_id prix.UM_id');  
      
    // Extraire tous les prix  
    const allPrices = [];  
    activeListePrix.forEach(liste => {  
      if (liste.prix && liste.prix.length > 0) {  
        liste.prix.forEach(prix => {  
          allPrices.push({  
            product_id: prix.product_id._id,  
            UM_id: prix.UM_id,  
            prix: prix.prix,  
            listeprix_id: liste._id  
          });  
        });  
      }  
    });  
      
    res.status(200).json({  
      success: true,  
      count: allPrices.length,  
      data: allPrices  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};