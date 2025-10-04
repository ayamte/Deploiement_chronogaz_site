import { useState, useEffect } from "react"   
import {     
  MdWarehouse as Warehouse,     
  MdAdd as Plus,     
  MdSearch as Search,     
  MdWarning as Warning,  
  MdSwapHoriz as SwapHoriz,  
  MdEdit as Edit,  
  MdClose as X,  
  MdInventory as Package  
} from "react-icons/md"    
import "./gestionStock.css"    
import stockService from '../../../services/stockService'  
import productService from '../../../services/productService'  
import depotService from '../../../services/depotService'  
  
export default function StockManagement() {  
  const [searchTerm, setSearchTerm] = useState("")    
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)  
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)  
  const [stocks, setStocks] = useState([])  
  const [products, setProducts] = useState([])  
  const [depots, setDepots] = useState([])  
  const [lowStockAlerts, setLowStockAlerts] = useState([])  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState(null)  
  const [selectedDepot, setSelectedDepot] = useState("all")  
    
  const [formData, setFormData] = useState({    
    product: "",    
    depot: "",    
    quantity: "",    
    minStock: "",    
  })  
    
  const [transferData, setTransferData] = useState({  
    productId: "",  
    fromDepot: "",  
    toDepot: "",  
    quantity: ""  
  })  
  
  // Charger les données au montage  
  useEffect(() => {  
    loadData()  
  }, [])  
  
  const loadData = async () => {  
    try {  
      setLoading(true)  
      const [stocksResponse, productsResponse, depotsResponse, alertsResponse] = await Promise.all([  
        stockService.getAllStocks(),  
        productService.getAllProducts({ actif: true }),  
        depotService.getAllDepots(),  
        stockService.getLowStockAlerts()  
      ])  
        
      setStocks(stocksResponse.data || [])  
      setProducts(productsResponse.data || [])  
      setDepots(depotsResponse.data || [])  
      setLowStockAlerts(alertsResponse.data || [])  
      setError(null)  
    } catch (err) {  
      console.error("Erreur lors du chargement des données:", err)  
      setError("Erreur lors du chargement des données")  
      // Suppression des données mockées - laisse les tableaux vides en cas d'erreur  
      setStocks([])  
      setProducts([])  
      setDepots([])  
      setLowStockAlerts([])  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // Filtrer les stocks - ✅ Corrigé pour utiliser la nouvelle structure des dépôts  
  const filteredStocks = stocks.filter(stock => {  
    const matchesSearch =   
      stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.product?.nom_court?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.product?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.product?.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.depot?.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.depot?.reference?.toLowerCase().includes(searchTerm.toLowerCase())  
      
    const matchesDepot = selectedDepot === "all" || stock.depot?._id === selectedDepot  
      
    return matchesSearch && matchesDepot  
  })  
  
  // Calculer les statistiques  
  const totalProducts = stocks.length  
  const lowStockCount = lowStockAlerts.length  
  const totalQuantity = stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0)  
  
  const handleInputChange = (field, value, isTransfer = false) => {  
    if (isTransfer) {  
      setTransferData(prev => ({ ...prev, [field]: value }))  
    } else {  
      setFormData(prev => ({ ...prev, [field]: value }))  
    }  
  }  
  
  const handleSubmit = async (e) => {  
    e.preventDefault()  
      
    try {  
      const stockData = {  
        product: formData.product,  
        depot: formData.depot,  
        quantity: parseInt(formData.quantity),  
        minStock: parseInt(formData.minStock)  
      }  
  
      await stockService.createStock(stockData)  
      await loadData()  
        
      // Réinitialiser le formulaire  
      setFormData({  
        product: "",  
        depot: "",  
        quantity: "",  
        minStock: ""  
      })  
      setIsAddDialogOpen(false)  
    } catch (error) {  
      console.error("Erreur lors de l'ajout du stock:", error)  
      alert("Erreur lors de l'ajout du stock")  
    }  
  }  
  
  const handleTransfer = async (e) => {  
    e.preventDefault()  
      
    try {  
      const data = {  
        productId: transferData.productId,  
        fromDepot: transferData.fromDepot,  
        toDepot: transferData.toDepot,  
        quantity: parseInt(transferData.quantity)  
      }  
  
      await stockService.transferStock(data)  
      await loadData()  
        
      // Réinitialiser le formulaire  
      setTransferData({  
        productId: "",  
        fromDepot: "",  
        toDepot: "",  
        quantity: ""  
      })  
      setIsTransferDialogOpen(false)  
    } catch (error) {  
      console.error("Erreur lors du transfert:", error)  
      alert("Erreur lors du transfert")  
    }  
  }  
  
  const getStockStatus = (stock) => {  
    if (stock.quantity <= 0) {  
      return <span className="badge badge-danger">Rupture</span>  
    } else if (stock.quantity < (stock.minStock || stock.minQuantity)) {  
      return <span className="badge badge-warning">Stock bas</span>  
    } else {  
      return <span className="badge badge-success">Normal</span>  
    }  
  }  
  
  return (    
    <div className="stock-management-layout">    
      <div className="stock-management-wrapper">    
        <div className="stock-management-container">    
          <div className="stock-management-content">    
            {/* En-tête */}    
            <div className="table-header">  
              <h2 className="table-title">Gestion Globale des Stocks</h2>  
              <button  
                className="btn btn-primary"  
                style={{ marginLeft: 16 }}  
                onClick={() => window.location.href = '/admin/stocks-depot'}  
              >  
                Vue par dépôt  
              </button>  
            </div>    
              
            {/* Cards statistiques */}    
            <div className="stock-stats-grid">    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Total Produits</h3>    
                    <div className="stat-value">{totalProducts}</div>    
                    <p className="stat-description">Références en stock</p>    
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
                    <h3 className="stat-label">Quantité Totale</h3>    
                    <div className="stat-value">{totalQuantity.toLocaleString()}</div>    
                    <p className="stat-description">Unités en stock</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon green">    
                      <Warehouse className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
    
              <div className="stat-card gradient-card">    
                <div className="stat-card-header">    
                  <div className="stat-content">    
                    <h3 className="stat-label">Alertes Stock Bas</h3>    
                    <div className="stat-value">{lowStockCount}</div>    
                    <p className="stat-description">Produits à réapprovisionner</p>    
                  </div>    
                  <div className="stat-icon-container">    
                    <div className="stat-icon orange">    
                      <Warning className="icon" />    
                    </div>    
                  </div>    
                </div>    
              </div>    
            </div>    
    
            {/* Boutons d'action */}    
            <div className="action-section">    
              <button className="add-button" onClick={() => setIsAddDialogOpen(true)}>    
                <Plus className="button-icon" />    
                Ajouter Stock    
              </button>  
              <button className="transfer-button" onClick={() => setIsTransferDialogOpen(true)}>    
                <SwapHoriz className="button-icon" />    
                Transférer Stock    
              </button>  
            </div>    
    
            {/* Filtres et recherche */}    
            <div className="filter-section">  
              <div className="search-container">    
                <Search className="search-icon" />    
                <input    
                  type="text"    
                  placeholder="Rechercher par produit, code ou dépôt..."    
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
            </div>    
    
            {/* Alertes de stock bas - ✅ Corrigé pour utiliser short_name */}  
            {lowStockAlerts.length > 0 && (  
              <div className="alerts-section">  
                <h3 className="alerts-title">  
                  <Warning className="alert-icon" />  
                  Alertes de Stock Bas  
                </h3>  
                <div className="alerts-grid">  
                  {lowStockAlerts.map(alert => (  
                    <div key={alert._id} className="alert-card">  
                      <div className="alert-content">  
                        <h4>{alert.product?.nom_court || alert.product?.name}</h4>  
                        <p>Dépôt: {alert.depot?.short_name || 'N/A'}</p>  
                        <p className="alert-quantity">  
                          Stock actuel: <strong>{alert.quantity}</strong> /   
                          Minimum requis: <strong>{alert.minStock || alert.minQuantity}</strong>  
                        </p>  
                      </div>  
                    </div>  
                  ))}  
                </div>  
              </div>  
            )}  
  
            {/* Tableau des stocks */}    
            <div className="table-card">    
              <div className="table-header">    
                <h3 className="table-title">État des Stocks</h3>    
              </div>    
              <div className="table-content">    
                <div className="table-container">    
                  <table className="stocks-table">    
                    <thead>    
                      <tr>    
                        <th>Produit</th>    
                        <th>Code</th>    
                        <th>Dépôt</th>    
                        <th>Quantité</th>    
                        <th>Stock Min</th>    
                        <th>Statut</th>    
                        <th>Dernière MAJ</th>  
                        <th>Actions</th>    
                      </tr>    
                    </thead>    
                    <tbody>    
                      {loading ? (  
                        <tr>  
                          <td colSpan="8" className="text-center">Chargement...</td>  
                        </tr>  
                      ) : filteredStocks.length === 0 ? (  
                        <tr>  
                          <td colSpan="8" className="text-center">  
                            Aucun stock trouvé  
                          </td>  
                        </tr>  
                      ) : (  
                        filteredStocks.map((stock) => (    
                          <tr key={stock._id}>    
                            <td className="font-medium">{stock.product?.nom_court || stock.product?.name || 'N/A'}</td>    
                            <td>{stock.product?.reference || stock.product?.code || 'N/A'}</td>  
                            <td>{stock.depot?.short_name || 'N/A'}</td>    
                            <td className="quantity-cell">{stock.quantity}</td>    
                            <td>{stock.minStock || stock.minQuantity || 0}</td>  
                            <td>{getStockStatus(stock)}</td>    
                            <td>{new Date(stock.updatedAt || stock.lastUpdated).toLocaleDateString('fr-FR')}</td>  
                            <td>  
                              <button className="edit-button" title="Modifier">  
                                <Edit className="action-icon" />  
                              </button>  
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
      </div>    
    
      {/* Modal Ajouter Stock */}    
      {isAddDialogOpen && (    
        <div className="modal-overlay" onClick={() => setIsAddDialogOpen(false)}>    
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Ajouter Stock</h2>    
              <button className="modal-close" onClick={() => setIsAddDialogOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
                
            <form onSubmit={handleSubmit} className="modal-form">    
              <div className="form-group">    
                <label htmlFor="product" className="form-label">Produit</label>    
                <select    
                  id="product"    
                  value={formData.product}    
                  onChange={(e) => handleInputChange("product", e.target.value)}  
                  className="form-select"    
                  required    
                >    
                  <option value="">Sélectionner un produit</option>    
                  {products.map(product => (  
                    <option key={product._id} value={product._id}>  
                      {product.nom_court || product.name} ({product.reference || product.code})  
                    </option>  
                  ))}  
                </select>    
              </div>    
    
              <div className="form-group">    
                <label htmlFor="depot" className="form-label">Dépôt</label>    
                <select    
                  id="depot"    
                  value={formData.depot}    
                  onChange={(e) => handleInputChange("depot", e.target.value)}    
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
                <label htmlFor="quantity" className="form-label">Quantité</label>    
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
    
              <div className="form-group">    
                <label htmlFor="minStock" className="form-label">Stock Minimum</label>    
                <input    
                  id="minStock"    
                  type="number"    
                  min="0"  
                  placeholder="Ex: 20"    
                  value={formData.minStock}    
                  onChange={(e) => handleInputChange("minStock", e.target.value)}    
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
  
      {/* Modal Transfert Stock */}    
      {isTransferDialogOpen && (    
        <div className="modal-overlay" onClick={() => setIsTransferDialogOpen(false)}>    
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h2 className="modal-title">Transférer Stock</h2>    
              <button className="modal-close" onClick={() => setIsTransferDialogOpen(false)}>    
                <X className="close-icon" />    
              </button>    
            </div>    
                
            <form onSubmit={handleTransfer} className="modal-form">    
              <div className="form-group">    
                <label htmlFor="transfer-product" className="form-label">Produit</label>    
                <select    
                  id="transfer-product"    
                  value={transferData.productId}    
                  onChange={(e) => handleInputChange("productId", e.target.value, true)}    
                  className="form-select"    
                  required    
                >    
                  <option value="">Sélectionner un produit</option>    
                  {products.map(product => (  
                    <option key={product._id} value={product._id}>  
                      {product.nom_court || product.name} ({product.reference || product.code})  
                    </option>  
                  ))}  
                </select>    
              </div>    
    
              <div className="form-group">    
                <label htmlFor="from-depot" className="form-label">Dépôt source</label>    
                <select    
                  id="from-depot"    
                  value={transferData.fromDepot}    
                  onChange={(e) => handleInputChange("fromDepot", e.target.value, true)}    
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
                <label htmlFor="to-depot" className="form-label">Dépôt destination</label>    
                <select    
                  id="to-depot"    
                  value={transferData.toDepot}    
                  onChange={(e) => handleInputChange("toDepot", e.target.value, true)}    
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
                <label htmlFor="transfer-quantity" className="form-label">Quantité à transférer</label>    
                <input    
                  id="transfer-quantity"    
                  type="number"    
                  min="1"  
                  placeholder="Ex: 50"    
                  value={transferData.quantity}    
                  onChange={(e) => handleInputChange("quantity", e.target.value, true)}    
                  className="form-input"    
                  required    
                />    
              </div>    
    
              <div className="form-actions">    
                <button type="button" className="cancel-button" onClick={() => setIsTransferDialogOpen(false)}>    
                  Annuler    
                </button>    
                <button type="submit" className="submit-button">    
                  Transférer    
                </button>    
              </div>    
            </form>    
          </div>    
        </div>    
      )}    
    </div>    
  )    
}