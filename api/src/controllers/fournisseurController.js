const Fournisseur = require('../models/Fournisseur');  
const AdresseFournisseur = require('../models/AdresseFournisseur');  
const City = require('../models/City');  
  
// Créer un nouveau fournisseur avec adresses  
exports.createFournisseur = async (req, res) => {  
  try {  
    const { code, nom, ice, rc, ville_rc, email, adresses } = req.body;  
      
    const fournisseur = new Fournisseur({  
      code,  
      nom,  
      ice,  
      rc,  
      ville_rc, 
      email  
    });  
  
    const savedFournisseur = await fournisseur.save();  
  
    // Créer les adresses si fournies  
    if (adresses && adresses.length > 0) {  
      const adressesPromises = adresses.map(async (addr) => {  
        // Vérifier que la ville existe  
        const city = await City.findById(addr.ville_id);  
        if (!city) {  
          throw new Error(`Ville non trouvée pour l'ID: ${addr.ville_id}`);  
        }  
  
        const adresseFournisseur = new AdresseFournisseur({  
          fournisseur_id: savedFournisseur._id,  
          adresse: addr.adresse,  
          ville_id: addr.ville_id,  
          code_postal: addr.code_postal,  
          type_adresse: addr.type_adresse || 'SIÈGE SOCIAL',  
          is_principal: addr.is_principal || false  
        });  
        return await adresseFournisseur.save();  
      });  
  
      await Promise.all(adressesPromises);  
    }  
  
    // Récupérer le fournisseur avec ses adresses  
    const fournisseurWithAddresses = await Fournisseur.findById(savedFournisseur._id);  
    const adressesFournisseur = await AdresseFournisseur.find({   
      fournisseur_id: savedFournisseur._id,   
      actif: true   
    }).populate('ville_id', 'name code');  
  
    res.status(201).json({   
      success: true,   
      data: {  
        ...fournisseurWithAddresses.toObject(),  
        adresses: adressesFournisseur  
      }  
    });  
  } catch (error) {  
    res.status(400).json({ success: false, error: error.message });  
  }  
};  
  
// Récupérer tous les fournisseurs avec leurs adresses  
exports.getAllFournisseurs = async (req, res) => {  
  try {  
    const fournisseurs = await Fournisseur.find({ actif: true }).sort({ nom: 1 });  
      
    // Récupérer les adresses pour chaque fournisseur  
    const fournisseursWithAddresses = await Promise.all(  
      fournisseurs.map(async (fournisseur) => {  
        const adresses = await AdresseFournisseur.find({   
          fournisseur_id: fournisseur._id,   
          actif: true   
        }).populate('ville_id', 'name code');  
          
        return {  
          ...fournisseur.toObject(),  
          adresses  
        };  
      })  
    );  
  
    res.json({ success: true, data: fournisseursWithAddresses });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};  
  
// Récupérer un fournisseur par ID avec ses adresses  
exports.getFournisseurById = async (req, res) => {  
  try {  
    const fournisseur = await Fournisseur.findById(req.params.id);  
      
    if (!fournisseur) {  
      return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });  
    }  
  
    const adresses = await AdresseFournisseur.find({   
      fournisseur_id: fournisseur._id,   
      actif: true   
    }).populate('ville_id', 'name code');  
      
    res.json({   
      success: true,   
      data: {  
        ...fournisseur.toObject(),  
        adresses  
      }  
    });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};  
  
