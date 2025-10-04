import { useState, useEffect } from "react"    
import {    
  MdWarehouse as Warehouse,    
  MdAdd as Plus,    
  MdSearch as Search,    
  MdEdit as Edit,    
  MdArchive as Archive,    
  MdClose as X,    
  MdCalendarToday as Calendar,    
  MdDescription as Description    
} from "react-icons/md"    
import "./StockDepotManagement.css"    
import stockDepotService from '../../../services/stockDepotService'    
import depotService from '../../../services/depotService'    
    
export default function StockDepotManagement() {    
  const [searchTerm, setSearchTerm] = useState("")    
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)    
  const [stockDepots, setStockDepots] = useState([])    
  const [depots, setDepots] = useState([])    
  const [loading, setLoading] = useState(true)    
  const [error, setError] = useState(null)    
  const [selectedDepot, setSelectedDepot] = useState("all")    
  const [showArchived, setShowArchived] = useState(false)   
  const [errorMessage, setErrorMessage] = useState("")   
    
  const [formData, setFormData] = useState({    
    depot_id: "",    
    description: ""    
  })    
    
  useEffect(() => {    
    loadData()    
  }, [selectedDepot, showArchived])    
    
  const loadData = async () => {    
    try {    
      setLoading(true)    
      const [stockDepotsResponse, depotsResponse] = await Promise.all([    
        stockDepotService.getAllStockDepots({    
          depot: selectedDepot !== "all" ? selectedDepot : undefined,    
          archive: showArchived    
        }),    
        depotService.getAllDepots()    
      ])    
    
      setStockDepots(stockDepotsResponse.data || [])    
      setDepots(depotsResponse.data || [])    
      setError(null)    
    } catch (err) {    
      console.error("Erreur lors du chargement des données:", err)    
      setError("Erreur lors du chargement des données")    
      setStockDepots([])    
      setDepots([])    
    } finally {    
      setLoading(false)    
    }    
  }    
    
  const filteredStockDepots = stockDepots.filter(stockDepot =>    
    stockDepot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||    
    stockDepot.depot_id?.short_name?.toLowerCase().includes(searchTerm.toLowerCase())    
  )    
    
  const handleInputChange = (field, value) => {    
    setFormData(prev => ({ ...prev, [field]: value }))    
  }    
    
  const handleSubmit = async (e) => {    
    e.preventDefault()    
    setErrorMessage("") // Réinitialiser le message d'erreur    
    try {    
      await stockDepotService.createStockDepot(formData)    
      await loadData()    
      setFormData({ depot_id: "", description: "" })    
      setIsAddDialogOpen(false)    
    } catch (error) {    
      console.error("Erreur lors de la création de l'inventaire:", error)    
      const errorMsg = error.response?.data?.error || "Erreur lors de la création de l'inventaire"    
      setErrorMessage(errorMsg)    
    }    
  }   
    
  const handleArchive = async (id) => {    
    if (window.confirm("Êtes-vous sûr de vouloir archiver cet inventaire ?")) {    
      try {    
        await stockDepotService.archiveStockDepot(id)    
        await loadData()    
      } catch (error) {    
        console.error("Erreur lors de l'archivage:", error)    
        alert("Erreur lors de l'archivage")    
      }    
    }    
  }    
    
  const handleViewDetails = (stockDepotId) => {    
    window.location.href = `/magasinier/stock-lines/${stockDepotId}`    
  }    
  
  // Fonction pour fermer le modal et réinitialiser l'erreur  
  const closeModal = () => {  
    setIsAddDialogOpen(false)  
    setErrorMessage("")  
    setFormData({ depot_id: "", description: "" })  
  }  
    
  return (    
    <div className="stock-depot-layout">    
      <div className="stock-depot-wrapper">    
        <div className="stock-depot-container">    
          <div className="stock-depot-content">    
            {/* En-tête */}    
            <div className="page-header">    
              <div className="header-content">    
                <h1 className="page-title">    
                  <Warehouse className="icon" />    
                  Gestion des Inventaires    
                </h1>    
                <p className="page-subtitle">    
                  Créez et gérez les inventaires par dépôt    
                </p>    
              </div>    
            </div>    
    
            {/* Actions */}    
            <div className="action-section">    
              <button className="add-button" onClick={() => setIsAddDialogOpen(true)}>    
                <Plus className="button-icon" />    
                Nouvel Inventaire    
              </button>    
            </div>    
    
            {/* Filtres */}    
            <div className="filter-section">    
              <div className="search-container">    
                <Search className="search-icon" />    
                <input    
                  type="text"    
                  placeholder="Rechercher par description ou dépôt..."    
                  value={searchTerm}    
                  onChange={(e) => setSearchTerm(e.target.value)}    
                  className="search-input"    
                />    
              </div>    
    
              <select    
                className="depot-filter"    
                value={selectedDepot}    
                onChange={(e) => setSelectedDepot(e.target.value)}    
              >    
                <option value="all">Tous les dépôts</option>    
                {depots.map(depot => (    
                  <option key={depot._id} value={depot._id}>    
                    {depot.short_name} ({depot.reference})    
                  </option>    
                ))}    
              </select>    
    
              <label className="archive-toggle">    
                <input    
                  type="checkbox"    
                  checked={showArchived}    
                  onChange={(e) => setShowArchived(e.target.checked)}    
                />    
                Afficher archivés    
              </label>    
            </div>    
    
            {/* Tableau des inventaires */}    
            <div className="table-card">    
              <div className="table-header">    
                <h3 className="table-title">Liste des Inventaires</h3>    
              </div>    
              <div className="table-content">    
                <table className="inventaires-table">    
                  <thead>    
                    <tr>    
                      <th>Date</th>    
                      <th>Dépôt</th>    
                      <th>Description</th>    
                      <th>Statut</th>    
                      <th>Actions</th>    
                    </tr>    
                  </thead>    
                  <tbody>    
                    {loading ? (    
                      <tr>    
                        <td colSpan="5" className="text-center">Chargement...</td>    
                      </tr>    
                    ) : filteredStockDepots.length === 0 ? (    
                      <tr>    
                        <td colSpan="5" className="text-center">    
                          Aucun inventaire trouvé    
                        </td>    
                      </tr>    
                    ) : (    
                      filteredStockDepots.map((stockDepot) => (    
                        <tr key={stockDepot._id}>    
                          <td>{new Date(stockDepot.stock_date).toLocaleDateString('fr-FR')}</td>    
                          <td>{stockDepot.depot_id?.short_name}</td>    
                          <td>{stockDepot.description || 'N/A'}</td>    
                          <td>    
                            <span className={`status-badge ${stockDepot.archive ? 'archived' : 'active'}`}>    
                              {stockDepot.archive ? 'Archivé' : 'Actif'}    
                            </span>    
                          </td>    
                          <td>    
                            <div className="action-buttons">    
                              <button    
                                className="view-button"    
                                onClick={() => handleViewDetails(stockDepot._id)}    
                                title="Voir détails"    
                              >    
                                <Edit className="action-icon" />    
                              </button>    
                              {!stockDepot.archive && (    
                                <button    
                                  className="archive-button"    
                                  onClick={() => handleArchive(stockDepot._id)}    
                                  title="Archiver"    
                                >    
                                  <Archive className="action-icon" />    
                                </button>    
                              )}    
                            </div>    
                          </td>    
                        </tr>    
                      ))    
                    )}    
                  </tbody>    
                </table>    
              </div>    
            </div>    
          </div>    
        </div>    
      </div>    
    
      {/* Modal Nouvel Inventaire */}    
      {isAddDialogOpen && (    
        <div className="modal-overlay" onClick={closeModal}>    
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Nouvel Inventaire</h2>    
              <button className="modal-close" onClick={closeModal}>    
                <X className="close-icon" />    
              </button>    
            </div>    
  
            {errorMessage && (    
              <div className="error-message" style={{    
                backgroundColor: '#fef2f2',    
                border: '1px solid #fecaca',    
                borderRadius: '8px',    
                padding: '12px 16px',    
                margin: '16px 24px',    
                color: '#dc2626',    
                fontSize: '14px'    
              }}>    
                {errorMessage}    
              </div>    
            )}  
    
            <form onSubmit={handleSubmit} className="modal-form">    
              <div className="form-group">    
                <label htmlFor="depot" className="form-label">Dépôt *</label>    
                <select    
                  id="depot"    
                  value={formData.depot_id}    
                  onChange={(e) => handleInputChange("depot_id", e.target.value)}    
                  className="form-select"    
                  required    
                >    
                  <option value="">Sélectionner un dépôt</option>    
                  {depots.map(depot => (    
                    <option key={depot._id} value={depot._id}>    
                      {depot.short_name} ({depot.reference})    
                    </option>    
                  ))}    
                </select>    
              </div>    
    
              <div className="form-group">    
                <label htmlFor="description" className="form-label">Description</label>    
                <input    
                  id="description"    
                  type="text"    
                  placeholder="Description de l'inventaire"    
                  value={formData.description}    
                  onChange={(e) => handleInputChange("description", e.target.value)}    
                  className="form-input"    
                  maxLength="45"    
                />    
              </div>    
    
              <div className="form-actions">    
                <button type="button" className="cancel-button" onClick={closeModal}>    
                  Annuler    
                </button>    
                <button type="submit" className="submit-button">    
                  Créer    
                </button>    
              </div>    
            </form>    
          </div>    
        </div>    
      )}    
    </div>    
  )    
}