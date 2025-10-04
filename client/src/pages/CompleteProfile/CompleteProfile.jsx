import { useState, useEffect } from "react";      
import { User, Building, AlertCircle } from "lucide-react";      
import { authService } from "../../services/authService";  
import { redirectUserByRole } from "../../utils/redirectUtils";  
import "./CompleteProfile.css";      
  
const CompleteProfile = ({ googleProfile }) => {      
  const [userType, setUserType] = useState("PHYSIQUE");      
  const [isLoading, setIsLoading] = useState(false);      
  const [error, setError] = useState("");      
  const [cities, setCities] = useState([]);    
  const [loadingCities, setLoadingCities] = useState(false);    
  
  // Pré-remplir avec les données Google      
  const [physicalData, setPhysicalData] = useState({      
    first_name: googleProfile?.given_name || "",      
    last_name: googleProfile?.family_name || "",      
    civilite: "M",      
    telephone_principal: "",      
    // Champs d'adresse structurés    
    street: "",    
    numappt: "",    
    numimmeuble: "",    
    quartier: "",    
    postal_code: "",    
    city_id: ""    
  });      
  
  // Définition de moralData pour les entreprises      
  const [moralData, setMoralData] = useState({      
    raison_sociale: "",      
    ice: "",      
    patente: "",      
    rc: "",      
    ville_rc: "",      
    telephone_principal: "",      
    // Champs d'adresse structurés    
    street: "",    
    numappt: "",    
    numimmeuble: "",    
    quartier: "",    
    postal_code: "",    
    city_id: ""    
  });      
  
  // Charger les villes au montage du composant    
  useEffect(() => {    
    loadCities();    
  }, []);    
  
  const loadCities = async () => {      
    try {      
      setLoadingCities(true);      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/locations/cities`);      
      const data = await response.json();      
              
      if (data.success) {      
        setCities(data.data || []);      
      }      
    } catch (error) {      
      console.error('Erreur lors du chargement des villes:', error);      
    } finally {      
      setLoadingCities(false);      
    }      
  };    
  
  const handlePhysicalChange = (e) => {      
    setPhysicalData(prev => ({      
      ...prev,      
      [e.target.name]: e.target.value      
    }));      
  };      
  
  const handleMoralChange = (e) => {      
    setMoralData(prev => ({      
      ...prev,      
      [e.target.name]: e.target.value      
    }));      
  };      
  
  const handleSubmit = async (e) => {      
    e.preventDefault();      
    setIsLoading(true);      
    setError("");      
  
    try {      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/complete-profile`, {      
        method: "POST",      
        headers: {      
          "Content-Type": "application/json",      
          "Authorization": `Bearer ${authService.getToken()}`      
        },      
        body: JSON.stringify({      
          type_personne: userType,      
          profile: userType === 'PHYSIQUE' ? physicalData : moralData      
        })      
      });      
  
      const data = await response.json();        
      if (data.success) {        
        // Mettre à jour le token si fourni      
        if (data.data?.token) {      
          authService.setToken(data.data.token);      
            
          // Créer un objet utilisateur complet avec le type  
          const completeUser = {  
            ...data.data.user,  
            type: userType // PHYSIQUE ou MORAL  
          };  
            
          authService.setUser(completeUser);      
        }      
          
        // Rediriger selon le type d'utilisateur  
        redirectUserByRole('CLIENT', userType);        
      } else {        
        throw new Error(data.message);        
      }     
    } catch (error) {      
      console.error('Erreur:', error);      
      setError(error.message || 'Une erreur est survenue');      
    } finally {      
      setIsLoading(false);      
    }      
  };      
  
  return (      
    <div className="complete-profile-container">      
      <div className="complete-profile-content">      
        <div className="complete-profile-header">      
          <h1 className="complete-profile-title">Complétez votre profil</h1>      
          <p className="complete-profile-subtitle">      
            Quelques informations supplémentaires pour finaliser votre inscription      
          </p>      
        </div>      
  
        {error && (      
          <div className="error-message">      
            <AlertCircle className="error-icon" />      
            <span>{error}</span>      
          </div>      
        )}      
  
        <div className="user-type-selection">      
          <button      
            type="button"      
            onClick={() => setUserType("PHYSIQUE")}      
            className={`user-type-button ${userType === "PHYSIQUE" ? "active" : ""}`}      
          >      
            <User className="user-type-icon" />      
            <span className="user-type-label">Particulier</span>      
          </button>      
          <button      
            type="button"      
            onClick={() => setUserType("MORAL")}      
            className={`user-type-button ${userType === "MORAL" ? "active" : ""}`}      
          >      
            <Building className="user-type-icon" />      
            <span className="user-type-label">Entreprise</span>      
          </button>      
        </div>      
  
        <form onSubmit={handleSubmit} className="complete-profile-form">      
          {userType === "PHYSIQUE" && (      
            <>      
              <div className="form-row">      
                <div className="form-group">      
                  <label htmlFor="civilite" className="form-label">Civilité *</label>      
                  <select      
                    id="civilite"      
                    name="civilite"      
                    value={physicalData.civilite}      
                    onChange={handlePhysicalChange}      
                    className="form-select"      
                    required      
                  >      
                    <option value="M">M.</option>      
                    <option value="Mme">Mme</option>      
                    <option value="Mlle">Mlle</option>      
                  </select>      
                </div>      
                <div className="form-group">      
                  <label htmlFor="first_name" className="form-label">Prénom *</label>      
                  <input      
                    id="first_name"      
                    name="first_name"      
                    type="text"      
                    placeholder="Votre prénom"      
                    value={physicalData.first_name}      
                    onChange={handlePhysicalChange}      
                    className="form-input"      
                    required      
                  />      
                </div>      
              </div>      
  
              <div className="form-group">      
                <label htmlFor="last_name" className="form-label">Nom *</label>      
                <input      
                  id="last_name"      
                  name="last_name"      
                  type="text"      
                  placeholder="Votre nom"      
                  value={physicalData.last_name}      
                  onChange={handlePhysicalChange}      
                  className="form-input"      
                  required      
                />      
              </div>      
            </>      
          )}      
  
          {userType === "MORAL" && (      
            <>      
              <div className="form-group">      
                <label htmlFor="raison_sociale" className="form-label">Raison sociale *</label>      
                <input      
                  id="raison_sociale"      
                  name="raison_sociale"      
                  type="text"      
                  placeholder="Nom de l'entreprise"      
                  value={moralData.raison_sociale}      
                  onChange={handleMoralChange}      
                  className="form-input"      
                  required      
                />      
              </div>      
  
              <div className="form-row">      
                <div className="form-group">      
                  <label htmlFor="ice" className="form-label">ICE</label>      
                  <input      
                    id="ice"      
                    name="ice"      
                    type="text"      
                    placeholder="Numéro ICE"      
                    value={moralData.ice}      
                    onChange={handleMoralChange}      
                    className="form-input"      
                  />      
                </div>      
                <div className="form-group">      
                  <label htmlFor="rc" className="form-label">RC</label>      
                  <input      
                    id="rc"      
                    name="rc"      
                    type="text"      
                    placeholder="Registre de commerce"      
                    value={moralData.rc}      
                    onChange={handleMoralChange}      
                    className="form-input"      
                  />      
                </div>      
              </div>      
            </>      
          )}      
  
          <div className="form-group">      
            <label htmlFor="telephone_principal" className="form-label">Téléphone principal *</label>      
            <input      
              id="telephone_principal"      
              name="telephone_principal"      
              type="tel"      
              placeholder="+212 6XX XXX XXX"      
              value={userType === "PHYSIQUE" ? physicalData.telephone_principal : moralData.telephone_principal}      
              onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}      
              className="form-input"      
              required      
            />      
          </div>      
  
          {/* Section Adresse structurée */}    
          <div className="form-section">    
            <h3 className="section-title">Adresse principale</h3>    
                
            <div className="form-group">    
              <label htmlFor="street" className="form-label">Rue *</label>    
              <input    
                id="street"    
                name="street"    
                type="text"    
                placeholder="Nom de la rue"    
                value={userType === "PHYSIQUE" ? physicalData.street : moralData.street}    
                onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}    
                className="form-input"    
                required    
              />    
            </div>    
  
            <div className="form-row">    
              <div className="form-group">    
                <label htmlFor="numimmeuble" className="form-label">N° Immeuble</label>    
                <input    
                  id="numimmeuble"    
                  name="numimmeuble"    
                  type="text"    
                  placeholder="Numéro d'immeuble"    
                  value={userType === "PHYSIQUE" ? physicalData.numimmeuble : moralData.numimmeuble}    
                  onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}    
                  className="form-input"    
                />    
              </div>    
              <div className="form-group">    
                <label htmlFor="numappt" className="form-label">N° Appartement</label>    
                <input    
                  id="numappt"    
                  name="numappt"    
                  type="text"    
                  placeholder="Numéro d'appartement"    
                  value={userType === "PHYSIQUE" ? physicalData.numappt : moralData.numappt}    
                  onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}    
                  className="form-input"    
                />    
              </div>    
            </div>    
  
            <div className="form-group">    
              <label htmlFor="quartier" className="form-label">Quartier</label>    
              <input    
                id="quartier"    
                name="quartier"    
                type="text"    
                placeholder="Nom du quartier"    
                value={userType === "PHYSIQUE" ? physicalData.quartier : moralData.quartier}    
                onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}    
                className="form-input"    
              />    
            </div>    
  
            <div className="form-row">    
              <div className="form-group">    
                <label htmlFor="postal_code" className="form-label">Code postal</label>    
                <input    
                  id="postal_code"    
                  name="postal_code"    
                  type="text"    
                  placeholder="Ex: 20000"    
                  value={userType === "PHYSIQUE" ? physicalData.postal_code : moralData.postal_code}    
                  onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}    
                  className="form-input"    
                />    
              </div>    
              <div className="form-group">    
                <label htmlFor="city_id" className="form-label">Ville *</label>    
                <select    
                  id="city_id"    
                  name="city_id"    
                  value={userType === "PHYSIQUE" ? physicalData.city_id : moralData.city_id}    
                  onChange={userType === "PHYSIQUE" ? handlePhysicalChange : handleMoralChange}    
                  className="form-select"    
                  required    
                  disabled={loadingCities}    
                >    
                  <option value="">    
                    {loadingCities ? 'Chargement des villes...' : 'Sélectionner une ville'}    
                  </option>    
                  {cities.map(city => (    
                    <option key={city._id} value={city._id}>    
                      {city.name || city.nom}    
                    </option>    
                  ))}    
                </select>    
              </div>    
            </div>    
          </div>    
  
          <div className="form-actions">      
            <button      
              type="submit"      
              className={`btn-primary ${isLoading ? "btn-loading" : ""}`}      
              disabled={isLoading}      
            >      
              {isLoading ? "Finalisation..." : "Finaliser mon inscription"}      
            </button>      
          </div>      
        </form>      
      </div>      
    </div>      
  );      
};      
    
export default CompleteProfile;