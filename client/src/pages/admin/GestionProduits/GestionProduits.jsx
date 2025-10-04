import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {     
  MdSearch as Search,     
  MdAdd as Plus,     
  MdInventory as Package,     
  MdCategory as Category,     
  MdLocalGasStation as GasStation,     
  MdVisibility as Eye,  
  MdEdit as Edit,  
  MdDelete as Delete,
  MdImage as ImageIcon,
  MdPerson as Person,
  MdClose as X
} from "react-icons/md"    
import "./GestionProduits.css"  
import productService from '../../../services/productService'

export default function ProductManagement() {  
  const navigate = useNavigate()    
  const [searchTerm, setSearchTerm] = useState("")  
  const [products, setProducts] = useState([])  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    ref: "",
    short_name: "",
    long_name: "",
    gamme: "",
    brand: "",
    description: "",
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {  
    loadData()  
  }, [])  

  const loadData = async () => {      
    try {      
      setLoading(true)      
      const response = await productService.getAllProducts()
      setProducts(response.data || [])
      setError(null)      
    } catch (err) {      
      console.error("Erreur lors du chargement des données:", err)      
      setError("Erreur lors du chargement des données")      
      setProducts([])      
    } finally {      
      setLoading(false)      
    }      
  }

  const getStatusBadge = (actif) => {    
    return actif ? 
      <span className="badge badge-available">Actif</span> :
      <span className="badge badge-maintenance">Inactif</span>
  }

  const handleViewDetails = async (productId) => {
    try {
      const response = await productService.getProductById(productId)
      if (response.success) {
        setSelectedProduct(response.data)
        setIsDetailModalOpen(true)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      alert("Erreur lors du chargement des détails")
    }
  }

  const handleEdit = async (productId) => {
    try {
      const response = await productService.getProductById(productId)
      if (response.success) {
        const product = response.data
        setFormData({
          ref: product.ref || "",
          short_name: product.short_name || "",
          long_name: product.long_name || "",
          gamme: product.gamme || "",
          brand: product.brand || "",
          description: product.description || "",
          image: null
        })
        setSelectedProduct(product)
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
      await productService.updateProduct(selectedProduct._id, formData)
      await loadData()
      setIsEditModalOpen(false)
      setSelectedProduct(null)
      resetForm()
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      alert("Erreur lors de la modification")
    }
  }

  const handleDelete = async (id) => {  
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {  
      try {  
        await productService.deleteProduct(id)  
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
      ref: "",
      short_name: "",
      long_name: "",
      gamme: "",
      brand: "",
      description: "",
      image: null
    })
    setImagePreview(null)
  }

  const renderProductImage = (product) => {
    if (product.image && product.image.data) {
      const base64String = btoa(
        new Uint8Array(product.image.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      return (
        <img 
          src={`data:image/png;base64,${base64String}`} 
          alt="Produit" 
          className="product-image"
        />
      )
    }
    return <ImageIcon className="no-image-icon" />
  }
    
  // Filtrer les produits selon le terme de recherche    
  const filteredProducts = products.filter(  
    (product) =>    
      product.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||    
      product.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||    
      product.long_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )    
    
  // Calculer les statistiques    
  const totalProducts = products.length      
  const activeProducts = products.filter((product) => product.actif).length
  const inactiveProducts = products.filter((product) => !product.actif).length
    
  return (    
    <div className="product-management-layout">    
      <div className="product-management-wrapper">    
        <div className="product-management-container">    
          <div className="product-management-content">    
            {/* En-tête */}    
            <div className="page-header">    
              <h1 className="page-title">Gestion des Produits</h1>    
            </div>    
    
            {/* 3 Cards en haut avec gradient */}    
            <div className="produit-stats-grid">    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Total Produits</h3>    
                    <div className="stat-value">{totalProducts}</div>    
                    <p className="stat-description">Produits dans le catalogue</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon blue">    
                      <Package className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Actifs</h3>    
                    <div className="stat-value">{activeProducts}</div>    
                    <p className="stat-description">Produits disponibles</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon green">    
                      <GasStation className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Inactifs</h3>    
                    <div className="stat-value">{inactiveProducts}</div>    
                    <p className="stat-description">Produits désactivés</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon orange">    
                      <Category className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
            </div>    
    
            {/* Bouton Ajouter Produit */}    
            <div className="action-section">    
              <button   
                className="add-button"   
                onClick={() => navigate('/ajouter-produit')}  
              >    
                <Plus className="button-icon" />    
                Ajouter Produit    
              </button>    
            </div>    
    
            {/* Barre de recherche */}    
            <div className="search-section">    
              <div className="search-container">    
                <Search className="search-icon" />    
                <input    
                  type="text"    
                  placeholder="Rechercher par référence, nom ou marque..."    
                  value={searchTerm}    
                  onChange={(e) => setSearchTerm(e.target.value)}    
                  className="search-input"    
                />    
              </div>    
            </div>    
    
            {/* Tableau */}    
            <div className="table-card">    
              <div className="table-header">    
                <h3 className="table-title">Liste des Produits</h3>    
              </div>    
              <div className="table-content">    
                <div className="table-container">    
                  {loading ? (  
                    <div className="text-center">Chargement...</div>  
                  ) : (  
                    <table className="products-table">    
                      <thead>  
                        <tr>  
                          <th>Image</th>
                          <th>Référence</th>  
                          <th>Nom Court</th>  
                          <th>Nom Complet</th>  
                          <th>Marque</th>  
                          <th>Gamme</th>  
                          <th>Statut</th>
                          <th>Actions</th>  
                        </tr>  
                      </thead>  
                      <tbody>  
                        {filteredProducts.map((product) => (  
                          <tr key={product._id}>  
                            <td>
                              <div className="product-image-cell">
                                {renderProductImage(product)}
                              </div>
                            </td>
                            <td>{product.ref}</td>  
                            <td>{product.short_name}</td>  
                            <td>{product.long_name}</td>  
                            <td>{product.brand || 'N/A'}</td>  
                            <td>{product.gamme || 'N/A'}</td>  
                            <td>{getStatusBadge(product.actif)}</td>
                             <td>  
                              <div className="action-buttons">  
                                <button     
                                  className="details-button"    
                                  onClick={() => handleViewDetails(product._id)}  
                                  title="Voir détails"  
                                >    
                                  <Eye className="details-icon" />    
                                </button>  
                                <button  
                                  className="edit-button"  
                                  onClick={() => handleEdit(product._id)}  
                                  title="Modifier"  
                                >  
                                  <Edit className="action-icon" />  
                                </button>  
                                <button  
                                  className="delete-button"  
                                  onClick={() => handleDelete(product._id)}  
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
    
                  {!loading && filteredProducts.length === 0 && (    
                    <div className="no-results">    
                      Aucun produit trouvé pour votre recherche.    
                    </div>    
                  )}    
                </div>      
              </div>      
            </div>      
          </div>      
        </div>      
      </div>      
  
      {/* Modal de détails */}  
      {isDetailModalOpen && selectedProduct && (  
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>  
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">Détails du Produit - {selectedProduct.ref}</h2>  
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>  
                <X className="close-icon" />  
              </button>  
            </div>  
              
            <div className="detail-content">  
              {/* Image du produit */}  
              <div className="detail-image-section">  
                {selectedProduct.image && selectedProduct.image.data ? (  
                  <img   
                    src={`data:image/png;base64,${btoa(  
                      new Uint8Array(selectedProduct.image.data).reduce((data, byte) => data + String.fromCharCode(byte), '')  
                    )}`}  
                    alt="Produit"   
                    className="detail-product-image"  
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
                <div className="detail-section">    
                  <h3>Informations Générales</h3>    
                  <div className="detail-item">    
                    <span className="detail-label">Référence:</span>    
                    <span className="detail-value">{selectedProduct.ref}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Nom Court:</span>    
                    <span className="detail-value">{selectedProduct.short_name}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Nom Complet:</span>    
                    <span className="detail-value">{selectedProduct.long_name}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Marque:</span>    
                    <span className="detail-value">{selectedProduct.brand || 'Non spécifié'}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Gamme:</span>    
                    <span className="detail-value">{selectedProduct.gamme || 'Non spécifié'}</span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Statut:</span>    
                    <span className="detail-value">{getStatusBadge(selectedProduct.actif)}</span>    
                  </div>    
                </div>    
    
                <div className="detail-section">    
                  <h3>Informations Système</h3>    
                  <div className="detail-item">    
                    <span className="detail-label">Date de création:</span>    
                    <span className="detail-value">  
                      {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString("fr-FR") : 'N/A'}  
                    </span>    
                  </div>    
                  <div className="detail-item">    
                    <span className="detail-label">Dernière modification:</span>    
                    <span className="detail-value">  
                      {selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleDateString("fr-FR") : 'N/A'}  
                    </span>    
                  </div>    
                </div>    
              </div>    
    
              {/* Description */}    
              {selectedProduct.description && (    
                <div className="detail-section">    
                  <h3>Description</h3>    
                  <p className="detail-description">{selectedProduct.description}</p>    
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
              <h2 className="modal-title">Modifier le Produit</h2>    
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
                
            <form onSubmit={handleSubmitEdit} className="modal-form">    
              <div className="form-grid">    
                <div className="form-group">    
                  <label className="form-label">Référence</label>    
                  <input    
                    type="text"    
                    value={formData.ref}    
                    onChange={(e) => handleInputChange("ref", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Nom Court</label>    
                  <input    
                    type="text"    
                    value={formData.short_name}    
                    onChange={(e) => handleInputChange("short_name", e.target.value)}    
                    className="form-input"    
                    required    
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Nom Complet</label>    
                  <input    
                    type="text"    
                    value={formData.long_name}    
                    onChange={(e) => handleInputChange("long_name", e.target.value)}    
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
                  />    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Gamme</label>    
                  <input    
                    type="text"    
                    value={formData.gamme}    
                    onChange={(e) => handleInputChange("gamme", e.target.value)}    
                    className="form-input"    
                  />    
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

