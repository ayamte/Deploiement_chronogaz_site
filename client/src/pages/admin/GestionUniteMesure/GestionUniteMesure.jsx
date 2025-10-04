import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  MdSearch as Search,
  MdAdd as Plus,
  MdStraighten as Ruler,
  MdScale as Scale,
  MdSpeed as Speed,
  MdVisibility as Eye,
  MdEdit as Edit,
  MdDelete as Delete,
  MdClose as X,
  MdSave as Save
} from "react-icons/md"
import "./GestionUniteMesure.css"
import umService from '../../../services/umService'

export default function GestionUniteMesure() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [unitesMesure, setUnitesMesure] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUm, setSelectedUm] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    unitemesure: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await umService.getAllUms()
      setUnitesMesure(response.data || [])
      setError(null)
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError("Erreur lors du chargement des données")
      setUnitesMesure([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (umId) => {
    try {
      const response = await umService.getUmById(umId)
      if (response.success) {
        setSelectedUm(response.data)
        setIsDetailModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      alert("Erreur lors du chargement des détails")
    }
  }

  const handleEdit = async (umId) => {
    try {
      const response = await umService.getUmById(umId)
      if (response.success) {
        const um = response.data
        setFormData({
          unitemesure: um.unitemesure || ""
        })
        setSelectedUm(um)
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      alert("Erreur lors du chargement")
    }
  }

  const handleAdd = () => {
    setFormData({
      unitemesure: ""
    })
    setIsAddModalOpen(true)
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    try {
      await umService.createUm({ ...formData, createdBy: 'admin' })
      await loadData()
      setIsAddModalOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error)
      alert("Erreur lors de l'ajout")
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      await umService.updateUm(selectedUm._id, formData)
      await loadData()
      setIsEditModalOpen(false)
      setSelectedUm(null)
      resetForm()
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      alert("Erreur lors de la modification")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette unité de mesure ?")) {
      try {
        await umService.deleteUm(id)
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

  const resetForm = () => {
    setFormData({
      unitemesure: ""
    })
  }

  // Filtrer les unités selon le terme de recherche
  const filteredUnitesMesure = unitesMesure.filter(
    (um) =>
      um.unitemesure?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculer les statistiques
  const totalUnites = unitesMesure.length

  return (
    <div className="um-management-layout">
      <div className="um-management-wrapper">
        <div className="um-management-container">
          <div className="um-management-content">
            {/* En-tête */}
            <div className="page-header">
              <h1 className="page-title">Gestion des Unités de Mesure</h1>
            </div>

            {/* Card statistique */}
            <div className="um-stats-grid">
              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Total Unités</h3>
                    <div className="stat-value">{totalUnites}</div>
                    <p className="stat-description">Unités de mesure configurées</p>
                  </div>
                  <div className="stat-icon-container">
                    <div className="stat-icon blue">
                      <Ruler className="icon" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Types Courants</h3>
                    <div className="stat-value">
                      {unitesMesure.filter(um => 
                        ['kg', 'litre', 'unité', 'pièce'].some(type => 
                          um.unitemesure?.toLowerCase().includes(type)
                        )
                      ).length}
                    </div>
                    <p className="stat-description">Unités standards</p>
                  </div>
                  <div className="stat-icon-container">
                    <div className="stat-icon green">
                      <Scale className="icon" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Personnalisées</h3>
                    <div className="stat-value">
                      {unitesMesure.filter(um => 
                        !['kg', 'litre', 'unité', 'pièce'].some(type => 
                          um.unitemesure?.toLowerCase().includes(type)
                        )
                      ).length}
                    </div>
                    <p className="stat-description">Unités spécifiques</p>
                  </div>
                  <div className="stat-icon-container">
                    <div className="stat-icon orange">
                      <Speed className="icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Ajouter Unité */}
            <div className="action-section">
              <button
                className="add-button"
                onClick={handleAdd}
              >
                <Plus className="button-icon" />
                Ajouter Unité de Mesure
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="search-section">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par nom d'unité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Tableau */}
            <div className="table-card">
              <div className="table-header">
                <h3 className="table-title">Liste des Unités de Mesure</h3>
              </div>
              <div className="table-content">
                <div className="table-container">
                  {loading ? (
                    <div className="text-center">Chargement...</div>
                  ) : (
                    <table className="um-table">
                      <thead>
                        <tr>
                          <th>Nom de l'Unité</th>
                          <th>Date de Création</th>
                          <th>Dernière Modification</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnitesMesure.map((um) => (
                          <tr key={um._id}>
                            <td>
                              <div className="um-name">
                                <Ruler className="um-icon" />
                                <span className="um-text">{um.unitemesure}</span>
                              </div>
                            </td>
                            <td>{um.createdAt ? new Date(um.createdAt).toLocaleDateString("fr-FR") : 'N/A'}</td>
                            <td>{um.updatedAt ? new Date(um.updatedAt).toLocaleDateString("fr-FR") : 'N/A'}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="details-button"
                                  onClick={() => handleViewDetails(um._id)}
                                  title="Voir détails"
                                >
                                  <Eye className="details-icon" />
                                </button>
                                <button
                                  className="edit-button"
                                  onClick={() => handleEdit(um._id)}
                                  title="Modifier"
                                >
                                  <Edit className="action-icon" />
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={() => handleDelete(um._id)}
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

                  {!loading && filteredUnitesMesure.length === 0 && (
                    <div className="no-results">
                      Aucune unité de mesure trouvée pour votre recherche.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ajouter une Unité de Mesure</h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nom de l'Unité *</label>
                <input
                  type="text"
                  value={formData.unitemesure}
                  onChange={(e) => handleInputChange("unitemesure", e.target.value)}
                  className="form-input"
                  placeholder="Ex: Kilogramme, Litre, Pièce..."
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setIsAddModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="submit-button">
                  <Save className="btn-icon" />
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Modifier l'Unité de Mesure</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nom de l'Unité *</label>
                <input
                  type="text"
                  value={formData.unitemesure}
                  onChange={(e) => handleInputChange("unitemesure", e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="submit-button">
                  <Save className="btn-icon" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {isDetailModalOpen && selectedUm && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Détails de l'Unité - {selectedUm.unitemesure}</h2>
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-info-grid">
                <div className="detail-section">
                  <h3>Informations Générales</h3>
                  <div className="detail-item">
                    <span className="detail-label">Nom de l'unité:</span>  
                    <span className="detail-value">{selectedUm.unitemesure}</span>  
                  </div>  
                </div>  
  
                <div className="detail-section">  
                  <h3>Informations Système</h3>  
                  <div className="detail-item">  
                    <span className="detail-label">Date de création:</span>  
                    <span className="detail-value">  
                      {selectedUm.createdAt ? new Date(selectedUm.createdAt).toLocaleDateString("fr-FR") : 'N/A'}  
                    </span>  
                  </div>  
                  <div className="detail-item">  
                    <span className="detail-label">Dernière modification:</span>  
                    <span className="detail-value">  
                      {selectedUm.updatedAt ? new Date(selectedUm.updatedAt).toLocaleDateString("fr-FR") : 'N/A'}  
                    </span>  
                  </div>  
                </div>  
              </div>  
            </div>  
          </div>  
        </div>  
      )}  
    </div>  
  )  
}