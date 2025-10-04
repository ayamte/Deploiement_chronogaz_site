
import { useState, useEffect } from "react"  
import { useParams, useNavigate } from "react-router-dom"  
import {  
  MdArrowBack as ArrowBack,  
  MdAdd as Plus,  
  MdSearch as Search,  
  MdEdit as Edit,  
  MdDelete as Delete,  
  MdClose as X,  
  MdInventory as Package  
} from "react-icons/md"  
import "./StockLineManagement.css"  
import stockLineService from '../../../services/stockLineService'  
import stockDepotService from '../../../services/stockDepotService'  
import productService from '../../../services/productService'  
import umService from '../../../services/umService'  
  
export default function StockLineManagement() {  
  const { stockDepotId } = useParams()  
  const navigate = useNavigate()  
    
  const [searchTerm, setSearchTerm] = useState("")  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)  
  const [stockLines, setStockLines] = useState([])  
  const [stockDepot, setStockDepot] = useState(null)  
  const [products, setProducts] = useState([])  
  const [ums, setUms] = useState([])  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState(null)  
  const [editingLine, setEditingLine] = useState(null)  
  
  const [formData, setFormData] = useState({  
    product_id: "",  
    um_id: "",  
    quantity: ""  
  })  
  
  useEffect(() => {  
    loadData()  
  }, [stockDepotId])  
  
  const loadData = async () => {  
    try {  
      setLoading(true)  
      const [stockLinesResponse, stockDepotResponse, productsResponse, umsResponse] = await Promise.all([  
        stockLineService.getStockLinesByDepot(stockDepotId),  
        stockDepotService.getStockDepotById(stockDepotId),  
        productService.getAllProducts({ actif: true }),  
        umService.getAllUms()  
      ])  
  
      setStockLines(stockLinesResponse.data || [])  
      setStockDepot(stockDepotResponse.data)  
      setProducts(productsResponse.data || [])  
      setUms(umsResponse.data || [])  
      setError(null)  
    } catch (err) {  
      console.error("Erreur lors du chargement des données:", err)  
      setError("Erreur lors du chargement des données")  
      setStockLines([])  
      setProducts([])  
      setUms([])  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  const filteredStockLines = stockLines.filter(line =>  
    line.product_id?.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    line.product_id?.ref?.toLowerCase().includes(searchTerm.toLowerCase()) 
  )  
  
  const handleInputChange = (field, value) => {  
    setFormData(prev => ({ ...prev, [field]: value }))  
  }  
  
  const handleSubmit = async (e) => {  
    e.preventDefault()  
    try {  
      const stockLineData = {  
        ...formData,  
        stock_depot_id: stockDepotId,  
        quantity: parseInt(formData.quantity)  
      }  
  
      await stockLineService.createStockLine(stockLineData)  
      await loadData()  
      setFormData({ product_id: "", um_id: "", quantity: "" })  
      setIsAddDialogOpen(false)  
    } catch (error) {  
      console.error("Erreur lors de l'ajout de la ligne:", error)  
      alert("Erreur lors de l'ajout de la ligne")  
    }  
  }  
  
  const handleEditSubmit = async (e) => {  
    e.preventDefault()  
    try {  
      const stockLineData = {  
        ...formData,  
        quantity: parseInt(formData.quantity)  
      }  
  
      await stockLineService.updateStockLine(editingLine._id, stockLineData)  
      await loadData()  
      setFormData({ product_id: "", um_id: "", quantity: "" })  
      setEditingLine(null)  
      setIsEditDialogOpen(false)  
    } catch (error) {  
      console.error("Erreur lors de la modification de la ligne:", error)  
      alert("Erreur lors de la modification de la ligne")  
    }  
  }  
  
  const handleEdit = (line) => {  
    setEditingLine(line)  
    setFormData({  
      product_id: line.product_id._id,  
      um_id: line.um_id._id,  
      quantity: line.quantity.toString()  
    })  
    setIsEditDialogOpen(true)  
  }  
  
  const handleDelete = async (id) => {  
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) {  
      try {  
        await stockLineService.deleteStockLine(id)  
        await loadData()  
      } catch (error) {  
        console.error("Erreur lors de la suppression:", error)  
        alert("Erreur lors de la suppression")  
      }  
    }  
  }  
  
  return (  
    <div className="stock-line-layout">  
      <div className="stock-line-wrapper">  
        <div className="stock-line-container">  
          <div className="stock-line-content">  
            {/* En-tête avec retour */}  
            <div className="page-header">  
              <div className="header-content">  
                <button   
                  className="back-button"  
                  onClick={() => navigate('/magasinier/inventaires')}  
                >  
                  <ArrowBack className="icon" />  
                  Retour aux inventaires  
                </button>  
                <h1 className="page-title">  
                  <Package className="icon" />  
                  Détails de l'Inventaire  
                </h1>  
                {stockDepot && (  
                  <div className="inventory-info">  
                    <p><strong>Dépôt:</strong> {stockDepot.depot_id?.short_name}</p>  
                    <p><strong>Date:</strong> {new Date(stockDepot.stock_date).toLocaleDateString('fr-FR')}</p>  
                    <p><strong>Description:</strong> {stockDepot.description || 'N/A'}</p>  
                  </div>  
                )}  
              </div>  
            </div>  
  
            {/* Actions */}  
            <div className="action-section">  
              <button className="add-button" onClick={() => setIsAddDialogOpen(true)}>  
                <Plus className="button-icon" />  
                Ajouter Produit  
              </button>  
            </div>  
  
            {/* Recherche */}  
            <div className="filter-section">  
              <div className="search-container">  
                <Search className="search-icon" />  
                <input  
                  type="text"  
                  placeholder="Rechercher un produit..."  
                  value={searchTerm}  
                  onChange={(e) => setSearchTerm(e.target.value)}  
                  className="search-input"  
                />  
              </div>  
            </div>  
  
            {/* Tableau des lignes de stock */}  
            <div className="table-card">  
              <div className="table-header">  
                <h3 className="table-title">Produits de l'Inventaire</h3>  
                <span className="table-count">{filteredStockLines.length} produits</span>  
              </div>  
              <div className="table-content">  
                <table className="stock-lines-table">  
                  <thead>  
                    <tr>  
                      <th>Code</th>  
                      <th>Produit</th>  
                      <th>Unité</th>  
                      <th>Quantité</th>  
                      <th>Actions</th>  
                    </tr>  
                  </thead>  
                  <tbody>  
                    {loading ? (  
                      <tr>  
                        <td colSpan="5" className="text-center">Chargement...</td>  
                      </tr>  
                    ) : filteredStockLines.length === 0 ? (  
                      <tr>  
                        <td colSpan="5" className="text-center">  
                          Aucun produit dans cet inventaire  
                        </td>  
                      </tr>  
                    ) : (  
                      filteredStockLines.map((line) => (  
                        <tr key={line._id}>  
                          <td>{line.product_id?.ref}</td>  
                          <td>{line.product_id?.short_name}</td> 
                          <td>{line.um_id?.symbole || line.um_id?.nom}</td>  
                          <td className="quantity-cell">{line.quantity}</td>  
                          <td>  
                            <div className="action-buttons">  
                              <button  
                                className="edit-button"  
                                onClick={() => handleEdit(line)}  
                                title="Modifier"  
                              >  
                                <Edit className="action-icon" />  
                              </button>  
                              <button  
                                className="delete-button"  
                                onClick={() => handleDelete(line._id)}  
                                title="Supprimer"  
                              >  
                                <Delete className="action-icon" />  
                              </button>  
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
  
      {/* Modal Ajouter Produit */}  
      {isAddDialogOpen && (  
        <div className="modal-overlay" onClick={() => setIsAddDialogOpen(false)}>  
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">Ajouter Produit</h2>  
              <button className="modal-close" onClick={() => setIsAddDialogOpen(false)}>  
                <X className="close-icon" />  
              </button>  
            </div>  
  
            <form onSubmit={handleSubmit} className="modal-form">  
              <div className="form-group">  
                <label htmlFor="product" className="form-label">Produit *</label>  
                <select  
                  id="product"  
                  value={formData.product_id}  
                  onChange={(e) => handleInputChange("product_id", e.target.value)}  
                  className="form-select"  
                  required  
                >  
                  <option value="">Sélectionner un produit</option>  
                  {products.map(product => (  
                    <option key={product._id} value={product._id}>  
                      {product.short_name} ({product.ref}) 
                    </option>  
                  ))}  
                </select>  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="um" className="form-label">Unité de mesure *</label>  
                <select  
                  id="um"  
                  value={formData.um_id}  
                  onChange={(e) => handleInputChange("um_id", e.target.value)}  
                  className="form-select"  
                  required  
                >  
                  <option value="">Sélectionner une unité</option>  
                  {ums.map(um => (  
                    <option key={um._id} value={um._id}>  
                      {um.nom} ({um.symbole})  
                    </option>  
                  ))}  
                </select>  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="quantity" className="form-label">Quantité *</label>  
                <input  
                  id="quantity"  
                  type="number"  
                  min="0"  
                  placeholder="Ex: 100"  
                  value={formData.quantity}  
                  onChange={(e) => handleInputChange("quantity", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-actions">  
                <button type="button" className="cancel-button" onClick={() => setIsAddDialogOpen(false)}>  
                  Annuler  
                </button>  
                <button type="submit" className="submit-button">  
                  Ajouter  
                </button>  
              </div>  
            </form>  
          </div>  
        </div>  
      )}  
  
      {/* Modal Modifier Produit */}  
      {isEditDialogOpen && (  
        <div className="modal-overlay" onClick={() => setIsEditDialogOpen(false)}>  
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">Modifier Produit</h2>  
              <button className="modal-close" onClick={() => setIsEditDialogOpen(false)}>  
                <X className="close-icon" />  
              </button>  
            </div>  
  
            <form onSubmit={handleEditSubmit} className="modal-form">  
              <div className="form-group">  
                <label htmlFor="edit-product" className="form-label">Produit *</label>  
                <select  
                  id="edit-product"  
                  value={formData.product_id}  
                  onChange={(e) => handleInputChange("product_id", e.target.value)}  
                  className="form-select"  
                  required  
                >  
                  <option value="">Sélectionner un produit</option>  
                  {products.map(product => (  
                    <option key={product._id} value={product._id}>  
                      {product.nom_court} ({product.reference})  
                    </option>  
                  ))}  
                </select>  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-um" className="form-label">Unité de mesure *</label>  
                <select  
                  id="edit-um"  
                  value={formData.um_id}  
                  onChange={(e) => handleInputChange("um_id", e.target.value)}  
                  className="form-select"  
                  required  
                >  
                  <option value="">Sélectionner une unité</option>  
                  {ums.map(um => (  
                    <option key={um._id} value={um._id}>  
                      {um.nom} ({um.symbole})  
                    </option>  
                  ))}  
                </select>  
              </div>  
  
              <div className="form-group">  
                <label htmlFor="edit-quantity" className="form-label">Quantité *</label>  
                <input  
                  id="edit-quantity"  
                  type="number"  
                  min="0"  
                  placeholder="Ex: 100"  
                  value={formData.quantity}  
                  onChange={(e) => handleInputChange("quantity", e.target.value)}  
                  className="form-input"  
                  required  
                />  
              </div>  
  
              <div className="form-actions">  
                <button type="button" className="cancel-button" onClick={() => setIsEditDialogOpen(false)}>  
                  Annuler  
                </button>  
                <button type="submit" className="submit-button">  
                  Modifier  
                </button>  
              </div>  
            </form>  
          </div>  
        </div>  
      )}  
    </div>  
  )  
}

