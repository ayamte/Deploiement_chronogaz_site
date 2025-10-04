import { useState, useEffect } from "react"          
import {            
  MdInventory as Package,             
  MdUpload as Upload,            
  MdSave as Save,            
  MdClose as X,            
  MdCheckCircle as CheckCircle,            
  MdWarning as AlertTriangle,            
  MdArrowBack as ArrowLeft,            
  MdImage as ImageIcon,            
  MdTag as Hash,            
  MdDescription as FileText,            
  MdLabel as TagLabel,  
  MdAdd as Plus,  
  MdDelete as Delete          
} from "react-icons/md"      
import "./AjouterProduit.css"           
import productService from '../../../services/productService'  
import umService from '../../../services/umService'  
import { useNavigate } from "react-router-dom"
        
export default function AjouterProduit() {  
  const navigate = useNavigate()     
  const [formData, setFormData] = useState({      
    ref: "",      
    short_name: "",      
    long_name: "",    
    gamme: "",    
    brand: "",    
    description: "",    
    image: null,  
    unites_mesure: []      
  })      
      
  const [errors, setErrors] = useState({})      
  const [loading, setLoading] = useState(false)      
  const [showSuccess, setShowSuccess] = useState(false)      
  const [imagePreview, setImagePreview] = useState(null)  
    
  // États pour les relations  
  const [availableUMs, setAvailableUMs] = useState([])  
  
  useEffect(() => {  
    loadRelatedData()  
  }, [])  
  
  const loadRelatedData = async () => {  
    try {  
      const umsResponse = await umService.getAllUms()
      setAvailableUMs(umsResponse.data || [])  
    } catch (error) {  
      console.error("Erreur lors du chargement des données:", error)  
    }  
  }  
      
  // Fonction de validation      
  const validateForm = () => {      
    const newErrors = {}      
      
    // Validation de la référence      
    if (!formData.ref.trim()) {      
      newErrors.ref = "La référence du produit est obligatoire."      
    } else if (!/^[A-Z0-9-]+$/.test(formData.ref.trim())) {      
      newErrors.ref = "La référence doit contenir uniquement des lettres majuscules, chiffres et tirets."      
    }      
      
    // Validation du nom court      
    if (!formData.short_name.trim()) {      
      newErrors.short_name = "Le nom court est obligatoire."      
    } else if (formData.short_name.trim().length < 3) {      
      newErrors.short_name = "Le nom court doit contenir au moins 3 caractères."      
    }      
    
    // Validation du nom complet    
    if (!formData.long_name.trim()) {      
      newErrors.long_name = "Le nom complet est obligatoire."      
    } else if (formData.long_name.trim().length < 5) {      
      newErrors.long_name = "Le nom complet doit contenir au moins 5 caractères."      
    }      
      
    // Validation de la description      
    if (!formData.description.trim()) {      
      newErrors.description = "La description est obligatoire."      
    } else if (formData.description.trim().length < 10) {      
      newErrors.description = "La description doit contenir au moins 10 caractères."      
    }      
      
    // Validation de l'image (optionnelle mais si fournie, valider)      
    if (formData.image) {      
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]      
      if (!allowedTypes.includes(formData.image.type)) {      
        newErrors.image = "Format d'image non supporté. Utilisez JPG, PNG ou WebP."      
      } else if (formData.image.size > 5 * 1024 * 1024) {      
        // Limite de 5MB      
        newErrors.image = "L'image ne doit pas dépasser 5MB."      
      }      
    }      
      
    return newErrors      
  }      
      
  const handleInputChange = (field, value) => {      
    setFormData(prev => ({ ...prev, [field]: value }))      
      
    // Effacer l'erreur pour ce champ quand l'utilisateur commence à taper      
    if (errors[field]) {      
      setErrors(prev => ({ ...prev, [field]: undefined }))      
    }      
  }      
      
  const handleImageUpload = (event) => {      
    const file = event.target.files?.[0]      
    if (file) {      
      setFormData(prev => ({ ...prev, image: file }))      
      
      // Créer un aperçu      
      const reader = new FileReader()      
      reader.onload = (e) => {      
        setImagePreview(e.target?.result)      
      }      
      reader.readAsDataURL(file)      
      
      // Effacer l'erreur d'image      
      if (errors.image) {      
        setErrors(prev => ({ ...prev, image: undefined }))      
      }      
    }      
  }      
      
  const removeImage = () => {      
    setFormData(prev => ({ ...prev, image: null }))      
    setImagePreview(null)      
    // Réinitialiser l'input file      
    const fileInput = document.getElementById("image-upload")      
    if (fileInput) {      
      fileInput.value = ""      
    }      
  }
  
  const debugFormData = () => {
    console.log('=== DEBUG FORM DATA ===');
    console.log('ref:', formData.ref);
    console.log('short_name:', formData.short_name);
    console.log('long_name:', formData.long_name);
    console.log('gamme:', formData.gamme);
    console.log('brand:', formData.brand);
    console.log('description:', formData.description);
    console.log('image:', formData.image);
    console.log('unites_mesure:', formData.unites_mesure);
    console.log('========================');
  };
  
  // Gestion des unités de mesure  
  const addUnite = () => {  
    setFormData(prev => ({  
      ...prev,  
      unites_mesure: [...prev.unites_mesure, { UM_id: "", is_principal: false }]  
    }))  
  }  
  
  const removeUnite = (index) => {  
    setFormData(prev => ({  
      ...prev,  
      unites_mesure: prev.unites_mesure.filter((_, i) => i !== index)  
    }))  
  }  
  
  const updateUnite = (index, field, value) => {  
    setFormData(prev => ({  
      ...prev,  
      unites_mesure: prev.unites_mesure.map((unite, i) =>   
        i === index ? { ...unite, [field]: value } : unite  
      )  
    }))  
  }  
      
  const handleSubmit = async (e) => {    
    e.preventDefault() 
    debugFormData()   
      
    const validationErrors = validateForm()    
    if (Object.keys(validationErrors).length > 0) {    
      setErrors(validationErrors)    
      return    
    }    
      
    setLoading(true)    
    try {    
      // Créer d'abord le produit de base  
      const productResponse = await productService.createProduct({
        ref: formData.ref,
        short_name: formData.short_name,
        long_name: formData.long_name,
        gamme: formData.gamme,
        brand: formData.brand,
        description: formData.description,
        image: formData.image,
        unites_mesure: formData.unites_mesure,
        createdBy: 'admin'
      })  
  
      const productId = productResponse.data._id  
  
      // Ajouter les unités de mesure si présentes  
      if (formData.unites_mesure.length > 0) {  
        await productService.updateProductUnits(productId, formData.unites_mesure)  
      }  
      
      setShowSuccess(true)    
      
      // Réinitialiser le formulaire après soumission réussie    
      setTimeout(() => {    
        setFormData({    
          ref: "",    
          short_name: "",    
          long_name: "",    
          gamme: "",    
          brand: "",    
          description: "",    
          image: null,  
          unites_mesure: []    
        })    
        setImagePreview(null)    
        setShowSuccess(false)    
      }, 3000)    
    } catch (error) {    
      console.error("Erreur lors de l'ajout du produit:", error)  
      console.log("Détail de l'erreur serveur:", error.response?.data)
console.log("Status:", error.response?.status)
console.log("Headers de réponse:", error.response?.headers)  
      setErrors({ ref: "Erreur lors de l'ajout du produit. Veuillez réessayer." })    
    } finally {    
      setLoading(false)    
    }    
  }     
      
  const resetForm = () => {      
    setFormData({      
      ref: "",      
      short_name: "",      
      long_name: "",    
      gamme: "",    
      brand: "",    
      description: "",    
      image: null,  
      unites_mesure: []      
    })      
    setErrors({})      
    setImagePreview(null)      
      
    // Réinitialiser l'input file      
    const fileInput = document.getElementById("image-upload")      
    if (fileInput) {      
      fileInput.value = ""      
    }      
  }      
      
  if (showSuccess) {      
    return (      
      <div className="product-management-layout">     
        <div className="product-management-wrapper">      
          <div className="product-management-container">      
            <main className="product-main">      
              <div className="success-card">      
                <div className="success-content">      
                  <div className="success-icon">      
                    <CheckCircle className="success-check" />      
                  </div>      
                  <h3 className="success-title">Produit Ajouté avec Succès</h3>      
                  <p className="success-message">      
                    Le produit <strong>{formData.short_name}</strong> a été ajouté à l'inventaire.      
                  </p>      
                  <div className="success-actions">      
                    <button       
                      className="success-btn success-btn-primary"       
                      onClick={() => setShowSuccess(false)}      
                    >      
                      <Package className="btn-icon" />      
                      Ajouter un Autre Produit      
                    </button>      
                    <button   
                      className="success-btn success-btn-secondary"  
                      onClick={() => navigate('/admin/gestion-produits')}  
                    >  
                      Voir Tous les Produits  
                    </button>    
                  </div>      
                </div>      
              </div>      
            </main>      
          </div>      
        </div>      
      </div>      
    )      
  }      
      
  return (      
    <div className="product-management-layout">      
      <div className="product-management-wrapper">      
        <div className="product-management-container">      
          <main className="product-main">      
            <div className="page-header">      
              <div className="page-header-content">      
                <div className="page-header-left">      
                  <h2 className="page-title">Ajouter un Nouveau Produit</h2>      
                  <p className="page-subtitle">      
                    Ajoutez un nouveau produit à votre inventaire avec toutes les informations nécessaires      
                  </p>      
                </div>      
              </div>      
            </div>      
      
            <form onSubmit={handleSubmit} className="product-form">      
              <div className="form-grid">      
                {/* Section principale du formulaire */}      
                <div className="form-main">      
                  {/* Informations de base */}      
                  <div className="form-card">      
                    <div className="form-card-header">      
                      <div className="form-card-title">      
                        <Package className="form-card-icon" />      
                        <span>Informations de Base</span>      
                      </div>      
                    </div>      
                    <div className="form-card-content">      
                      <div className="form-row">      
                        <div className="form-group">      
                          <label htmlFor="product-ref" className="form-label">      
                            <Hash className="label-icon" />      
                            <span>Référence du Produit *</span>      
                          </label>      
                          <input      
                            id="product-ref"      
                            type="text"      
                            value={formData.ref}      
                            onChange={(e) => handleInputChange("ref", e.target.value.toUpperCase())}      
                            placeholder="Ex: BUT13"      
                            className={`form-input ${errors.ref ? "form-input-error" : ""}`}      
                          />      
                          {errors.ref && (      
                            <p className="form-error">      
                              <AlertTriangle className="error-icon" />      
                              <span>{errors.ref}</span>      
                            </p>      
                          )}      
                          <p className="form-help">      
                            Référence unique (lettres majuscules, chiffres et tirets uniquement)      
                          </p>      
                        </div>      
      
                        <div className="form-group">      
                          <label htmlFor="short-name" className="form-label">      
                            <FileText className="label-icon" />      
                            <span>Nom Court *</span>      
                          </label>      
                          <input      
                            id="short-name"      
                            type="text"      
                            value={formData.short_name}      
                            onChange={(e) => handleInputChange("short_name", e.target.value)}      
                            placeholder="Ex: Butane 13kg"      
                            className={`form-input ${errors.short_name ? "form-input-error" : ""}`}      
                          />      
                          {errors.short_name && (      
                            <p className="form-error">      
                              <AlertTriangle className="error-icon" />      
                              <span>{errors.short_name}</span>      
                            </p>      
                          )}      
                          <p className="form-help">Nom commercial court du produit (minimum 3 caractères)</p>      
                        </div>      
                      </div>      
    
                      <div className="form-group">      
                        <label htmlFor="long-name" className="form-label">      
                          <FileText className="label-icon" />      
                          <span>Nom Complet *</span>      
                        </label>      
                        <input      
                          id="long-name"      
                          type="text"      
                          value={formData.long_name}      
                          onChange={(e) => handleInputChange("long_name", e.target.value)}      
                          placeholder="Ex: Bouteille de gaz butane 13kg"      
                          className={`form-input ${errors.long_name ? "form-input-error" : ""}`}      
                        />      
                        {errors.long_name && (      
                          <p className="form-error">      
                            <AlertTriangle                             className="error-icon" />        
                            <span>{errors.long_name}</span>        
                          </p>        
                        )}        
                        <p className="form-help">Nom complet détaillé du produit (minimum 5 caractères)</p>        
                      </div>      
      
                      <div className="form-row">        
                        <div className="form-group">        
                          <label htmlFor="gamme" className="form-label">        
                            <TagLabel className="label-icon" />        
                            <span>Gamme</span>        
                          </label>        
                          <input        
                            id="gamme"        
                            type="text"        
                            value={formData.gamme}        
                            onChange={(e) => handleInputChange("gamme", e.target.value)}        
                            placeholder="Ex: Gaz domestique"        
                            className="form-input"        
                          />        
                          <p className="form-help">Gamme ou catégorie du produit</p>        
                        </div>        
      
                        <div className="form-group">        
                          <label htmlFor="brand" className="form-label">        
                            <TagLabel className="label-icon" />        
                            <span>Marque</span>        
                          </label>        
                          <input        
                            id="brand"        
                            type="text"        
                            value={formData.brand}        
                            onChange={(e) => handleInputChange("brand", e.target.value)}        
                            placeholder="Ex: ChronoGaz"        
                            className="form-input"        
                          />        
                          <p className="form-help">Marque du produit</p>        
                        </div>        
                      </div>        
        
                      <div className="form-group">        
                        <label htmlFor="description" className="form-label">        
                          <FileText className="label-icon" />        
                          <span>Description *</span>        
                        </label>        
                        <textarea        
                          id="description"        
                          value={formData.description}        
                          onChange={(e) => handleInputChange("description", e.target.value)}        
                          placeholder="Description détaillée du produit, ses caractéristiques et utilisations..."        
                          rows={4}        
                          className={`form-textarea ${errors.description ? "form-input-error" : ""}`}        
                        />          
                        {errors.description && (          
                          <p className="form-error">          
                            <AlertTriangle className="error-icon" />          
                            <span>{errors.description}</span>          
                          </p>          
                        )}          
                        <p className="form-help">          
                          Description complète du produit (minimum 10 caractères)          
                        </p>          
                      </div>          
                    </div>          
                  </div>    
    
                  {/* Section Unités de Mesure */}    
                  <div className="form-card">    
                    <div className="form-card-header">    
                      <div className="form-card-title">    
                        <TagLabel className="form-card-icon" />    
                        <span>Unités de Mesure</span>    
                      </div>    
                      <button    
                        type="button"    
                        onClick={addUnite}    
                        className="add-btn"    
                      >    
                        <Plus className="btn-icon" />    
                        Ajouter    
                      </button>    
                    </div>    
                    <div className="form-card-content">    
                      {formData.unites_mesure.length === 0 ? (    
                        <p className="empty-state">Aucune unité de mesure ajoutée</p>    
                      ) : (    
                        formData.unites_mesure.map((unite, index) => (    
                          <div key={index} className="unite-item">    
                            <div className="unite-fields">    
                              <div className="form-group">    
                                <label className="form-label">Unité de Mesure</label>    
                                <select    
                                  value={unite.UM_id}    
                                  onChange={(e) => updateUnite(index, "UM_id", e.target.value)}    
                                  className="form-select"    
                                >    
                                  <option value="">Sélectionner une unité</option>    
                                  {availableUMs.map((um) => (    
                                    <option key={um._id} value={um._id}>    
                                      {um.unitemesure}    
                                    </option>    
                                  ))}    
                                </select>    
                              </div>    
                              <div className="form-group">    
                                <label className="form-label">    
                                  <input    
                                    type="checkbox"    
                                    checked={unite.is_principal}    
                                    onChange={(e) => updateUnite(index, "is_principal", e.target.checked)}    
                                    className="form-checkbox"    
                                  />    
                                  Unité principale    
                                </label>    
                              </div>    
                            </div>    
                            <button    
                              type="button"    
                              onClick={() => removeUnite(index)}    
                              className="remove-btn"    
                            >    
                              <Delete className="btn-icon" />    
                            </button>    
                          </div>    
                        ))    
                      )}    
                    </div>    
                  </div>    
                </div>          
          
                {/* Section latérale */}          
                <div className="form-sidebar">          
                  {/* Upload d'image */}          
                  <div className="form-card">          
                    <div className="form-card-header">          
                      <div className="form-card-title">          
                        <ImageIcon className="form-card-icon" />          
                        <span>Image du Produit</span>          
                      </div>          
                    </div>          
                    <div className="form-card-content">          
                      {imagePreview ? (          
                        <div className="image-preview-container">          
                          <img          
                            src={imagePreview}          
                            alt="Aperçu du produit"          
                            className="image-preview"          
                          />          
                          <button          
                            type="button"          
                            onClick={removeImage}          
                            className="image-remove-btn"          
                          >          
                            <X className="remove-icon" />          
                          </button>          
                        </div>          
                      ) : (          
                        <div className="image-placeholder">          
                          <ImageIcon className="placeholder-icon" />          
                          <p className="placeholder-text">Aucune image sélectionnée</p>          
                          <p className="placeholder-help">JPG, PNG ou WebP (max 5MB)</p>          
                        </div>          
                      )}          
          
                      <div className="form-group">          
                        <label htmlFor="image-upload" className="form-label">          
                          <Upload className="label-icon" />          
                          <span>Télécharger une Image</span>          
                        </label>          
                        <input          
                          id="image-upload"          
                          type="file"          
                          accept="image/jpeg,image/jpg,image/png,image/webp"          
                          onChange={handleImageUpload}          
                          className={`form-input-file ${errors.image ? "form-input-error" : ""}`}          
                        />          
                        {errors.image && (          
                          <p className="form-error">          
                            <AlertTriangle className="error-icon" />          
                            <span>{errors.image}</span>          
                          </p>          
                        )}          
                        <p className="form-help">          
                          Image optionnelle du produit (JPG, PNG, WebP - max 5MB)          
                        </p>          
                      </div>          
                    </div>          
                  </div>          
          
                  {/* Actions du formulaire */}          
                  <div className="form-card">          
                    <div className="form-card-header">          
                      <div className="form-card-title">          
                        <span>Actions</span>          
                      </div>          
                    </div>          
                    <div className="form-card-content">          
                      <div className="form-actions-vertical">          
                        <button           
                          type="submit"           
                          disabled={loading}           
                          className="form-btn form-btn-primary"          
                        >          
                          {loading ? (          
                            <>          
                              <div className="loading-spinner" />          
                              Ajout en cours...          
                            </>          
                          ) : (          
                            <>          
                              <Save className="btn-icon" />          
                              Ajouter le Produit          
                            </>          
                          )}          
                        </button>          
          
                        <button          
                          type="button"          
                          onClick={resetForm}          
                          disabled={loading}          
                          className="form-btn form-btn-secondary"          
                        >          
                          <X className="btn-icon" />          
                          Réinitialiser          
                        </button>          
          
                        <div className="form-separator"></div>          
          
                        <button className="form-btn form-btn-outline">          
                          <ArrowLeft className="btn-icon" />          
                          Annuler          
                        </button>          
                      </div>          
                    </div>          
                  </div>          
          
                  {/* Aide */}          
                  <div className="form-card">          
                    <div className="form-card-header">          
                      <div className="form-card-title">          
                        <span>Aide</span>          
                      </div>          
                    </div>          
                    <div className="form-card-content">          
                      <div className="help-content">          
                        <div className="help-item">          
                          <strong>Référence:</strong> Code unique du produit (ex: BUT13)          
                        </div>          
                        <div className="help-item">          
                          <strong>Nom Court:</strong> Nom commercial court          
                        </div>          
                        <div className="help-item">          
                          <strong>Nom Complet:</strong> Nom détaillé du produit          
                        </div>          
                        <div className="help-item">          
                          <strong>Gamme:</strong> Catégorie du produit          
                        </div>          
                        <div className="help-item">          
                          <strong>Marque:</strong> Marque du fabricant          
                        </div>    
                        <div className="help-item">          
                          <strong>Unités:</strong> Unités de mesure disponibles          
                        </div>          
                      </div>          
                    </div>          
                  </div>          
                </div>          
              </div>          
            </form>          
          </main>          
        </div>          
      </div>          
    </div>          
  )          
}