// Modifier un fournisseur  
exports.updateFournisseur = async (req, res) => {  
  try {  
    const { adresses, ...fournisseurData } = req.body;  
      
    const fournisseur = await Fournisseur.findByIdAndUpdate(  
      req.params.id,  
      fournisseurData,  
      { new: true, runValidators: true }  
    );  
      
    if (!fournisseur) {  
      return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });  
    }  
  
    // Mettre à jour les adresses si fournies  
    if (adresses) {  
      // Désactiver les anciennes adresses  
      await AdresseFournisseur.updateMany(  
        { fournisseur_id: req.params.id },  
        { actif: false }  
      );  
  
      // Créer les nouvelles adresses  
      if (adresses.length > 0) {  
        const adressesPromises = adresses.map(async (addr) => {  
          const city = await City.findById(addr.ville_id);  
          if (!city) {  
            throw new Error(`Ville non trouvée pour l'ID: ${addr.ville_id}`);  
          }  
  
          const adresseFournisseur = new AdresseFournisseur({  
            fournisseur_id: req.params.id,  
            adresse: addr.adresse,  
            ville_id: addr.ville_id,  
            code_postal: addr.code_postal,  
            type_adresse: addr.type_adresse || 'SIÈGE SOCIAL',  
            is_principal: addr.is_principal || false  
          });  
          return await adresseFournisseur.save();  
        });  
  
        await Promise.all(adressesPromises);  
      }  
    }  
  
    // Récupérer le fournisseur mis à jour avec ses adresses  
    const adressesFournisseur = await AdresseFournisseur.find({   
      fournisseur_id: req.params.id,   
      actif: true   
    }).populate('ville_id', 'name code');  
  
    res.json({   
      success: true,   
      data: {  
        ...fournisseur.toObject(),  
        adresses: adressesFournisseur  
      }  
    });  
  } catch (error) {  
    res.status(400).json({ success: false, error: error.message });  
  }  
};  
  
// Supprimer un fournisseur (soft delete)  
exports.deleteFournisseur = async (req, res) => {  
  try {  
    const fournisseur = await Fournisseur.findByIdAndUpdate(  
      req.params.id,  
      { actif: false },  
      { new: true }  
    );  
      
    if (!fournisseur) {  
      return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });  
    }  
  
    // Désactiver aussi les adresses  
    await AdresseFournisseur.updateMany(  
      { fournisseur_id: req.params.id },  
      { actif: false }  
    );  
      
    res.json({ success: true, message: 'Fournisseur supprimé avec succès' });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};  
  
// Ajouter une adresse à un fournisseur  
exports.addAdresseFournisseur = async (req, res) => {  
  try {  
    const { fournisseur_id } = req.params;  
    const { adresse, ville_id, code_postal, type_adresse, is_principal } = req.body;  
  
    // Vérifier que le fournisseur existe  
    const fournisseur = await Fournisseur.findById(fournisseur_id);  
    if (!fournisseur) {  
      return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });  
    }  
  
    // Vérifier que la ville existe  
    const city = await City.findById(ville_id);  
    if (!city) {  
      return res.status(400).json({ success: false, error: 'Ville non trouvée' });  
    }  
  
    const adresseFournisseur = new AdresseFournisseur({  
      fournisseur_id,  
      adresse,  
      ville_id,  
      code_postal,  
      type_adresse: type_adresse || 'SIÈGE SOCIAL',  
      is_principal: is_principal || false  
    });  
  
    const savedAdresse = await adresseFournisseur.save();  
    const populatedAdresse = await AdresseFournisseur.findById(savedAdresse._id)  
      .populate('ville_id', 'name code');  
  
    res.status(201).json({ success: true, data: populatedAdresse });  
  } catch (error) {  
    res.status(400).json({ success: false, error: error.message });  
  }  
};  
  
