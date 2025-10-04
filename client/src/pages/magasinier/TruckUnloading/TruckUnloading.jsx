import React, { useState, useEffect } from 'react'
import {
  MdLocalShipping as TruckIcon,
  MdInventory as Package,
  MdLocationOn as MapPin,
  MdPerson as User,
  MdWarning as AlertTriangle,
  MdCheckCircle as CheckCircle,
  MdCancel as XCircle,
  MdSave as Save,
  MdVisibility as Eye,
  MdHome as Home,
  MdWarehouse as Warehouse,
  MdAssignmentTurnedIn as ClipboardCheck,
} from 'react-icons/md'
import './TruckUnloading.css'
import depotService from '../../../services/depotService';
import stockLineService from '../../../services/stockLineService';
import stockDepotService from '../../../services/stockDepotService';
import productService from '../../../services/productService';
import umService from '../../../services/umService';
import truckService from '../../../services/truckService';
import truckLoadingService from '../../../services/truckLoadingService';


export default function TruckUnloadingPage() {
  // TOUS LES HOOKS EN PREMIER
  const [trucks, setTrucks] = useState([]);
  const [depots, setDepots] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [ums, setUms] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [loadingSession, setLoadingSession] = useState(null);
  const [unloadingSession, setUnloadingSession] = useState({
    id: '',
    truckId: '',
    depotId: '',
    routeSessionId: '',
    unloadingDate: new Date().toISOString().split("T")[0],
    startTime: new Date().toISOString(),
    status: "in-progress",
    unloadedBy: '',
    totalDiscrepancies: 0,
    products: [],
  });
  const [generalNotes, setGeneralNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Charger les camions
    truckService.getAllTrucks().then(data => {
      console.log('Trucks data:', data);
      const truckList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      // Mapper les données pour assurer la compatibilité
      const mappedTrucks = truckList.map(truck => ({
        ...truck,
        id: truck._id || truck.id,
        plateNumber: truck.matricule || truck.plateNumber,
        model: truck.modele || truck.model,
        capacity: truck.capacite || truck.capacity || { weight: 0, volume: 0 }
      }));
      setTrucks(mappedTrucks);
    }).catch(error => {
      console.error('Erreur chargement camions:', error);
      setTrucks([]);
    });
    
    // Charger les dépôts
    depotService.getAllDepots().then(data => {
      console.log('Depots data:', data);
      const depotList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      // Mapper les données pour assurer la compatibilité
      const mappedDepots = depotList.map(depot => ({
        ...depot,
        id: depot._id || depot.id,
        name: depot.short_name || depot.long_name || depot.name,
        code: depot.reference || depot.code,
        address: depot.address || 'Adresse non définie'
      }));
      setDepots(mappedDepots);
    }).catch(error => {
      console.error('Erreur chargement dépôts:', error);
      setDepots([]);
    });
    
    // Charger les produits
    productService.getAllProducts().then(data => {
      console.log('Products data:', data);
      const productList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      // Mapper les données pour assurer la compatibilité
      const mappedProducts = productList.map(product => ({
        ...product,
        id: product._id || product.id,
        name: product.short_name || product.long_name || product.name,
        code: product.ref || product.code,
        defaultUnit: 'kg',
        availableUnits: product.unites_mesure || ['kg', 'L', 'unité'],
        weightPerUnit: 1,
        volumePerUnit: 0.001
      }));
      setProductTypes(mappedProducts);
    }).catch(error => {
      console.error('Erreur chargement produits:', error);
      setProductTypes([]);
    });
    
    // Charger les unités
    umService.getAllUms().then(data => {
      console.log('Units data:', data);
      const umList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      // Mapper les données pour assurer la compatibilité
      const mappedUms = umList.map(um => ({
        ...um,
        id: um._id || um.id,
        name: um.unitemesure || um.name,
        code: um.unitemesure || um.code,
        value: um.unitemesure || um.value
      }));
      setUms(mappedUms);
    }).catch(error => {
      console.error('Erreur chargement unités:', error);
      setUms([]);
    });
  }, []);

  // Load products when truck is selected
  useEffect(() => {
    const loadTruckProducts = async () => {
      if (!selectedTruck) {
        setLoadingSession(null);
        setUnloadingSession(prev => ({ ...prev, products: [] }));
        return;
      }

      try {
        // Récupérer la session de chargement active pour ce camion
        const activeSession = await truckLoadingService.getActiveLoadingSessionByTruck(selectedTruck.id);
        
        if (activeSession?.data) {
          setLoadingSession(activeSession.data);
          
          // Mapper les produits chargés vers les produits à décharger
          const productsToUnload = activeSession.data.products.map(product => ({
            id: `unload-${product.product_id}-${Date.now()}`,
            productId: product.product_id,
            productName: product.product_name,
            productCode: product.product_code || 'N/A',
            unit: product.unit,
            quantityLoaded: product.quantity_loaded,
            quantityReturned: product.quantity_loaded, // Par défaut, on s'attend à tout retourner
            quantityUnloaded: 0,
            condition: 'good',
            notes: '',
            batchNumber: product.batch_number || null,
            expiryDate: product.expiry_date || null
          }));

          setUnloadingSession(prev => ({
            ...prev,
            truckId: selectedTruck.id,
            depotId: activeSession.data.depot_id,
            products: productsToUnload
          }));

          // Sélectionner automatiquement le dépôt de destination
          const depot = depots.find(d => d.id === activeSession.data.depot_id);
          setSelectedDepot(depot || null);
        } else {
          setLoadingSession(null);
          setUnloadingSession(prev => ({ ...prev, products: [] }));
          setErrors(['Aucune session de chargement active trouvée pour ce camion.']);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        setLoadingSession(null);
        setUnloadingSession(prev => ({ ...prev, products: [] }));
        setErrors(['Erreur lors du chargement des produits du camion.']);
      }
    };

    loadTruckProducts();
  }, [selectedTruck, depots]);

  // Calculate total discrepancies when products change
  useEffect(() => {
    const discrepancies = unloadingSession.products.reduce((total, product) => {
      const discrepancy = Math.abs(product.quantityReturned - product.quantityUnloaded)
      return total + discrepancy
    }, 0)

    setUnloadingSession((prev) => ({
      ...prev,
      totalDiscrepancies: discrepancies,
    }))
  }, [unloadingSession.products])

  // TOUTES LES FONCTIONS
  const updateProductUnloaded = (productId, quantityUnloaded) => {
    setUnloadingSession((prev) => ({
      ...prev,
      products: prev.products.map((product) => 
        product.id === productId ? { ...product, quantityUnloaded } : product
      ),
    }))
  }

  const updateProductCondition = (productId, condition) => {
    setUnloadingSession((prev) => ({
      ...prev,
      products: prev.products.map((product) => 
        product.id === productId ? { ...product, condition } : product
      ),
    }))
  }

  const updateProductNotes = (productId, notes) => {
    setUnloadingSession((prev) => ({
      ...prev,
      products: prev.products.map((product) => 
        product.id === productId ? { ...product, notes } : product
      ),
    }))
  }

  const getConditionColor = (condition) => {
    switch (condition) {
      case "good":
        return "tu-condition-good"
      case "damaged":
        return "tu-condition-damaged"
      case "expired":
        return "tu-condition-expired"
      default:
        return "tu-condition-default"
    }
  }

  const getConditionText = (condition) => {
    switch (condition) {
      case "good":
        return "Bon état"
      case "damaged":
        return "Endommagé"
      case "expired":
        return "Expiré"
      default:
        return condition
    }
  }

  const getConditionIcon = (condition) => {
    switch (condition) {
      case "good":
        return <CheckCircle className="tu-condition-icon" />
      case "damaged":
        return <XCircle className="tu-condition-icon" />
      case "expired":
        return <AlertTriangle className="tu-condition-icon" />
      default:
        return null
    }
  }

  const validateUnloading = () => {
    const validationErrors = []

    // Check if all products have been processed
    const unprocessedProducts = unloadingSession.products.filter((product) => product.quantityUnloaded === 0)
    if (unprocessedProducts.length > 0) {
      validationErrors.push("Certains produits n'ont pas encore été déchargés.")
    }

    // Check for major discrepancies
    const majorDiscrepancies = unloadingSession.products.filter((product) => {
      const discrepancy = Math.abs(product.quantityReturned - product.quantityUnloaded)
      return discrepancy > 0
    })

    if (majorDiscrepancies.length > 0) {
      validationErrors.push(
        `${majorDiscrepancies.length} produit(s) présentent des écarts entre les quantités attendues et déchargées.`,
      )
    }

    return validationErrors
  }

  const handleCompleteUnloading = async () => {
    const validationErrors = validateUnloading()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      // 1. Récupérer ou créer un inventaire pour ce dépôt - LOGIQUE SIMPLIFIÉE
      let stockDepotId = null;
      
      // Étape 1: Essayer de récupérer tous les inventaires
      try {
        console.log('Recherche d\'inventaires pour le dépôt:', selectedDepot.id);
        const allStockDepots = await stockDepotService.getAllStockDepots();
        console.log('Tous les inventaires récupérés:', allStockDepots);
        
        if (allStockDepots?.data && Array.isArray(allStockDepots.data)) {
          // Chercher un inventaire actif pour ce dépôt
          const existingDepot = allStockDepots.data.find(d => {
            const depotMatch = d.depot_id === selectedDepot.id || d.depot === selectedDepot.id;
            const isActive = d.archive === false || !d.archive;
            console.log(`Vérification inventaire ${d._id || d.id}: depot=${depotMatch}, active=${isActive}`);
            return depotMatch && isActive;
          });
          
          if (existingDepot) {
            stockDepotId = existingDepot._id || existingDepot.id;
            console.log('✅ Inventaire existant trouvé:', stockDepotId);
          }
        }
      } catch (error) {
        console.log('Erreur lors de la récupération des inventaires:', error);
      }
      
      // Étape 2: Si aucun inventaire trouvé, en créer un nouveau
      if (!stockDepotId) {
        try {
          console.log('Création d\'un nouvel inventaire pour le dépôt:', selectedDepot.id);
          const stockDepotPayload = {
            depot_id: selectedDepot.id,
            description: generalNotes || 'Inventaire créé lors du déchargement',
            archive: false
          };
          const stockDepotRes = await stockDepotService.createStockDepot(stockDepotPayload);
          stockDepotId = stockDepotRes?.data?._id || stockDepotRes?.data?.id || stockDepotRes?._id || stockDepotRes?.id;
          console.log('✅ Nouvel inventaire créé:', stockDepotId);
        } catch (createError) {
          console.log('Erreur lors de la création d\'inventaire:', createError);
          
          // Dernière tentative: re-chercher les inventaires au cas où un autre processus en aurait créé un
          try {
            const retryStockDepots = await stockDepotService.getAllStockDepots();
            const retryDepot = retryStockDepots?.data?.find(d => 
              (d.depot_id === selectedDepot.id || d.depot === selectedDepot.id) && 
              (d.archive === false || !d.archive)
            );
            if (retryDepot) {
              stockDepotId = retryDepot._id || retryDepot.id;
              console.log('✅ Inventaire trouvé lors de la nouvelle tentative:', stockDepotId);
            }
          } catch (retryError) {
            console.log('Erreur lors de la nouvelle tentative:', retryError);
          }
        }
      }
      
      // Vérification finale - Si toujours pas d'inventaire, utiliser l'inventaire de la session de chargement
      if (!stockDepotId && loadingSession?.stock_depot_id) {
        stockDepotId = loadingSession.stock_depot_id;
        console.log('✅ Utilisation de l\'inventaire de la session de chargement:', stockDepotId);
      }
      
      // Dernière tentative - créer un inventaire minimal
      if (!stockDepotId) {
        try {
          console.log('Création d\'un inventaire minimal pour le déchargement');
          const minimalStockDepot = {
            depot_id: selectedDepot.id,
            description: 'Inventaire créé automatiquement pour déchargement',
            archive: false,
            created_at: new Date()
          };
          const minimalRes = await stockDepotService.createStockDepot(minimalStockDepot);
          stockDepotId = minimalRes?.data?._id || minimalRes?.data?.id || minimalRes?._id || minimalRes?.id;
          console.log('✅ Inventaire minimal créé:', stockDepotId);
        } catch (minimalError) {
          console.error('❌ Impossible de créer un inventaire minimal:', minimalError);
        }
      }
      
      if (!stockDepotId) {
        console.error('❌ Aucun inventaire disponible après toutes les tentatives');
        throw new Error('Impossible de récupérer ou créer un inventaire pour ce dépôt. Le déchargement ne peut pas continuer.');
      }
      
      console.log('📦 Inventaire final utilisé:', stockDepotId);

      // 2. Pour chaque produit déchargé, mettre à jour/créer la ligne de stock
      for (const product of unloadingSession.products) {
        if (product.quantityUnloaded > 0) {
          // Récupérer l'ID produit réel
          let productId = product.productId;
          
          // Récupérer l'ID unité de mesure
          let umId = null;
          const allUms = await umService.getAllUms();
          if (allUms && Array.isArray(allUms.data)) {
            const matchUm = allUms.data.find(um => 
              um.code === product.unit || 
              um.name === product.unit || 
              um.unitemesure === product.unit
            );
            umId = matchUm?._id || matchUm?.id;
          }
          if (!umId) throw new Error(`Unité de mesure non trouvée pour ${product.unit}`);
          
          // Gestion robuste des lignes de stock
          try {
            console.log(`Traitement produit ${productId} avec UM ${umId}, quantité: ${product.quantityUnloaded}`);
            
            // Essayer de récupérer la ligne existante
            let stockLine = null;
            try {
              const stockLinesRes = await stockLineService.getStockLinesByDepot(stockDepotId);
              if (stockLinesRes && Array.isArray(stockLinesRes.data)) {
                stockLine = stockLinesRes.data.find(l => l.product_id === productId && l.um_id === umId);
                console.log('Ligne de stock existante trouvée:', stockLine ? 'Oui' : 'Non');
              }
            } catch (stockLineError) {
              console.log('Erreur récupération lignes de stock:', stockLineError);
              // Continuer sans ligne existante
            }
            
            const stockLinePayload = {
              stock_depot_id: stockDepotId,
              product_id: productId,
              um_id: umId,
              quantity: product.quantityUnloaded,
            };
            
            if (stockLine) {
              // Mettre à jour la quantité existante (ajouter la quantité déchargée)
              const newQuantity = (stockLine.quantity || 0) + product.quantityUnloaded;
              console.log(`Mise à jour ligne existante: ${stockLine.quantity || 0} + ${product.quantityUnloaded} = ${newQuantity}`);
              await stockLineService.updateStockLine(stockLine._id || stockLine.id, {
                ...stockLinePayload,
                quantity: newQuantity
              });
            } else {
              // Créer une nouvelle ligne de stock
              console.log('Création nouvelle ligne de stock:', stockLinePayload);
              await stockLineService.createStockLine(stockLinePayload);
            }
            console.log(`✅ Produit ${productId} traité avec succès`);
          } catch (productError) {
            console.error(`❌ Erreur traitement produit ${productId}:`, productError);
            // Continuer avec les autres produits au lieu d'échouer complètement
          }
        }
      }

      // 3. Marquer la session de chargement comme déchargée
      try {
        if (loadingSession) {
          console.log('Marquage de la session comme déchargée:', loadingSession._id || loadingSession.id);
          await truckLoadingService.completeUnloading(loadingSession._id || loadingSession.id);
          console.log('✅ Session marquée comme déchargée avec succès');
        }
      } catch (unloadError) {
        console.error('❌ Erreur lors du marquage de déchargement:', unloadError);
        // Ne pas faire échouer tout le processus pour cette erreur
      }

      setUnloadingSession((prev) => ({
        ...prev,
        status: "completed",
        endTime: new Date().toISOString(),
        generalNotes,
      }))
      setShowConfirmation(true)
      setErrors([])
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      setErrors([error?.response?.data?.error || error?.message || "Erreur lors de la finalisation du déchargement. Veuillez réessayer."])
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewInventory = () => {
    setShowPreview(true)
  }

  const closePreview = () => {
    setShowPreview(false)
  }

  const calculateTotalReturned = () => {
    return unloadingSession.products.reduce((total, product) => total + product.quantityReturned, 0)
  }

  const calculateTotalUnloaded = () => {
    return unloadingSession.products.reduce((total, product) => total + product.quantityUnloaded, 0)
  }

  // CONDITIONS DE RETOUR APRÈS TOUS LES HOOKS
  if (showConfirmation) {
    return (
      <div className="tu-layout">
        <div className="tu-wrapper">
          <div className="tu-confirmation-container">
            <div className="tu-confirmation-card">
              <div className="tu-confirmation-content">
                <div className="tu-confirmation-icon">
                  <CheckCircle className="tu-icon-large tu-text-green" />
                </div>
                <h3 className="tu-confirmation-title">Déchargement Terminé</h3>
                <p className="tu-confirmation-message">
                  Le déchargement du camion {selectedTruck.plateNumber} a été finalisé avec succès.
                </p>
                <div className="tu-confirmation-actions">
                  <button className="tu-btn tu-btn-primary">
                    <Eye className="tu-btn-icon" />
                    Voir l'Inventaire
                  </button>
                  <button className="tu-btn tu-btn-secondary">
                    <Home className="tu-btn-icon" />
                    Retour au Tableau de Bord
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className="tu-layout">
        <div className="tu-wrapper">
          <div className="tu-preview-overlay">
            <div className="tu-preview-modal">
              <div className="tu-preview-header">
                <h2 className="tu-preview-title">Aperçu Inventaire</h2>
                <button onClick={closePreview} className="tu-preview-close">×</button>
              </div>
              
              <div className="tu-preview-content">
                <div className="tu-preview-section">
                  <h3 className="tu-preview-section-title">Informations Générales</h3>
                  <div className="tu-preview-info">
                    <p><strong>Camion:</strong> {selectedTruck.plateNumber} - {selectedTruck.model}</p>
                    <p><strong>Dépôt:</strong> {selectedDepot.name} ({selectedDepot.code})</p>
                    <p><strong>Date:</strong> {unloadingSession.unloadingDate}</p>
                    <p><strong>Chauffeur:</strong> {selectedTruck.driverName}</p>
                  </div>
                </div>

                <div className="tu-preview-section">
                  <h3 className="tu-preview-section-title">Résumé du Déchargement</h3>
                  <div className="tu-preview-summary">
                    <p><strong>Produits à retourner:</strong> {calculateTotalReturned()}</p>
                    <p><strong>Produits déchargés:</strong> {calculateTotalUnloaded()}</p>
                    <p><strong>Écarts détectés:</strong> {unloadingSession.totalDiscrepancies}</p>
                  </div>
                </div>

                <div className="tu-preview-section">
                  <h3 className="tu-preview-section-title">Détail des Produits</h3>
                  <ul className="tu-preview-products">
                    {unloadingSession.products.map((product) => (
                      <li key={product.id} className="tu-preview-product-item">
                        <div className="tu-preview-product-main">
                          <strong>{product.productName}</strong> ({product.productCode})
                        </div>
                        <div className="tu-preview-product-details">
                          Chargé: {product.quantityLoaded} {product.unit} | 
                          À retourner: {product.quantityReturned} {product.unit} | 
                          Déchargé: {product.quantityUnloaded} {product.unit}
                        </div>
                        <div className="tu-preview-product-condition">
                          État: {getConditionText(product.condition)}
                        </div>
                        {product.notes && (
                          <div className="tu-preview-product-notes">
                            Notes: {product.notes}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tu-preview-section">
                  <h3 className="tu-preview-section-title">Notes Générales</h3>
                  <p className="tu-preview-notes">
                    {generalNotes || "Aucune note."}
                  </p>
                </div>
              </div>

              <div className="tu-preview-actions">
                <button onClick={closePreview} className="tu-btn tu-btn-secondary">
                  Fermer l'Aperçu
                </button>
                <button 
                  onClick={() => {
                    closePreview();
                    handleCompleteUnloading();
                  }}
                  disabled={loading}
                  className="tu-btn tu-btn-primary"
                >
                  Finaliser le Déchargement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Return principal
  return (
    <div className="tu-layout">
      
      <div className="tu-wrapper">
        <div className="tu-container">
          <div className="tu-content">
            {/* Header */}
            <div className="tu-header">
              <div className="tu-header-left">
                <div className="tu-title-section">
                  <Warehouse className="tu-title-icon" />
                  <h1 className="tu-title">Déchargement Dépôt</h1>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="tu-alert tu-alert-error">
                <AlertTriangle className="tu-alert-icon" />
                <div className="tu-alert-content">
                  <ul className="tu-error-list">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="tu-grid">
              {/* Left Column - Truck and Depot Info */}
              <div className="tu-left-column">
                {/* Truck Information */}
                <div className="tu-card">
                  <div className="tu-card-header">
                    <h3 className="tu-card-title">
                      <TruckIcon className="tu-card-icon" />
                      Informations Camion
                    </h3>
                  </div>
                  <div className="tu-card-content">
                    <div className="tu-info-section">
                      <div className="tu-info-item">
                        <label className="tu-info-label">Plaque d'immatriculation</label>
                        <select 
                          value={unloadingSession.truckId}
                          onChange={e => {
                            const truckId = e.target.value;
                            const truck = trucks.find(t => t.id === truckId);
                            setSelectedTruck(truck || null);
                            setUnloadingSession(prev => ({ ...prev, truckId }));
                            setErrors([]); // Clear any previous errors
                          }}
                          className="tu-select"
                        >
                          <option value="">Sélectionner un camion</option>
                          {trucks.map(truck => (
                            <option key={truck.id} value={truck.id}>
                              {truck.plateNumber} - {truck.model}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="tu-info-item">
                        <label className="tu-info-label">Modèle</label>
                        <p className="tu-info-value">{selectedTruck?.model}</p>
                      </div>
                      <div className="tu-info-item">
                        <label className="tu-info-label">Chauffeur</label>
                        <div className="tu-driver-info">
                          <User className="tu-driver-icon" />
                          <p className="tu-info-value">{selectedTruck?.driverName || ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Depot Information */}
                <div className="tu-card">
                  <div className="tu-card-header">
                    <h3 className="tu-card-title">
                      <MapPin className="tu-card-icon" />
                      Informations Dépôt
                    </h3>
                  </div>
                  <div className="tu-card-content">
                    <div className="tu-info-section">
                      <div className="tu-info-item">
                        <label className="tu-info-label">Nom du dépôt</label>
                        <select
                          value={unloadingSession.depotId}
                          onChange={e => {
                            const depotId = e.target.value;
                            setUnloadingSession(prev => ({ ...prev, depotId }));
                            const depot = depots.find(d => d.id === depotId);
                            setSelectedDepot(depot || null);
                          }}
                          className="tu-select"
                        >
                          <option value="">Sélectionner un dépôt</option>
                          {depots.map(depot => (
                            <option key={depot.id} value={depot.id}>
                              {depot.name} ({depot.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="tu-info-item">
                        <label className="tu-info-label">Adresse</label>
                        <p className="tu-depot-address">{selectedDepot?.address || ''}</p>
                      </div>
                      <div className="tu-info-item">
                        <label className="tu-info-label">Responsable</label>
                        <p className="tu-info-value">{selectedDepot?.managerName || ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="tu-card">
                  <div className="tu-card-header">
                    <h3 className="tu-card-title">
                      <ClipboardCheck className="tu-card-icon" />
                      Résumé
                    </h3>
                  </div>
                  <div className="tu-card-content">
                    <div className="tu-summary-section">
                      <div className="tu-summary-item">
                        <span className="tu-summary-label">Produits à retourner:</span>
                        <span className="tu-summary-value">{calculateTotalReturned()}</span>
                      </div>
                      <div className="tu-summary-item">
                        <span className="tu-summary-label">Produits déchargés:</span>
                        <span className="tu-summary-value tu-text-green">{calculateTotalUnloaded()}</span>
                      </div>
                      <div className="tu-summary-item">
                        <span className="tu-summary-label">Écarts détectés:</span>
                        <span className={`tu-summary-value ${
                          unloadingSession.totalDiscrepancies > 0 ? "tu-text-red" : "tu-text-green"
                        }`}>
                          {unloadingSession.totalDiscrepancies}
                        </span>
                      </div>
                    </div>

                    {unloadingSession.totalDiscrepancies > 0 && (
                      <div className="tu-alert tu-alert-warning">
                        <AlertTriangle className="tu-alert-icon" />
                        <div className="tu-alert-content">
                          Des écarts ont été détectés. Veuillez vérifier les quantités avant de finaliser.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Products */}
              <div className="tu-right-column">
                {/* Loading Session Info */}
                {loadingSession && (
                  <div className="tu-card">
                    <div className="tu-card-header">
                      <h3 className="tu-card-title">
                        <Package className="tu-card-icon" />
                        Session de Chargement
                      </h3>
                    </div>
                    <div className="tu-card-content">
                      <div className="tu-info-section">
                        <div className="tu-info-item">
                          <label className="tu-info-label">Date de chargement</label>
                          <p className="tu-info-value">{loadingSession.loading_date}</p>
                        </div>
                        <div className="tu-info-item">
                          <label className="tu-info-label">Dépôt de départ</label>
                          <p className="tu-info-value">{selectedDepot?.name} ({selectedDepot?.code})</p>
                        </div>
                        <div className="tu-info-item">
                          <label className="tu-info-label">Poids total chargé</label>
                          <p className="tu-info-value">{loadingSession.total_weight?.toFixed(1)} kg</p>
                        </div>
                        <div className="tu-info-item">
                          <label className="tu-info-label">Volume total chargé</label>
                          <p className="tu-info-value">{loadingSession.total_volume?.toFixed(2)} m³</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products List */}
                <div className="tu-card">
                  <div className="tu-card-header">
                    <div className="tu-card-title-with-badge">
                      <h3 className="tu-card-title">
                        <Package className="tu-card-icon" />
                        Produits à Décharger
                      </h3>
                      <span className="tu-badge">{unloadingSession.products.length} produits</span>
                    </div>
                  </div>
                  <div className="tu-card-content">
                    {unloadingSession.products.length === 0 ? (
                      <div className="tu-empty-state">
                        <Package className="tu-empty-icon" />
                        <h3 className="tu-empty-title">Aucun produit à décharger</h3>
                        <p className="tu-empty-message">
                          {selectedTruck 
                            ? "Aucune session de chargement active trouvée pour ce camion."
                            : "Sélectionnez un camion pour voir les produits chargés."
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="tu-products-list">
                        {unloadingSession.products.map((product) => (
                        <div key={product.id} className="tu-product-item">
                          <div className="tu-product-header">
                            <div className="tu-product-info">
                              <h4 className="tu-product-name">{product.productName}</h4>
                              <p className="tu-product-code">Code: {product.productCode}</p>
                              {product.batchNumber && (
                                <p className="tu-product-batch">Lot: {product.batchNumber}</p>
                              )}
                            </div>
                            <div className={`tu-condition-badge ${getConditionColor(product.condition)}`}>
                              {getConditionIcon(product.condition)}
                              <span className="tu-condition-text">{getConditionText(product.condition)}</span>
                            </div>
                          </div>

                          <div className="tu-product-quantities">
                            <div className="tu-quantity-item">
                              <label className="tu-quantity-label">Quantité chargée</label>
                              <p className="tu-quantity-value">
                                {product.quantityLoaded} {product.unit}
                              </p>
                            </div>
                            <div className="tu-quantity-item">
                              <label className="tu-quantity-label">Quantité à retourner</label>
                              <p className="tu-quantity-value tu-text-blue">
                                {product.quantityReturned} {product.unit}
                              </p>
                            </div>
                            <div className="tu-quantity-item">
                              <label htmlFor={`unloaded-${product.id}`} className="tu-quantity-label">
                                Quantité déchargée
                              </label>
                              <input
                                id={`unloaded-${product.id}`}
                                type="number"
                                min="0"
                                max={product.quantityReturned}
                                value={product.quantityUnloaded}
                                onChange={(e) => updateProductUnloaded(product.id, parseInt(e.target.value) || 0)}
                                className="tu-input tu-quantity-input"
                                placeholder="Entrez la quantité"
                              />
                            </div>
                          </div>

                          <div className="tu-product-details">
                            <div className="tu-detail-item">
                              <label className="tu-detail-label">État du produit</label>
                              <select
                                value={product.condition}
                                onChange={(e) => updateProductCondition(product.id, e.target.value)}
                                className="tu-select"
                              >
                                <option value="good">Bon état</option>
                                <option value="damaged">Endommagé</option>
                                <option value="expired">Expiré</option>
                              </select>
                            </div>
                            {product.expiryDate && (
                              <div className="tu-detail-item">
                                <label className="tu-detail-label">Date d'expiration</label>
                                <p className="tu-expiry-date">{product.expiryDate}</p>
                              </div>
                            )}
                          </div>

                          <div className="tu-product-notes-section">
                            <label htmlFor={`notes-${product.id}`} className="tu-notes-label">
                              Notes (optionnel)
                            </label>
                            <textarea
                              id={`notes-${product.id}`}
                              value={product.notes || ""}
                              onChange={(e) => updateProductNotes(product.id, e.target.value)}
                              placeholder="Observations sur l'état du produit, dommages, etc..."
                              rows={2}
                              className="tu-textarea"
                            />
                          </div>

                          {/* Discrepancy Alert */}
                          {Math.abs(product.quantityReturned - product.quantityUnloaded) > 0 &&
                            product.quantityUnloaded > 0 && (
                              <div className="tu-alert tu-alert-warning tu-discrepancy-alert">
                                <AlertTriangle className="tu-alert-icon" />
                                <div className="tu-alert-content">
                                  Écart détecté: {Math.abs(product.quantityReturned - product.quantityUnloaded)}{" "}
                                  {product.unit}{" "}
                                  {product.quantityUnloaded > product.quantityReturned ? "en excès" : "manquant"}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* General Notes and Actions */}
                <div className="tu-card">
                  <div className="tu-card-header">
                    <h3 className="tu-card-title">Notes Générales et Finalisation</h3>
                  </div>
                  <div className="tu-card-content">
                    <div className="tu-form-group">
                      <label htmlFor="general-notes" className="tu-label">Observations générales</label>
                      <textarea
                        id="general-notes"
                        value={generalNotes}
                        onChange={(e) => setGeneralNotes(e.target.value)}
                        placeholder="Notes sur le déchargement, problèmes rencontrés, état général des produits..."
                        rows={4}
                        className="tu-textarea"
                      />
                    </div>

                    <div className="tu-separator" />

                    <div className="tu-action-buttons">
                      <button
                        onClick={handleCompleteUnloading}
                        disabled={loading}
                        className="tu-btn tu-btn-primary tu-btn-large"
                      >
                        {loading ? (
                          <>
                            <div className="tu-spinner" />
                            Finalisation...
                          </>
                        ) : (
                          <>
                            <Save className="tu-btn-icon" />
                            Finaliser le Déchargement
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePreviewInventory}
                        className="tu-btn tu-btn-secondary tu-btn-large"
                      >
                        <Eye className="tu-btn-icon" />
                        Aperçu Inventaire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}