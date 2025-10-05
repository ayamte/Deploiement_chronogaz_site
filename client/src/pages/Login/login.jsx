import { useState } from "react"        
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Chrome } from "lucide-react"        
import { Link, useNavigate } from "react-router-dom"  
import "./login.css"         
import { authService } from '../../services/authService';        
import { redirectUserByRole } from '../../utils/redirectUtils';      
        
const LoginPage = () => {        
  const navigate = useNavigate();  
  const [formData, setFormData] = useState({        
    email: "",        
    password: "",        
  })        
  const [showPassword, setShowPassword] = useState(false)        
  const [isLoading, setIsLoading] = useState(false)        
  const [error, setError] = useState("")        
  const [rememberMe, setRememberMe] = useState(false)     
    
  const handleGoogleLogin = () => {    
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;    
  };  
        
  const handleSubmit = async (e) => {        
    e.preventDefault()        
    setIsLoading(true)        
    setError("")        
        
    try {        
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {        
        method: "POST",        
        headers: {        
          "Content-Type": "application/json",        
        },        
        body: JSON.stringify({        
          email: formData.email,        
          password: formData.password        
        }),        
      })        
        
      const data = await response.json()        
        
      if (data.success) {        
        authService.setToken(data.data.token);        
        authService.setUser(data.data.user);        
        redirectUserByRole(data.data.user.role, data.data.user.type);  
      } else if (data.requiresVerification) {    
        navigate('/verify-email', {     
          state: { email: data.email }     
        });    
      } else {        
        throw new Error(data.message)        
      }        
    } catch (err) {        
      setError(err.message || "Une erreur est survenue")        
    } finally {        
      setIsLoading(false)        
    }        
  }        
        
  const handleChange = (e) => {        
    setFormData((prev) => ({        
      ...prev,        
      [e.target.name]: e.target.value,        
    }))        
  }        
        
  return (        
    <div className="login-container">        
      <div className="login-background"></div>        
        
      <div className="login-content">        
        <div className="login-card">        
          <div className="login-header">        
            <div className="login-icon">        
              <User className="icon" />        
            </div>        
            <h1 className="login-title">Bon retour</h1>        
            <p className="login-subtitle">Connectez-vous à votre compte</p>        
          </div>        
        
          {error && (        
            <div className="error-alert">        
              <AlertCircle className="error-icon" />        
              <span>{error}</span>        
            </div>        
          )}        
        
          <form onSubmit={handleSubmit} className="login-form">        
            <div className="form-group">        
              <label htmlFor="email" className="form-label">        
                Email        
              </label>        
              <div className="input-wrapper">         
                <input        
                  id="email"        
                  name="email"        
                  type="email"        
                  placeholder="votre@email.com"        
                  value={formData.email}        
                  onChange={handleChange}        
                  className="form-input"        
                  required        
                />        
              </div>        
            </div>        
        
            <div className="form-group">        
              <label htmlFor="password" className="form-label">        
                Mot de passe        
              </label>        
              <div className="input-wrapper">        
                <input        
                  id="password"        
                  name="password"        
                  type={showPassword ? "text" : "password"}        
                  placeholder="••••••••"        
                  value={formData.password}        
                  onChange={handleChange}        
                  className="form-input password-input"        
                  required        
                />        
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">        
                  {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}        
                </button>        
              </div>        
            </div>        
        
            <div className="form-options">        
              <label className="checkbox-label">        
                <input        
                  type="checkbox"        
                  checked={rememberMe}        
                  onChange={(e) => setRememberMe(e.target.checked)}        
                  className="checkbox"        
                />        
                <span className="checkbox-text">Se souvenir de moi</span>        
              </label>        
              <Link to="/forgot-password" className="forgot-password">        
                Mot de passe oublié ?        
              </Link>        
            </div>        
        
            <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>        
              {isLoading ? "Connexion..." : "Se connecter"}        
            </button>  
  
            <div className="login-separator">  
              <span>ou</span>  
            </div>  
    
            <button     
              type="button"     
              onClick={handleGoogleLogin}    
              className="google-login-button"    
            >    
              <Chrome className="google-icon" /> Se connecter avec Google    
            </button>      
          </form>        
        
          <div className="login-footer">        
            <p>        
              Pas encore de compte ?{" "}        
              <Link to="/signup" className="signup-link">        
                S'inscrire        
              </Link>        
            </p>        
          </div>        
        </div>        
      </div>        
    </div>        
  )        
}        
        
export default LoginPage