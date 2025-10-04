import { useState, useEffect } from "react"  
import {  
  MdWarehouse as Warehouse,  
  MdSearch as Search,  
  MdLocationOn as Location,  
  MdInventory as Inventory  
} from "react-icons/md"  
import "./GestionStocksDepot.css"  
import stockService from '../../../services/stockService'  
import productService from '../../../services/productService'  
import depotService from '../../../services/depotService'  
  
export default function GestionStocksDepot() {  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedDepot, setSelectedDepot] = useState("all")  
  const [stocks, setStocks] = useState([])  
  const [depots, setDepots] = useState([])  
  const [products, setProducts] = useState([])  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState(null)  
  const [activeTab, setActiveTab] = useState("overview")  
  
  // Charger les données au montage  
  useEffect(() => {  
    loadData()  
  }, [selectedDepot])  
  
  const loadData = async () => {  
    try {  
      setLoading(true)  
        
      // Charger les dépôts et produits  
      const [depotsResponse, productsResponse] = await Promise.all([  
        depotService.getAllDepots(),  
        productService.getAllProducts({ actif: true })  
      ])  
        
      setDepots(depotsResponse.data || [])  
      setProducts(productsResponse.data || [])  
        
      // Charger les stocks en fonction du dépôt sélectionné  
      let stocksResponse  
      if (selectedDepot === "all") {  
        stocksResponse = await stockService.getAllStocks()  
      } else {  
        stocksResponse = await stockService.getStockByDepot(selectedDepot)  
      }  
        
      setStocks(stocksResponse.data || [])  
      setError(null)  
    } catch (err) {  
      console.error("Erreur lors du chargement des données:", err)  
      setError("Erreur lors du chargement des données")  
      setStocks([])  
      setProducts([])  
      setDepots([])  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // Filtrer les stocks  
  const filteredStocks = stocks.filter(stock => {  
    const matchesSearch =   
      stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.product?.nom_court?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.product?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      stock.product?.reference?.toLowerCase().includes(searchTerm.toLowerCase())  
      
    return matchesSearch  
  })  
  
  // Obtenir le statut du stock  
  const getStockStatus = (stock) => {  
    if (stock.quantity <= 0) {  
      return { label: "Rupture", class: "status-danger" }  
    } else if (stock.quantity < (stock.minStock || stock.minQuantity)) {  
      return { label: "Stock bas", class: "status-warning" }  
    } else {  
      return { label: "Normal", class: "status-success" }  
    }  
  }  
  
  if (loading) {  
    return (  
      <div className="stock-depot-layout">  
        <div className="loading-container">  
          <div className="spinner"></div>  
          <p>Chargement des stocks...</p>  
        </div>  
      </div>  
    )  
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
                  Gestion des Stocks par Dépôt  
                </h1>  
                <p className="page-subtitle">  
                  Gérez et surveillez les stocks de chaque dépôt  
                </p>  
                <button  
                  className="btn btn-primary"  
                  style={{ marginLeft: 16 }}  
                  onClick={() => window.location.href = '/admin/stocks'}  
                >  
                  Vue globale  
                </button>  
              </div>  
            </div>  
  
            {/* Sélecteur de dépôt */}  
            <div className="depot-selector">  
              <label>Sélectionner un dépôt :</label>  
              <select   
                value={selectedDepot}  
                onChange={(e) => setSelectedDepot(e.target.value)}  
                className="depot-select"  
              >  
                <option value="all">Tous les dépôts</option>  
                {depots.map(depot => (  
                  <option key={depot._id} value={depot._id}>  
                    {depot.short_name} ({depot.reference})  
                  </option>  
                ))}  
              </select>  
            </div>  
  
            {/* Onglets */}  
            <div className="tabs">  
              <button   
                className={`tab ${activeTab === "overview" ? "active" : ""}`}  
                onClick={() => setActiveTab("overview")}  
              >  
                Vue d'ensemble  
              </button>  
              <button   
                className={`tab ${activeTab === "details" ? "active" : ""}`}  
                onClick={() => setActiveTab("details")}  
              >  
                Détails des stocks  
              </button>  
            </div>  
  
            {/* Contenu des onglets */}  
            {activeTab === "overview" && (  
              <div className="tab-content">  
                <div className="depots-grid">  
                  {depots.map(depot => (  
                    <div key={depot._id} className="depot-card">  
                      <div className="depot-header">  
                        <div className="depot-icon">  
                          <Location />  
                        </div>  
                        <div className="depot-info">  
                          <h3>{depot.short_name}</h3>  
                          <p className="depot-code">{depot.reference}</p>  
                          {depot.address && (  
                            <p className="depot-address">{depot.address}</p>  
                          )}  
                        </div>  
                      </div>  
                      <div className="depot-description">  
                        {depot.description && (  
                          <p>{depot.description}</p>  
                        )}  
                        {depot.surface_area && (  
                          <p>Surface: {depot.surface_area} m²</p>  
                        )}  
                      </div>  
                    </div>  
                  ))}  
                </div>  
                {depots.length === 0 && (  
                  <div className="empty-state">  
                    <Location className="empty-icon" />  
                    <p>Aucun dépôt trouvé</p>  
                  </div>  
                )}  
              </div>  
            )}  
  
            {activeTab === "details" && (  
              <div className="tab-content">  
                {/* Barre de recherche */}  
                <div className="search-section">  
                  <div className="search-box">  
                    <Search className="search-icon" />  
                    <input  
                      type="text"  
                      placeholder="Rechercher un produit..."  
                      value={searchTerm}  
                      onChange={(e) => setSearchTerm(e.target.value)}  
                    />  
                  </div>  
                </div>  
  
                {/* Tableau des stocks */}  
                <div className="stocks-table-container">  
                  <table className="stocks-table">  
                    <thead>  
                      <tr>  
                        <th>Code</th>  
                        <th>Produit</th>  
                        <th>Dépôt</th>  
                        <th>Quantité</th>  
                        <th>Stock min</th>  
                        <th>Statut</th>  
                        <th>Dernière MAJ</th>  
                      </tr>  
                    </thead>  
                    <tbody>  
                      {filteredStocks.map(stock => {  
                        const status = getStockStatus(stock)  
                        return (  
                          <tr key={stock._id}>  
                            <td className="font-medium">{stock.product?.reference || stock.product?.code}</td>  
                            <td>{stock.product?.nom_court || stock.product?.name}</td>  
                            <td>{stock.depot?.short_name}</td>  
                            <td className="quantity-cell">  
                              <span className={stock.quantity < (stock.minStock || stock.minQuantity) ? "text-warning" : ""}>  
                                {stock.quantity}  
                              </span>  
                            </td>  
                            <td>{stock.minStock || stock.minQuantity}</td>  
                            <td>  
                              <span className={`status-badge ${status.class}`}>  
                                {status.label}  
                              </span>  
                            </td>  
                            <td>{new Date(stock.updatedAt || stock.lastUpdated).toLocaleDateString()}</td>  
                          </tr>  
                        )  
                      })}  
                    </tbody>  
                  </table>  
                  {filteredStocks.length === 0 && (  
                    <div className="empty-state">  
                      <Inventory className="empty-icon" />  
                      <p>Aucun stock trouvé</p>  
                    </div>  
                  )}  
                </div>  
              </div>  
            )}  
          </div>  
        </div>  
      </div>  
    </div>  
  )  
}
