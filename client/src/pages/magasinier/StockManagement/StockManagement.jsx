import React, { useState, useEffect } from 'react';
import {
  MdInventory as Package,
  MdSearch as Search,
  MdAdd as Plus,
  MdEdit as Edit,
  MdDelete as Trash2,
  MdWarning as AlertTriangle,
  MdTrendingUp as TrendingUp,
  MdTrendingDown as TrendingDown,
  MdFilterList as Filter,
  MdFileDownload as Download,
  MdRefresh as RefreshCw
} from 'react-icons/md';
import './StockManagement.css';

const StockManagement = () => {
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Données mockées pour la démonstration
  const mockStockData = [
    {
      id: 1,
      code: 'BUT13',
      name: 'Bouteille Gaz Butane 13kg',
      category: 'Gaz Butane',
      quantite_theorique: 150,
      quantite_physique: 148,
      quantite_disponible: 145,
      quantite_reservee: 3,
      seuil_alerte: 20,
      prix_unitaire: 25.50,
      statut: 'NORMAL'
    },
    {
      id: 2,
      code: 'PROP35',
      name: 'Bouteille Gaz Propane 35kg',
      category: 'Gaz Propane',
      quantite_theorique: 80,
      quantite_physique: 78,
      quantite_disponible: 75,
      quantite_reservee: 3,
      seuil_alerte: 15,
      prix_unitaire: 45.00,
      statut: 'NORMAL'
    },
    {
      id: 3,
      code: 'BUT6',
      name: 'Bouteille Gaz Butane 6kg',
      category: 'Gaz Butane',
      quantite_theorique: 200,
      quantite_physique: 18,
      quantite_disponible: 15,
      quantite_reservee: 3,
      seuil_alerte: 30,
      prix_unitaire: 15.75,
      statut: 'ALERTE'
    },
    {
      id: 4,
      code: 'CIT1000',
      name: 'Citerne 1000L',
      category: 'Citernes',
      quantite_theorique: 25,
      quantite_physique: 8,
      quantite_disponible: 5,
      quantite_reservee: 3,
      seuil_alerte: 10,
      prix_unitaire: 850.00,
      statut: 'CRITIQUE'
    }
  ];

  const categories = ['Gaz Butane', 'Gaz Propane', 'Citernes', 'Accessoires', 'Équipements'];

  useEffect(() => {
    // Simulation du chargement des données
    setTimeout(() => {
      setStockData(mockStockData);
      setFilteredData(mockStockData);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = stockData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedCategory, stockData]);

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'NORMAL':
        return <span className="badge badge-normal">Normal</span>;
      case 'ALERTE':
        return <span className="badge badge-alerte">Alerte</span>;
      case 'CRITIQUE':
        return <span className="badge badge-critique">Critique</span>;
      default:
        return <span className="badge badge-normal">Normal</span>;
    }
  };

  const calculateStats = () => {
    const total = stockData.length;
    const normal = stockData.filter(item => item.statut === 'NORMAL').length;
    const alerte = stockData.filter(item => item.statut === 'ALERTE').length;
    const critique = stockData.filter(item => item.statut === 'CRITIQUE').length;
    const valeurTotale = stockData.reduce((sum, item) => sum + (item.quantite_disponible * item.prix_unitaire), 0);

    return { total, normal, alerte, critique, valeurTotale };
  };

  const stats = calculateStats();

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setStockData(stockData.filter(item => item.id !== productId));
    }
  };

  if (loading) {
    return (
      <div className="stock-management-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données de stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-management-wrapper">
      <div className="stock-management-container">
        <main className="stock-main">
          {/* En-tête de la page */}
          <div className="page-header">
            <div className="page-header-content">
              <div className="page-header-left">
                <h2 className="page-title">Gestion du Stock</h2>
                <p className="page-subtitle">
                  Gérez l'inventaire et suivez les niveaux de stock en temps réel
                </p>
              </div>
              <div className="page-header-right">
                <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                  <RefreshCw className="btn-icon" />
                  Actualiser
                </button>
                <button className="btn btn-primary" onClick={handleAddProduct}>
                  <Plus className="btn-icon" />
                  Ajouter Produit
                </button>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <h3 className="stat-card-title">Total Produits</h3>
                  <Package className="stat-card-icon" />
                </div>
                <div className="stat-card-value">{stats.total}</div>
              </div>
            </div>

            <div className="stat-card gradient-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <h3 className="stat-card-title">Stock Normal</h3>
                  <TrendingUp className="stat-card-icon" />
                </div>
                <div className="stat-card-value">{stats.normal}</div>
              </div>
            </div>

            <div className="stat-card alert-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <h3 className="stat-card-title">Alertes</h3>
                  <AlertTriangle className="stat-card-icon" />
                </div>
                <div className="stat-card-value">{stats.alerte + stats.critique}</div>
              </div>
            </div>

            <div className="stat-card value-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <h3 className="stat-card-title">Valeur Stock</h3>
                  <TrendingDown className="stat-card-icon" />
                </div>
                <div className="stat-card-value">{stats.valeurTotale.toFixed(2)}€</div>
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="filters-section">
            <div className="filters-container">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-container">
                <Filter className="filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-secondary">
                <Download className="btn-icon" />
                Exporter
              </button>
            </div>
          </div>

          {/* Tableau des produits */}
          <div className="table-container">
            <div className="table-card">
              <div className="table-header">
                <h3 className="table-title">Inventaire des Produits</h3>
                <span className="table-count">{filteredData.length} produits</span>
              </div>

              <div className="table-wrapper">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Produit</th>
                      <th>Catégorie</th>
                      <th>Qté Théorique</th>
                      <th>Qté Physique</th>
                      <th>Disponible</th>
                      <th>Réservé</th>
                      <th>Seuil</th>
                      <th>Prix Unit.</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(product => (
                      <tr key={product.id} className={product.statut === 'CRITIQUE' ? 'row-critical' : product.statut === 'ALERTE' ? 'row-alert' : ''}>
                        <td className="product-code">{product.code}</td>
                        <td className="product-name">{product.name}</td>
                        <td>{product.category}</td>
                        <td className="quantity">{product.quantite_theorique}</td>
                        <td className="quantity">{product.quantite_physique}</td>
                        <td className="quantity available">{product.quantite_disponible}</td>
                        <td className="quantity reserved">{product.quantite_reservee}</td>
                        <td className="quantity threshold">{product.seuil_alerte}</td>
                        <td className="price">{product.prix_unitaire.toFixed(2)}€</td>
                        <td>{getStatutBadge(product.statut)}</td>
                        <td className="actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditProduct(product)}
                            title="Modifier"
                          >
                            <Edit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteProduct(product.id)}
                            title="Supprimer"
                          >
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StockManagement;
