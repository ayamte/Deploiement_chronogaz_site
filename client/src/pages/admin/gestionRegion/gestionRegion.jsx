import { useState, useEffect } from "react"  
import { useNavigate } from "react-router-dom"  
import {  
  MdSearch as Search,  
  MdAdd as Plus,  
  MdEdit as Edit,  
  MdDelete as Delete,  
  MdClose as X,  
  MdLocationCity as LocationCity,  
  MdSave as Save  
} from "react-icons/md"  
import "./gestionRegion.css"  
import locationService from '../../../services/locationService'  
  
export default function GestionVilles() { 
  const navigate = useNavigate()  
  const [cities, setCities] = useState([])  
  const [loading, setLoading] = useState(true)  
  const [searchTerm, setSearchTerm] = useState("")  
    

  const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false)  
  const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false)  
    
  // États pour les formulaires des villes
  const [selectedCity, setSelectedCity] = useState(null)  
  const [cityFormData, setCityFormData] = useState({ name: "", code: "" })  
  
  useEffect(() => {  
    loadCities() 
  }, [])  
  
  const loadCities = async () => {  
    try {  
      setLoading(true)  
      const citiesResponse = await locationService.getCities()  
      setCities(citiesResponse.data || [])  
    } catch (error) {  
      console.error('Erreur chargement des villes:', error)  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // ✅ SUPPRIMER toggleCityExpansion car plus de régions à afficher
  
  // Gestion des villes  
  const handleAddCity = () => {  
    setCityFormData({ name: "", code: "" })  
    setIsAddCityModalOpen(true)  
  }  
  
  const handleEditCity = (city) => {  
    setSelectedCity(city)  
    setCityFormData({ name: city.name, code: city.code })  
    setIsEditCityModalOpen(true)  
  }  
  
  const handleSubmitCity = async (e) => {  
    e.preventDefault()  
    try {  
      if (isEditCityModalOpen) {  
        await locationService.updateCity(selectedCity._id, cityFormData)  
      } else {  
        await locationService.createCity(cityFormData)  
      }  
      await loadCities() // ✅ Simplifié
      setIsAddCityModalOpen(false)  
      setIsEditCityModalOpen(false)  
      setSelectedCity(null)  
    } catch (error) {  
      console.error('Erreur:', error)  
    }  
  }  
  
  const handleDeleteCity = async (cityId) => {  
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) { // ✅ Message simplifié
      try {  
        await locationService.deleteCity(cityId)  
        await loadCities() // ✅ Simplifié
      } catch (error) {  
        console.error('Erreur:', error)  
      }  
    }  
  }  

  
  // Filtrer les villes selon le terme de recherche  
  const filteredCities = cities.filter(city =>  
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    city.code.toLowerCase().includes(searchTerm.toLowerCase())  
  )  
  
  // ✅ Statistiques simplifiées - suppression des régions
  const totalCities = cities.length  
  const activeCities = cities.filter(city => city.actif).length  
  
  return (  
    <div className="region-management-layout">  
      <div className="region-management-wrapper">  
        <div className="region-management-container">  
          <div className="region-management-content">  
            {/* ✅ En-tête modifié */}  
            <div className="page-header">  
              <h1 className="page-title">Gestion des Villes</h1>  
              <p className="page-subtitle">Gérez les villes pour la livraison ChronoGaz</p>  
            </div>  
  
            {/* ✅ Statistiques simplifiées */}  
            <div className="stats-grid">  
              <div className="stat-card gradient-card">  
                <div className="stat-content">  
                  <h3 className="stat-label">Total Villes</h3>  
                  <div className="stat-value">{totalCities}</div>  
                  <p className="stat-description">Villes configurées</p>  
                </div>  
              </div>  
              <div className="stat-card gradient-card">  
                <div className="stat-content">  
                  <h3 className="stat-label">Villes Actives</h3>  
                  <div className="stat-value">{activeCities}</div>  
                  <p className="stat-description">Villes en service</p>  
                </div>  
              </div>  
              <div className="stat-card gradient-card">  
                <div className="stat-content">  
                  <h3 className="stat-label">Ville Principale</h3>  
                  <div className="stat-value">Casablanca</div>  
                  <p className="stat-description">Zone de service principale</p>  
                </div>  
              </div>  
            </div>  
  
            {/* Actions */}  
            <div className="action-section">  
              <button className="add-button" onClick={handleAddCity}>  
                <Plus className="button-icon" />  
                Ajouter Ville  
              </button>  
            </div>  
  
            {/* Recherche */}  
            <div className="search-section">  
              <div className="search-container">  
                <Search className="search-icon" />  
                <input  
                  type="text"  
                  placeholder="Rechercher par nom ou code de ville..."  
                  value={searchTerm}  
                  onChange={(e) => setSearchTerm(e.target.value)}  
                  className="search-input"  
                />  
              </div>  
            </div>  
  
            {/* ✅ Liste simplifiée des villes - suppression de la hiérarchie */}  
            <div className="cities-container">  
              {loading ? (  
                <div className="loading-container">Chargement...</div>  
              ) : (  
                <div className="cities-list">  
                  {filteredCities.map(city => (  
                    <div key={city._id} className="city-item">  
                      <div className="city-header">  
                        <div className="city-info">  
                          <LocationCity className="city-icon" />  
                          <div className="city-details">  
                            <h3 className="city-name">{city.name}</h3>  
                            <span className="city-code">Code: {city.code}</span>  
                            <span className="city-status">  
                              {city.actif ? 'Actif' : 'Inactif'}  
                            </span>  
                          </div>  
                        </div>  
                        <div className="city-actions">  
                          <button   
                            className="action-btn edit-btn"  
                            onClick={() => handleEditCity(city)}  
                            title="Modifier la ville"  
                          >  
                            <Edit />  
                          </button>  
                          <button   
                            className="action-btn delete-btn"  
                            onClick={() => handleDeleteCity(city._id)}  
                            title="Supprimer la ville"  
                          >  
                            <Delete />  
                          </button>  
                        </div>  
                      </div>  
                      {/* ✅ SUPPRIMER toute la section des régions */}
                    </div>  
                  ))}  
                </div>  
              )}  
            </div>  
          </div>  
        </div>  
      </div>  
  
      {/* Modal Ajouter/Modifier Ville */}  
      {(isAddCityModalOpen || isEditCityModalOpen) && (  
        <div className="modal-overlay" onClick={() => {  
          setIsAddCityModalOpen(false)  
          setIsEditCityModalOpen(false)  
        }}>  
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>  
            <div className="modal-header">  
              <h2 className="modal-title">  
                {isEditCityModalOpen ? 'Modifier la ville' : 'Ajouter une ville'}  
              </h2>  
              <button className="modal-close" onClick={() => {  
                setIsAddCityModalOpen(false)  
                setIsEditCityModalOpen(false)  
              }}>  
                <X className="close-icon" />  
              </button>  
            </div>  
              
            <form onSubmit={handleSubmitCity} className="modal-form">  
              <div className="form-group">  
                <label className="form-label">Nom de la ville</label>  
                <input  
                  type="text"  
                  value={cityFormData.name}  
                  onChange={(e) => setCityFormData({...cityFormData, name: e.target.value})}  
                  className="form-input"  
                  placeholder="Ex: Casablanca"  
                  required  
                />  
              </div>  
                
              <div className="form-group">  
                <label className="form-label">Code de la ville</label>  
                <input  
                  type="text"  
                  value={cityFormData.code}  
                  onChange={(e) => setCityFormData({...cityFormData, code: e.target.value.toUpperCase()})}  
                  className="form-input"  
                  placeholder="Ex: CASA"  
                  required  
                />  
              </div>  
                
              <div className="form-actions">  
                <button type="button" className="cancel-button" onClick={() => {  
                  setIsAddCityModalOpen(false)  
                  setIsEditCityModalOpen(false)  
                }}>  
                  Annuler  
                </button>  
                <button type="submit" className="submit-button">  
                  <Save className="btn-icon" />  
                  {isEditCityModalOpen ? 'Modifier' : 'Ajouter'}  
                </button>  
              </div>  
            </form>  
          </div>  
        </div>  
      )}  
  
    </div>  
  )  
}