import React, { useState, useEffect } from 'react';    
import {    
  MdEdit as Edit,    
  MdSave as Save,    
  MdClose as X,    
  MdAdd as Plus,    
  MdLock as Lock,    
  MdLocationOn as LocationOn,    
  MdVisibility as Eye,    
  MdVisibilityOff as EyeOff,  
  MdDelete as Delete,  
  MdGpsFixed as GpsFixed  
} from 'react-icons/md';    
import { authService } from '../../services/authService';    
import './Profile.css';    

    
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';    
    
export default function Profile() {    
  const [isEditing, setIsEditing] = useState(false);    
  const [loading, setLoading] = useState(true);    
  const [error, setError] = useState('');    
  const [success, setSuccess] = useState('');    
  const [user, setUser] = useState(null);    
  const [profile, setProfile] = useState({});    
  const [editedProfile, setEditedProfile] = useState({});    
    
  // États pour la gestion des adresses  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);  
  const [addresses, setAddresses] = useState([]);  
  const [loadingAddresses, setLoadingAddresses] = useState(false);  

  // États pour l'édition d'adresses
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    street: '',
    numappt: '',
    numimmeuble: '',
    quartier: '',
    postal_code: '',
    city_id: ''
  });
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
    
  // États pour le modal de changement de mot de passe    
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);    
  const [passwordLoading, setPasswordLoading] = useState(false);    
  const [passwordError, setPasswordError] = useState('');    
  const [passwordSuccess, setPasswordSuccess] = useState('');    
  const [passwordData, setPasswordData] = useState({    
    currentPassword: '',    
    newPassword: '',    
    confirmPassword: ''    
  });    
  const [showPasswords, setShowPasswords] = useState({    
    current: false,    
    new: false,    
    confirm: false    
  });    
    
  useEffect(() => {    
    loadProfile();    
  }, []);    
    
  const loadProfile = async () => {    
    try {    
      setLoading(true);    
      const currentUser = authService.getUser();    
      setUser(currentUser);    
    
      const token = authService.getToken();    
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {    
        method: 'GET',    
        headers: {    
          'Authorization': `Bearer ${token}`,    
          'Content-Type': 'application/json'    
        }    
      });    
    
      if (response.status === 401) {    
        authService.logout();    
        return;    
      }    
    
      const data = await response.json();    
      if (data.success) {    
        setProfile(data.data.profile);    
        setEditedProfile(data.data.profile);    
    
        // Mettre à jour l'état user avec l'email frais de l'API    
        if (data.data.profile.email && data.data.profile.email !== currentUser?.email) {    
          const updatedUser = { ...currentUser, email: data.data.profile.email };    
          authService.setUser(updatedUser);    
          setUser(updatedUser);    
        }    
      } else {    
        setError('Erreur lors du chargement du profil');    
      }    
    } catch (err) {    
      setError('Erreur de connexion');    
      console.error('Erreur:', err);    
    } finally {    
      setLoading(false);    
    }    
  };    
  
