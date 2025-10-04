import { useState, useEffect } from "react"
import {
  MdSearch as Search,
  MdAdd as Plus,
  MdBusiness as Business,
  MdLocationOn as Location,
  MdEdit as Edit,
  MdDelete as Delete,
  MdClose as X,
  MdPhone as Phone,
  MdEmail as Email,
  MdExpandMore as ExpandMore,
  MdExpandLess as ExpandLess
} from "react-icons/md"
import "./GestionFournisseur.css"
import fournisseurService from '../../../services/fournisseurService'
import locationService from '../../../services/locationService'

export default function GestionFournisseur() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [fournisseurs, setFournisseurs] = useState([])
  const [editingFournisseur, setEditingFournisseur] = useState(null)
  const [selectedFournisseur, setSelectedFournisseur] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [isEditAddressDialogOpen, setIsEditAddressDialogOpen] = useState(false);  
  const [editingAddress, setEditingAddress] = useState(null);
  
  const [formData, setFormData] = useState({
    code: "",
    nom: "",
    ice: "",
    rc: "",
    ville_rc: "",
    email: "",
    actif: true
  })

  const [addressFormData, setAddressFormData] = useState({
    adresse: "",
    ville_id: "",
    code_postal: "",
    type_adresse: "SIÈGE SOCIAL",
    is_principal: false
  })

  // Charger les données au montage du composant
  useEffect(() => {
    loadFournisseurs()
    loadCities()
  }, [])

  const loadFournisseurs = async () => {  
    try {  
      setLoading(true)  
      const response = await fournisseurService.getAllFournisseurs()  
      
      if (response && response.success) {  
        setFournisseurs(response.data)  
      } else {  
        console.error('Erreur dans la réponse:', response)  
      }  
    } catch (error) {  
      console.error("Erreur complète:", error)  
    } finally {  
      setLoading(false)  
    }  
  }

  const loadCities = async () => {
    try {
      setLoadingCities(true)
      const response = await locationService.getCities()
      setCities(response.data || [])
    } catch (error) {
      console.error('Erreur chargement villes:', error)
    } finally {
      setLoadingCities(false)
    }
  }

  // Filtrer les fournisseurs selon le terme de recherche
  const filteredFournisseurs = fournisseurs.filter(
    (fournisseur) =>
      fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fournisseur.ice && fournisseur.ice.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fournisseur.email && fournisseur.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Calculer les statistiques
  const totalFournisseurs = fournisseurs.length
  const fournisseursActifs = fournisseurs.filter((f) => f.actif).length
  const fournisseursAvecICE = fournisseurs.filter((f) => f.ice && f.ice.trim() !== "").length
  const fournisseursAvecEmail = fournisseurs.filter((f) => f.email && f.email.trim() !== "").length


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressInputChange = (field, value) => {
    setAddressFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fournisseurService.createFournisseur(formData)
      if (response.success) {
        await loadFournisseurs()
        resetForm()
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du fournisseur:", error)
    }
  }

  const handleAddClick = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fournisseurService.updateFournisseur(editingFournisseur._id, formData)
      if (response.success) {
        await loadFournisseurs()
        resetForm()
        setEditingFournisseur(null)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Erreur lors de la modification du fournisseur:", error)
    }
  }

  const handleEdit = (fournisseur) => {
    setEditingFournisseur(fournisseur)
    setFormData({
      code: fournisseur.code,
      nom: fournisseur.nom,
      ice: fournisseur.ice || "",
      rc: fournisseur.rc || "",
      ville_rc: fournisseur.ville_rc || "",
      email: fournisseur.email || "",
      actif: fournisseur.actif
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (fournisseurId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      try {
        const response = await fournisseurService.deleteFournisseur(fournisseurId)
        if (response.success) {
          await loadFournisseurs()
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du fournisseur:", error)
      }
    }
  }

  const handleAddAddress = (fournisseur) => {
    setSelectedFournisseur(fournisseur)
    resetAddressForm()
    setIsAddressDialogOpen(true)
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fournisseurService.addAdresseFournisseur(
        selectedFournisseur._id, 
        addressFormData
      )
      if (response.success) {
        await loadFournisseurs()
        resetAddressForm()
        setIsAddressDialogOpen(false)
        setSelectedFournisseur(null)
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'adresse:", error)
    }
  }


  // Fonction pour modifier une adresse  
const handleEditAddress = (adresse) => {  
  setEditingAddress(adresse);  
  setAddressFormData({  
    adresse: adresse.adresse,  
    ville_id: adresse.ville_id?._id || '',  
    code_postal: adresse.code_postal || '',  
    type_adresse: adresse.type_adresse,  
    is_principal: adresse.is_principal  
  });  
  setIsEditAddressDialogOpen(true);  
};  
  
// Fonction pour supprimer une adresse  
const handleDeleteAddress = async (adresseId) => {  
  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) {  
    try {  
      const response = await fournisseurService.deleteAdresseFournisseur(adresseId);  
      if (response.success) {  
        await loadFournisseurs();  
      }  
    } catch (error) {  
      console.error("Erreur lors de la suppression de l'adresse:", error);  
    }  
  }  
};

  const toggleRowExpansion = (fournisseurId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(fournisseurId)) {
      newExpanded.delete(fournisseurId)
    } else {
      newExpanded.add(fournisseurId)
    }
    setExpandedRows(newExpanded)
  }

  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      ice: "",
      rc: "",
      ville_rc: "",
      email: "",
      actif: true
    })
  }

  const resetAddressForm = () => {
    setAddressFormData({
      adresse: "",
      ville_id: "",
      code_postal: "",
      type_adresse: "SIÈGE SOCIAL",
      is_principal: false
    })
  }

  const getStatutBadge = (actif) => {
    return actif ? 
      <span className="badge badge-actif">Actif</span> : 
      <span className="badge badge-inactif">Inactif</span>
  }

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  return (
    <div className="fournisseur-management-layout">

        
      <div className="fournisseur-management-wrapper">
        <div className="fournisseur-management-container">
          <div className="fournisseur-management-content">
            {/* En-tête */}
            <div className="page-header">
              <h1 className="page-title">Gestion des Fournisseurs</h1>
              <p className="page-subtitle">Gérez votre réseau de fournisseurs</p>
            </div>

            {/* 4 Cards en haut avec gradient */}
            <div className="stats-grid">
              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Total Fournisseurs</h3>
                    <div className="stat-value">{totalFournisseurs}</div>
                    <p className="stat-description">Fournisseurs enregistrés</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Actifs</h3>
                    <div className="stat-value">{fournisseursActifs}</div>
                    <p className="stat-description">Fournisseurs actifs</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Avec ICE</h3>
                    <div className="stat-value">{fournisseursAvecICE}</div>
                    <p className="stat-description">ICE renseigné</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Avec Email</h3>
                    <div className="stat-value">{fournisseursAvecEmail}</div>
                    <p className="stat-description">Email renseigné</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Ajouter Fournisseur */}
            <div className="action-section">
              <button className="add-button" onClick={handleAddClick}>
                <Plus className="button-icon" />
                Ajouter Fournisseur
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="search-section">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code, ICE ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Tableau */}
            <div className="table-card">
              <div className="table-header">
                <h3 className="table-title">Liste des Fournisseurs</h3>
              </div>
              <div className="table-content">
                <div className="table-container">
                  <table className="fournisseurs-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Code</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Statut</th>
                        <th>Adresses</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFournisseurs.map((fournisseur) => (
                        <>
                          <tr key={fournisseur._id}>
                            <td>
                              <button 
                                className="expand-button"
                                onClick={() => toggleRowExpansion(fournisseur._id)}
                              >
                                {expandedRows.has(fournisseur._id) ? 
                                  <ExpandLess className="expand-icon" /> : 
                                  <ExpandMore className="expand-icon" />
                                }
                              </button>
                            </td>
                            <td className="font-medium">{fournisseur.code}</td>
                            <td>{fournisseur.nom}</td>
                            <td>{fournisseur.email || '-'}</td>
                            <td>{getStatutBadge(fournisseur.actif)}</td>
                            <td>
                              <span className="address-count">
                                {fournisseur.adresses?.length || 0} adresse(s)
                              </span>
                            </td>
                            <td>  
                            <div className="action-buttons">  
                                <button   
                                className="edit-action-button"  
                                onClick={() => handleEdit(fournisseur)}  
                                >  
                                <Edit className="action-icon" />  
                                </button>  
                                <button   
                                className="add-address-button"  
                                onClick={() => handleAddAddress(fournisseur)}  
                                title="Ajouter une adresse"  
                                >  
                                Ajouter adresse  
                                </button>  
                                <button   
                                className="delete-action-button"  
                                onClick={() => handleDelete(fournisseur._id)}  
                                >  
                                <Delete className="action-icon" />  
                                </button>  
                            </div>  
                            </td>
                          </tr>
                          
                          {/* Ligne étendue pour les adresses */}
                          {expandedRows.has(fournisseur._id) && (
                            <tr className="expanded-row">
                              <td colSpan="7">
                                <div className="addresses-section">
                                  <h4 className="addresses-title">  
                                    <Location className="location-icon" />  
                                    Adresses du fournisseur  
                                  </h4>  
                                    
                                  {fournisseur.adresses && fournisseur.adresses.length > 0 ? (  
                                    <div className="addresses-list">  
                                      {fournisseur.adresses.map((adresse) => (  
                                        <div key={adresse._id} className="address-item">  
                                          <div className="address-info">  
                                            <div className="address-main">  
                                              <span className="address-text">{adresse.adresse}</span>  
                                              <span className="address-city">{adresse.ville_id?.name}</span>  
                                              {adresse.code_postal && (  
                                                <span className="address-postal">{adresse.code_postal}</span>  
                                              )}  
                                            </div>  
                                            <div className="address-meta">  
                                              <span className="address-type">{adresse.type_adresse}</span>  
                                              {adresse.is_principal && (  
                                                <span className="address-principal">Principal</span>  
                                              )}  
                                            </div>  
                                          </div>  
                                          
                                        </div>  
                                      ))}  
                                    </div>  
                                  ) : (  
                                    <div className="no-addresses">  
                                      <p>Aucune adresse enregistrée pour ce fournisseur.</p>  
                                      <button   
                                        className="add-first-address-button"  
                                        onClick={() => handleAddAddress(fournisseur)}  
                                      >  
                                        <Plus className="button-icon" />  
                                        Ajouter la première adresse  
                                      </button>  
                                    </div>  
                                  )}  
                                </div>  
                              </td>  
                            </tr>  
                          )}  
                        </>  
                      ))}  
                    </tbody>  
                  </table>  
                  {filteredFournisseurs.length === 0 && (  
                    <div className="no-results">  
                      Aucun fournisseur trouvé pour votre recherche.  
                    </div>  
                  )}  
                </div>  
              </div>  
            </div>  
          </div>  
        </div>  
      </div>  
  
      {/* Modal pour ajouter un fournisseur */}  
      {isAddDialogOpen && (  
        <div className="modal-overlay" onClick={() => setIsAddDialogOpen(false)}>  
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">Ajouter Fournisseur</h2>  
              <button className="modal-close" onClick={() => setIsAddDialogOpen(false)}>  
                <X className="close-icon" />  
              </button>  
            </div>  
                  
            <form onSubmit={handleAddSubmit} className="modal-form">  
              <div className="form-group">  
                <label htmlFor="code" className="form-label">Code fournisseur</label>  
                <input  
                  id="code"  
                  type="text"  
                  placeholder="Ex: FRS001"  
                  value={formData.code}  
                  onChange={(e) => handleInputChange("code", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="nom" className="form-label">Nom du fournisseur</label>  
                <input  
                  id="nom"  
                  type="text"  
                  placeholder="Ex: Société ABC"  
                  value={formData.nom}  
                  onChange={(e) => handleInputChange("nom", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="ice" className="form-label">ICE</label>  
                <input  
                  id="ice"  
                  type="text"  
                  placeholder="Ex: 123456789000123"  
                  value={formData.ice}  
                  onChange={(e) => handleInputChange("ice", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="rc" className="form-label">Registre de commerce</label>  
                <input  
                  id="rc"  
                  type="text"  
                  placeholder="Ex: RC123456"  
                  value={formData.rc}  
                  onChange={(e) => handleInputChange("rc", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="ville_rc" className="form-label">Ville RC</label>  
                <input  
                  id="ville_rc"  
                  type="text"  
                  placeholder="Ex: Casablanca"  
                  value={formData.ville_rc}  
                  onChange={(e) => handleInputChange("ville_rc", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="email" className="form-label">Email</label>  
                <input  
                  id="email"  
                  type="email"  
                  placeholder="Ex: contact@fournisseur.ma"  
                  value={formData.email}  
                  onChange={(e) => handleInputChange("email", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="modal-actions">  
                <button type="button" className="cancel-button" onClick={() => setIsAddDialogOpen(false)}>  
                  Annuler  
                </button>  
                <button type="submit" className="submit-button">  
                  Ajouter Fournisseur  
                </button>  
              </div>  
            </form>  
          </div>  
        </div>  
      )}  
  
      {/* Modal pour modifier un fournisseur */}  
      {isEditDialogOpen && (  
        <div className="modal-overlay" onClick={() => setIsEditDialogOpen(false)}>  
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">Modifier Fournisseur</h2>  
              <button className="modal-close" onClick={() => setIsEditDialogOpen(false)}>  
                <X className="close-icon" />  
              </button>  
            </div>  
                  
            <form onSubmit={handleEditSubmit} className="modal-form">  
              <div className="form-group">  
                <label htmlFor="edit-code" className="form-label">Code fournisseur</label>  
                <input  
                  id="edit-code"  
                  type="text"  
                  placeholder="Ex: FRS001"  
                  value={formData.code}  
                  onChange={(e) => handleInputChange("code", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-nom" className="form-label">Nom du fournisseur</label>  
                <input  
                  id="edit-nom"  
                  type="text"  
                  placeholder="Ex: Société ABC"  
                  value={formData.nom}  
                  onChange={(e) => handleInputChange("nom", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-ice" className="form-label">ICE</label>  
                <input  
                  id="edit-ice"  
                  type="text"  
                  placeholder="Ex: 123456789000123"  
                  value={formData.ice}  
                  onChange={(e) => handleInputChange("ice", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-rc" className="form-label">Registre de commerce</label>  
                <input  
                  id="edit-rc"  
                  type="text"  
                  placeholder="Ex: RC123456"  
                  value={formData.rc}  
                  onChange={(e) => handleInputChange("rc", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-ville_rc" className="form-label">Ville RC</label>  
                <input  
                  id="edit-ville_rc"  
                  type="text"  
                  placeholder="Ex: Casablanca"  
                  value={formData.ville_rc}  
                  onChange={(e) => handleInputChange("ville_rc", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-email" className="form-label">Email</label>  
                <input  
                  id="edit-email"  
                  type="email"  
                  placeholder="Ex: contact@fournisseur.ma"  
                  value={formData.email}  
                  onChange={(e) => handleInputChange("email", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-actif" className="form-label">Statut</label>  
                <select  
                  id="edit-actif"  
                  value={formData.actif}  
                  onChange={(e) => handleInputChange("actif", e.target.value === "true")}  
                  className="form-select"  
                  required  
                >  
                  <option value={true}>Actif</option>  
                  <option value={false}>Inactif</option>  
                </select>  
              </div>  
  
              <div className="modal-actions">  
                <button type="button" className="cancel-button" onClick={() => setIsEditDialogOpen(false)}>  
                  Annuler  
                </button>  
                <button type="submit" className="submit-button">  
                  Modifier Fournisseur  
                </button>  
              </div>  
            </form>  
          </div>  
        </div>  
      )}  
  
      {/* Modal pour ajouter une adresse */}  
      {isAddressDialogOpen && (  
        <div className="modal-overlay" onClick={() => setIsAddressDialogOpen(false)}>  
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">  
                Ajouter une adresse - {selectedFournisseur?.nom}  
              </h2>  
              <button className="modal-close" onClick={() => setIsAddressDialogOpen(false)}>  
                <X className="close-icon" />  
              </button>  
            </div>  
                  
            <form onSubmit={handleAddressSubmit} className="modal-form">  
              <div className="form-group">  
                <label htmlFor="adresse" className="form-label">Adresse</label>  
                <input  
                  id="adresse"  
                  type="text"  
                  placeholder="Ex: 123 Rue Mohammed V"  
                  value={addressFormData.adresse}  
                  onChange={(e) => handleAddressInputChange("adresse", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="ville_id" className="form-label">Ville</label>  
                <select  
                  id="ville_id"  
                  value={addressFormData.ville_id}  
                  onChange={(e) => handleAddressInputChange("ville_id", e.target.value)}  
                  className="form-select"  
                  disabled={loadingCities}  
                  required  
                >  
                  <option value="">Sélectionner une ville</option>  
                  {cities.map(city => (  
                    <option key={city._id} value={city._id}>  
                      {city.name}  
                    </option>  
                  ))}  
                </select>  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="code_postal" className="form-label">Code postal</label>  
                <input  
                  id="code_postal"  
                  type="text"  
                  placeholder="Ex: 20000"  
                  value={addressFormData.code_postal}  
                  onChange={(e) => handleAddressInputChange("code_postal", e.target.value)}  
                  className="form-input"  
                />  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="type_adresse" className="form-label">Type d'adresse</label>  
                <select  
                  id="type_adresse"  
                  value={addressFormData.type_adresse}  
                  onChange={(e) => handleAddressInputChange("type_adresse", e.target.value)}  
                  className="form-select"  
                  required  
                >  
                  <option value="SIÈGE SOCIAL">Siège social</option>  
                  <option value="ENTREPÔT">Entrepôt</option>  
                  <option value="BUREAU">Bureau</option>  
                  <option value="AUTRE">Autre</option>  
                </select>  
              </div>  
  
              <div className="form-group">  
                <label className="checkbox-label">  
                  <input  
                    type="checkbox"  
                    checked={addressFormData.is_principal}  
                    onChange={(e) => handleAddressInputChange("is_principal", e.target.checked)}  
                    className="form-checkbox"  
                  />  
                  Adresse principale  
                </label>  
              </div>  
  
              <div className="modal-actions">  
                <button type="button" className="cancel-button" onClick={() => setIsAddressDialogOpen(false)}>  
                  Annuler  
                </button>  
                <button type="submit" className="submit-button">  
                    Ajouter Adresse  
                </button> 
              </div>  
            </form>  
          </div>  
        </div>  
      )}  
    </div>  
  )  
}