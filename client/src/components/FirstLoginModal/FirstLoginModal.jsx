import React, { useState } from 'react';  
import {  
  MdLock as Lock,  
  MdVisibility as Eye,  
  MdVisibilityOff as EyeOff,  
  MdClose as X  
} from 'react-icons/md';  
import { authService } from '../../services/authService';  
import './FirstLoginModal.css';  
  
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';  
  
const FirstLoginModal = ({ onPasswordChanged }) => {  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');  
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
  
  const handleInputChange = (field, value) => {  
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
  
  const handleSubmit = async (e) => {  
    e.preventDefault();  
    setError('');  
  
    // Validation  
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {  
      setError('Tous les champs sont requis');  
      return;  
    }  
  
    if (passwordData.newPassword !== passwordData.confirmPassword) {  
      setError('Les nouveaux mots de passe ne correspondent pas');  
      return;  
    }  
  
    if (passwordData.newPassword.length < 8) {  
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');  
      return;  
    }  
  
    try {  
      setLoading(true);  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/users/first-login-password`, {  
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
  
      if (response.status === 401) {  
        authService.logout();  
        return;  
      }  
  
      const data = await response.json();  
      if (data.success) {  
        // Mettre à jour les données utilisateur pour supprimer le flag requiresPasswordChange  
        const currentUser = authService.getUser();  
        const updatedUser = { ...currentUser, requiresPasswordChange: false };  
        authService.setUser(updatedUser);  
          
        onPasswordChanged();  
      } else {  
        setError(data.message || 'Erreur lors du changement de mot de passe');  
      }  
    } catch (err) {  
      setError('Erreur de connexion');  
      console.error('Erreur:', err);  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  return (  
    <div className="first-login-modal-overlay">  
      <div className="first-login-modal-content">  
        <div className="first-login-modal-header">  
          <div className="first-login-icon">  
            <Lock className="icon" />  
          </div>  
          <h2 className="first-login-title">Changement de mot de passe requis</h2>  
          <p className="first-login-subtitle">  
            Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire  
          </p>  
        </div>  
  
        <form onSubmit={handleSubmit} className="first-login-form">  
          {error && (  
            <div className="alert alert-error">  
              {error}  
            </div>  
          )}  
  
          <div className="form-group">  
            <label className="form-label">Mot de passe actuel</label>  
            <div className="password-input-container">  
              <input  
                type={showPasswords.current ? 'text' : 'password'}  
                value={passwordData.currentPassword}  
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}  
                className="form-input password-input"  
                placeholder="ChronoGaz2024"  
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
                onChange={(e) => handleInputChange('newPassword', e.target.value)}  
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
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}  
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
  
          <button  
            type="submit"  
            className="first-login-submit-btn"  
            disabled={loading}  
          >  
            {loading ? 'Changement en cours...' : 'Changer le mot de passe'}  
          </button>  
        </form>  
      </div>  
    </div>  
  );  
};  
  
export default FirstLoginModal;