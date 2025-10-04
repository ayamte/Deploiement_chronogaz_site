import React, { useState, useEffect } from 'react';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';  
import './ResetPassword.css';  
  
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';  
  
const ResetPassword = () => {  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const [formData, setFormData] = useState({  
    newPassword: '',  
    confirmPassword: ''  
  });  
  const [showPasswords, setShowPasswords] = useState({  
    new: false,  
    confirm: false  
  });  
  const [loading, setLoading] = useState(false);  
  const [success, setSuccess] = useState(false);  
  const [error, setError] = useState('');  
  const [token, setToken] = useState('');  
  
  useEffect(() => {  
    const tokenParam = searchParams.get('token');  
    if (!tokenParam) {  
      setError('Token manquant');  
      return;  
    }  
    setToken(tokenParam);  
  }, [searchParams]);  
  
  const handleSubmit = async (e) => {  
    e.preventDefault();  
    setError('');  
  
    if (formData.newPassword !== formData.confirmPassword) {  
      setError('Les mots de passe ne correspondent pas');  
      return;  
    }  
  
    if (formData.newPassword.length < 8) {  
      setError('Le mot de passe doit contenir au moins 8 caractères');  
      return;  
    }  
  
    setLoading(true);  
  
    try {  
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({  
          token,  
          newPassword: formData.newPassword  
        })  
      });  
  
      const data = await response.json();  
        
      if (data.success) {  
        setSuccess(true);  
        setTimeout(() => {  
          navigate('/login');  
        }, 3000);  
      } else {  
        setError(data.message || 'Une erreur est survenue');  
      }  
    } catch (err) {  
      setError('Erreur de connexion');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  const togglePasswordVisibility = (field) => {  
    setShowPasswords(prev => ({  
      ...prev,  
      [field]: !prev[field]  
    }));  
  };  
  
  if (success) {  
    return (  
      <div className="reset-password-container">  
        <div className="reset-password-card">  
          <div className="success-icon">  
            <CheckCircle className="icon" />  
          </div>  
          <h2>Mot de passe réinitialisé !</h2>  
          <p>Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div className="reset-password-container">  
      <div className="reset-password-card">  
        <div className="reset-password-header">  
          <h1>Nouveau mot de passe</h1>  
          <p>Choisissez un nouveau mot de passe sécurisé</p>  
        </div>  
  
        {error && (  
          <div className="alert alert-error">  
            {error}  
          </div>  
        )}  
  
        <form onSubmit={handleSubmit}>  
          <div className="form-group">  
            <label htmlFor="newPassword">Nouveau mot de passe</label>  
            <div className="input-wrapper">  
              <Lock className="input-icon" />  
              <input  
                id="newPassword"  
                type={showPasswords.new ? 'text' : 'password'}  
                value={formData.newPassword}  
                onChange={(e) => setFormData(prev => ({...prev, newPassword: e.target.value}))}  
                placeholder="••••••••"  
                required  
                minLength="8"  
              />  
              <button  
                type="button"  
                className="password-toggle"  
                onClick={() => togglePasswordVisibility('new')}  
              >  
                {showPasswords.new ? <EyeOff /> : <Eye />}  
              </button>  
            </div>  
          </div>  
  
          <div className="form-group">  
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>  
            <div className="input-wrapper">  
              <Lock className="input-icon" />  
              <input  
                id="confirmPassword"  
                type={showPasswords.confirm ? 'text' : 'password'}  
                value={formData.confirmPassword}  
                onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}  
                placeholder="••••••••"  
                required  
              />  
              <button  
                type="button"  
                className="password-toggle"  
                onClick={() => togglePasswordVisibility('confirm')}  
              >  
                {showPasswords.confirm ? <EyeOff /> : <Eye />}  
              </button>  
            </div>  
          </div>  
  
          <button type="submit" disabled={loading} className="submit-btn">  
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}  
          </button>  
        </form>  
      </div>  
    </div>  
  );  
};  
  
export default ResetPassword;