const loadAddresses = async () => {  
  try {  
    setLoadingAddresses(true);  
    setError('');  
      
    const token = authService.getToken();  
      
    // Récupérer le profil complet avec customer_id  
    const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {  
      headers: {  
        'Authorization': `Bearer ${token}`,  
        'Content-Type': 'application/json'  
      }  
    });  
      
    if (!profileResponse.ok) {  
      throw new Error('Erreur lors de la récupération du profil');  
    }  
      
    const profileData = await profileResponse.json();  
    const customerId = profileData.data?.customer_info?.customer_id;  
      
    if (!customerId) {  
      setError('Informations client non disponibles. Veuillez contacter l\'administrateur.');  
      return;  
    }  
      
    // Récupérer les adresses avec le customer_id correct  
    const response = await fetch(`${API_BASE_URL}/api/customer/${customerId}/addresses`, {  
      headers: {  
        'Authorization': `Bearer ${token}`,  
        'Content-Type': 'application/json'  
      }  
    });  
      
    const data = await response.json();  
      
    if (data.success) {  
      setAddresses(data.addresses || []);  
    } else {  
      setError(data.message || 'Erreur lors du chargement des adresses');  
    }  
  } catch (err) {  
    setError('Erreur de connexion lors du chargement des adresses');  
    console.error('Erreur loadAddresses:', err);  
  } finally {  
    setLoadingAddresses(false);  
  }  
};

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const response = await fetch(`${API_BASE_URL}/api/locations/cities`);
      const data = await response.json();
      
      if (data.success) {
        setCities(data.data || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des villes:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressFormData({
      street: address.street || '',
      numappt: address.numappt || '',
      numimmeuble: address.numimmeuble || '',
      quartier: address.quartier || '',
      postal_code: address.postal_code || '',
      city_id: address.city?._id || ''
    });
    setIsEditingAddress(true);
    loadCities();
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressFormData({
      street: '',
      numappt: '',
      numimmeuble: '',
      quartier: '',
      postal_code: '',
      city_id: ''
    });
    setIsEditingAddress(true);
    loadCities();
  };

  const handleAddressFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!addressFormData.street || !addressFormData.city_id) {
      setError('La rue et la ville sont obligatoires');
      return;
    }

    try {
      setLoadingAddresses(true);
      const token = authService.getToken();
      const currentUser = authService.getUser();
      let customerId = currentUser?.customer_id;

      if (!customerId) {
       const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        }  
      });  
        
      if (profileResponse.ok) {  
        const profileData = await profileResponse.json();  
        customerId = profileData.data?.customer_info?.customer_id;  
      }
      }

      if (!customerId) {
        setError('Impossible de récupérer les informations client');
        return;
      }

      let response;
      if (editingAddress) {
        // Modifier une adresse existante
        response = await fetch(`${API_BASE_URL}/api/addresses/${editingAddress._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(addressFormData)
        });
      } else {
        // Créer une nouvelle adresse
        response = await fetch(`${API_BASE_URL}/api/addresses/customer/${customerId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...addressFormData,
            type_adresse: 'LIVRAISON'
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        setSuccess(editingAddress ? 'Adresse modifiée avec succès' : 'Adresse ajoutée avec succès');
        setIsEditingAddress(false);
        await loadAddresses();
      } else {
        setError(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressInputChange = (field, value) => {
    setAddressFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelAddressEdit = () => {
    setIsEditingAddress(false);
    setEditingAddress(null);
    setAddressFormData({
      street: '',
      numappt: '',
      numimmeuble: '',
      quartier: '',
      postal_code: '',
      city_id: ''
    });
  };
    
  const handleEdit = () => {    
    setIsEditing(true);    
    setEditedProfile({ ...profile });    
    setError('');    
    setSuccess('');    
  };    
    
  const handleSave = async () => {    
    try {    
      setLoading(true);    
      const token = authService.getToken();    
        
      const profileToSave = {  
        ...editedProfile  
      };  
        
      // Supprimer les champs obsolètes
      delete profileToSave.adresse_principale;  
      delete profileToSave.city_id;  
      delete profileToSave.region_principale;  
        
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {    
        method: 'PUT',    
        headers: {    
          'Authorization': `Bearer ${token}`,    
          'Content-Type': 'application/json'    
        },    
        body: JSON.stringify({    
          profile: profileToSave    
        })    
      });    
    
      if (response.status === 401) {    
        authService.logout();    
        return;    
      }    
    
      const data = await response.json();    
      if (data.success) {    
        await loadProfile();    
        setIsEditing(false);    
        setSuccess('Profil mis à jour avec succès');    
      } else {    
        setError(data.message || 'Erreur lors de la mise à jour');    
      }    
    } catch (err) {    
      setError('Erreur lors de la mise à jour du profil');    
      console.error('Erreur:', err);    
    } finally {    
      setLoading(false);    
    }    
  };    
    
  const handleCancel = () => {    
    setEditedProfile({ ...profile });    
    setIsEditing(false);    
    setError('');    
    setSuccess('');    
  };    
    
  const handleInputChange = (field, value) => {    
    setEditedProfile(prev => ({    
      ...prev,    
      [field]: value    
    }));    
  };    
  
  const handleAddressModalOpen = async () => {  
    setIsAddressModalOpen(true);  
    await loadAddresses();  
  };  
  
  const handleAddressModalClose = () => {  
    setIsAddressModalOpen(false);  
    setAddresses([]);  
    setError('');
    setIsEditingAddress(false);
    setEditingAddress(null);
  };  

  // Gestion du modal de mot de passe
  const handlePasswordModalOpen = () => {
    setIsPasswordModalOpen(true);
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setPasswordLoading(true);  
      setPasswordError('');  
        
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {  
        method: 'PUT',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({  
          currentPassword: passwordData.currentPassword,  
          newPassword: passwordData.newPassword  
        })  
      });  
  
      const data = await response.json();  
        
      if (data.success) {  
        setPasswordSuccess('Mot de passe modifié avec succès');  
        setTimeout(() => {  
          handlePasswordModalClose();  
        }, 2000);  
      } else {  
        setPasswordError(data.message || 'Erreur lors du changement de mot de passe');  
      }  
    } catch (err) {  
      setPasswordError('Erreur de connexion');  
      console.error('Erreur:', err);  
    } finally {  
      setPasswordLoading(false);  
    }  
  };  
  
  if (loading) {  
    return (  
      <div className="profile-container">  
        <div className="loading-container">  
          <div className="loading-spinner"></div>  
          <p>Chargement du profil...</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div className="profile-layout">  
    <div className="profile-container">  
      <div className="profile-header">  
        <h1 className="profile-title">Mon Profil</h1>  
        <p className="profile-subtitle">Gérez vos informations personnelles</p>  
      </div>  
  
      {error && (  
        <div className="alert alert-error">  
          {error}  
        </div>  
      )}  
  
      {success && (  
        <div className="alert alert-success">  
          {success}  
        </div>  
      )}  
  
      {/* Informations principales */}  
      <div className="profile-card">  
        <div className="card-header">  
          <div className="card-header-content">  
            <h2 className="card-title">Informations Principales</h2>  
            <div className="card-actions">  
              {!isEditing ? (  
                <button className="btn btn-primary" onClick={handleEdit}>  
                  <Edit className="btn-icon" />  
                  Modifier  
                </button>  
              ) : (  
                <div className="edit-actions">  
                  <button className="btn btn-outline" onClick={handleCancel}>  
                    <X className="btn-icon" />  
                    Annuler  
                  </button>  
                  <button className="btn btn-primary" onClick={handleSave}>  
                    <Save className="btn-icon" />  
                    Sauvegarder  
                  </button>  
                </div>  
              )}  
            </div>  
          </div>  
        </div>  
  
        <div className="card-content">  
          {/* Email */}  
          <div className="form-group">  
            <label className="form-label">Email</label>  
            {isEditing ? (  
              <input  
                type="email"  
                value={editedProfile.email || ''}  
                onChange={(e) => handleInputChange('email', e.target.value)}  
                className="form-input"  
                placeholder="votre@email.com"  
              />  
            ) : (  
              <div className="form-display">  
                {profile.email || 'Non renseigné'}  
              </div>  
            )}  
          </div>  
  
          {/* Informations selon le type d'utilisateur */}  
          {profile.type === 'PHYSIQUE' ? (  
            <>  
              <div className="form-separator"></div>  
              <h3 className="section-title">Informations Personnelles</h3>  
  
              <div className="form-row">  
                <div className="form-group">  
                  <label className="form-label">Civilité</label>  
                  {isEditing ? (  
                    <select  
                      value={editedProfile.civilite || 'M'}  
                      onChange={(e) => handleInputChange('civilite', e.target.value)}  
                      className="form-input"  
                    >  
                      <option value="M">M.</option>  
                      <option value="Mme">Mme</option>  
                      <option value="Mlle">Mlle</option>  
                    </select>  
                  ) : (  
                    <div className="form-display">  
                      {profile.civilite || 'Non renseigné'}  
                    </div>  
                  )}  
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Prénom</label>    
                  {isEditing ? (    
                    <input    
                      type="text"    
                      value={editedProfile.first_name || ''}    
                      onChange={(e) => handleInputChange('first_name', e.target.value)}    
                      className="form-input"    
                      placeholder="Votre prénom"    
                    />    
                  ) : (    
                    <div className="form-display">    
                      {profile.first_name || 'Non renseigné'}    
                    </div>    
                  )}    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Nom</label>    
                  {isEditing ? (    
                    <input    
                      type="text"    
                      value={editedProfile.last_name || ''}    
                      onChange={(e) => handleInputChange('last_name', e.target.value)}    
                      className="form-input"    
                      placeholder="Votre nom"    
                    />    
                  ) : (    
                    <div className="form-display">    
                      {profile.last_name || 'Non renseigné'}    
                    </div>    
                  )}    
                </div>    
              </div>    
    
              <div className="form-group">    
                <label className="form-label">Téléphone</label>    
                {isEditing ? (    
                  <input    
                    type="tel"    
                    value={editedProfile.telephone_principal || ''}    
                    onChange={(e) => handleInputChange('telephone_principal', e.target.value)}    
                    className="form-input"    
                    placeholder="0612345678"    
                  />    
                ) : (    
                  <div className="form-display">    
                    {profile.telephone_principal || 'Non renseigné'}    
                  </div>    
                )}    
              </div>    
            </>    
          ) : profile.type === 'MORAL' ? (    
            <>    
              <div className="form-separator"></div>    
              <h3 className="section-title">Informations Entreprise</h3>    
    
              <div className="form-group">    
                <label className="form-label">Raison Sociale</label>    
                {isEditing ? (    
                  <input    
                    type="text"    
                    value={editedProfile.raison_sociale || ''}    
                    onChange={(e) => handleInputChange('raison_sociale', e.target.value)}    
                    className="form-input"    
                    placeholder="Nom de l'entreprise"    
                  />    
                ) : (    
                  <div className="form-display">    
                    {profile.raison_sociale || 'Non renseigné'}    
                  </div>    
                )}    
              </div>    
    
              <div className="form-row">    
                <div className="form-group">    
                  <label className="form-label">ICE</label>    
                  {isEditing ? (    
                    <input    
                      type="text"    
                      value={editedProfile.ice || ''}    
                      onChange={(e) => handleInputChange('ice', e.target.value)}    
                      className="form-input"    
                      placeholder="Numéro ICE"    
                    />    
                  ) : (    
                    <div className="form-display">    
                      {profile.ice || 'Non renseigné'}    
                    </div>    
                  )}    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">RC</label>    
                  {isEditing ? (    
                    <input    
                      type="text"    
                      value={editedProfile.rc || ''}    
                      onChange={(e) => handleInputChange('rc', e.target.value)}    
                      className="form-input"    
                      placeholder="Registre de commerce"    
                    />    
                  ) : (    
                    <div className="form-display">    
                      {profile.rc || 'Non renseigné'}    
                    </div>    
                  )}    
                </div>    
              </div>    
    
              <div className="form-row">    
                <div className="form-group">    
                  <label className="form-label">Ville RC</label>    
                  {isEditing ? (    
                    <input    
                      type="text"    
                      value={editedProfile.ville_rc || ''}    
                      onChange={(e) => handleInputChange('ville_rc', e.target.value)}    
                      className="form-input"    
                      placeholder="Ville du RC"    
                    />    
                  ) : (    
                    <div className="form-display">    
                      {profile.ville_rc || 'Non renseigné'}    
                    </div>    
                  )}    
                </div>    
    
                <div className="form-group">    
                  <label className="form-label">Patente</label>    
                  {isEditing ? (    
                    <input    
                      type="text"    
                      value={editedProfile.patente || ''}    
                      onChange={(e) => handleInputChange('patente', e.target.value)}    
                      className="form-input"    
                      placeholder="Numéro de patente"    
                    />    
                  ) : (    
                    <div className="form-display">    
                      {profile.patente || 'Non renseigné'}    
                    </div>    
                  )}    
                </div>    
              </div>    
    
              <div className="form-group">    
                <label className="form-label">Téléphone</label>    
                {isEditing ? (    
                  <input    
                    type="tel"    
                    value={editedProfile.telephone_principal || ''}    
                    onChange={(e) => handleInputChange('telephone_principal', e.target.value)}    
                    className="form-input"    
                    placeholder="0612345678"    
                  />    
                ) : (    
                  <div className="form-display">    
                    {profile.telephone_principal || 'Non renseigné'}    
                  </div>    
                )}    
              </div>    
            </>    
          ) : null}    
        </div>    
      </div>    
    
      {/* Actions supplémentaires */}    
      <div className="profile-card">    
        <div className="card-header">    
          <div className="card-header-content">    
            <h2 className="card-title">Actions</h2>    
            <p className="card-description">Gérez vos adresses et votre sécurité</p>    
          </div>    
        </div>    
    
        <div className="card-content">    
          <div className="actions-grid">    
            <button     
              className="btn btn-outline action-btn"    
              onClick={handleAddressModalOpen}    
            >    
              <LocationOn className="btn-icon" />    
              Gérer mes adresses    
            </button>    
            <button     
              className="btn btn-outline action-btn"    
              onClick={handlePasswordModalOpen}    
            >    
              <Lock className="btn-icon" />    
              Modifier le mot de passe    
            </button>    
          </div>    
        </div>    
      </div>    
    
      {/* Modal des adresses */}    
      {isAddressModalOpen && (    
        <div className="modal-overlay" onClick={handleAddressModalClose}>    
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h3 className="modal-title">Mes Adresses</h3>    
              <button     
                className="modal-close-btn"    
                onClick={handleAddressModalClose}    
              >    
                <X className="modal-close-icon" />    
              </button>    
            </div>    
    
            <div className="modal-body">    
              {loadingAddresses ? (    
                <div className="loading-container">    
                  <div className="loading-spinner"></div>    
                  <p>Chargement des adresses...</p>    
                </div>    
              ) : isEditingAddress ? (  
                /* Formulaire d'édition/ajout d'adresse */  
                <form onSubmit={handleAddressFormSubmit} className="address-form">  
                  <h4 className="form-title">  
                    {editingAddress ? 'Modifier l\'adresse' : 'Ajouter une adresse'}  
                  </h4>  
                    
                  <div className="form-group">  
                    <label className="form-label">Rue *</label>  
                    <input  
                      type="text"  
                      value={addressFormData.street}  
                      onChange={(e) => handleAddressInputChange('street', e.target.value)}  
                      className="form-input"  
                      placeholder="Nom de la rue"  
                      required  
                    />  
                  </div>  
  
                  <div className="form-row">  
                    <div className="form-group">  
                      <label className="form-label">Numéro d'immeuble</label>  
                      <input  
                        type="text"  
                        value={addressFormData.numimmeuble}  
                        onChange={(e) => handleAddressInputChange('numimmeuble', e.target.value)}  
                        className="form-input"  
                        placeholder="N° immeuble"  
                      />  
                    </div>  
                    <div className="form-group">  
                      <label className="form-label">Numéro d'appartement</label>  
                      <input  
                        type="text"  
                        value={addressFormData.numappt}  
                        onChange={(e) => handleAddressInputChange('numappt', e.target.value)}  
                        className="form-input"  
                        placeholder="N° appartement"  
                      />  
                    </div>  
                  </div>  
  
                  <div className="form-group">  
                    <label className="form-label">Quartier</label>  
                    <input  
                      type="text"  
                      value={addressFormData.quartier}  
                      onChange={(e) => handleAddressInputChange('quartier', e.target.value)}  
                      className="form-input"  
                      placeholder="Nom du quartier"  
                    />  
                  </div>  
  
                  <div className="form-row">  
                    <div className="form-group">  
                      <label className="form-label">Code postal</label>  
                      <input  
                        type="text"  
                        value={addressFormData.postal_code}  
                        onChange={(e) => handleAddressInputChange('postal_code', e.target.value)}  
                        className="form-input"  
                        placeholder="Ex: 20000"  
                      />  
                    </div>  
                    <div className="form-group">  
                      <label className="form-label">Ville *</label>  
                      <select  
                        value={addressFormData.city_id}  
                        onChange={(e) => handleAddressInputChange('city_id', e.target.value)}  
                        className="form-input"  
                        required  
                        disabled={loadingCities}  
                      >  
                        <option value="">Sélectionner une ville</option>  
                        {cities.map(city => (  
                          <option key={city._id} value={city._id}>  
                            {city.name || city.nom}  
                          </option>  
                        ))}  
                      </select>  
                    </div>  
                  </div>  
  
                  <div className="modal-footer">  
                    <button  
                      type="button"  
                      className="btn btn-outline"  
                      onClick={handleCancelAddressEdit}  
                      disabled={loadingAddresses}  
                    >  
                      Annuler  
                    </button>  
                    <button  
                      type="submit"  
                      className="btn btn-primary"  
                      disabled={loadingAddresses}  
                    >  
                      {loadingAddresses ? 'Sauvegarde...' : (editingAddress ? 'Modifier' : 'Ajouter')}  
                    </button>  
                  </div>  
                </form>  
              ) : addresses.length > 0 ? (    
                <div className="addresses-list">    
                  {addresses.map((address, index) => (    
                    <div key={index} className="address-item">    
                      <div className="address-header">    
                        <LocationOn className="address-icon" />    
                        <div className="address-info">    
                          <h4 className="address-title">    
                            {address.type_adresse || 'Adresse'}    
                            {address.is_principal && (    
                              <span className="principal-badge">Principal</span>    
                            )}    
                          </h4>    
                            
                          {/* Affichage des champs demandés */}  
                          <div className="address-details">  
                            <p className="address-text">  
                              <strong>Rue:</strong> {address.street}  
                            </p>  
                            {address.numimmeuble && (  
                              <p className="address-text">  
                                <strong>Immeuble:</strong> {address.numimmeuble}  
                              </p>  
                            )}  
                            {address.numappt && (  
                              <p className="address-text">  
                                <strong>Appartement:</strong> {address.numappt}  
                              </p>  
                            )}  
                            {address.quartier && (  
                              <p className="address-text">  
                                <strong>Quartier:</strong> {address.quartier}  
                              </p>  
                            )}  
                            {address.postal_code && (  
                              <p className="address-text">  
                                <strong>Code postal:</strong> {address.postal_code}  
                              </p>  
                            )}  
                            {address.city && (  
                              <p className="address-city">  
                                <strong>Ville:</strong> {address.city.name || address.city}  
                              </p>  
                            )}  
                          </div>  
                        </div>  
                          
                        {/* Boutons d'action */}  
                        <div className="address-actions">  
                          <button   
                            className="btn btn-outline btn-sm"  
                            onClick={() => handleEditAddress(address)}  
                          >  
                            <Edit className="btn-icon" />  
                            Modifier  
                          </button>  
                        </div>  
                      </div>    
                    </div>    
                  ))}  
                    
                  {/* Bouton pour ajouter une nouvelle adresse */}  
                  <div className="modal-footer">  
                    <button   
                      className="btn btn-primary"  
                      onClick={handleAddAddress}  
                    >  
                      <Plus className="btn-icon" />  
                      Ajouter une adresse  
                    </button>  
                  </div>  
                </div>    
              ) : (    
                <div className="empty-state">    
                  <LocationOn className="empty-icon" />    
                  <p>Aucune adresse enregistrée</p>    
                  <div className="modal-footer">  
                    <button   
                      className="btn btn-primary"  
                      onClick={handleAddAddress}  
                    >  
                      <Plus className="btn-icon" />  
                      Ajouter une adresse  
                    </button>  
                  </div>  
                </div>    
              )}    
            </div>    
          </div>    
        </div>    
      )}    
    
      {/* Modal de changement de mot de passe */}    
      {isPasswordModalOpen && (    
        <div className="modal-overlay" onClick={handlePasswordModalClose}>    
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="modal-header">    
              <h3 className="modal-title">Modifier le mot de passe</h3>    
              <button     
                className="modal-close-btn"    
                onClick={handlePasswordModalClose}    
              >    
                <X className="modal-close-icon" />    
              </button>    
            </div>    
    
            <form onSubmit={handlePasswordSubmit} className="modal-body">    
              {passwordError && (    
                <div className="alert alert-error">    
                  {passwordError}    
                </div>    
              )}    
              {passwordSuccess && (    
                <div className="alert alert-success">    
                  {passwordSuccess}    
                </div>    
              )}    
    
              <div className="form-group">    
                <label className="form-label">Mot de passe actuel</label>    
                <div className="password-input-container">    
                  <input    
                    type={showPasswords.current ? 'text' : 'password'}    
                    value={passwordData.currentPassword}    
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}    
                    className="form-input password-input"    
                    required    
                  />    
                  <button    
                    type="button"    
                    className="password-toggle-btn"    
                    onClick={() => togglePasswordVisibility('current')}    
                  >    
                    {showPasswords.current ? <EyeOff /> : <Eye />}    
                  </button>    
                </div>    
              </div>    
    
              <div className="form-group">    
                <label className="form-label">Nouveau mot de passe</label>    
                <div className="password-input-container">    
                  <input    
                    type={showPasswords.new ? 'text' : 'password'}    
                    value={passwordData.newPassword}    
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}    
                    className="form-input password-input"    
                    required    
                    minLength="8"    
                  />    
                  <button    
                    type="button"    
                    className="password-toggle-btn"    
                    onClick={() => togglePasswordVisibility('new')}    
                  >    
                    {showPasswords.new ? <EyeOff /> : <Eye />}    
                  </button>    
                </div>    
                <small className="form-help">    
                  Le mot de passe doit contenir au moins 8 caractères    
                </small>    
              </div>    
    
              <div className="form-group">    
                <label className="form-label">Confirmer le nouveau mot de passe</label>    
                <div className="password-input-container">    
                  <input    
                    type={showPasswords.confirm ? 'text' : 'password'}    
                    value={passwordData.confirmPassword}    
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}    
                    className="form-input password-input"    
                    required    
                  />    
                  <button    
                    type="button"    
                    className="password-toggle-btn"    
                    onClick={() => togglePasswordVisibility('confirm')}    
                  >    
                    {showPasswords.confirm ? <EyeOff /> : <Eye />}    
                  </button>    
                </div>    
              </div>    
    
              <div className="modal-footer">    
                <button    
                  type="button"    
                  className="btn btn-outline"    
                  onClick={handlePasswordModalClose}    
                  disabled={passwordLoading}    
                >    
                  Annuler    
                </button>    
                <button    
                  type="submit"    
                  className="btn btn-primary"    
                  disabled={passwordLoading}    
                >    
                  {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}    
                </button>    
              </div>    
            </form>    
          </div>    
        </div>    
      )}    
    </div> 
    </div>    
  );    
}