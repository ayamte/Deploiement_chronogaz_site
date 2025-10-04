import React, { useState, useEffect, useContext } from 'react'
import {
  MdDownload as Download,
  MdUpload as Upload,
  MdDescription as FileText,
  MdBusiness as Building2,
  MdInventory as Package,
  MdCalendarToday as Calendar,
  MdWarning as AlertTriangle,
  MdCheckCircle as CheckCircle,
  MdHistory as History,
  MdAdd as Plus,
  MdClose as X,
  MdVisibility as Eye,
  MdLocalShipping as TruckIcon,
} from 'react-icons/md'
import './SupplierVoucher.css'
import authService from '../../../services/authService'
import fournisseurService from '../../../services/fournisseurService'
import productService from '../../../services/productService'
import depotService from '../../../services/depotService'
import blFrsService from '../../../services/blFrsService'
import umService from '../../../services/umService'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'  

export default function SupplierVoucherPage() {
  // Context pour récupérer l'utilisateur connecté
  const user = authService.getUser()
  
  // États pour les données réelles
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [depots, setDepots] = useState([])
  const [unitMeasures, setUnitMeasures] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  
  // États du formulaire
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [selectedDepotId, setSelectedDepotId] = useState("")
  const [blDate, setBlDate] = useState(new Date().toISOString().split("T")[0])
  const [blReference, setBlReference] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0])
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 0,
    unitMeasureId: "",
    unitPrice: 0,
  })
  const [commentaires, setCommentaires] = useState("")
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [generatedBLFRS, setGeneratedBLFRS] = useState(null)
   const [currentUser, setCurrentUser] = useState(null)  

  // Charger les données au montage
  useEffect(() => {
    loadInitialData()
  }, [])

  // Mettre à jour le fournisseur sélectionné
  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find((s) => s._id === selectedSupplierId)
      setSelectedSupplier(supplier || null)
    } else {
      setSelectedSupplier(null)
    }
  }, [selectedSupplierId, suppliers])

    useEffect(() => {  
    const fetchCurrentUser = async () => {  
      try {  
        const token = authService.getToken()  
        if (!token) return  
          
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {  
          headers: {  
            'Authorization': `Bearer ${token}`,  
            'Content-Type': 'application/json'  
          }  
        })  
          
        if (response.ok) {  
          const data = await response.json()  
          if (data.success && data.data) {  
            setCurrentUser({  
              ...data.data,  
              employee_id: data.data.employee_info?._id  
            })  
          }  
        }  
      } catch (error) {  
        console.error('Erreur récupération utilisateur:', error)  
      }  
    }  
      
    fetchCurrentUser()  
  }, [])

    const loadInitialData = async () => {    
    try {    
      setLoadingData(true)    
      const [suppliersRes, productsRes, depotsRes, unitsRes] = await Promise.all([    
        fournisseurService.getAllFournisseurs(),    
        productService.getAllProducts(),     
        depotService.getAllDepots(),    
        umService.getAllUms()  
      ])    
    
      console.log('Products:', productsRes.data) // Pour voir la structure  
      console.log('Depots:', depotsRes.data)     // Pour voir la structure  
      console.log('Units:', unitsRes.data)       // Pour voir la structure  
      
      if (suppliersRes.success) setSuppliers(suppliersRes.data)    
      if (productsRes.success) setProducts(productsRes.data)    
      if (depotsRes.success) setDepots(depotsRes.data)    
      if (unitsRes.success) setUnitMeasures(unitsRes.data)    
    } catch (error) {    
      console.error("Erreur lors du chargement des données:", error)    
      setErrors(["Erreur lors du chargement des données initiales"])    
    } finally {    
      setLoadingData(false)    
    }    
  }

  const generateBlReference = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getTime()).slice(-6)
    setBlReference(`BL-${year}${month}${day}-${time}`)
  }

  // Calculer les totaux
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const TAX_RATE = 0.2
  const taxAmount = subtotal * TAX_RATE
  const totalAmount = subtotal + taxAmount

  const addItem = () => {
    if (!newItem.productId || newItem.quantity <= 0 || !newItem.unitMeasureId || newItem.unitPrice <= 0) {
      setErrors(["Veuillez remplir tous les champs de l'article."])
      return
    }

    const product = products.find(p => p._id === newItem.productId)
    const unitMeasure = unitMeasures.find(u => u._id === newItem.unitMeasureId)

    const item = {  
      id: `item-${Date.now()}`,  
      productId: newItem.productId,  
      productName: product?.short_name || '',  
      quantity: newItem.quantity,  
      unitMeasureId: newItem.unitMeasureId,  
      unitMeasureName: unitMeasure?.unitemesure || '',  
      unitPrice: newItem.unitPrice,  
      totalPrice: newItem.quantity * newItem.unitPrice,  
    }

    setItems((prev) => [...prev, item])
    setNewItem({ productId: "", quantity: 0, unitMeasureId: "", unitPrice: 0 })
    setErrors([])
  }

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice,
            }
          : item,
      ),
    )
  }

  const updateItemPrice = (itemId, unitPrice) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              unitPrice,
              totalPrice: item.quantity * unitPrice,
            }
          : item,
      ),
    )
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(["Le fichier ne doit pas dépasser 5MB."])
        return
      }
      setAttachmentFile(file)
      setErrors([])
    }
  }

  const validateForm = () => {
    const validationErrors = []

    if (!selectedSupplierId) {
      validationErrors.push("Veuillez sélectionner un fournisseur.")
    }

    if (!selectedDepotId) {
      validationErrors.push("Veuillez sélectionner un dépôt.")
    }

    if (!blDate) {
      validationErrors.push("Veuillez sélectionner une date de BL.")
    }

    if (!blReference.trim()) {
      validationErrors.push("Veuillez saisir une référence de BL.")
    }

    if (!entryDate) {
      validationErrors.push("Veuillez sélectionner une date d'entrée.")
    }

    if (items.length === 0) {
      validationErrors.push("Veuillez ajouter au moins un article au bon de livraison.")
    }

    if (!user?.id) {
      validationErrors.push("Utilisateur non identifié.")
    }

    return validationErrors
  }

