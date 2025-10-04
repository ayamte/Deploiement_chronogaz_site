import React, { useState, useEffect } from 'react';
import {
  MdHistory as History,
  MdDelete as Trash2,
  MdVisibility as Eye,
  MdLocalShipping as TruckIcon,
  MdLocationOn as MapPin,
  MdCalendarToday as Calendar,
  MdPerson as User,
  MdWarning as AlertTriangle,
  MdCheckCircle as CheckCircle,
  MdRefresh as RefreshCw,
  MdFilterList as Filter
} from 'react-icons/md';
import './TruckLoadingHistory.css';
import truckLoadingService from '../../../services/truckLoadingService';
import truckService from '../../../services/truckService';
import depotService from '../../../services/depotService';

export default function TruckLoadingHistory() {
  const [loadingSessions, setLoadingSessions] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [filters, setFilters] = useState({
    truckId: '',
    depotId: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les sessions de chargement
      const sessionsData = await truckLoadingService.getAllLoadingSessions();
      const sessionsList = Array.isArray(sessionsData?.data) ? sessionsData.data : [];
      setLoadingSessions(sessionsList);

      // Charger les camions
      const trucksData = await truckService.getAllTrucks();
      const trucksList = Array.isArray(trucksData?.data) ? trucksData.data : [];
      const mappedTrucks = trucksList.map(truck => ({
        ...truck,
        id: truck._id || truck.id,
        plateNumber: truck.matricule || truck.plateNumber,
        model: truck.modele || truck.model
      }));
      setTrucks(mappedTrucks);

      // Charger les dépôts
      const depotsData = await depotService.getAllDepots();
      const depotsList = Array.isArray(depotsData?.data) ? depotsData.data : [];
      const mappedDepots = depotsList.map(depot => ({
        ...depot,
        id: depot._id || depot.id,
        name: depot.short_name || depot.long_name || depot.name,
        code: depot.reference || depot.code
      }));
      setDepots(mappedDepots);

      setErrors([]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setErrors(['Erreur lors du chargement des données']);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await truckLoadingService.deleteLoadingSession(sessionId);
      setLoadingSessions(prev => prev.filter(session => session._id !== sessionId));
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
      setErrors([]);
    } catch (error) {
      console.error('Erreur suppression session:', error);
      setErrors(['Erreur lors de la suppression de la session']);
    }
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'tlh-status-completed';
      case 'in-progress':
        return 'tlh-status-progress';
      case 'unloaded':
        return 'tlh-status-unloaded';
      default:
        return 'tlh-status-default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in-progress':
        return 'En cours';
      case 'unloaded':
        return 'Déchargé';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="tlh-status-icon" />;
      case 'in-progress':
        return <RefreshCw className="tlh-status-icon" />;
      case 'unloaded':
        return <CheckCircle className="tlh-status-icon" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTruckInfo = (truckId) => {
    const truck = trucks.find(t => t.id === truckId || t._id === truckId);
    return truck ? `${truck.plateNumber} - ${truck.model}` : 'Camion inconnu';
  };

  const getDepotInfo = (depotId) => {
    const depot = depots.find(d => d.id === depotId || d._id === depotId);
    return depot ? `${depot.name} (${depot.code})` : 'Dépôt inconnu';
  };

  const filteredSessions = loadingSessions.filter(session => {
    if (filters.truckId && session.truck_id !== filters.truckId) return false;
    if (filters.depotId && session.depot_id !== filters.depotId) return false;
    if (filters.status && session.status !== filters.status) return false;
    if (filters.dateFrom && new Date(session.loading_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(session.loading_date) > new Date(filters.dateTo)) return false;
    return true;
  });

  if (showDeleteConfirm) {
    return (
      <div className="tlh-layout">
        <div className="tlh-wrapper">
          <div className="tlh-confirmation-overlay">
            <div className="tlh-confirmation-modal">
              <div className="tlh-confirmation-header">
                <h3 className="tlh-confirmation-title">Confirmer la suppression</h3>
              </div>
              <div className="tlh-confirmation-content">
                <p>Êtes-vous sûr de vouloir supprimer cette session de chargement ?</p>
                <p className="tlh-warning">Cette action est irréversible.</p>
              </div>
              <div className="tlh-confirmation-actions">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSessionToDelete(null);
                  }}
                  className="tlh-btn tlh-btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteSession(sessionToDelete)}
                  className="tlh-btn tlh-btn-danger"
                >
                  <Trash2 className="tlh-btn-icon" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showDetails && selectedSession) {
    return (
      <div className="tlh-layout">
        <div className="tlh-wrapper">
          <div className="tlh-details-overlay">
            <div className="tlh-details-modal">
              <div className="tlh-details-header">
                <h2 className="tlh-details-title">Détails de la session</h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedSession(null);
                  }}
                  className="tlh-details-close"
                >
                  ×
                </button>
              </div>
              
              <div className="tlh-details-content">
                <div className="tlh-details-section">
                  <h3 className="tlh-details-section-title">Informations générales</h3>
                  <div className="tlh-details-info">
                    <p><strong>Camion:</strong> {getTruckInfo(selectedSession.truck_id)}</p>
                    <p><strong>Dépôt:</strong> {getDepotInfo(selectedSession.depot_id)}</p>
                    <p><strong>Date de chargement:</strong> {formatDate(selectedSession.loading_date)}</p>
                    <p><strong>Statut:</strong> 
                      <span className={`tlh-status-badge ${getStatusColor(selectedSession.status)}`}>
                        {getStatusIcon(selectedSession.status)}
                        {getStatusText(selectedSession.status)}
                      </span>
                    </p>
                    <p><strong>Poids total:</strong> {selectedSession.total_weight?.toFixed(1) || 0} kg</p>
                    <p><strong>Volume total:</strong> {selectedSession.total_volume?.toFixed(2) || 0} m³</p>
                  </div>
                </div>

                <div className="tlh-details-section">
                  <h3 className="tlh-details-section-title">Produits chargés ({selectedSession.products?.length || 0})</h3>
                  {selectedSession.products && selectedSession.products.length > 0 ? (
                    <ul className="tlh-details-products">
                      {selectedSession.products.map((product, index) => (
                        <li key={index} className="tlh-details-product-item">
                          <div className="tlh-details-product-main">
                            <strong>{product.product_name}</strong>
                          </div>
                          <div className="tlh-details-product-details">
                            Quantité: {product.quantity_loaded} {product.unit} | 
                            Poids: {product.total_weight?.toFixed(1) || 0}kg | 
                            Volume: {product.total_volume?.toFixed(2) || 0}m³
                          </div>
                          {product.notes && (
                            <div className="tlh-details-product-notes">
                              Notes: {product.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="tlh-details-empty">Aucun produit chargé</p>
                  )}
                </div>

                {selectedSession.notes && (
                  <div className="tlh-details-section">
                    <h3 className="tlh-details-section-title">Notes</h3>
                    <p className="tlh-details-notes">{selectedSession.notes}</p>
                  </div>
                )}
              </div>

              <div className="tlh-details-actions">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedSession(null);
                  }}
                  className="tlh-btn tlh-btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tlh-layout">
      <div className="tlh-wrapper">
        <div className="tlh-container">
          <div className="tlh-content">
            {/* Header */}
            <div className="tlh-header">
              <div className="tlh-header-left">
                <div className="tlh-title-section">
                  <History className="tlh-title-icon" />
                  <h1 className="tlh-title">Historique des Chargements</h1>
                </div>
              </div>
              <div className="tlh-header-right">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="tlh-btn tlh-btn-primary"
                >
                  <RefreshCw className="tlh-btn-icon" />
                  Actualiser
                </button>
              </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="tlh-alert tlh-alert-error">
                <AlertTriangle className="tlh-alert-icon" />
                <div className="tlh-alert-content">
                  <ul className="tlh-error-list">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="tlh-card">
              <div className="tlh-card-header">
                <h3 className="tlh-card-title">
                  <Filter className="tlh-card-icon" />
                  Filtres
                </h3>
              </div>
              <div className="tlh-card-content">
                <div className="tlh-filters-grid">
                  <div className="tlh-filter-group">
                    <label className="tlh-filter-label">Camion</label>
                    <select
                      value={filters.truckId}
                      onChange={(e) => setFilters(prev => ({ ...prev, truckId: e.target.value }))}
                      className="tlh-filter-select"
                    >
                      <option value="">Tous les camions</option>
                      {trucks.map(truck => (
                        <option key={truck.id} value={truck.id}>
                          {truck.plateNumber} - {truck.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tlh-filter-group">
                    <label className="tlh-filter-label">Dépôt</label>
                    <select
                      value={filters.depotId}
                      onChange={(e) => setFilters(prev => ({ ...prev, depotId: e.target.value }))}
                      className="tlh-filter-select"
                    >
                      <option value="">Tous les dépôts</option>
                      {depots.map(depot => (
                        <option key={depot.id} value={depot.id}>
                          {depot.name} ({depot.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tlh-filter-group">
                    <label className="tlh-filter-label">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="tlh-filter-select"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="in-progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="unloaded">Déchargé</option>
                    </select>
                  </div>

                  <div className="tlh-filter-group">
                    <label className="tlh-filter-label">Date début</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="tlh-filter-input"
                    />
                  </div>

                  <div className="tlh-filter-group">
                    <label className="tlh-filter-label">Date fin</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="tlh-filter-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="tlh-card">
              <div className="tlh-card-header">
                <div className="tlh-card-title-with-badge">
                  <h3 className="tlh-card-title">Sessions de chargement</h3>
                  <span className="tlh-badge">
                    {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="tlh-card-content">
                {loading ? (
                  <div className="tlh-loading">
                    <div className="tlh-spinner" />
                    <p>Chargement des sessions...</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="tlh-empty-state">
                    <History className="tlh-empty-icon" />
                    <h3 className="tlh-empty-title">Aucune session trouvée</h3>
                    <p className="tlh-empty-message">
                      Aucune session de chargement ne correspond aux critères sélectionnés.
                    </p>
                  </div>
                ) : (
                  <div className="tlh-sessions-list">
                    {filteredSessions.map((session) => (
                      <div key={session._id} className="tlh-session-item">
                        <div className="tlh-session-header">
                          <div className="tlh-session-info">
                            <div className="tlh-session-main">
                              <TruckIcon className="tlh-session-icon" />
                              <div className="tlh-session-details">
                                <h4 className="tlh-session-truck">{getTruckInfo(session.truck_id)}</h4>
                                <p className="tlh-session-depot">
                                  <MapPin className="tlh-session-detail-icon" />
                                  {getDepotInfo(session.depot_id)}
                                </p>
                                <p className="tlh-session-date">
                                  <Calendar className="tlh-session-detail-icon" />
                                  {formatDate(session.loading_date)}
                                </p>
                              </div>
                            </div>
                            <div className={`tlh-status-badge ${getStatusColor(session.status)}`}>
                              {getStatusIcon(session.status)}
                              <span className="tlh-status-text">{getStatusText(session.status)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="tlh-session-summary">
                          <div className="tlh-summary-item">
                            <span className="tlh-summary-label">Produits:</span>
                            <span className="tlh-summary-value">{session.products?.length || 0}</span>
                          </div>
                          <div className="tlh-summary-item">
                            <span className="tlh-summary-label">Poids:</span>
                            <span className="tlh-summary-value">{session.total_weight?.toFixed(1) || 0} kg</span>
                          </div>
                          <div className="tlh-summary-item">
                            <span className="tlh-summary-label">Volume:</span>
                            <span className="tlh-summary-value">{session.total_volume?.toFixed(2) || 0} m³</span>
                          </div>
                        </div>

                        <div className="tlh-session-actions">
                          <button
                            onClick={() => handleViewDetails(session)}
                            className="tlh-btn tlh-btn-secondary tlh-btn-small"
                          >
                            <Eye className="tlh-btn-icon" />
                            Détails
                          </button>
                          <button
                            onClick={() => {
                              setSessionToDelete(session._id);
                              setShowDeleteConfirm(true);
                            }}
                            className="tlh-btn tlh-btn-danger tlh-btn-small"
                          >
                            <Trash2 className="tlh-btn-icon" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
