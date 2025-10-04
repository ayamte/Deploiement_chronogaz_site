import React, { useState } from 'react';  
import { useLocation, useNavigate } from 'react-router-dom';  
import { Mail, CheckCircle } from 'lucide-react';  
  
const EmailVerification = () => {  
  const location = useLocation();  
  const navigate = useNavigate();  
  const email = location.state?.email || '';  
    
  const [code, setCode] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState(false);  
  
  const handleSubmit = async (e) => {  
    e.preventDefault();  
    setLoading(true);  
    setError('');  
  
    try {  
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-email`, {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({ email, code })  
      });  
  
      const data = await response.json();  
        
      if (data.success) {  
        setSuccess(true);  
        setTimeout(() => {  
          navigate('/login');  
        }, 2000);  
      } else {  
        setError(data.message || 'Code invalide');  
      }  
    } catch (err) {  
      setError('Erreur de connexion');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  const handleResendCode = async () => {  
    try {  
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/resend-verification`, {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({ email })  
      });  
  
      const data = await response.json();  
      if (data.success) {  
        alert('Nouveau code envoyé !');  
      }  
    } catch (err) {  
      console.error('Erreur:', err);  
    }  
  };  
  
  if (success) {  
    return (  
      <div className="verification-container">  
        <div className="verification-card">  
          <CheckCircle className="success-icon" />  
          <h2>Email vérifié !</h2>  
          <p>Votre compte a été activé. Redirection vers la connexion...</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div className="verification-container">  
      <div className="verification-card">  
        <Mail className="mail-icon" />  
        <h1>Vérifiez votre email</h1>  
        <p>Nous avons envoyé un code de vérification à :</p>  
        <strong>{email}</strong>  
  
        {error && <div className="alert alert-error">{error}</div>}  
  
        <form onSubmit={handleSubmit}>  
          <div className="form-group">  
            <label>Code de vérification</label>  
            <input  
              type="text"  
              value={code}  
              onChange={(e) => setCode(e.target.value)}  
              placeholder="123456"  
              maxLength="6"  
              required  
            />  
          </div>  
  
          <button type="submit" disabled={loading}>  
            {loading ? 'Vérification...' : 'Vérifier'}  
          </button>  
        </form>  
  
        <button onClick={handleResendCode} className="resend-btn">  
          Renvoyer le code  
        </button>  
      </div>  
    </div>  
  );  
};  
  
export default EmailVerification;