const handleCreateBLFRS = async () => {  
  console.log('=== Frontend BLFRS Creation ===');  
  console.log('User:', user);  
  console.log('Selected Supplier ID:', selectedSupplierId);  
  console.log('Selected Depot ID:', selectedDepotId);  
  console.log('Items:', items);  
    
  const validationErrors = validateForm()  
  if (validationErrors.length > 0) {  
    console.log('Validation errors:', validationErrors);  
    setErrors(validationErrors)  
    return  
  }  
  
  setLoading(true)  
  try {  
    const lignes = items.map(item => ({  
      product_id: item.productId,  
      quantity: item.quantity,  
      um_id: item.unitMeasureId,  
      prix_unitaire: item.unitPrice,  
      total_ligne: item.totalPrice  
    }))  
  
    const blFrsData = {    
      fournisseur_id: selectedSupplierId,    
      depot_id: selectedDepotId,    
      bl_date: blDate,    
      bl_reference: blReference,    
      entry_date: entryDate,    
      livreur_employee_id: ['CHAUFFEUR', 'ACCOMPAGNANT'].includes(currentUser?.employee_info?.fonction)     
        ? currentUser.employee_id : null,    
      magasin_employee_id: currentUser?.employee_info?.fonction === 'MAGASINIER'     
        ? currentUser.employee_id : null,    
      commentaires,    
      lignes  
    }  
  
    console.log('BLFRS Data to send:', blFrsData);  
    console.log('Attachment file:', attachmentFile);  
    console.log('API call starting...');  
  
    const response = await blFrsService.createBLFRS(blFrsData, attachmentFile)  
      
    console.log('API Response:', response);  

      if (response.success) {
        setGeneratedBLFRS(response.data)
        setShowConfirmation(true)
        setErrors([])
      } else {
        setErrors([response.error || "Erreur lors de la création du bon de livraison"])
      }
    } catch (error) {
      console.error("Erreur lors de la création du BLFRS:", error)
      setErrors([error.error || "Erreur lors de la création du bon de livraison. Veuillez réessayer."])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedSupplierId("")
    setSelectedSupplier(null)
    setSelectedDepotId("")
    setBlDate(new Date().toISOString().split("T")[0])
    setEntryDate(new Date().toISOString().split("T")[0])
    generateBlReference()
    setItems([])
    setNewItem({ productId: "", quantity: 0, unitMeasureId: "", unitPrice: 0 })
    setCommentaires("")
    setAttachmentFile(null)
    setErrors([])
    setShowConfirmation(false)
    setGeneratedBLFRS(null)
  }

  if (loadingData) {
    return <div className="sv-layout"><div className="loading">Chargement des données...</div></div>
  }

  // Écran de confirmation
  if (showConfirmation && generatedBLFRS) {
    return (
      <div className="sv-layout">
        <div className="sv-wrapper">
          <div className="sv-confirmation-container">
            <div className="sv-confirmation-card">
              <div className="sv-confirmation-content">
                <div className="sv-confirmation-icon">
                  <CheckCircle className="sv-icon-large sv-text-green" />
                </div>
                <h3 className="sv-confirmation-title">Bon de Livraison Créé</h3>
                <p className="sv-confirmation-message">
                  Le bon de livraison <strong>{generatedBLFRS.bl_reference}</strong> a été créé avec succès.
                </p>

                <div className="sv-confirmation-summary">
                  <div className="sv-summary-grid">
                    <div className="sv-summary-item">
                      <span className="sv-summary-label">Fournisseur:</span>
                      <p className="sv-summary-value">{selectedSupplier?.nom}</p>
                    </div>
                    <div className="sv-summary-item">
                      <span className="sv-summary-label">Date BL:</span>
                      <p className="sv-summary-value">{blDate}</p>
                    </div>
                    <div className="sv-summary-item">
                      <span className="sv-summary-label">Articles:</span>
                      <p className="sv-summary-value">{items.length}</p>
                    </div>
                    <div className="sv-summary-item">
                      <span className="sv-summary-label">Total TTC:</span>
                      <p className="sv-summary-value">{totalAmount.toFixed(2)}MAD</p>
                    </div>
                  </div>
                </div>

                <div className="sv-confirmation-actions">
                  <button onClick={resetForm} className="sv-btn sv-btn-primary sv-btn-large">
                    <Plus className="sv-btn-icon" />
                    Nouveau Bon de Livraison
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sv-layout">
      <div className="sv-wrapper">
        <div className="sv-container">
          <div className="sv-content">
            {/* Header */}
            <div className="sv-header">
              <div className="sv-header-left">
                <h2 className="sv-title">Bon de Livraison Fournisseur</h2>
                <p className="sv-subtitle">Créez un bon de livraison pour l'entrée en stock</p>
              </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="sv-alert sv-alert-error">
                <AlertTriangle className="sv-alert-icon" />
                <div className="sv-alert-content">
                  <ul className="sv-error-list">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="sv-main-grid">
              {/* Left Column - Supplier and Order Info */}
              <div className="sv-left-column">
                {/* Supplier Selection */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <h3 className="sv-card-title">
                      <Building2 className="sv-card-icon" />
                      Sélection du Fournisseur
                    </h3>
                  </div>
                  <div className="sv-card-content">  
                    <div className="sv-form-group">  
                      <label htmlFor="supplier-select" className="sv-label">Fournisseur *</label>  
                      <select  
                        id="supplier-select"  
                        value={selectedSupplierId}  
                        onChange={(e) => setSelectedSupplierId(e.target.value)}  
                        className="sv-select"  
                      >  
                        <option value="">Choisir un fournisseur</option>  
                        {suppliers.map((supplier) => (  
                          <option key={supplier._id} value={supplier._id}>  
                            {supplier.nom}  
                          </option>  
                        ))}  
                      </select>  
                    </div>  
  
                    {selectedSupplier && (  
                      <div className="sv-supplier-info">  
                        <h4 className="sv-supplier-info-title">Informations Fournisseur</h4>  
                        <div className="sv-supplier-details">  
                          <div className="sv-detail-item">  
                            <span className="sv-detail-label">Code:</span>  
                            <p className="sv-detail-value">{selectedSupplier.code}</p>  
                          </div>  
                          <div className="sv-detail-item">  
                            <span className="sv-detail-label">Email:</span>  
                            <p className="sv-detail-value">{selectedSupplier.email || '-'}</p>  
                          </div>  
                          <div className="sv-detail-item">  
                            <span className="sv-detail-label">ICE:</span>  
                            <p className="sv-detail-value">{selectedSupplier.ice || '-'}</p>  
                          </div>  
                        </div>  
                      </div>  
                    )}  
                  </div>  
                </div>  
  
                {/* Depot Selection */}  
                <div className="sv-card">  
                  <div className="sv-card-header">  
                    <h3 className="sv-card-title">  
                      <Package className="sv-card-icon" />  
                      Sélection du Dépôt  
                    </h3>  
                  </div>  
                  <div className="sv-card-content">  
                    <div className="sv-form-group">  
                      <label htmlFor="depot-select" className="sv-label">Dépôt *</label>  
                      <select  
                        id="depot-select"  
                        value={selectedDepotId}  
                        onChange={(e) => setSelectedDepotId(e.target.value)}  
                        className="sv-select"  
                      >  
                        <option value="">Choisir un dépôt</option>  
                        {depots.map((depot) => (  
                          <option key={depot._id} value={depot._id}>  
                            {depot.short_name} - {depot.address}  
                          </option>  
                        ))}
                      </select>  
                    </div>  
                  </div>  
                </div>  
  
                {/* BL Info */}  
                <div className="sv-card">  
                  <div className="sv-card-header">  
                    <h3 className="sv-card-title">  
                      <Calendar className="sv-card-icon" />  
                      Informations BL  
                    </h3>  
                  </div>  
                  <div className="sv-card-content">  
                    <div className="sv-form-group">  
                      <label htmlFor="bl-reference" className="sv-label">Référence BL *</label>  
                      <input  
                        id="bl-reference"  
                        type="text"  
                        value={blReference}  
                        onChange={(e) => setBlReference(e.target.value)}  
                        className="sv-input"  
                        placeholder="Ex: BL-20241201-123456"  
                      />  
                    </div>  
                    <div className="sv-form-group">  
                      <label htmlFor="bl-date" className="sv-label">Date BL *</label>  
                      <input  
                        id="bl-date"  
                        type="date"  
                        value={blDate}  
                        onChange={(e) => setBlDate(e.target.value)}  
                        className="sv-input"  
                      />  
                    </div>  
                    <div className="sv-form-group">  
                      <label htmlFor="entry-date" className="sv-label">Date d'entrée *</label>  
                      <input  
                        id="entry-date"  
                        type="date"  
                        value={entryDate}  
                        onChange={(e) => setEntryDate(e.target.value)}  
                        className="sv-input"  
                      />  
                    </div>  
                  </div>  
                </div>  
  
                {/* File Upload */}  
                <div className="sv-card">  
                  <div className="sv-card-header">  
                    <h3 className="sv-card-title">  
                      <Upload className="sv-card-icon" />  
                      Pièce jointe  
                    </h3>  
                  </div>  
                  <div className="sv-card-content">  
                    <div className="sv-form-group">  
                      <label htmlFor="file-upload" className="sv-label">Fichier (facultatif)</label>  
                      <input  
                        id="file-upload"  
                        type="file"  
                        accept=".pdf,.jpg,.jpeg,.png"  
                        onChange={handleFileUpload}  
                        className="sv-file-input"  
                      />  
                      {attachmentFile && (  
                        <div className="sv-upload-success">  
                          <p className="sv-upload-text">Fichier sélectionné: {attachmentFile.name}</p>  
                        </div>  
                      )}  
                    </div>  
                  </div>  
                </div>  
  
                {/* Order Summary */}  
                {items.length > 0 && (  
                  <div className="sv-card">  
                    <div className="sv-card-header">  
                      <h3 className="sv-card-title">Résumé du BL</h3>  
                    </div>  
                    <div className="sv-card-content">  
                      <div className="sv-summary-section">  
                        <div className="sv-summary-item">  
                          <span className="sv-summary-label">Sous-total HT:</span>  
                          <span className="sv-summary-value">{subtotal.toFixed(2)} MAD</span>  
                        </div>  
                        <div className="sv-summary-item">  
                          <span className="sv-summary-label">TVA (20%):</span>  
                          <span className="sv-summary-value">{taxAmount.toFixed(2)} MAD</span>  
                        </div>  
                        <div className="sv-separator" />  
                        <div className="sv-summary-item sv-summary-total">  
                          <span className="sv-summary-label">Total TTC:</span>  
                          <span className="sv-summary-value">{totalAmount.toFixed(2)} MAD</span>  
                        </div>  
                      </div>  
                    </div>  
                  </div>  
                )}  
              </div>  
  
              {/* Right Column - Items and Notes */}  
              <div className="sv-right-column">  
                {/* Add Item */}  
                <div className="sv-card">  
                  <div className="sv-card-header">  
                    <h3 className="sv-card-title">  
                      <Plus className="sv-card-icon" />  
                      Ajouter un Article  
                    </h3>  
                  </div>  
                  <div className="sv-card-content">  
                    <div className="sv-add-item-grid">  
                      <div className="sv-form-group sv-form-group-span-2">  
                        <label htmlFor="product-select" className="sv-label">Produit *</label>  
                        <select  
                          id="product-select"  
                          value={newItem.productId}  
                          onChange={(e) => setNewItem((prev) => ({ ...prev, productId: e.target.value }))}  
                          className="sv-select"  
                        >  
                          <option value="">Sélectionner un produit</option>  
                          {products.map((product) => (  
                            <option key={product._id} value={product._id}>  
                              {product.short_name} - {product.ref}  
                            </option>  
                          ))}
                        </select>  
                      </div>  
  
                      <div className="sv-form-group">  
                        <label htmlFor="quantity" className="sv-label">Quantité *</label>  
                        <input  
                          id="quantity"  
                          type="number"  
                          min="1"  
                          value={newItem.quantity || ""}  
                          onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}  
                          placeholder="0"  
                          className="sv-input"  
                        />  
                      </div>  
  
                      <div className="sv-form-group">  
                        <label htmlFor="unit-measure" className="sv-label">Unité de mesure *</label>  
                        <select  
                          id="unit-measure"  
                          value={newItem.unitMeasureId}  
                          onChange={(e) => setNewItem((prev) => ({ ...prev, unitMeasureId: e.target.value }))}  
                          className="sv-select"  
                        >  
                          <option value="">Sélectionner</option>  
                          {unitMeasures.map((unit) => (  
                            <option key={unit._id} value={unit._id}>  
                              {unit.unitemesure}  
                            </option>  
                          ))} 
                        </select>  
                      </div>  
  
                      <div className="sv-form-group">  
                        <label htmlFor="unit-price" className="sv-label">Prix Unitaire (MAD) *</label>  
                        <input  
                          id="unit-price"  
                          type="number"  
                          min="0"  
                          step="0.01"  
                          value={newItem.unitPrice || ""}  
                          onChange={(e) => setNewItem((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}  
                          placeholder="0.00"  
                          className="sv-input"  
                        />  
                      </div>  
                    </div>  
  
                    <div className="sv-add-item-actions">  
                      <button  
                        onClick={addItem}  
                        disabled={!newItem.productId || newItem.quantity <= 0 || !newItem.unitMeasureId || newItem.unitPrice <= 0}  
                        className="sv-btn sv-btn-primary"  
                      >  
                        <Plus className="sv-btn-icon" />  
                        Ajouter l'Article  
                      </button>  
                    </div>  
                  </div>  
                </div>  
  
                {/* Items List */}  
                <div className="sv-card">  
                  <div className="sv-card-header">  
                    <div className="sv-card-header-with-badge">  
                      <h3 className="sv-card-title">  
                        <Package className="sv-card-icon" />  
                        Articles du BL  
                      </h3>  
                      <div className="sv-badge">  
                        {items.length} article{items.length !== 1 ? "s" : ""}  
                      </div>  
                    </div>  
                  </div>  
                  <div className="sv-card-content">  
                    {items.length === 0 ? (  
                      <div className="sv-empty-state">  
                        <Package className="sv-empty-icon" />  
                        <h3 className="sv-empty-title">Aucun article ajouté</h3>  
                        <p className="sv-empty-message">Commencez par ajouter des articles à votre bon de livraison.</p>  
                      </div>  
                    ) : (  
                      <div className="sv-items-list">  
                        {items.map((item) => (  
                          <div key={item.id} className="sv-item-card">  
                            <div className="sv-item-header">  
                              <div className="sv-item-info">  
                                <h4 className="sv-item-name">{item.productName}</h4>  
                                <div className="sv-item-details-grid">  
                                  <div className="sv-item-detail">  
                                    <label className="sv-item-detail-label">Quantité</label>  
                                    <input  
                                      type="number"  
                                      min="1"  
                                      value={item.quantity}  
                                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}  
                                      className="sv-item-input"  
                                    />  
                                  </div>  
                                  <div className="sv-item-detail">  
                                    <label className="sv-item-detail-label">Unité</label>  
                                    <p className="sv-item-value">{item.unitMeasureName}</p>  
                                  </div>  
                                  <div className="sv-item-detail">  
                                    <label className="sv-item-detail-label">Prix Unitaire (MAD)</label>  
                                    <input  
                                      type="number"  
                                      min="0"  
                                      step="0.01"  
                                      value={item.unitPrice}  
                                      onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}  
                                      className="sv-item-input"  
                                    />  
                                  </div>  
                                  <div className="sv-item-detail">  
                                    <label className="sv-item-detail-label">Total (MAD)</label>  
                                    <p className="sv-item-total">{item.totalPrice.toFixed(2)}</p>  
                                  </div>  
                                </div>  
                              </div>  
                              <button  
                                onClick={() => removeItem(item.id)}  
                                className="sv-btn sv-btn-remove"  
                              >  
                                <X className="sv-btn-icon" />  
                              </button>  
                            </div>  
                          </div>  
                        ))}  
                      </div>  
                    )}  
                  </div>  
                </div>  
  
                {/* Comments and Create */}  
                <div className="sv-card">  
                  <div className="sv-card-header">  
                    <h3 className="sv-card-title">Commentaires et Création</h3>  
                  </div>  
                  <div className="sv-card-content">  
                    <div className="sv-form-group">  
                      <label htmlFor="commentaires" className="sv-label">Commentaires (facultatif)</label>  
                      <textarea  
                        id="commentaires"  
                        value={commentaires}  
                        onChange={(e) => setCommentaires(e.target.value)}  
                        placeholder="Ajoutez des commentaires sur ce bon de livraison..."  
                        rows={4}  
                        className="sv-textarea"  
                      />  
                    </div>  
  
                    <div className="sv-separator" />  
  
                    <div className="sv-download-actions">  
                      <button  
                        onClick={handleCreateBLFRS}  
                        disabled={loading || items.length === 0 || !selectedSupplierId || !selectedDepotId}  
                        className="sv-btn sv-btn-primary sv-btn-large"  
                      >  
                        {loading ? (  
                          <>  
                            <div className="sv-spinner" />  
                            Création en cours...  
                          </>  
                        ) : (  
                          <>  
                            <Download className="sv-btn-icon" />  
                            Créer le Bon de Livraison  
                          </>  
                        )}  
                      </button>  
  
                      <button onClick={resetForm} className="sv-btn sv-btn-secondary sv-btn-large">  
                        <FileText className="sv-btn-icon" />  
                        Nouveau BL  
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

