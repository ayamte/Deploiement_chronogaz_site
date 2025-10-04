import React, { useState, useEffect } from 'react'
import {
  MdLocalShipping as TruckIcon,
  MdAdd as Plus,
  MdDelete as Trash2,
  MdCheckCircle as CheckCircle,
  MdWarning as AlertTriangle,
  MdLocationOn as MapPin,
  MdAssignment as ClipboardList,
  MdSave as Save,
  MdInventory as Package
} from 'react-icons/md'
import './TruckLoading.css'
import depotService from '../../../services/depotService';
import truckService from '../../../services/truckService';
import stockLineService from '../../../services/stockLineService';
import stockDepotService from '../../../services/stockDepotService';
import productService from '../../../services/productService';
import umService from '../../../services/umService';
import truckLoadingService from '../../../services/truckLoadingService';


const mockUser = {
  id: "user-001",
  name: "Jean Dupont",
  role: "chauffeur",
}

export default function TruckLoadingPage() {
  // TOUS LES HOOKS DOIVENT ÊTRE DÉCLARÉS EN PREMIER
  const [trucks, setTrucks] = useState([]);
  const [depots, setDepots] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [ums, setUms] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [loadingSession, setLoadingSession] = useState({
    id: "",
    truckId: "",
    depotId: "",
    chauffeurId: mockUser.id,
    loadingDate: new Date().toISOString().split("T")[0],
    status: "in-progress",
    products: [],
    totalWeight: 0,
    totalVolume: 0,
  });
  const [newProduct, setNewProduct] = useState({
    productTypeId: "",
    unit: "",
    quantity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // DÉPLACÉ ICI

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les unités en premier
        const umsData = await umService.getAllUms();
        console.log('Units data:', umsData);
        const umList = Array.isArray(umsData?.data) ? umsData.data : Array.isArray(umsData) ? umsData : [];
        const mappedUms = umList.map(um => ({
          ...um,
          id: um._id || um.id,
          name: um.unitemesure || um.name,
          code: um.unitemesure || um.code,
          value: um.unitemesure || um.value
        }));
        setUms(mappedUms);

        // Charger les camions
        const trucksData = await truckService.getAllTrucks();
        console.log('Trucks data:', trucksData);
        const truckList = Array.isArray(trucksData?.data) ? trucksData.data : Array.isArray(trucksData) ? trucksData : [];
        const mappedTrucks = truckList.map(truck => ({
          ...truck,
          id: truck._id || truck.id,
          plateNumber: truck.matricule || truck.plateNumber,
          model: truck.modele || truck.model,
          capacity: truck.capacite || truck.capacity || { weight: 0, volume: 0 }
        }));
        setTrucks(mappedTrucks);
        
        // Charger les dépôts
        const depotsData = await depotService.getAllDepots();
        console.log('Depots data:', depotsData);
        const depotList = Array.isArray(depotsData?.data) ? depotsData.data : Array.isArray(depotsData) ? depotsData : [];
        const mappedDepots = depotList.map(depot => ({
          ...depot,
          id: depot._id || depot.id,
          name: depot.short_name || depot.long_name || depot.name,
          code: depot.reference || depot.code,
          address: depot.address || 'Adresse non définie'
        }));
        setDepots(mappedDepots);
        
        // Charger les produits après avoir chargé les UMs
        const productsData = await productService.getAllProducts();
        console.log('Products data:', productsData);
        const productList = Array.isArray(productsData?.data) ? productsData.data : Array.isArray(productsData) ? productsData : [];
        const mappedProducts = productList.map(product => {
          // Extraire les noms des unités de mesure depuis les objets UM
          let availableUnits = ['kg', 'L', 'unité']; // valeurs par défaut
          if (product.unites_mesure && Array.isArray(product.unites_mesure)) {
            const unitNames = product.unites_mesure.map(unite => {
              // Chercher l'UM correspondant dans la liste des UMs
              const umDetails = mappedUms.find(um => um.id === unite.UM_id || um._id === unite.UM_id);
              return umDetails ? (umDetails.name || umDetails.unitemesure || umDetails.code) : null;
            }).filter(Boolean);
            
            if (unitNames.length > 0) {
              availableUnits = unitNames;
            }
          }
          
          return {
            ...product,
            id: product._id || product.id,
            name: product.short_name || product.long_name || product.name,
            code: product.ref || product.code,
            defaultUnit: availableUnits[0] || 'kg',
            availableUnits: availableUnits,
            weightPerUnit: 1,
            volumePerUnit: 0.001
          };
        });
        setProductTypes(mappedProducts);
        
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setTrucks([]);
        setDepots([]);
        setProductTypes([]);
        setUms([]);
      }
    };

    loadData();
  }, []);

  // Calculate totals when products change
  useEffect(() => {
    const totals = loadingSession.products.reduce(
      (acc, product) => {
        const productType = productTypes.find((p) => p.id === product.productTypeId)
        if (productType) {
          const weight = (productType.weightPerUnit || 0) * product.quantity
          const volume = (productType.volumePerUnit || 0) * product.quantity
          acc.weight += weight
          acc.volume += volume
        }
        return acc
      },
      { weight: 0, volume: 0 },
    )

    setLoadingSession((prev) => ({
      ...prev,
      totalWeight: totals.weight,
      totalVolume: totals.volume,
    }))
  }, [loadingSession.products])

  // TOUTES LES FONCTIONS APRÈS LES HOOKS
  const handleTruckChange = (truckId) => {
    const truck = trucks.find((t) => t.id === truckId)
    setSelectedTruck(truck || null)
    setLoadingSession((prev) => ({ ...prev, truckId }))
  }

  const handleDepotChange = (depotId) => {
    const depot = depots.find((d) => d.id === depotId)
    setSelectedDepot(depot || null)
    setLoadingSession((prev) => ({ ...prev, depotId }))
  }

  const handleProductTypeChange = (productTypeId) => {
    const productType = productTypes.find((p) => p.id === productTypeId)
    if (productType) {
      setNewProduct({
        productTypeId,
        productName: productType.name,
        unit: productType.defaultUnit,
        quantity: 0,
      })
    }
  }

  const addProduct = () => {
    if (!newProduct.productTypeId || !newProduct.quantity || newProduct.quantity <= 0) {
      setErrors(["Veuillez sélectionner un produit et saisir une quantité valide."])
      return
    }

    const productType = productTypes.find((p) => p.id === newProduct.productTypeId)
    if (!productType) return

    const product = {
      id: `loaded-${Date.now()}`,
      productTypeId: newProduct.productTypeId,
      productName: productType.name,
      unit: newProduct.unit || productType.defaultUnit,
      quantity: newProduct.quantity,
      totalWeight: (productType.weightPerUnit || 0) * newProduct.quantity,
      totalVolume: (productType.volumePerUnit || 0) * newProduct.quantity,
      notes: newProduct.notes,
    }

    setLoadingSession((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }))

    // Reset form
    setNewProduct({
      productTypeId: "",
      unit: "",
      quantity: 0,
    })
    setErrors([])
  }

  const removeProduct = (productId) => {
    setLoadingSession((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }))
  }

  const updateProductQuantity = (productId, quantity) => {
    setLoadingSession((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === productId) {
          const productType = productTypes.find((pt) => pt.id === p.productTypeId)
          return {
            ...p,
            quantity,
            totalWeight: (productType?.weightPerUnit || 0) * quantity,
            totalVolume: (productType?.volumePerUnit || 0) * quantity,
          }
        }
        return p
      }),
    }))
  }

  const validateLoading = () => {
    const validationErrors = []

    if (!loadingSession.truckId) {
      validationErrors.push("Veuillez sélectionner un camion.")
    }

    if (!loadingSession.depotId) {
      validationErrors.push("Veuillez sélectionner un dépôt.")
    }

    if (loadingSession.products.length === 0) {
      validationErrors.push("Veuillez ajouter au moins un produit.")
    }

    if (selectedTruck) {
      if (loadingSession.totalWeight > selectedTruck.capacity.weight) {
        validationErrors.push(
          `Le poids total (${loadingSession.totalWeight.toFixed(1)}kg) dépasse la capacité du camion (${selectedTruck.capacity.weight}kg).`,
        )
      }

      if (loadingSession.totalVolume > selectedTruck.capacity.volume) {
        validationErrors.push(
          `Le volume total (${loadingSession.totalVolume.toFixed(1)}m³) dépasse la capacité du camion (${selectedTruck.capacity.volume}m³).`,
        )
      }
    }

    return validationErrors
  }

  const getCapacityUsageColor = (used, capacity) => {
    const percentage = (used / capacity) * 100
    if (percentage > 90) return "tl-text-red"
    if (percentage > 75) return "tl-text-orange"
    return "tl-text-green"
  }

  const handleSaveLoading = async () => {
    const validationErrors = validateLoading()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      let stockDepotId = null;
      
      // 1. Vérifier s'il existe déjà un inventaire actif pour ce dépôt
      try {
        const existingStockDepots = await stockDepotService.getAllStockDepots({ 
          depot: loadingSession.depotId, 
          archive: false 
        });
        
        if (existingStockDepots?.data && existingStockDepots.data.length > 0) {
          // Utiliser l'inventaire existant
          stockDepotId = existingStockDepots.data[0]._id || existingStockDepots.data[0].id;
          console.log('Utilisation de l\'inventaire existant:', stockDepotId);
        }
      } catch (error) {
        console.log('Aucun inventaire existant trouvé, création d\'un nouveau');
      }
      
      // 2. Si aucun inventaire actif n'existe, en créer un nouveau
      if (!stockDepotId) {
        const stockDepotPayload = {
          depot_id: loadingSession.depotId,
          description: loadingSession.notes || '',
        };
        const stockDepotRes = await stockDepotService.createStockDepot(stockDepotPayload);
        stockDepotId = stockDepotRes?.data?._id || stockDepotRes?.data?.id || stockDepotRes?._id || stockDepotRes?.id;
      }
      
      if (!stockDepotId) throw new Error('ID inventaire non récupéré');

      // 3. Créer une session de chargement pour le camion
      const loadingSessionPayload = {
        truck_id: loadingSession.truckId,
        depot_id: loadingSession.depotId,
        chauffeur_id: loadingSession.chauffeurId,
        loading_date: loadingSession.loadingDate,
        status: "completed",
        products: loadingSession.products.map(product => ({
          product_id: product.productTypeId,
          product_name: product.productName,
          unit: product.unit,
          quantity_loaded: product.quantity,
          total_weight: product.totalWeight,
          total_volume: product.totalVolume,
          notes: product.notes
        })),
        total_weight: loadingSession.totalWeight,
        total_volume: loadingSession.totalVolume,
        notes: loadingSession.notes,
        stock_depot_id: stockDepotId
      };
      
      const loadingSessionRes = await truckLoadingService.createLoadingSession(loadingSessionPayload);
      console.log('Session de chargement créée:', loadingSessionRes);

      // 4. Pour chaque produit, créer une ligne de stock
      for (const product of loadingSession.products) {
        // Récupérer l'ID produit réel
        let productId = product.productTypeId;
        
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
        
        const stockLinePayload = {
          stock_depot_id: stockDepotId,
          product_id: productId,
          um_id: umId,
          quantity: product.quantity,
        };
        await stockLineService.createStockLine(stockLinePayload);
      }
      
      setLoadingSession((prev) => ({
        ...prev,
        status: "completed",
        completedAt: new Date().toISOString(),
        sessionId: loadingSessionRes?.data?._id || loadingSessionRes?.data?.id
      }))
      setShowConfirmation(true)
      setErrors([])
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors([error?.response?.data?.error || error?.message || "Erreur lors de la sauvegarde. Veuillez réessayer."])
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewList = () => {
    setShowPreview(true)
  }

  const closePreview = () => {
    setShowPreview(false)
  }

  // CONDITIONS DE RETOUR APRÈS TOUS LES HOOKS
  if (showConfirmation) {
    return (
      <div className="tl-layout">
        <div className="tl-wrapper">
          <div className="tl-confirmation-container">
            <div className="tl-confirmation-card">
              <div className="tl-confirmation-content">
                <div className="tl-confirmation-icon">
                  <CheckCircle className="tl-icon-large tl-text-green" />
                </div>
                <h3 className="tl-confirmation-title">Chargement Confirmé</h3>
                <p className="tl-confirmation-message">
                  Le chargement du camion {selectedTruck?.plateNumber} a été enregistré avec succès.
                </p>
                <div className="tl-confirmation-actions">
                  <button className="tl-btn tl-btn-primary">Voir ma tournée</button>
                  <button 
                    className="tl-btn tl-btn-secondary" 
                    onClick={() => setShowConfirmation(false)}
                  >
                    Nouveau chargement
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
      <div className="tl-layout">
        <div className="tl-wrapper">
          <div className="tl-preview-overlay">
            <div className="tl-preview-modal">
              <div className="tl-preview-header">
                <h2 className="tl-preview-title">Aperçu du Chargement</h2>
                <button onClick={closePreview} className="tl-preview-close">
                  ×
                </button>
              </div>
              
              <div className="tl-preview-content">
                <div className="tl-preview-section">
                  <h3 className="tl-preview-section-title">Informations Générales</h3>
                  <div className="tl-preview-info">
                    <p><strong>Camion:</strong> {selectedTruck?.plateNumber} - {selectedTruck?.model}</p>
                    <p><strong>Dépôt:</strong> {selectedDepot?.name} ({selectedDepot?.code})</p>
                    <p><strong>Date:</strong> {loadingSession.loadingDate}</p>
                  </div>
                </div>

                <div className="tl-preview-section">
                  <h3 className="tl-preview-section-title">Produits Chargés ({loadingSession.products.length})</h3>
                  {loadingSession.products.length > 0 ? (
                    <ul className="tl-preview-products">
                      {loadingSession.products.map((product) => (
                        <li key={product.id} className="tl-preview-product-item">
                          <div className="tl-preview-product-main">
                            <strong>{product.productName}</strong> - {product.quantity} {product.unit}
                          </div>
                          <div className="tl-preview-product-details">
                            Poids: {product.totalWeight?.toFixed(1)}kg, Volume: {product.totalVolume?.toFixed(2)}m³
                          </div>
                          {product.notes && (
                            <div className="tl-preview-product-notes">
                              Notes: {product.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="tl-preview-empty">Aucun produit chargé</p>
                  )}
                </div>
                {selectedTruck && (
                  <div className="tl-preview-section">
                    <h3 className="tl-preview-section-title">Résumé des Capacités</h3>
                    <div className="tl-preview-capacity">
                      <p>
                        <strong>Poids total:</strong> {loadingSession.totalWeight.toFixed(1)}kg / {selectedTruck.capacity.weight}kg
                        <span className={`tl-preview-status ${getCapacityUsageColor(loadingSession.totalWeight, selectedTruck.capacity.weight)}`}>
                          ({((loadingSession.totalWeight / selectedTruck.capacity.weight) * 100).toFixed(1)}%)
                        </span>
                      </p>
                      <p>
                        <strong>Volume total:</strong> {loadingSession.totalVolume.toFixed(1)}m³ / {selectedTruck.capacity.volume}m³
                        <span className={`tl-preview-status ${getCapacityUsageColor(loadingSession.totalVolume, selectedTruck.capacity.volume)}`}>
                          ({((loadingSession.totalVolume / selectedTruck.capacity.volume) * 100).toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="tl-preview-section">
                  <h3 className="tl-preview-section-title">Notes Générales</h3>
                  <p className="tl-preview-notes">
                    {loadingSession.notes || "Aucune note."}
                  </p>
                </div>
              </div>

              <div className="tl-preview-actions">
                <button onClick={closePreview} className="tl-btn tl-btn-secondary">
                  Fermer l'Aperçu
                </button>
                <button 
                  onClick={() => {
                    closePreview();
                    handleSaveLoading();
                  }}
                  disabled={loading || loadingSession.products.length === 0}
                  className="tl-btn tl-btn-primary"
                >
                  Confirmer le Chargement
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
    <div className="tl-layout">
      
      <div className="tl-wrapper">
        <div className="tl-container">
          <div className="tl-content">
            {/* Header */}
            <div className="tl-header">
              <div className="tl-header-left">
                <div className="tl-title-section">
                  <Package className="tl-title-icon" />
                  <h1 className="tl-title">Chargement Camion</h1>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="tl-alert tl-alert-error">
                <AlertTriangle className="tl-alert-icon" />
                <div className="tl-alert-content">
                  <ul className="tl-error-list">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="tl-grid">
              {/* Left Column - Truck and Depot Selection */}
              <div className="tl-left-column">
                {/* Truck Selection */}
                <div className="tl-card">
                  <div className="tl-card-header">
                    <h3 className="tl-card-title">
                      <TruckIcon className="tl-card-icon" />
                      Sélection du Camion
                    </h3>
                  </div>
                  <div className="tl-card-content">
                    <div className="tl-form-group">
                      <label htmlFor="truck-select" className="tl-label">Camion</label>
                      <select 
                        value={loadingSession.truckId} 
                        onChange={(e) => handleTruckChange(e.target.value)}
                        className="tl-select"
                      >
                        <option value="">Sélectionner un camion</option>
                        {trucks.map((truck) => (
                          <option key={truck.id} value={truck.id}>
                            {truck.plateNumber} - {truck.model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTruck && (
                      <div className="tl-truck-info">
                        <h4 className="tl-info-title">Capacités du camion</h4>
                        <div className="tl-capacity-details">
                          <div className="tl-capacity-item">
                            <span>Poids max:</span>
                            <span className="tl-capacity-value">{selectedTruck.capacity.weight}kg</span>
                          </div>
                          <div className="tl-capacity-item">
                            <span>Volume max:</span>
                            <span className="tl-capacity-value">{selectedTruck.capacity.volume}m³</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Depot Selection */}
                <div className="tl-card">
                  <div className="tl-card-header">
                    <h3 className="tl-card-title">
                      <MapPin className="tl-card-icon" />
                      Dépôt de Départ
                    </h3>
                  </div>
                  <div className="tl-card-content">
                    <div className="tl-form-group">
                      <label htmlFor="depot-select" className="tl-label">Dépôt</label>
                      <select 
                        value={loadingSession.depotId} 
                        onChange={(e) => handleDepotChange(e.target.value)}
                        className="tl-select"
                      >
                        <option value="">Sélectionner un dépôt</option>
                        {depots.map((depot) => (
                          <option key={depot.id} value={depot.id}>
                            {depot.name} ({depot.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedDepot && (
                      <div className="tl-depot-info">
                        <h4 className="tl-info-title">{selectedDepot.name}</h4>
                        <p className="tl-depot-address">{selectedDepot.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loading Summary */}
                {selectedTruck && loadingSession.products.length > 0 && (
                  <div className="tl-card">
                    <div className="tl-card-header">
                      <h3 className="tl-card-title">
                        <ClipboardList className="tl-card-icon" />
                        Résumé du Chargement
                      </h3>
                    </div>
                    <div className="tl-card-content">
                      <div className="tl-summary-section">
                        <div className="tl-summary-item">
                          <div className="tl-summary-header">
                            <span className="tl-summary-label">Poids total:</span>
                            <span className={`tl-summary-value ${getCapacityUsageColor(loadingSession.totalWeight, selectedTruck.capacity.weight)}`}>
                              {loadingSession.totalWeight.toFixed(1)}kg / {selectedTruck.capacity.weight}kg
                            </span>
                          </div>
                          <div className="tl-progress-bar">
                            <div 
                              className={`tl-progress-fill ${
                                loadingSession.totalWeight > selectedTruck.capacity.weight
                                  ? "tl-progress-red"
                                  : loadingSession.totalWeight > selectedTruck.capacity.weight * 0.75
                                    ? "tl-progress-orange"
                                    : "tl-progress-green"
                              }`}
                              style={{
                                width: `${Math.min((loadingSession.totalWeight / selectedTruck.capacity.weight) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="tl-summary-item">
                          <div className="tl-summary-header">
                            <span className="tl-summary-label">Volume total:</span>
                            <span className={`tl-summary-value ${getCapacityUsageColor(loadingSession.totalVolume, selectedTruck.capacity.volume)}`}>
                              {loadingSession.totalVolume.toFixed(1)}m³ / {selectedTruck.capacity.volume}m³
                            </span>
                          </div>
                          <div className="tl-progress-bar">
                            <div 
                              className={`tl-progress-fill ${
                                loadingSession.totalVolume > selectedTruck.capacity.volume
                                  ? "tl-progress-red"
                                  : loadingSession.totalVolume > selectedTruck.capacity.volume * 0.75
                                    ? "tl-progress-orange"
                                    : "tl-progress-green"
                              }`}
                              style={{
                                width: `${Math.min((loadingSession.totalVolume / selectedTruck.capacity.volume) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="tl-summary-total">
                          <div className="tl-summary-header">
                            <span className="tl-summary-label">Nombre d'articles:</span>
                            <span className="tl-summary-value">{loadingSession.products.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Product Management */}
              <div className="tl-right-column">
                {/* Add Product */}
                <div className="tl-card">
                  <div className="tl-card-header">
                    <h3 className="tl-card-title">
                      <Plus className="tl-card-icon" />
                      Ajouter un Produit
                    </h3>
                  </div>
                  <div className="tl-card-content">
                    <div className="tl-product-form">
                      <div className="tl-form-row">
                        <div className="tl-form-group">
                          <label htmlFor="product-type" className="tl-label">Produit</label>
                          <select 
                            value={newProduct.productTypeId || ""} 
                            onChange={(e) => handleProductTypeChange(e.target.value)}
                            className="tl-select"
                          >
                            <option value="">Sélectionner</option>
                            {productTypes.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="tl-form-group">
                          <label htmlFor="unit" className="tl-label">Unité</label>
                          <select
                            value={newProduct.unit || ""}
                            onChange={(e) => setNewProduct((prev) => ({ ...prev, unit: e.target.value }))}
                            disabled={!newProduct.productTypeId}
                            className="tl-select"
                          >
                            <option value="">Unité</option>
                            {newProduct.productTypeId &&
                              productTypes
                                .find((p) => p.id === newProduct.productTypeId)
                                ?.availableUnits.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                          </select>
                        </div>

                        <div className="tl-form-group">
                          <label htmlFor="quantity" className="tl-label">Quantité</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={newProduct.quantity || ""}
                            onChange={(e) =>
                              setNewProduct((prev) => ({
                                ...prev,
                                quantity: Number.parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0"
                            className="tl-input"
                          />
                        </div>

                        <div className="tl-form-group tl-add-btn-group">
                          <button
                            onClick={addProduct}
                            disabled={!newProduct.productTypeId || !newProduct.quantity}
                            className="tl-btn tl-btn-primary tl-add-btn"
                          >
                            <Plus className="tl-btn-icon" />
                            Ajouter
                          </button>
                        </div>
                      </div>

                      <div className="tl-form-group">
                        <label htmlFor="notes" className="tl-label">Notes (optionnel)</label>
                        <textarea
                          value={newProduct.notes || ""}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes sur ce produit..."
                          rows={2}
                          className="tl-textarea"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product List */}
                <div className="tl-card">
                  <div className="tl-card-header">
                    <div className="tl-card-title-with-badge">
                      <h3 className="tl-card-title">
                        <Package className="tl-card-icon" />
                        Produits Chargés
                      </h3>
                      <span className="tl-badge">
                        {loadingSession.products.length} article{loadingSession.products.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="tl-card-content">
                    {loadingSession.products.length === 0 ? (
                      <div className="tl-empty-state">
                        <Package className="tl-empty-icon" />
                        <h3 className="tl-empty-title">Aucun produit chargé</h3>
                        <p className="tl-empty-message">Commencez par ajouter des produits à votre chargement.</p>
                      </div>
                    ) : (
                      <div className="tl-products-list">
                        {loadingSession.products.map((product) => {
                          const productType = productTypes.find((p) => p.id === product.productTypeId)
                          return (
                            <div key={product.id} className="tl-product-item">
                              <div className="tl-product-header">
                                <h4 className="tl-product-name">{product.productName}</h4>
                                <p className="tl-product-code">Code: {productType?.code}</p>
                              </div>

                              <div className="tl-product-details">
                                <div className="tl-product-detail">
                                  <span className="tl-detail-label">Quantité:</span>
                                  <div className="tl-quantity-input">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={product.quantity}
                                      onChange={(e) =>
                                        updateProductQuantity(product.id, Number.parseFloat(e.target.value) || 0)
                                      }
                                      className="tl-input tl-input-small"
                                    />
                                    <span className="tl-unit">{product.unit}</span>
                                  </div>
                                </div>

                                <div className="tl-product-detail">
                                  <span className="tl-detail-label">Poids:</span>
                                  <p className="tl-detail-value">{product.totalWeight?.toFixed(1)}kg</p>
                                </div>

                                <div className="tl-product-detail">
                                  <span className="tl-detail-label">Volume:</span>
                                  <p className="tl-detail-value">{product.totalVolume?.toFixed(2)}m³</p>
                                </div>

                                <div className="tl-product-actions">
                                  <button
                                    onClick={() => removeProduct(product.id)}
                                    className="tl-btn tl-btn-danger tl-btn-small"
                                  >
                                    <Trash2 className="tl-btn-icon" />
                                  </button>
                                </div>
                              </div>

                              {product.notes && (
                                <div className="tl-product-notes">
                                  <span className="tl-notes-label">Notes:</span>
                                  <p className="tl-notes-text">{product.notes}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes and Confirmation */}
                <div className="tl-card">
                  <div className="tl-card-header">
                    <h3 className="tl-card-title">Notes Générales</h3>
                  </div>
                  <div className="tl-card-content">
                    <div className="tl-form-group">
                      <label htmlFor="general-notes" className="tl-label">Notes sur le chargement</label>
                      <textarea
                        value={loadingSession.notes || ""}
                        onChange={(e) => setLoadingSession((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notes générales sur le chargement, observations, etc..."
                        rows={3}
                        className="tl-textarea"
                      />
                    </div>

                    <div className="tl-action-buttons">
                      <button
                        onClick={handleSaveLoading}
                        disabled={loading || loadingSession.products.length === 0}
                        className="tl-btn tl-btn-primary tl-btn-large"
                      >
                        {loading ? (
                          <>
                            <div className="tl-spinner" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="tl-btn-icon" />
                            Confirmer le Chargement
                          </>
                        )}
                      </button>

                      <button   
                        onClick={handlePreviewList}  
                        className="tl-btn tl-btn-secondary tl-btn-large"  
                      >  
                        <ClipboardList className="tl-btn-icon" />  
                        Aperçu Liste  
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