import { useState, useEffect } from "react"  
import { useNavigate } from "react-router-dom"  
import {     
  MdSearch as Search,     
  MdAdd as Plus,     
  MdLocalShipping as Truck,     
  MdPeople as Users,     
  MdLocationOn as MapPin,     
  MdVisibility as Eye,  
  MdEdit as Edit,  
  MdDelete as Delete,
  MdImage as ImageIcon,
  MdPerson as Person,
  MdClose as X
} from "react-icons/md"    
import "./gestionCamion.css"  
import truckService from '../../../services/truckService' 
import { employeeService } from '../../../services/employeeService'

export default function TruckManagement() {  
  const navigate = useNavigate()    
  const [searchTerm, setSearchTerm] = useState("")  
  const [trucks, setTrucks] = useState([])  
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState(null)
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    matricule: "",
    brand: "",
    modele: "",
    capacite: "",
    fuel: "DIESEL",
    anneecontruction: "",
    puissancefiscale: "",
    gps: "",
    description: "",
    driver: "",
    accompagnant: "",
    status: "Disponible",
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {  
    loadData()  
  }, [])  

  const loadData = async () => {      
    try {      
      setLoading(true)      
      const [trucksResponse, employeesResponse] = await Promise.all([
        truckService.getAllTrucks(),
        employeeService.getAll()
      ])
      
      console.log('Trucks response:', trucksResponse)
      console.log('Employees response:', employeesResponse)
      
      setTrucks(trucksResponse.data || [])
      setEmployees(employeesResponse.data || [])
      setError(null)      
    } catch (err) {      
      console.error("Erreur lors du chargement des données:", err)      
      setError("Erreur lors du chargement des données")      
      setTrucks([])
      setEmployees([])      
    } finally {      
      setLoading(false)      
    }      
  }

  const getStatusBadge = (statut) => {    
    switch (statut) {    
      case "Disponible":    
        return <span className="badge badge-available">Disponible</span>    
      case "En maintenance":    
        return <span className="badge badge-maintenance">En maintenance</span>    
      case "En mission":    
        return <span className="badge badge-mission">En mission</span>    
      case "Hors service":  
        return <span className="badge badge-out-of-service">Hors service</span>  
      default:    
        return <span className="badge badge-default">{statut}</span>    
    }    
  }

  // ✅ CORRIGÉ: Fonction qui gère les deux structures de données
  const getEmployeeName = (employee) => {    
    if (!employee) return 'Non assigné'    
    if (employee.name) return employee.name    
      
    // Nouvelle structure (API employees avec user_info)
    if (employee.user_info) {    
      return `${employee.user_info.first_name} ${employee.user_info.last_name}`    
    }  
      
    // Ancienne structure (API trucks avec populate physical_user_id)
    if (employee.physical_user_id) {  
      return `${employee.physical_user_id.first_name} ${employee.physical_user_id.last_name}`  
    }  
      
    return 'Non assigné'    
  }

  // ✅ CORRIGÉ: Fonction pour obtenir l'email avec les deux structures
  const getEmployeeEmail = (employee) => {
    if (!employee) return null
    
    // Nouvelle structure (API employees)
    if (employee.user_info?.email) {
      return employee.user_info.email
    }
    
    // Ancienne structure (API trucks avec populate)
    if (employee.physical_user_id?.email) {
      return employee.physical_user_id.email
    }
    
    return null
  }

  const handleViewDetails = async (truckId) => {
    try {
      const response = await truckService.getTruckById(truckId)
      if (response.success) {
        console.log('Truck details:', response.data)
        setSelectedTruck(response.data)
        setIsDetailModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      alert("Erreur lors du chargement des détails")
    }
  }

  const handleEdit = async (truckId) => {
    try {
      const response = await truckService.getTruckById(truckId)
      if (response.success) {
        const truck = response.data
        setFormData({
          matricule: truck.matricule || "",
          brand: truck.brand || "",
          modele: truck.modele || "",
          capacite: truck.capacite || "",
          fuel: truck.fuel || "DIESEL",
          anneecontruction: truck.anneecontruction || "",
          puissancefiscale: truck.puissancefiscale || "",
          gps: truck.gps || "",
          description: truck.description || "",
          driver: truck.driver?._id || "",
          accompagnant: truck.accompagnant?._id || "",
          status: truck.status || "Disponible",
          image: null
        })
        setSelectedTruck(truck)
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      alert("Erreur lors du chargement")
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      await truckService.updateTruck(selectedTruck._id, formData)
      await loadData()
      setIsEditModalOpen(false)
      setSelectedTruck(null)
      resetForm()
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      alert("Erreur lors de la modification")
    }
  }

  const handleDelete = async (id) => {  
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce camion ?")) {  
      try {  
        await truckService.deleteTruck(id)  
        await loadData()  
      } catch (error) {  
        console.error("Erreur lors de la suppression:", error)  
        alert("Erreur lors de la suppression")  
      }  
    }  
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      matricule: "",
      brand: "",
      modele: "",
      capacite: "",
      fuel: "DIESEL",
      anneecontruction: "",
      puissancefiscale: "",
      gps: "",
      description: "",
      driver: "",
      accompagnant: "",
      status: "Disponible",
      image: null
    })
    setImagePreview(null)
  }

  const renderTruckImage = (truck) => {
    if (truck.image && truck.image.data) {
      const base64String = btoa(
        new Uint8Array(truck.image.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      return (
        <img 
          src={`data:image/png;base64,${base64String}`} 
          alt="Camion" 
          className="truck-image"
        />
      )
    }
    return <ImageIcon className="no-image-icon" />
  }
    
  // Filtrer les camions selon le terme de recherche    
  const filteredTrucks = trucks.filter(  
    (truck) =>    
      truck.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||    
      truck.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||    
      truck.modele?.toLowerCase().includes(searchTerm.toLowerCase())  
  )    
    
  // Calculer les statistiques    
  const totalTrucks = trucks.length      
  const availableTrucks = trucks.filter((truck) => truck.status === 'Disponible').length
  const maintenanceTrucks = trucks.filter((truck) => truck.status === 'En maintenance').length
    
  return (    
    <div className="truck-management-layout">
  
      <div className="truck-management-wrapper">    
        <div className="truck-management-container">    
          <div className="truck-management-content">    
            {/* En-tête */}    
            <div className="page-header">    
              <h1 className="page-title">Gestion des Camions</h1>    
            </div>

            {/* Affichage des erreurs */}
            {error && (
              <div className="error-alert" style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}
    
            {/* 3 Cards en haut avec gradient */}    
            <div className="camion-stats-grid">    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Total Camions</h3>    
                    <div className="stat-value">{totalTrucks}</div>    
                    <p className="stat-description">Véhicules dans la flotte</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon blue">    
                      <Truck className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Disponibles</h3>    
                    <div className="stat-value">{availableTrucks}</div>    
                    <p className="stat-description">Camions en service</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon green">    
                      <MapPin className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">En Maintenance</h3>    
                    <div className="stat-value">{maintenanceTrucks}</div>    
                    <p className="stat-description">Nécessitent attention</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon orange">    
                      <Users className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
            </div>    
    
            {/* Bouton Ajouter Camion */}    
            <div className="action-section">    
              <button   
                className="add-button"   
                onClick={() => navigate('/admin/ajouter-camion')}  
              >    
                <Plus className="button-icon" />    
                Ajouter Camion    
              </button>    
            </div>    
    
            {/* Barre de recherche */}    
            <div className="search-section">    
              <div className="search-container">    
                <Search className="search-icon" />    
                <input    
                  type="text"    
                  placeholder="Rechercher par matricule, marque ou modèle..."    
                  value={searchTerm}    
                  onChange={(e) => setSearchTerm(e.target.value)}    
                  className="search-input"    
                />    
              </div>    
            </div>    
    
            {/* Tableau */}    
            <div className="table-card">    
              <div className="table-header">    
                <h3 className="table-title">Liste des Camions</h3>    
              </div>    
              <div className="table-content">    
                <div className="table-container">    
                  {loading ? (  
                    <div className="text-center">Chargement...</div>  
                  ) : (  
                    <table className="trucks-table">    
                      <thead>  
                        <tr>  
                          <th>Image</th>
                          <th>Matricule</th>  
                          <th>Marque/Modèle</th>  
                          <th>Capacité</th>  
                          <th>Chauffeur</th>  
                          <th>Accompagnant</th>  
                          <th>Statut</th>
                          <th>Actions</th>  
                        </tr>  
                      </thead>  
                      <tbody>  
                        {filteredTrucks.map((truck) => (  
                          <tr key={truck._id}>  
                            <td>
                              <div className="truck-image-cell">
                                {renderTruckImage(truck)}
                              </div>
                            </td>
                            <td>{truck.matricule}</td>  
                            <td>{truck.brand} {truck.modele}</td>  
                            <td>{truck.capacite}</td>  
                            <td>{getEmployeeName(truck.driver)}</td>  
                            <td>{getEmployeeName(truck.accompagnant)}</td>  
                            <td>{getStatusBadge(truck.status)}</td>
                             <td>  
                              <div className="action-buttons">    
                                <button       
                                  className="details-button"      
                                  onClick={() => handleViewDetails(truck._id)}    
                                  title="Voir détails"    
                                >      
                                  <Eye className="details-icon" />      
                                </button>    
                                <button    
                                  className="edit-button"    
                                  onClick={() => handleEdit(truck._id)}    
                                  title="Modifier"    
                                >    
                                  <Edit className="action-icon" />    
                                </button>    
                                <button    
                                  className="delete-button"    
                                  onClick={() => handleDelete(truck._id)}    
                                  title="Supprimer"    
                                >    
                                  <Delete className="action-icon" />    
                                </button>    
                              </div>    
                            </td>   
                          </tr>    
                        ))}    
                      </tbody>     
                    </table>    
                  )}    
      
                  {!loading && filteredTrucks.length === 0 && (      
                    <div className="no-results">      
                      Aucun camion trouvé pour votre recherche.      
                    </div>      
                  )}      
                </div>        
              </div>        
            </div>        
          </div>        
        </div>        
      </div>        
    
      {/* Modal de détails */}    
      {isDetailModalOpen && selectedTruck && (    
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>    
          <div className="modal-content truck-detail-modal" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Détails du Camion - {selectedTruck.matricule}</h2>    
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
                
            <div className="truck-detail-content">    
              {/* Image du camion */}    
              <div className="detail-image-section">    
                {selectedTruck.image && selectedTruck.image.data ? (    
                  <img     
                    src={`data:image/png;base64,${btoa(    
                      new Uint8Array(selectedTruck.image.data).reduce((data, byte) => data + String.fromCharCode(byte), '')    
                    )}`}    
                    alt="Camion"     
                    className="detail-truck-image"    
                  />    
                ) : (    
                  <div className="no-image-placeholder">    
                    <ImageIcon className="no-image-icon-large" />    
                    <p>Aucune image disponible</p>    
                  </div>    
                )}    
              </div>    
    
              {/* Informations détaillées */}    
              <div className="detail-info-grid">    
                <div className="truck-detail-section">    
                  <h3>Informations Générales</h3>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Matricule:</span>    
                    <span className="truck-detail-value">{selectedTruck.matricule}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Marque:</span>    
                    <span className="truck-detail-value">{selectedTruck.brand}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Modèle:</span>    
                    <span className="truck-detail-value">{selectedTruck.modele}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Capacité:</span>    
                    <span className="truck-detail-value">{selectedTruck.capacite}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Carburant:</span>    
                    <span className="truck-detail-value">{selectedTruck.fuel}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Année:</span>    
                    <span className="truck-detail-value">{selectedTruck.anneecontruction}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Puissance fiscale:</span>    
                    <span className="truck-detail-value">{selectedTruck.puissancefiscale} CV</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">GPS:</span>    
                    <span className="truck-detail-value">{selectedTruck.gps || 'Non spécifié'}</span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Statut:</span>    
                    <span className="truck-detail-value">{getStatusBadge(selectedTruck.status)}</span>    
                  </div>    
                </div>    
    
                <div className="truck-detail-section">    
                  <h3>Équipe Assignée</h3>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Chauffeur:</span>    
                    <span className="truck-detail-value">    
                      {selectedTruck.driver ? (    
                        <div className="employee-info">    
                          <Person className="employee-icon" />    
                          <div>    
                            <div className="employee-name">{getEmployeeName(selectedTruck.driver)}</div>    
                            {getEmployeeEmail(selectedTruck.driver) && (        
                              <div className="employee-email">{getEmployeeEmail(selectedTruck.driver)}</div>        
                            )}    
                          </div>    
                        </div>    
                      ) : (    
                        'Non assigné'    
                      )}    
                    </span>    
                  </div>    
                  <div className="truck-detail-item">    
                    <span className="truck-detail-label">Accompagnant:</span>    
                    <span className="truck-detail-value">    
                      {selectedTruck.accompagnant ? (    
                        <div className="employee-info">    
                          <Person className="employee-icon" />    
                          <div>    
                            <div className="employee-name">{getEmployeeName(selectedTruck.accompagnant)}</div>    
                            {getEmployeeEmail(selectedTruck.accompagnant) && (      
                              <div className="employee-email">{getEmployeeEmail(selectedTruck.accompagnant)}</div>      
                            )}   
                          </div>    
                        </div>    
                      ) : (    
                        'Non assigné'    
                      )}    
                    </span>    
                  </div>    
                </div>    
              </div>    
    
              {/* Description */}    
              {selectedTruck.description && (    
                <div className="truck-detail-section">    
                  <h3>Description</h3>    
                  <p className="detail-description">{selectedTruck.description}</p>    
                </div>    
              )}    
            </div>    
          </div>    
        </div>    
      )}    
    
      {/* Modal de modification */}    
      {isEditModalOpen && (    
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>    
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Modifier le Camion</h2>    
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
                
            <form onSubmit={handleSubmitEdit} className="modal-form">    
              <div className="form-grid">    
                <div className="form-group">    
                  <label className="form-label">Matricule</label>    
                  <input    
                    type="text"    
                    value={formData.matricule}    
                    onChange={(e) => handleInputChange("matricule", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Marque</label>    
                  <input    
                    type="text"    
                    value={formData.brand}    
                    onChange={(e) => handleInputChange("brand", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Modèle</label>    
                  <input    
                    type="text"    
                    value={formData.modele}    
                    onChange={(e) => handleInputChange("modele", e.target.value)}    
                    className="form-input"    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Capacité</label>    
                  <input    
                    type="text"    
                    value={formData.capacite}    
                    onChange={(e) => handleInputChange("capacite", e.target.value)}    
                    className="form-input"    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Carburant</label>    
                  <select    
                    value={formData.fuel}    
                    onChange={(e) => handleInputChange("fuel", e.target.value)}    
                    className="form-select"    
                  >    
                    <option value="DIESEL">Diesel</option>    
                    <option value="ESSENCE">Essence</option>    
                    <option value="ELECTRIQUE">Électrique</option>    
                    <option value="HYBRIDE">Hybride</option>    
                  </select>    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Année de construction</label>    
                  <input    
                    type="number"    
                    value={formData.anneecontruction}    
                    onChange={(e) => handleInputChange("anneecontruction", e.target.value)}    
                    className="form-input"    
                    min="1990"    
                    max="2030"    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Puissance fiscale (CV)</label>    
                  <input    
                    type="number"    
                    value={formData.puissancefiscale}    
                    onChange={(e) => handleInputChange("puissancefiscale", e.target.value)}    
                    className="form-input"    
                    min="1"    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">GPS</label>    
                  <input    
                    type="text"    
                    value={formData.gps}    
                    onChange={(e) => handleInputChange("gps", e.target.value)}    
                    className="form-input"    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Chauffeur</label>    
                  <select      
                    value={formData.driver}      
                    onChange={(e) => handleInputChange("driver", e.target.value)}      
                    className="form-select"      
                  >      
                    <option value="">Aucun chauffeur</option>      
                    {employees.filter(emp => emp.fonction === 'CHAUFFEUR').map(emp => (      
                      <option key={emp.id} value={emp.id}>      
                        {emp.user_info?.first_name} {emp.user_info?.last_name}    
                      </option>      
                    ))}      
                  </select>     
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Accompagnant</label>    
                  <select      
                    value={formData.accompagnant}      
                    onChange={(e) => handleInputChange("accompagnant", e.target.value)}      
                    className="form-select"      
                  >      
                    <option value="">Aucun accompagnant</option>      
                    {employees.filter(emp => emp.fonction === 'ACCOMPAGNANT').map(emp => (      
                      <option key={emp.id} value={emp.id}>      
                        {emp.user_info?.first_name} {emp.user_info?.last_name}    
                      </option>      
                    ))}      
                  </select>   
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Statut</label>    
                  <select    
                    value={formData.status}    
                    onChange={(e) => handleInputChange("status", e.target.value)}    
                    className="form-select"    
                  >    
                    <option value="Disponible">Disponible</option>    
                    <option value="En mission">En mission</option>    
                    <option value="En maintenance">En maintenance</option>    
                    <option value="Hors service">Hors service</option>    
                  </select>    
                </div>    
    
                <div className="form-group full-width">    
                  <label className="form-label">Image</label>    
                  <input    
                    type="file"    
                    accept="image/*"    
                    onChange={handleImageChange}    
                    className="form-input"    
                  />    
                  {imagePreview && (    
                    <div className="image-preview">    
                      <img src={imagePreview} alt="Aperçu" className="preview-image" />    
                    </div>    
                  )}    
                </div>    
    
                <div className="form-group full-width">    
                  <label className="form-label">Description</label>    
                  <textarea    
                    value={formData.description}    
                    onChange={(e) => handleInputChange("description", e.target.value)}    
                    className="form-textarea"    
                    rows="3"    
                  />    
                </div>    
              </div>    
    
              <div className="form-actions">    
                <button type="button" className="cancel-button" onClick={() => setIsEditModalOpen(false)}>    
                  Annuler    
                </button>    
                <button type="submit" className="submit-button">    
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
