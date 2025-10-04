import React, { useState } from 'react';  
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';  
import { Link } from 'react-router-dom';  
import './ForgotPassword.css';  
  
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';  
  
const ForgotPassword = () => {  
  const [email, setEmail] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [success, setSuccess] = useState(false);  
  const [error, setError] = useState('');  
  
  const handleSubmit = async (e) => {  
    e.preventDefault();  
    setLoading(true);  
    setError('');  
  
    try {  
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({ email })  
      });  
  
      const data = await response.json();  
        
      if (data.success) {  
        setSuccess(true);  
      } else {  
        setError(data.message || 'Une erreur est survenue');  
      }  
    } catch (err) {  
      setError('Erreur de connexion');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  if (success) {  
    return (  
      <div className="forgot-password-container">  
        <div className="forgot-password-card">  
          <div className="success-icon">  
            <CheckCircle className="icon" />  
          </div>  
          <h2>Email envoyé !</h2>  
          <p>Si votre adresse email est enregistrée, vous recevrez un lien de réinitialisation dans quelques minutes.</p>  
          <Link to="/login" className="back-to-login">  
            <ArrowLeft className="icon" />  
            Retour à la connexion  
          </Link>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div className="forgot-password-container">  
      <div className="forgot-password-card">  
        <div className="forgot-password-header">  
          <h1>Mot de passe oublié ?</h1>  
          <p>Entrez votre adresse email pour recevoir un lien de réinitialisation</p>  
        </div>  
  
        {error && (  
          <div className="alert alert-error">  
            {error}  
          </div>  
        )}  
  
        <form onSubmit={handleSubmit}>  
          <div className="form-group">  
            <label htmlFor="email">Adresse email</label>  
            <div className="input-wrapper">  
              <Mail className="input-icon" />  
              <input  
                id="email"  
                type="email"  
                value={email}  
                onChange={(e) => setEmail(e.target.value)}  
                placeholder="votre@email.com"  
                required  
              />  
            </div>  
          </div>  
  
          <button type="submit" disabled={loading} className="submit-btn">  
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}  
          </button>  
        </form>  
  
        <Link to="/login" className="back-to-login">  
          <ArrowLeft className="icon" />  
          Retour à la connexion  
        </Link>  
      </div>  
    </div>  
  );  
};  
  
export default ForgotPassword;