// Récupérer les adresses d'un fournisseur  
exports.getAdressesFournisseur = async (req, res) => {  
  try {  
    const { fournisseur_id } = req.params;  
      
    const adresses = await AdresseFournisseur.find({   
      fournisseur_id,   
      actif: true   
    }).populate('ville_id', 'name code');  
  
    res.json({ success: true, data: adresses });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};

// Modifier une adresse d'un fournisseur  
exports.updateAdresseFournisseur = async (req, res) => {  
  try {  
    const { fournisseur_id, adresse_id } = req.params;  
    const { adresse, ville_id, code_postal, type_adresse, is_principal } = req.body;  
  
    // Vérifier que le fournisseur existe  
    const fournisseur = await Fournisseur.findById(fournisseur_id);  
    if (!fournisseur) {  
      return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });  
    }  
  
    // Vérifier que l'adresse existe et appartient au fournisseur  
    const existingAddress = await AdresseFournisseur.findOne({  
      _id: adresse_id,  
      fournisseur_id: fournisseur_id,  
      actif: true  
    });  
  
    if (!existingAddress) {  
      return res.status(404).json({ success: false, error: 'Adresse non trouvée' });  
    }  
  
    // Vérifier que la ville existe si fournie  
    if (ville_id) {  
      const city = await City.findById(ville_id);  
      if (!city) {  
        return res.status(400).json({ success: false, error: 'Ville non trouvée' });  
      }  
    }  
  
    // Si cette adresse devient principale, désactiver les autres adresses principales  
    if (is_principal) {  
      await AdresseFournisseur.updateMany(  
        {   
          fournisseur_id: fournisseur_id,   
          _id: { $ne: adresse_id },  
          actif: true   
        },  
        { is_principal: false }  
      );  
    }  
  
    // Mettre à jour l'adresse  
    const updatedAddress = await AdresseFournisseur.findByIdAndUpdate(  
      adresse_id,  
      {  
        adresse: adresse || existingAddress.adresse,  
        ville_id: ville_id || existingAddress.ville_id,  
        code_postal: code_postal || existingAddress.code_postal,  
        type_adresse: type_adresse || existingAddress.type_adresse,  
        is_principal: is_principal !== undefined ? is_principal : existingAddress.is_principal  
      },  
      { new: true, runValidators: true }  
    ).populate('ville_id', 'name code');  
  
    res.json({ success: true, data: updatedAddress });  
  } catch (error) {  
    res.status(400).json({ success: false, error: error.message });  
  }  
};

// Supprimer une adresse d'un fournisseur (soft delete)  
exports.deleteAdresseFournisseur = async (req, res) => {  
  try {  
    const { fournisseur_id, adresse_id } = req.params;  
  
    // Vérifier que le fournisseur existe  
    const fournisseur = await Fournisseur.findById(fournisseur_id);  
    if (!fournisseur) {  
      return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });  
    }  
  
    // Vérifier que l'adresse existe et appartient au fournisseur  
    const existingAddress = await AdresseFournisseur.findOne({  
      _id: adresse_id,  
      fournisseur_id: fournisseur_id,  
      actif: true  
    });  
  
    if (!existingAddress) {  
      return res.status(404).json({ success: false, error: 'Adresse non trouvée' });  
    }  
  
    // Vérifier qu'il reste au moins une autre adresse active  
    const activeAddressesCount = await AdresseFournisseur.countDocuments({  
      fournisseur_id: fournisseur_id,  
      actif: true  
    });  
  
    if (activeAddressesCount <= 1) {  
      return res.status(400).json({   
        success: false,   
        error: 'Impossible de supprimer la dernière adresse du fournisseur'   
      });  
    }  
  
    // Effectuer le soft delete  
    const deletedAddress = await AdresseFournisseur.findByIdAndUpdate(  
      adresse_id,  
      { actif: false },  
      { new: true }  
    );  
  
    // Si l'adresse supprimée était principale, assigner une nouvelle adresse principale  
    if (existingAddress.is_principal) {  
      const firstActiveAddress = await AdresseFournisseur.findOne({  
        fournisseur_id: fournisseur_id,  
        actif: true,  
        _id: { $ne: adresse_id }  
      });  
  
      if (firstActiveAddress) {  
        await AdresseFournisseur.findByIdAndUpdate(  
          firstActiveAddress._id,  
          { is_principal: true }  
        );  
      }  
    }  
  
    res.json({ success: true, message: 'Adresse supprimée avec succès' });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};