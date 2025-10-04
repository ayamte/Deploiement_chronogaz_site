import { useState, useEffect } from 'react';  
import locationService from '../../services/locationService';  
  
export default function CityRegionSelector({   
  selectedCity,   
  selectedRegion,   
  onCityChange,   
  onRegionChange,  
  required = false   
}) {  
  const [cities, setCities] = useState([]);  
  const [regions, setRegions] = useState([]);  
  const [loadingRegions, setLoadingRegions] = useState(false);  
  
  useEffect(() => {  
    loadCities();  
  }, []);  
  
  useEffect(() => {  
    if (selectedCity) {  
      loadRegions(selectedCity);  
    } else {  
      setRegions([]);  
      onRegionChange('');  
    }  
  }, [selectedCity]);  
  
  const loadCities = async () => {  
    try {  
      const response = await locationService.getCities();  
      setCities(response.data || []);  
    } catch (error) {  
      console.error('Erreur chargement villes:', error);  
    }  
  };  
  
  const loadRegions = async (cityId) => {  
    try {  
      setLoadingRegions(true);  
      const response = await locationService.getRegionsByCity(cityId);  
      setRegions(response.data || []);  
    } catch (error) {  
      console.error('Erreur chargement régions:', error);  
    } finally {  
      setLoadingRegions(false);  
    }  
  };  
  
  return (  
    <div className="city-region-selector">  
      <div className="form-group">  
        <label className="form-label">Ville {required && '*'}</label>  
        <select  
          value={selectedCity}  
          onChange={(e) => onCityChange(e.target.value)}  
          className="form-select"  
          required={required}  
        >  
          <option value="">Sélectionner une ville</option>  
          {cities.map(city => (  
            <option key={city._id} value={city._id}>  
              {city.name}  
            </option>  
          ))}  
        </select>  
      </div>  
  
      <div className="form-group">  
        <label className="form-label">Région {required && '*'}</label>  
        <select  
          value={selectedRegion}  
          onChange={(e) => onRegionChange(e.target.value)}  
          className="form-select"  
          disabled={!selectedCity || loadingRegions}  
          required={required}  
        >  
          <option value="">  
            {!selectedCity ? 'Sélectionner d\'abord une ville' : 'Sélectionner une région'}  
          </option>  
          {regions.map(region => (  
            <option key={region._id} value={region._id}>  
              {region.nom} 
            </option>  
          ))}
        </select>  
        {loadingRegions && <p className="form-help">Chargement des régions...</p>}  
      </div>  
    </div>  
  );  
}