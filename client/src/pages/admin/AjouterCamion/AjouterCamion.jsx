import { useState } from "react"            
import {              
  MdLocalShipping as Truck,               
  MdUpload as Upload,              
  MdSave as Save,              
  MdClose as X,              
  MdCheckCircle as CheckCircle,              
  MdWarning as AlertTriangle,              
  MdArrowBack as ArrowLeft,              
  MdImage as ImageIcon,              
  MdTag as Hash,              
  MdDescription as FileText,              
  MdLabel as TagLabel            
} from "react-icons/md"        
import "./AjouterCamion.css"             
import truckService from '../../../services/truckService'    
import { useNavigate } from "react-router-dom"    
          
export default function AjouterCamion() {         
  const navigate = useNavigate()    
  const [formData, setFormData] = useState({          
    matricule: "",          
    brand: "",          
    modele: "",        
    description: "",        
    fuel: "DIESEL",        
    anneecontruction: "",        
    puissancefiscale: "",      
    gps: "",      
    capacite: "",      
    image: null,    
    status: "Disponible"  
  })    
        
  const [errors, setErrors] = useState({})        
  const [loading, setLoading] = useState(false)        
  const [showSuccess, setShowSuccess] = useState(false)        
  const [imagePreview, setImagePreview] = useState(null)        
        
  // Fonction de validation        
  const validateForm = () => {        
    const newErrors = {}        
        
    // Validation du matricule        
    if (!formData.matricule.trim()) {        
      newErrors.matricule = "Le matricule est obligatoire."        
    } else if (!/^[A-Z0-9-]+$/.test(formData.matricule.trim())) {        
      newErrors.matricule = "Le matricule doit contenir uniquement des lettres majuscules, chiffres et tirets."        
    }        
        
    // Validation de la marque        
    if (!formData.brand.trim()) {        
      newErrors.brand = "La marque est obligatoire."        
    } else if (formData.brand.trim().length < 2) {        
      newErrors.brand = "La marque doit contenir au moins 2 caractères."        
    }        
      
    // Validation du modèle      
    if (!formData.modele.trim()) {        
      newErrors.modele = "Le modèle est obligatoire."        
    } else if (formData.modele.trim().length < 2) {        
      newErrors.modele = "Le modèle doit contenir au moins 2 caractères."        
    }        
        
    // Validation de la capacité        
    if (!formData.capacite.trim()) {        
      newErrors.capacite = "La capacité est obligatoire."        
    }        
        
    // Validation de l'année de construction    
    if (formData.anneecontruction && (formData.anneecontruction < 1900 || formData.anneecontruction > new Date().getFullYear())) {    
      newErrors.anneecontruction = "L'année de construction doit être valide."    
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
        
  const handleSubmit = async (e) => {      
    e.preventDefault()      
        
    const validationErrors = validateForm()      
    if (Object.keys(validationErrors).length > 0) {      
      setErrors(validationErrors)      
      return      
    }      
        
    setLoading(true)      
    try {      
      // CORRIGÉ: Mapper les champs pour correspondre EXACTEMENT au modèle backend
      const mappedData = {    
        matricule: formData.matricule,    
        brand: formData.brand,  
        modele: formData.modele,    
        description: formData.description,    
        fuel: formData.fuel,  // CORRIGÉ: garder fuel comme dans le modèle
        anneecontruction: formData.anneecontruction ? parseInt(formData.anneecontruction) : undefined,    
        puissancefiscale: formData.puissancefiscale ? parseInt(formData.puissancefiscale) : undefined,    
        gps: formData.gps,  
        capacite: formData.capacite,    
        status: formData.status,    
        image: formData.image,
        createdBy: 'admin'
      }
        
      await truckService.createTruck(mappedData)      
        
      setShowSuccess(true)      
        
      // Réinitialiser le formulaire après soumission réussie      
      setTimeout(() => {      
        navigate('/admin/gestion-camions')    
      }, 3000)      
    } catch (error) {      
      console.error("Erreur lors de l'ajout du camion:", error)      
      setErrors({ matricule: "Erreur lors de l'ajout du camion. Veuillez réessayer." })      
    } finally {      
      setLoading(false)      
    }      
  }       
        
  const resetForm = () => {        
    setFormData({        
      matricule: "",        
      brand: "",        
      modele: "",      
      description: "",      
      fuel: "DIESEL",      
      anneecontruction: "",      
      puissancefiscale: "",    
      gps: "",    
      capacite: "",    
      image: null,        
      status: "Disponible"  
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
      <div className="truck-management-layout">       
        <div className="truck-management-wrapper">        
          <div className="truck-management-container">        
            <main className="truck-main">        
              <div className="success-card">        
                <div className="success-content">        
                  <div className="success-icon">        
                    <CheckCircle className="success-check" />        
                  </div>        
                  <h3 className="success-title">Camion Ajouté avec Succès</h3>        
                  <p className="success-message">        
                    Le camion <strong>{formData.matricule}</strong> a été ajouté à la flotte.        
                  </p>        
                  <div className="success-actions">        
                    <button         
                      className="success-btn success-btn-primary"         
                      onClick={() => navigate('/admin/ajouter-camion')}        
                    >        
                      <Truck className="btn-icon" />        
                      Ajouter un Autre Camion        
                    </button>        
                    <button     
                      className="success-btn success-btn-secondary"    
                      onClick={() => navigate('/admin/gestion-camions')}    
                    >        
                      Voir Tous les Camions        
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
    <div className="truck-management-layout">        
      <div className="truck-management-wrapper">        
        <div className="truck-management-container">        
          <main className="truck-main">        
            <div className="page-header">        
              <div className="page-header-content">        
                <div className="page-header-left">        
                  <button     
                    className="back-button"    
                    onClick={() => navigate('/admin/gestion-camions')}    
                  >    
                    <ArrowLeft className="btn-icon" />    
                    Retour    
                  </button>    
                  <h2 className="page-title">+ Ajouter un Nouveau Camion</h2>        
                  <p className="page-subtitle">        
                    Ajoutez un nouveau camion à votre flotte avec toutes les informations nécessaires        
                  </p>        
                </div>        
              </div>        
            </div>        
        
            <form onSubmit={handleSubmit} className="truck-form">        
              <div className="form-grid">        
                {/* Section principale du formulaire */}        
                <div className="form-main">        
                  {/* Informations de base */}        
                  <div className="form-card">        
                    <div className="form-card-header">        
                      <div className="form-card-title">        
                        <Truck className="form-card-icon" />        
                        <span>Informations de Base</span>        
                      </div>        
                    </div>        
                    <div className="form-card-content">        
                      <div className="form-row">        
                        <div className="form-group">        
                          <label htmlFor="matricule" className="form-label">        
                            <Hash className="label-icon" />        
                            <span>Matricule *</span>        
                          </label>        
                          <input        
                            id="matricule"        
                            type="text"        
                            value={formData.matricule}        
                            onChange={(e) => handleInputChange("matricule", e.target.value.toUpperCase())}        
                            placeholder="Ex: AB-123-CD"        
                            className={`form-input ${errors.matricule ? "form-input-error" : ""}`}        
                          />        
                          {errors.matricule && (        
                            <p className="form-error">        
                              <AlertTriangle className="error-icon" />        
                              <span>{errors.matricule}</span>        
                            </p>        
                          )}        
                          <p className="form-help">        
                            Numéro d'immatriculation unique        
                          </p>        
                        </div>        
        
                        <div className="form-group">        
                          <label htmlFor="brand" className="form-label">        
                            <FileText className="label-icon" />        
                            <span>Marque *</span>        
                          </label>        
                          <input        
                            id="brand"        
                            type="text"        
                            value={formData.brand}        
                            onChange={(e) => handleInputChange("brand", e.target.value)}        
                            placeholder="Ex: Mercedes"        
                            className={`form-input ${errors.brand ? "form-input-error" : ""}`}        
                          />        
                          {errors.brand && (        
                            <p className="form-error">        
                              <AlertTriangle className="error-icon" />        
                              <span>{errors.brand}</span>        
                            </p>        
                          )}        
                          <p className="form-help">Marque du camion (minimum 2 caractères)</p>        
                        </div>        
                      </div>        
      
                      <div className="form-row">        
                        <div className="form-group">        
                          <label htmlFor="modele" className="form-label">        
                            <TagLabel className="label-icon" />        
                            <span>Modèle *</span>        
                          </label>        
                          <input        
                            id="modele"        
                            type="text"        
                            value={formData.modele}        
                            onChange={(e) => handleInputChange("modele", e.target.value)}        
                            placeholder="Ex: Actros"        
                            className={`form-input ${errors.modele ? "form-input-error" : ""}`}        
                          />        
                          {errors.modele && (        
                            <p className="form-error">        
                              <AlertTriangle className="error-icon" />        
                              <span>{errors.modele}</span>        
                            </p>        
                          )}        
                          <p className="form-help">Modèle du camion</p>        
                        </div>        
      
                        <div className="form-group">        
                          <label htmlFor="capacite" className="form-label">        
                            <TagLabel className="label-icon" />        
                            <span>Capacité *</span>        
                          </label>        
                          <input        
                            id="capacite"        
                            type="text"        
                            value={formData.capacite}        
                            onChange={(e) => handleInputChange("capacite", e.target.value)}        
                            placeholder="Ex: 25 tonnes"        
                            className={`form-input ${errors.capacite ? "form-input-error" : ""}`}        
                          />        
                          {errors.capacite && (        
                            <p className="form-error">          
                              <AlertTriangle className="error-icon" />          
                              <span>{errors.capacite}</span>          
                            </p>          
                          )}          
                          <p className="form-help">Capacité de chargement</p>          
                        </div>          
                      </div>          
      
                      <div className="form-row">          
                        <div className="form-group">          
                          <label htmlFor="fuel" className="form-label">          
                            <TagLabel className="label-icon" />          
                            <span>Carburant</span>          
                          </label>          
                          <select          
                            id="fuel"          
                            value={formData.fuel}          
                            onChange={(e) => handleInputChange("fuel", e.target.value)}          
                            className="form-select"          
                          >          
                            <option value="DIESEL">Diesel</option>          
                            <option value="ESSENCE">Essence</option>          
                            <option value="ELECTRIQUE">Électrique</option>          
                            <option value="HYBRIDE">Hybride</option>          
                          </select>          
                          <p className="form-help">Type de carburant utilisé</p>          
                        </div>          
      
                        <div className="form-group">          
                          <label htmlFor="anneecontruction" className="form-label">          
                            <TagLabel className="label-icon" />          
                            <span>Année de construction</span>          
                          </label>          
                          <input          
                            id="anneecontruction"          
                            type="number"          
                            min="1900"          
                            max={new Date().getFullYear()}          
                            value={formData.anneecontruction}          
                            onChange={(e) => handleInputChange("anneecontruction", e.target.value)}          
                            placeholder="Ex: 2020"          
                            className={`form-input ${errors.anneecontruction ? "form-input-error" : ""}`}          
                          />          
                          {errors.anneecontruction && (          
                            <p className="form-error">          
                              <AlertTriangle className="error-icon" />          
                              <span>{errors.anneecontruction}</span>          
                            </p>          
                          )}          
                          <p className="form-help">Année de fabrication du véhicule</p>          
                        </div>          
                      </div>          
      
                      <div className="form-row">          
                        <div className="form-group">          
                          <label htmlFor="puissancefiscale" className="form-label">          
                            <TagLabel className="label-icon" />          
                            <span>Puissance fiscale</span>          
                          </label>          
                          <input          
                            id="puissancefiscale"          
                            type="number"          
                            min="0"          
                            value={formData.puissancefiscale}          
                            onChange={(e) => handleInputChange("puissancefiscale", e.target.value)}          
                            placeholder="Ex: 15"          
                            className="form-input"          
                          />          
                          <p className="form-help">Puissance fiscale en CV</p>          
                        </div>          
      
                        <div className="form-group">          
                          <label htmlFor="gps" className="form-label">          
                            <TagLabel className="label-icon" />          
                            <span>GPS</span>          
                          </label>          
                          <input          
                            id="gps"          
                            type="text"          
                            value={formData.gps}          
                            onChange={(e) => handleInputChange("gps", e.target.value)}          
                            placeholder="Ex: Garmin DriveSmart 65"          
                            className="form-input"          
                          />          
                          <p className="form-help">Système GPS installé</p>          
                        </div>          
                      </div>          
          
                      <div className="form-group">          
                        <label htmlFor="description" className="form-label">          
                          <FileText className="label-icon" />          
                          <span>Description</span>          
                        </label>          
                        <textarea          
                          id="description"          
                          value={formData.description}          
                          onChange={(e) => handleInputChange("description", e.target.value)}          
                          placeholder="Description détaillée du camion, ses caractéristiques et équipements..."          
                          rows={4}          
                          className="form-textarea"          
                        />            
                        <p className="form-help">            
                          Description complète du camion (optionnel)            
                        </p>            
                      </div>       
    
                      <div className="form-group">            
                        <label htmlFor="status" className="form-label">            
                          <TagLabel className="label-icon" />            
                          <span>Statut</span>            
                        </label>            
                        <select            
                          id="status"            
                          value={formData.status}            
                          onChange={(e) => handleInputChange("status", e.target.value)}            
                          className="form-select"            
                        >            
                          <option value="Disponible">Disponible</option>            
                          <option value="En maintenance">En maintenance</option>            
                          <option value="En mission">En mission</option>            
                          <option value="Hors service">Hors service</option>            
                        </select>            
                        <p className="form-help">Statut opérationnel du camion</p>            
                      </div>         
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
                        <span>Image du Camion</span>            
                      </div>            
                    </div>            
                    <div className="form-card-content">            
                      {imagePreview ? (            
                        <div className="image-preview-container">            
                          <img            
                            src={imagePreview}            
                            alt="Aperçu du camion"            
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
                          Image optionnelle du camion (JPG, PNG, WebP - max 5MB)            
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
                              Ajouter le Camion            
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
            
                        <button       
                          type="button"      
                          className="form-btn form-btn-outline"      
                          onClick={() => navigate('/admin/gestion-camions')}      
                        >            
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
                          <strong>Matricule:</strong> Numéro d'immatriculation unique (ex: AB-123-CD)            
                        </div>            
                        <div className="help-item">            
                          <strong>Marque:</strong> Constructeur du véhicule            
                        </div>            
                        <div className="help-item">            
                          <strong>Modèle:</strong> Modèle spécifique du camion            
                        </div>            
                        <div className="help-item">            
                          <strong>Capacité:</strong> Capacité de chargement            
                        </div>            
                        <div className="help-item">            
                          <strong>Carburant:</strong> Type de carburant utilisé            
                        </div>            
                        <div className="help-item">            
                          <strong>Image:</strong> Photo du camion (optionnel)            
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

