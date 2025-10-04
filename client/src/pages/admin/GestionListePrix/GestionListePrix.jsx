import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  MdSearch as Search,
  MdAdd as Plus,
  MdAttachMoney as Money,
  MdCalendarToday as Calendar,
  MdCheckCircle as CheckCircle,
  MdCancel as Cancel,
  MdVisibility as Eye,
  MdEdit as Edit,
  MdDelete as Delete,
  MdClose as X,
  MdSave as Save,
  MdList as List
} from "react-icons/md"
import "./GestionListePrix.css"
import listePrixService from '../../../services/listePrixService'
import productService from '../../../services/productService'
import umService from '../../../services/umService'

export default function GestionListePrix() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [listePrix, setListePrix] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedListePrix, setSelectedListePrix] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPrixModalOpen, setIsPrixModalOpen] = useState(false)
  
  // États pour la gestion des prix
  const [prixData, setPrixData] = useState([])
  const [products, setProducts] = useState([])
  const [unitesMesure, setUnitesMesure] = useState([])
  const [newPrix, setNewPrix] = useState({
    product_id: '',
    UM_id: '',
    prix: ''
  })
  
  const [formData, setFormData] = useState({
    listeprix_id: "",
    nom: "",
    description: "",
    dtdebut: "",
    dtfin: "",
    isactif: true
  })

  useEffect(() => {
    loadData()
    loadProducts()
    loadUnitesMesure()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await listePrixService.getAllListePrix()
      setListePrix(response.data || [])
      setError(null)
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError("Erreur lors du chargement des données")
      setListePrix([])
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productService.getAllProducts()
      setProducts(response.data || [])
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err)
    }
  }

  const loadUnitesMesure = async () => {  
    try {  
      const response = await umService.getAllUms()
      setUnitesMesure(response.data || [])  
    } catch (err) {  
      console.error("Erreur lors du chargement des unités de mesure:", err)  
    }  
  }

  const loadPrixForListe = async (listeId) => {
    try {
      // Cette méthode devra être implémentée dans listePrixService
      const response = await listePrixService.getPrixByListe(listeId)
      setPrixData(response.data || [])
    } catch (err) {
      console.error("Erreur lors du chargement des prix:", err)
      setPrixData([])
    }
  }

  // Fonction pour filtrer les unités selon le produit sélectionné
  const getAvailableUnitsForProduct = (productId) => {  
    if (!productId) return []  
      
    const selectedProduct = products.find(p => p._id === productId)  
    if (!selectedProduct || !selectedProduct.unites_mesure) return []  
      
    // Retourner seulement les UMs associées à ce produit  
    return selectedProduct.unites_mesure.map(unite => {  
      const umDetails = unitesMesure.find(um => um._id === unite.UM_id)  
      return umDetails  
    }).filter(Boolean)  
  }

  const getStatusBadge = (isactif) => {
    return isactif ? 
      <span className="badge badge-active">Actif</span> :
      <span className="badge badge-inactive">Inactif</span>
  }

  const handleViewDetails = async (listePrixId) => {
    try {
      const response = await listePrixService.getListePrixById(listePrixId)
      if (response.success) {
        setSelectedListePrix(response.data)
        setIsDetailModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      alert("Erreur lors du chargement des détails")
    }
  }

  const handleManagePrix = async (listePrixId) => {
    try {
      const response = await listePrixService.getListePrixById(listePrixId)
      if (response.success) {
        setSelectedListePrix(response.data)
        await loadPrixForListe(listePrixId)
        setIsPrixModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      alert("Erreur lors du chargement")
    }
  }

  const handleEdit = async (listePrixId) => {
    try {
      const response = await listePrixService.getListePrixById(listePrixId)
      if (response.success) {
        const liste = response.data
        setFormData({
          listeprix_id: liste.listeprix_id || "",
          nom: liste.nom || "",
          description: liste.description || "",
          dtdebut: liste.dtdebut ? new Date(liste.dtdebut).toISOString().split('T')[0] : "",
          dtfin: liste.dtfin ? new Date(liste.dtfin).toISOString().split('T')[0] : "",
          isactif: liste.isactif
        })
        setSelectedListePrix(liste)
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      alert("Erreur lors du chargement")
    }
  }

  const handleAdd = () => {
    setFormData({
      listeprix_id: "",
      nom: "",
      description: "",
      dtdebut: "",
      dtfin: "",
      isactif: true
    })
    setIsAddModalOpen(true)
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    try {
      await listePrixService.createListePrix(formData)
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
      await listePrixService.updateListePrix(selectedListePrix._id, formData)
      await loadData()
      setIsEditModalOpen(false)
      setSelectedListePrix(null)
      resetForm()
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      alert("Erreur lors de la modification")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette liste de prix ?")) {
      try {
        await listePrixService.deleteListePrix(id)
        await loadData()
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        alert("Erreur lors de la suppression")
      }
    }
  }

  const handleAddPrix = async () => {
    try {
      if (!newPrix.product_id || !newPrix.UM_id || !newPrix.prix) {
        alert("Veuillez remplir tous les champs")
        return
      }

      // Cette méthode devra être implémentée dans listePrixService
      await listePrixService.addPrixToListe(selectedListePrix._id, newPrix)
      await loadPrixForListe(selectedListePrix._id)
      setNewPrix({ product_id: '', UM_id: '', prix: '' })
    } catch (error) {
      console.error("Erreur lors de l'ajout du prix:", error)
      alert("Erreur lors de l'ajout du prix")
    }
  }

  const handleDeletePrix = async (prixId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce prix ?")) {
      try {
        // Cette méthode devra être implémentée dans listePrixService
        await listePrixService.removePrixFromListe(selectedListePrix._id, prixId)
        await loadPrixForListe(selectedListePrix._id)
      } catch (error) {
        console.error("Erreur lors de la suppression du prix:", error)
        alert("Erreur lors de la suppression du prix")
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
      listeprix_id: "",
      nom: "",
      description: "",
      dtdebut: "",
      dtfin: "",
      isactif: true
    })
  }

  // Filtrer les listes de prix selon le terme de recherche
  const filteredListePrix = listePrix.filter(
    (liste) =>
      liste.listeprix_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liste.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liste.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculer les statistiques
  const totalListePrix = listePrix.length
  const activeListePrix = listePrix.filter((liste) => liste.isactif).length
  const inactiveListePrix = listePrix.filter((liste) => !liste.isactif).length

  return (
    <div className="listeprix-management-layout">
      <div className="listeprix-management-wrapper">
        <div className="listeprix-management-container">
          <div className="listeprix-management-content">
            {/* En-tête */}
            <div className="page-header">
              <h1 className="page-title">Gestion des Listes de Prix</h1>
            </div>

            {/* 3 Cards en haut avec gradient */}
            <div className="listeprix-stats-grid">
              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Total Listes</h3>
                    <div className="stat-value">{totalListePrix}</div>
                    <p className="stat-description">Listes de prix configurées</p>
                  </div>
                  <div className="stat-icon-container">
                    <div className="stat-icon blue">
                      <Money className="icon" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Actives</h3>
                    <div className="stat-value">{activeListePrix}</div>
                    <p className="stat-description">Listes en cours d'utilisation</p>
                  </div>
                  <div className="stat-icon-container">
                    <div className="stat-icon green">
                      <CheckCircle className="icon" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card gradient-card">
                <div className="stat-card-header">
                  <div className="stat-content">
                    <h3 className="stat-label">Inactives</h3>
                    <div className="stat-value">{inactiveListePrix}</div>
                    <p className="stat-description">Listes désactivées</p>
                  </div>
                  <div className="stat-icon-container">
                    <div className="stat-icon orange">
                      <Cancel className="icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Ajouter Liste de Prix */}
            <div className="action-section">
              <button
                className="add-button"
                onClick={handleAdd}
              >
                <Plus className="button-icon" />
                Ajouter Liste de Prix
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="search-section">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par ID, nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Tableau */}
            <div className="table-card">
              <div className="table-header">
                <h3 className="table-title">Liste des Prix</h3>
              </div>
              <div className="table-content">
                <div className="table-container">
                  {loading ? (
                    <div className="text-center">Chargement...</div>
                  ) : (
                    <table className="listeprix-table">
                      <thead>
                        <tr>
                          <th>ID Liste</th>
                          <th>Nom</th>
                          <th>Description</th>
                          <th>Date Début</th>
                          <th>Date Fin</th>  
                          <th>Statut</th>  
                          <th>Actions</th>  
                        </tr>  
                      </thead>  
                      <tbody>  
                        {filteredListePrix.map((liste) => (  
                          <tr key={liste._id}>  
                            <td>{liste.listeprix_id}</td>  
                            <td>{liste.nom}</td>  
                            <td>{liste.description || 'N/A'}</td>  
                            <td>{liste.dtdebut ? new Date(liste.dtdebut).toLocaleDateString("fr-FR") : 'N/A'}</td>  
                            <td>{liste.dtfin ? new Date(liste.dtfin).toLocaleDateString("fr-FR") : 'N/A'}</td>  
                            <td>{getStatusBadge(liste.isactif)}</td>  
                            <td>  
                              <div className="action-buttons">  
                                <button  
                                  className="details-button"  
                                  onClick={() => handleViewDetails(liste._id)}  
                                  title="Voir détails"  
                                >  
                                  <Eye className="details-icon" />  
                                </button>  
                                <button  
                                  className="prix-button"  
                                  onClick={() => handleManagePrix(liste._id)}  
                                  title="Gérer les prix"  
                                >  
                                  <List className="action-icon" />  
                                </button>    
                                <button    
                                  className="edit-button"    
                                  onClick={() => handleEdit(liste._id)}    
                                  title="Modifier"    
                                >    
                                  <Edit className="action-icon" />    
                                </button>    
                                <button    
                                  className="delete-button"    
                                  onClick={() => handleDelete(liste._id)}    
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
    
                  {!loading && filteredListePrix.length === 0 && (    
                    <div className="no-results">    
                      Aucune liste de prix trouvée pour votre recherche.    
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
              <h2 className="modal-title">Ajouter une Liste de Prix</h2>    
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
    
            <form onSubmit={handleSubmitAdd} className="modal-form">    
              <div className="form-grid">    
                <div className="form-group">    
                  <label className="form-label">ID Liste *</label>    
                  <input    
                    type="text"    
                    value={formData.listeprix_id}    
                    onChange={(e) => handleInputChange("listeprix_id", e.target.value)}    
                    className="form-input"    
                    placeholder="Ex: PRIX2024"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Nom *</label>    
                  <input    
                    type="text"    
                    value={formData.nom}    
                    onChange={(e) => handleInputChange("nom", e.target.value)}    
                    className="form-input"    
                    placeholder="Ex: Prix Standard 2024"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Date Début *</label>    
                  <input    
                    type="date"    
                    value={formData.dtdebut}    
                    onChange={(e) => handleInputChange("dtdebut", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Date Fin</label>    
                  <input    
                    type="date"    
                    value={formData.dtfin}    
                    onChange={(e) => handleInputChange("dtfin", e.target.value)}    
                    className="form-input"    
                  />    
                </div>    
    
                <div className="form-group full-width">    
                  <label className="form-label">Description</label>    
                  <textarea    
                    value={formData.description}    
                    onChange={(e) => handleInputChange("description", e.target.value)}    
                    className="form-textarea"    
                    rows="3"    
                    placeholder="Description de la liste de prix..."    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">    
                    <input    
                      type="checkbox"    
                      checked={formData.isactif}    
                      onChange={(e) => handleInputChange("isactif", e.target.checked)}    
                      className="form-checkbox"    
                    />    
                    Liste active    
                  </label>    
                </div>    
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
              <h2 className="modal-title">Modifier la Liste de Prix</h2>    
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
    
            <form onSubmit={handleSubmitEdit} className="modal-form">    
              <div className="form-grid">    
                <div className="form-group">    
                  <label className="form-label">ID Liste *</label>    
                  <input    
                    type="text"    
                    value={formData.listeprix_id}    
                    onChange={(e) => handleInputChange("listeprix_id", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Nom *</label>    
                  <input    
                    type="text"    
                    value={formData.nom}    
                    onChange={(e) => handleInputChange("nom", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Date Début *</label>    
                  <input    
                    type="date"    
                    value={formData.dtdebut}    
                    onChange={(e) => handleInputChange("dtdebut", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Date Fin</label>    
                  <input    
                    type="date"    
                    value={formData.dtfin}    
                    onChange={(e) => handleInputChange("dtfin", e.target.value)}    
                    className="form-input"    
                  />    
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
    
                <div className="form-group">    
                  <label className="form-label">    
                    <input    
                      type="checkbox"    
                      checked={formData.isactif}    
                      onChange={(e) => handleInputChange("isactif", e.target.checked)}    
                      className="form-checkbox"    
                    />    
                    Liste active    
                  </label>    
                </div>    
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
      {isDetailModalOpen && selectedListePrix && (    
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>    
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Détails de la Liste de Prix - {selectedListePrix.listeprix_id}</h2>    
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
    
            <div className="detail-content">    
              <div className="detail-info-grid">    
                <div className="detail-section">    
                  <h3>Informations Générales</h3>    
                  <div className="detail-item">    
                    <span className="detail-label">ID Liste:</span>    
                    <span className="detail-value">{selectedListePrix.listeprix_id}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Nom:</span>    
                    <span className="detail-value">{selectedListePrix.nom}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Description:</span>    
                    <span className="detail-value">{selectedListePrix.description || 'Non spécifié'}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Statut:</span>    
                    <span className="detail-value">{getStatusBadge(selectedListePrix.isactif)}</span>    
                  </div>    
                </div>    
    
                <div className="detail-section">    
                  <h3>Période de Validité</h3>    
                  <div className="detail-item">    
                    <span className="detail-label">Date de début:</span>    
                    <span className="detail-value">    
                      {selectedListePrix.dtdebut ? new Date(selectedListePrix.dtdebut).toLocaleDateString("fr-FR") : 'N/A'}    
                    </span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Date de fin:</span>    
                    <span className="detail-value">    
                      {selectedListePrix.dtfin ? new Date(selectedListePrix.dtfin).toLocaleDateString("fr-FR") : 'Indéterminée'}    
                    </span>    
                  </div>    
                </div>    
    
                <div className="detail-section">    
                  <h3>Informations Système</h3>    
                  <div className="detail-item">    
                    <span className="detail-label">Date de création:</span>    
                    <span className="detail-value">    
                      {selectedListePrix.createdAt ? new Date(selectedListePrix.createdAt).toLocaleDateString("fr-FR") : 'N/A'}    
                    </span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Dernière modification:</span>    
                    <span className="detail-value">    
                      {selectedListePrix.updatedAt ? new Date(selectedListePrix.updatedAt).toLocaleDateString("fr-FR") : 'N/A'}    
                    </span>    
                  </div>    
                </div>    
              </div>    
            </div>    
          </div>    
        </div>    
      )}    
    
      {/* Modal de gestion des prix - CORRIGÉ */}    
      {isPrixModalOpen && selectedListePrix && (    
        <div className="modal-overlay" onClick={() => setIsPrixModalOpen(false)}>    
          <div className="modal-content prix-modal" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Gestion des Prix - {selectedListePrix.nom}</h2>    
              <button className="modal-close" onClick={() => setIsPrixModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
    
            <div className="prix-content">    
              {/* Section d'ajout de prix */}    
              <div className="prix-add-section">    
                <h3>Ajouter un Prix</h3>    
                <div className="prix-form-grid">    
                  <div className="form-group">    
                    <label className="form-label">Produit *</label>    
                    <select      
                      value={newPrix.product_id}      
                      onChange={(e) => setNewPrix(prev => ({     
                        ...prev,     
                        product_id: e.target.value,    
                        UM_id: '' // Réinitialiser l'unité quand le produit change    
                      }))}

                      className="form-input"      
                      required      
                    >      
                      <option value="">Sélectionner un produit</option>      
                      {products.map(product => (      
                        <option key={product._id} value={product._id}>      
                          {product.ref} - {product.short_name}      
                        </option>      
                      ))}      
                    </select>      
                  </div>      
      
                  <div className="form-group">      
                    <label className="form-label">Unité de Mesure *</label>      
                    <select      
                      value={newPrix.UM_id}      
                      onChange={(e) => setNewPrix(prev => ({ ...prev, UM_id: e.target.value }))}      
                      className="form-input"      
                      required      
                      disabled={!newPrix.product_id} // Désactiver si aucun produit sélectionné    
                    >      
                      <option value="">Sélectionner une unité</option>      
                      {getAvailableUnitsForProduct(newPrix.product_id).map(um => (      
                        <option key={um._id} value={um._id}>      
                          {um.unitemesure}      
                        </option>      
                      ))}      
                    </select>      
                  </div>      
      
                  <div className="form-group">      
                    <label className="form-label">Prix (MAD) *</label>      
                    <input      
                      type="number"      
                      step="0.01"      
                      value={newPrix.prix}      
                      onChange={(e) => setNewPrix(prev => ({ ...prev, prix: e.target.value }))}      
                      className="form-input"      
                      placeholder="0.00"      
                      required      
                    />      
                  </div>      
      
                  <div className="form-group">      
                    <button      
                      type="button"      
                      onClick={handleAddPrix}      
                      className="add-prix-button"      
                    >      
                      <Plus className="btn-icon" />      
                      Ajouter Prix      
                    </button>      
                  </div>      
                </div>      
              </div>      
      
              {/* Liste des prix existants */}      
              <div className="prix-list-section">      
                <h3>Prix Configurés ({prixData.length})</h3>      
                {prixData.length > 0 ? (      
                  <div className="prix-table-container">      
                    <table className="prix-table">      
                      <thead>      
                        <tr>      
                          <th>Produit</th>      
                          <th>Unité</th>      
                          <th>Prix (MAD)</th>      
                          <th>Actions</th>      
                        </tr>      
                      </thead>      
                      <tbody>      
                        {prixData.map((prix, index) => (      
                          <tr key={index}>      
                            <td>      
                              <div className="product-info">      
                                <span className="product-ref">{prix.product_id?.ref}</span>      
                                <span className="product-name">{prix.product_id?.short_name}</span>      
                              </div>      
                            </td>      
                            <td>{prix.UM_id?.unitemesure}</td>      
                            <td className="prix-value">{prix.prix} MAD</td>      
                            <td>      
                              <button      
                                className="delete-prix-button"      
                                onClick={() => handleDeletePrix(prix._id)}      
                                title="Supprimer ce prix"      
                              >      
                                <Delete className="action-icon" />      
                              </button>      
                            </td>      
                          </tr>      
                        ))}      
                      </tbody>      
                    </table>      
                  </div>      
                ) : (      
                  <div className="no-prix">      
                    <p>Aucun prix configuré pour cette liste.</p>      
                    <p>Utilisez le formulaire ci-dessus pour ajouter des prix.</p>      
                  </div>      
                )}      
              </div>      
            </div>      
          </div>      
        </div>      
      )}      
    </div>      
  )      
}