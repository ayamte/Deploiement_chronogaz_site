import { useState, useEffect } from "react"  
import {  
  MdWarehouse as Warehouse,  
  MdSearch as Search,  
  MdAdd as Plus,  
  MdEdit as Edit,  
  MdDelete as Delete,  
  MdClose as X,  
  MdLocationOn as Location  
} from "react-icons/md"  
import "./GestionDepot.css"  
import depotService from '../../../services/depotService'  
  
export default function GestionDepot() {  
  const [searchTerm, setSearchTerm] = useState("")  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)  
  const [depots, setDepots] = useState([])  
  const [editingDepot, setEditingDepot] = useState(null)  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState(null)  
    
  const [formData, setFormData] = useState({  
    reference: "",  
    short_name: "",  
    long_name: "",  
    description: "",  
    surface_area: "",  
    address: ""  // ✅ Corrigé : utilise 'address' au lieu d'address_id
  })  
  
  // Charger les données au montage  
  useEffect(() => {  
    loadDepots()  
  }, [])  
  
  const loadDepots = async () => {  
    try {  
      setLoading(true)  
      const response = await depotService.getAllDepots()  
      setDepots(response.data || [])  
      setError(null)  
    } catch (err) {  
      console.error("Erreur lors du chargement des dépôts:", err)  
      setError("Erreur lors du chargement des données")  
      setDepots([])  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // Filtrer les dépôts selon le terme de recherche  
  const filteredDepots = depots.filter(  
    (depot) =>  
      depot.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      depot.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      depot.long_name?.toLowerCase().includes(searchTerm.toLowerCase())  
  )  
  
  const handleInputChange = (field, value) => {  
    setFormData((prev) => ({  
      ...prev,  
      [field]: value,  
    }))  
  }  
  
  const handleAddSubmit = async (e) => {  
    e.preventDefault()  
    try {  
      const newDepot = {  
        ...formData,  
        surface_area: formData.surface_area ? parseFloat(formData.surface_area) : undefined,  
        createdBy: 'admin'
      }  
        
      await depotService.createDepot(newDepot)  
      await loadDepots()  
        
      // ✅ Corrigé : Réinitialiser avec 'address' au lieu d'address_id
      setFormData({  
        reference: "",  
        short_name: "",  
        long_name: "",  
        description: "",  
        surface_area: "",  
        address: ""  
      })  
      setIsAddDialogOpen(false)  
    } catch (error) {  
      console.error("Erreur lors de l'ajout du dépôt:", error)  
      alert("Erreur lors de l'ajout du dépôt")  
    }  
  }  
  
  const handleEditSubmit = async (e) => {  
    e.preventDefault()  
    try {  
      const updatedDepot = {  
        ...formData,  
        surface_area: formData.surface_area ? parseFloat(formData.surface_area) : undefined  
      }  
        
      await depotService.updateDepot(editingDepot._id, updatedDepot)  
      await loadDepots()  
        
      // ✅ Corrigé : Réinitialiser avec 'address' au lieu d'address_id
      setFormData({  
        reference: "",  
        short_name: "",  
        long_name: "",  
        description: "",  
        surface_area: "",  
        address: ""  
      })  
      setEditingDepot(null)  
      setIsEditDialogOpen(false)  
    } catch (error) {  
      console.error("Erreur lors de la modification du dépôt:", error)  
      alert("Erreur lors de la modification du dépôt")  
    }  
  }  
  
  // ✅ Corrigé : handleEdit utilise maintenant depot.address
  const handleEdit = (depot) => {  
    setEditingDepot(depot)  
    setFormData({  
      reference: depot.reference || "",  
      short_name: depot.short_name || "",  
      long_name: depot.long_name || "",  
      description: depot.description || "",  
      surface_area: depot.surface_area?.toString() || "",  
      address: depot.address || ""  // ✅ Corrigé : depot.address au lieu de depot.address_id
    })  
    setIsEditDialogOpen(true)  
  }  
  
  const handleDelete = async (depotId) => {  
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce dépôt ?")) {  
      try {  
        await depotService.deleteDepot(depotId)  
        await loadDepots()  
      } catch (error) {  
        console.error("Erreur lors de la suppression du dépôt:", error)  
        alert("Erreur lors de la suppression du dépôt")  
      }  
    }  
  }  
  
  // ✅ Corrigé : handleAddClick utilise 'address' au lieu d'address_id
  const handleAddClick = () => {  
    setFormData({  
      reference: "",  
      short_name: "",  
      long_name: "",  
      description: "",  
      surface_area: "",  
      address: ""  // ✅ Corrigé
    })  
    setIsAddDialogOpen(true)  
  }  
  
  if (loading) {  
    return (  
      <div className="depot-management-layout">  
         
        <div className="depot-loading-container">  
          <div className="depot-spinner"></div>  
          <p>Chargement des dépôts...</p>  
        </div>  
      </div>  
    )  
  }  
  
  return (  
    <div className="depot-management-layout">  
      
        
      <div className="depot-management-wrapper">  
        <div className="depot-management-container">  
          <div className="depot-management-content">  
            {/* En-tête */}  
            <div className="depot-page-header">  
              <div className="depot-header-content">  
                <h1 className="depot-page-title">  
                  <Warehouse className="depot-title-icon" />  
                  Gestion des Dépôts  
                </h1>  
                <p className="depot-page-subtitle">  
                  Gérez les dépôts et entrepôts de votre réseau  
                </p>  
              </div>  
            </div>  
  
            {/* Bouton Ajouter Dépôt */}  
            <div className="depot-action-section">  
              <button className="depot-add-button" onClick={handleAddClick}>  
                <Plus className="depot-button-icon" />  
                Ajouter Dépôt  
              </button>  
            </div>  
  
            {/* Barre de recherche */}  
            <div className="depot-search-section">  
              <div className="depot-search-container">  
                <Search className="depot-search-icon" />  
                <input  
                  type="text"  
                  placeholder="Rechercher par référence, nom court ou nom complet..."  
                  value={searchTerm}  
                  onChange={(e) => setSearchTerm(e.target.value)}  
                  className="depot-search-input"  
                />  
              </div>  
            </div>  
  
            {/* Message d'erreur */}  
            {error && (  
              <div className="depot-error-message">  
                <p>{error}</p>  
              </div>  
            )}  
  
            {/* Tableau */}  
            <div className="depot-table-card">  
              <div className="depot-table-header">  
                <h3 className="depot-table-title">Liste des Dépôts</h3>  
              </div>  
              <div className="depot-table-content">  
                <div className="depot-table-container">  
                  <table className="depot-depots-table">  
                    <thead>  
                      <tr>  
                        <th>Référence</th>  
                        <th>Nom court</th>  
                        <th>Nom complet</th>  
                        <th>Surface (m²)</th>  
                        <th>Adresse</th>  
                        <th>Actions</th>  
                      </tr>  
                    </thead>  
                    <tbody>  
                      {filteredDepots.map((depot) => (  
                        <tr key={depot._id}>  
                          <td className="depot-font-medium">{depot.reference}</td>  
                          <td>{depot.short_name}</td>  
                          <td>{depot.long_name}</td>  
                          <td>{depot.surface_area?.toLocaleString() || 'N/A'}</td>  
                          <td>{depot.address || 'N/A'}</td>  
                          <td>  
                            <div className="depot-action-buttons">  
                              <button  
                                className="depot-edit-action-button"  
                                onClick={() => handleEdit(depot)}  
                                title="Modifier"  
                              >  
                                <Edit className="depot-action-icon" />  
                              </button>  
                              <button  
                                className="depot-delete-action-button"  
                                onClick={() => handleDelete(depot._id)}  
                                title="Supprimer"  
                              >  
                                <Delete className="depot-action-icon" />  
                              </button>  
                            </div>  
                          </td>  
                        </tr>  
                      ))}  
                    </tbody>  
                  </table>  
  
                  {filteredDepots.length === 0 && !loading && (  
                    <div className="depot-no-results">  
                      <Warehouse className="depot-empty-icon" />  
                      <p>Aucun dépôt trouvé pour votre recherche.</p>  
                    </div>  
                  )}  
                </div>  
              </div>  
            </div>  
          </div>  
        </div>  
      </div>  
  
      {/* Modal pour ajouter un dépôt */}  
      {isAddDialogOpen && (  
        <div className="depot-modal-overlay" onClick={() => setIsAddDialogOpen(false)}>  
          <div className="depot-modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="depot-modal-header">  
              <h2 className="depot-modal-title">Ajouter Dépôt</h2>  
              <button className="depot-modal-close" onClick={() => setIsAddDialogOpen(false)}>  
                <X className="depot-close-icon" />  
              </button>  
            </div>  
              
            <form onSubmit={handleAddSubmit} className="depot-modal-form">  
              <div className="depot-form-row">  
                <div className="depot-form-group">  
                  <label htmlFor="reference" className="depot-form-label">Référence *</label>  
                  <input  
                    id="reference"  
                    type="text"  
                    placeholder="Ex: DEP-CASA-01"  
                    value={formData.reference}  
                    onChange={(e) => handleInputChange("reference", e.target.value)}  
                    className="depot-form-input"  
                    required  
                  />  
                </div>  
                <div className="depot-form-group">  
                  <label htmlFor="short_name" className="depot-form-label">Nom court *</label>  
                  <input  
                    id="short_name"  
                    type="text"  
                    placeholder="Ex: Dépôt Casa"  
                    value={formData.short_name}  
                    onChange={(e) => handleInputChange("short_name", e.target.value)}  
                    className="depot-form-input"  
                    required  
                  />  
                </div>  
              </div>  
  
              <div className="depot-form-group">  
                <label htmlFor="long_name" className="depot-form-label">Nom complet *</label>  
                <input  
                  id="long_name"  
                  type="text"  
                  placeholder="Ex: Dépôt Casablanca Centre"  
                  value={formData.long_name}  
                  onChange={(e) => handleInputChange("long_name", e.target.value)}  
                  className="depot-form-input"  
                  required  
                />  
              </div>  
  
              <div className="depot-form-group">  
                <label htmlFor="description" className="depot-form-label">Description</label>  
                <textarea  
                  id="description"  
                  placeholder="Description du dépôt..."  
                  value={formData.description}  
                  onChange={(e) => handleInputChange("description", e.target.value)}  
                  className="depot-form-textarea"  
                  rows="3"  
                />  
              </div>  
  
              <div className="depot-form-row">  
                <div className="depot-form-group">  
                  <label htmlFor="surface_area" className="depot-form-label">Surface (m²)</label>  
                  <input  
                    id="surface_area"  
                    type="number"  
                    min="0"  
                    step="0.01"  
                    placeholder="Ex: 2500.5"  
                    value={formData.surface_area}  
                    onChange={(e) => handleInputChange("surface_area", e.target.value)}  
                    className="depot-form-input"  
                  />  
                </div>  
                {/* ✅ Corrigé : Champ address au lieu d'address_id */}  
                <div className="depot-form-group">    
                  <label htmlFor="address" className="depot-form-label">Adresse</label>    
                  <input    
                    id="address"    
                    type="text"    
                    placeholder="Adresse du dépôt"    
                    value={formData.address}    
                    onChange={(e) => handleInputChange("address", e.target.value)}    
                    className="depot-form-input"    
                  />    
                </div>    
              </div>    
    
              <div className="depot-form-actions">    
                <button type="button" className="depot-cancel-button" onClick={() => setIsAddDialogOpen(false)}>    
                  Annuler    
                </button>    
                <button type="submit" className="depot-submit-button">    
                  Ajouter    
                </button>    
              </div>    
            </form>    
          </div>    
        </div>    
      )}    
    
      {/* Modal pour modifier un dépôt */}    
      {isEditDialogOpen && (    
        <div className="depot-modal-overlay" onClick={() => setIsEditDialogOpen(false)}>    
          <div className="depot-modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="depot-modal-header">    
              <h2 className="depot-modal-title">Modifier Dépôt</h2>    
              <button className="depot-modal-close" onClick={() => setIsEditDialogOpen(false)}>    
                <X className="depot-close-icon" />    
              </button>    
            </div>    
                
            <form onSubmit={handleEditSubmit} className="depot-modal-form">    
              <div className="depot-form-row">    
                <div className="depot-form-group">    
                  <label htmlFor="edit-reference" className="depot-form-label">Référence *</label>    
                  <input    
                    id="edit-reference"    
                    type="text"    
                    placeholder="Ex: DEP-CASA-01"    
                    value={formData.reference}    
                    onChange={(e) => handleInputChange("reference", e.target.value)}    
                    className="depot-form-input"    
                    required    
                  />    
                </div>    
                <div className="depot-form-group">    
                  <label htmlFor="edit-short_name" className="depot-form-label">Nom court *</label>    
                  <input    
                    id="edit-short_name"    
                    type="text"    
                    placeholder="Ex: Dépôt Casa"    
                    value={formData.short_name}    
                    onChange={(e) => handleInputChange("short_name", e.target.value)}    
                    className="depot-form-input"    
                    required    
                  />    
                </div>    
              </div>    
    
              <div className="depot-form-group">    
                <label htmlFor="edit-long_name" className="depot-form-label">Nom complet *</label>    
                <input    
                  id="edit-long_name"    
                  type="text"    
                  placeholder="Ex: Dépôt Casablanca Centre"    
                  value={formData.long_name}    
                  onChange={(e) => handleInputChange("long_name", e.target.value)}    
                  className="depot-form-input"    
                  required    
                />    
              </div>    
    
              <div className="depot-form-group">    
                <label htmlFor="edit-description" className="depot-form-label">Description</label>    
                <textarea    
                  id="edit-description"    
                  placeholder="Description du dépôt..."    
                  value={formData.description}    
                  onChange={(e) => handleInputChange("description", e.target.value)}    
                  className="depot-form-textarea"    
                  rows="3"    
                />    
              </div>    
    
              <div className="depot-form-row">    
                <div className="depot-form-group">    
                  <label htmlFor="edit-surface_area" className="depot-form-label">Surface (m²)</label>    
                  <input    
                    id="edit-surface_area"    
                    type="number"    
                    min="0"    
                    step="0.01"    
                    placeholder="Ex: 2500.5"    
                    value={formData.surface_area}    
                    onChange={(e) => handleInputChange("surface_area", e.target.value)}    
                    className="depot-form-input"    
                  />    
                </div>    
                {/* ✅ Corrigé : Champ address au lieu d'address_id dans le modal d'édition */}  
                <div className="depot-form-group">    
                  <label htmlFor="edit-address" className="depot-form-label">Adresse</label>    
                  <input    
                    id="edit-address"    
                    type="text"    
                    placeholder="Adresse du dépôt"    
                    value={formData.address}    
                    onChange={(e) => handleInputChange("address", e.target.value)}    
                    className="depot-form-input"    
                  />    
                </div>    
              </div>    
    
              <div className="depot-form-actions">    
                <button type="button" className="depot-cancel-button" onClick={() => setIsEditDialogOpen(false)}>    
                  Annuler    
                </button>    
                <button type="submit" className="depot-submit-button">    
                  Sauvegarder    
                </button>    
              </div>    
            </form>    
          </div>    
        </div>    
      )}    
    </div>    
  )    
}