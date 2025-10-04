import React, { useState, useEffect } from "react"    
import {       
  MdChevronLeft as ChevronLeft,       
  MdChevronRight as ChevronRight,       
  MdCalendarToday as Calendar,       
  MdRefresh as RotateCcw       
} from "react-icons/md"    
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'    
import "./Dashboard.css"    
import butaneImage from './butane.png'    
import reportService from '../../../services/reportService'    
import { authService } from '../../../services/authService'    
  
// Fonctions utilitaires pour les dates      
const formatDate = (date, format) => {      
  const options = {      
    year: "numeric",      
    month: "long",      
    day: "numeric",      
    weekday: "long",      
  }      
  
  switch (format) {      
    case "week":      
      return `Semaine du ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`      
    case "month":      
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })      
    case "year":      
      return date.getFullYear().toString()      
    default:      
      return date.toLocaleDateString("fr-FR", options)      
  }      
}      
  
const getWeekStart = (date) => {      
  const d = new Date(date)      
  const day = d.getDay()      
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)      
  return new Date(d.setDate(diff))      
}      
  
const getMonthStart = (date) => {      
  return new Date(date.getFullYear(), date.getMonth(), 1)      
}      
  
const getYearStart = (date) => {      
  return new Date(date.getFullYear(), 0, 1)      
}      
  
const addPeriod = (date, type, amount) => {      
  const newDate = new Date(date)      
  switch (type) {      
    case "jour":      
      newDate.setDate(newDate.getDate() + amount * 7)      
      break      
    case "semaine":      
      newDate.setMonth(newDate.getMonth() + amount)      
      break      
    case "mois":      
      newDate.setFullYear(newDate.getFullYear() + amount)      
      break      
  }      
  return newDate      
}    
  
export default function Dashboard() {    
  const [selectedPeriod, setSelectedPeriod] = useState("jour")    
  const [currentDate, setCurrentDate] = useState(new Date())    
  const [loading, setLoading] = useState(true)    
  const [error, setError] = useState('')    
      
  // États pour les statistiques    
  const [stats, setStats] = useState({    
    totalEmployees: 0,    
    totalClients: 0,    
    totalSales: 0    
  })    
      
  // États pour les données du graphique    
  const [salesData, setSalesData] = useState([])    
  
  // Charger les statistiques générales avec URLs corrigées  
  const loadDashboardStats = async () => {    
    console.log('🔄 [DASHBOARD] Début du chargement des statistiques...')  
    console.log('🔄 [DASHBOARD] URL de base API:', process.env.REACT_APP_API_URL || 'http://localhost:5000')  
      
    try {    
      setLoading(true)    
      setError('')    
  
      // Vérifier le token d'authentification  
      const token = localStorage.getItem('token')  
      console.log('🔐 [AUTH] Token présent:', !!token)  
      console.log('🔐 [AUTH] Token (premiers 20 chars):', token ? token.substring(0, 20) + '...' : 'AUCUN')  
  
      if (!token) {  
        console.error('❌ [AUTH] Aucun token d\'authentification trouvé')  
        setError('Token d\'authentification manquant')  
        return  
      }  
  
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'  
      const headers = {  
        'Authorization': `Bearer ${token}`,  
        'Content-Type': 'application/json'  
      }  
  
      console.log('📡 [API] Headers utilisés:', headers)  
  
      // 1. Récupérer les statistiques des employés    
      console.log('👥 [EMPLOYEES] Début de la requête employés...')  
      const employeesUrl = `${baseUrl}/api/admin/employees`  
      console.log('👥 [EMPLOYEES] URL:', employeesUrl)  
        
      const employeesResponse = await fetch(employeesUrl, { headers })  
      console.log('👥 [EMPLOYEES] Status de la réponse:', employeesResponse.status)  
      console.log('👥 [EMPLOYEES] Headers de réponse:', Object.fromEntries(employeesResponse.headers.entries()))  
        
      const employeesData = await employeesResponse.json()  
      console.log('👥 [EMPLOYEES] Données reçues:', employeesData)  
      console.log('👥 [EMPLOYEES] Type de données:', typeof employeesData)  
      console.log('👥 [EMPLOYEES] Success:', employeesData.success)  
      console.log('👥 [EMPLOYEES] Data length:', employeesData.data ? employeesData.data.length : 'N/A')  
  
      // 2. Récupérer les statistiques des clients - URL CORRIGÉE  
      console.log('👤 [CLIENTS] Début de la requête clients...')  
      const clientsUrl = `${baseUrl}/api/customer/stats/overview`  // URL corrigée  
      console.log('👤 [CLIENTS] URL:', clientsUrl)  
        
      const clientsResponse = await fetch(clientsUrl, { headers })  
      console.log('👤 [CLIENTS] Status de la réponse:', clientsResponse.status)  
      console.log('👤 [CLIENTS] Headers de réponse:', Object.fromEntries(clientsResponse.headers.entries()))  
        
      const clientsData = await clientsResponse.json()  
      console.log('👤 [CLIENTS] Données reçues:', clientsData)  
      console.log('👤 [CLIENTS] Type de données:', typeof clientsData)  
      console.log('👤 [CLIENTS] Success:', clientsData.success)  
      console.log('👤 [CLIENTS] Total:', clientsData.data ? clientsData.data.total : 'N/A')  
  
      // 3. Récupérer les statistiques des commandes/ventes - URL CORRIGÉE  
      console.log('📦 [ORDERS] Début de la requête commandes...')  
      const ordersUrl = `${baseUrl}/api/commands/stats`  // URL corrigée  
      console.log('📦 [ORDERS] URL:', ordersUrl)  
        
      const ordersResponse = await fetch(ordersUrl, { headers })  
      console.log('📦 [ORDERS] Status de la réponse:', ordersResponse.status)  
      console.log('📦 [ORDERS] Headers de réponse:', Object.fromEntries(ordersResponse.headers.entries()))  
        
      const ordersData = await ordersResponse.json()  
      console.log('📦 [ORDERS] Données reçues:', ordersData)  
      console.log('📦 [ORDERS] Type de données:', typeof ordersData)  
      console.log('📦 [ORDERS] Success:', ordersData.success)  
      console.log('📦 [ORDERS] Total orders:', ordersData.data ? ordersData.data.totalCommandes : 'N/A')  
  
      // Calcul des statistiques finales avec protection contre undefined  
      const finalStats = {  
        totalEmployees: (employeesData.success && employeesData.data) ? employeesData.data.length : 0,  
        totalClients: (clientsData.success && clientsData.data) ? (clientsData.data.total || 0) : 0,  
        totalSales: (ordersData.success && ordersData.data) ? (ordersData.data.totalCommandes || 0) : 0  
      }  
  
      console.log('📊 [STATS] Statistiques finales calculées:', finalStats)  
        
      setStats(finalStats)  
      console.log('✅ [DASHBOARD] Statistiques chargées avec succès')  
  
    } catch (err) {    
      console.error('❌ [DASHBOARD] Erreur lors du chargement des statistiques:', err)  
      console.error('❌ [DASHBOARD] Stack trace:', err.stack)  
      console.error('❌ [DASHBOARD] Message d\'erreur:', err.message)  
      setError(`Erreur lors du chargement des statistiques: ${err.message}`)  
    } finally {    
      setLoading(false)  
      console.log('🏁 [DASHBOARD] Fin du chargement des statistiques')  
    }    
  }    
  
  // Charger les données de ventes pour le graphique avec URL corrigée  
  const loadSalesData = async (periodType, date) => {    
    console.log('📈 [SALES] Début du chargement des données de ventes...')  
    console.log('📈 [SALES] Type de période:', periodType)  
    console.log('📈 [SALES] Date:', date)  
      
    try {    
      let startDate, endDate    
          
      switch (periodType) {    
        case "jour":    
          startDate = getWeekStart(date)    
          endDate = new Date(startDate)    
          endDate.setDate(startDate.getDate() + 6)    
          break    
        case "semaine":    
          startDate = getMonthStart(date)    
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)    
          break    
        case "mois":    
          startDate = getYearStart(date)    
          endDate = new Date(date.getFullYear(), 11, 31)    
          break    
      }    
  
      console.log('📈 [SALES] Date de début:', startDate)  
      console.log('📈 [SALES] Date de fin:', endDate)  
  
      const token = localStorage.getItem('token')  
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'  
      const salesUrl = `${baseUrl}/api/commands/sales-data`  // URL corrigée  
        
      console.log('📈 [SALES] URL:', salesUrl)  
        
      const requestBody = {  
        periodType,  
        startDate: startDate.toISOString(),  
        endDate: endDate.toISOString()  
      }  
        
      console.log('📈 [SALES] Corps de la requête:', requestBody)  
  
      const response = await fetch(salesUrl, {  
        method: 'POST',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify(requestBody)  
      })  
  
      console.log('📈 [SALES] Status de la réponse:', response.status)  
      console.log('📈 [SALES] Headers de réponse:', Object.fromEntries(response.headers.entries()))  
  
      const data = await response.json()  
      console.log('📈 [SALES] Données reçues:', data)  
          
      if (data.success) {    
        console.log('✅ [SALES] Données de ventes chargées avec succès')  
        setSalesData(data.data)    
      } else {    
        console.log('⚠️ [SALES] API non implémentée, utilisation des données de fallback')  
        const fallbackData = generateFallbackData(periodType, date)  
        console.log('📈 [SALES] Données de fallback:', fallbackData)  
        setSalesData(fallbackData)    
      }    
  
    } catch (err) {    
      console.error('❌ [SALES] Erreur lors du chargement des données de ventes:', err)  
      console.error('❌ [SALES] Stack trace:', err.stack)  
      console.log('⚠️ [SALES] Utilisation des données de fallback à cause de l\'erreur')  
      const fallbackData = generateFallbackData(periodType, date)  
      console.log('📈 [SALES] Données de fallback:', fallbackData)  
      setSalesData(fallbackData)    
    }    
  }    
  
  // Génération de données de fallback en attendant l'API    
  const generateFallbackData = (periodType, currentDate) => {  
    console.log('🔄 [FALLBACK] Génération des données de fallback pour:', periodType);  
        
    let labels;  
    const data = [];  
    
    switch (periodType) {  
      case "jour":  
        labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];  
        for (let i = 0; i < 7; i++) {  
          data.push({  
            period: labels[i],  
            livrees: 0,  
            annulees: 0,  
            fullDate: labels[i]  
          });  
        }  
        break;  
    
      case "semaine":  
        for (let i = 1; i <= 4; i++) {  
          data.push({  
            period: `S${i}`,  
            livrees: 0,  
            annulees: 0,  
            fullDate: `Semaine ${i}`  
          });  
        }  
        break;  
    
      case "mois":  
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];  
        for (let i = 0; i < 12; i++) {  
          data.push({  
            period: monthNames[i],  
            livrees: 0,  
            annulees: 0,  
            fullDate: monthNames[i]  
          });  
        }  
        break;  
    }  
    
    return data;  
  };
  
  // Effets avec logs  
  useEffect(() => {    
    console.log('🚀 [DASHBOARD] Composant monté, chargement initial des statistiques')  
    loadDashboardStats()    
  }, [])    
  
  useEffect(() => {    
    console.log('🔄 [DASHBOARD] Changement de période ou date, rechargement des données de ventes')  
    console.log('🔄 [DASHBOARD] Nouvelle période:', selectedPeriod)  
    console.log('🔄 [DASHBOARD] Nouvelle date:', currentDate)  
    loadSalesData(selectedPeriod, currentDate)    
  }, [selectedPeriod, currentDate])    
  
  // Gestionnaires d'événements    
  const handlePeriodChange = (newPeriod) => {    
    console.log('📅 [PERIOD] Changement de période:', selectedPeriod, '->', newPeriod)  
    setSelectedPeriod(newPeriod)    
  }    
  
  const navigatePeriod = (direction) => {    
    console.log('🧭 [NAVIGATION] Navigation:', direction)  
    const amount = direction === "prev" ? -1 : 1    
    const newDate = addPeriod(currentDate, selectedPeriod, amount)    
    console.log('🧭 [NAVIGATION] Nouvelle date calculée:', newDate)  
    setCurrentDate(newDate)    
  }    
  
  const goToToday = () => {    
    console.log('📅 [TODAY] Retour à aujourd\'hui')  
    const today = new Date()  
    console.log('📅 [TODAY] Date d\'aujourd\'hui:', today)  
    setCurrentDate(today)    
  }    
  
  const handleRefresh = () => {    
    console.log('🔄 [REFRESH] Actualisation manuelle déclenchée')  
    console.log('🔄 [REFRESH] Rechargement des statistiques et données de ventes')  
    loadDashboardStats()    
    loadSalesData(selectedPeriod, currentDate)    
  }    
  
  const getCurrentPeriodLabel = () => {    
    console.log('🏷️ [LABEL] Génération du label pour la période:', selectedPeriod)  
    switch (selectedPeriod) {    
      case "jour":    
        const weekStart = getWeekStart(currentDate)    
        const weekEnd = new Date(weekStart)    
        weekEnd.setDate(weekStart.getDate() + 6)    
        const label = `${weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`  
        console.log('🏷️ [LABEL] Label semaine généré:', label)  
        return label  
  
      case "semaine":    
        const monthLabel = formatDate(currentDate, "month")  
        console.log('🏷️ [LABEL] Label mois généré:', monthLabel)  
        return monthLabel  
  
      case "mois":    
        const yearLabel = formatDate(currentDate, "year")  
        console.log('🏷️ [LABEL] Label année généré:', yearLabel)  
        return yearLabel  
  
      default:    
        console.log('🏷️ [LABEL] Période inconnue, retour vide')  
        return ""    
    }    
  }    
  
  const getPeriodTitle = () => {    
    switch (selectedPeriod) {    
      case "jour":    
        return "Semaine du"    
      case "semaine":    
        return "Mois de"    
      case "mois":    
        return "Année"    
      default:    
        return ""    
    }    
  }    
  
  // Calcul des totaux pour les cards avec logs et protection  
  const totalVentesLivrees = salesData.reduce((sum, item) => sum + (item.livrees || 0), 0);  
  const totalVentesAnnulees = salesData.reduce((sum, item) => sum + (item.annulees || 0), 0);  

  if (loading) {    
    console.log('⏳ [RENDER] Affichage de l\'écran de chargement')  
    return (    
      <div className="dashboard-layout">    
        <div className="dashboard-wrapper">    
          <div className="dashboard-container">    
            <div style={{ padding: '20px', textAlign: 'center' }}>    
              Chargement du tableau de bord...    
            </div>    
          </div>    
        </div>    
      </div>    
    )    
  }    
  
  console.log('🎨 [RENDER] Rendu du dashboard principal')  
  console.log('🎨 [RENDER] Stats actuelles:', stats)  
  console.log('🎨 [RENDER] Données de ventes actuelles:', salesData)  
  console.log('🎨 [RENDER] Erreur actuelle:', error)  
  
  return (    
    <div className="dashboard-layout">    
      <div className="dashboard-wrapper">    
        <div className="dashboard-container">    
          <div className="dashboard-content">    
            {/* Header */}    
            <div className="dashboard-header">    
              <h1 className="dashboard-title">Dashboard</h1>    
              <button    
                onClick={handleRefresh}    
                className="refresh-button"    
                disabled={loading}    
                title="Actualiser"    
              >    
                <RotateCcw className={`refresh-icon ${loading ? 'spinning' : ''}`} />    
                Actualiser    
              </button>    
            </div>    
  
            {/* Affichage des erreurs */}    
            {error && (    
              <div className="error-message">    
                {error}    
              </div>    
            )}    
  
            {/* Cards statistiques avec protection contre undefined */}    
            <div className="dashboard-stats-grid">    
              {/* Card 1 - Total Employés */}    
              <div className="dashboard-stat-card gradient-card">    
                <div className="dashboard-stat-card-header">    
                  <div className="dashboard-stat-content">    
                    <h3 className="dashboard-stat-label">Total Employés</h3>    
                    <div className="dashboard-stat-value">{(stats.totalEmployees ?? 0).toLocaleString()}</div>    
                    <p className="dashboard-stat-change">Membres de l'équipe</p>    
                  </div>    
                </div>    
                <div className="card-image-container">    
                  <img src={butaneImage} alt="Employés" className="card-image" />    
                </div>    
              </div>    
                  
              {/* Card 2 - Total Clients */}    
              <div className="dashboard-stat-card gradient-card">    
                <div className="dashboard-stat-card-header">    
                  <div className="dashboard-stat-content">    
                    <h3 className="dashboard-stat-label">Total Clients</h3>    
                    <div className="dashboard-stat-value">{(stats.totalClients ?? 0).toLocaleString()}</div>    
                    <p className="dashboard-stat-change">Clients enregistrés</p>    
                  </div>    
                </div>    
                <div className="card-image-container">    
                  <img src={butaneImage} alt="Clients" className="card-image" />    
                </div>    
              </div>    
                  
              {/* Card 3 - Total Ventes */}    
              <div className="dashboard-stat-card gradient-card">    
                <div className="dashboard-stat-card-header">    
                  <div className="dashboard-stat-content">    
                    <h3 className="dashboard-stat-label">Total Ventes</h3>    
                    <div className="dashboard-stat-value">{(stats.totalSales ?? 0).toLocaleString()}</div>    
                    <p className="dashboard-stat-change">Commandes totales</p>    
                  </div>    
                </div>    
                <div className="card-image-container">    
                  <img src={butaneImage} alt="Ventes" className="card-image" />    
                </div>    
              </div>    
            </div>    
  
            {/* Section graphique */}    
            <div className="chart-card">    
              <div className="chart-header">    
                <div className="chart-title-section">    
                  <div className="chart-title-container">    
                    <h3 className="chart-title">    
                      Statistiques des ventes totales    
                    </h3>    
                    <p className="chart-subtitle">Évolution des ventes dans le temps</p>    
                  </div>    
  
                  {/* Filtres de période */}    
                  <div className="period-filters">    
                    <button    
                      className={`period-button ${selectedPeriod === "jour" ? "active" : "outline"}`}    
                      onClick={() => handlePeriodChange("jour")}    
                    >    
                      Jour    
                    </button>    
                    <button    
                      className={`period-button ${selectedPeriod === "mois" ? "active" : "outline"}`}    
                      onClick={() => handlePeriodChange("mois")}    
                    >    
                      Mois    
                    </button>    
                  </div>    
                </div>    
  
                {/* Navigation des dates */}    
                <div className="date-navigation">    
                  <button    
                    className="nav-button"    
                    onClick={() => navigatePeriod("prev")}    
                  >    
                    <ChevronLeft className="nav-icon" />    
                    <span>Précédent</span>    
                  </button>    
  
                  <div className="date-info">    
                    <div className="date-display">    
                      <Calendar className="calendar-icon" />    
                      <span>{getPeriodTitle()}</span>    
                      <span className="current-period">{getCurrentPeriodLabel()}</span>    
                    </div>    
  
                    <button    
                      className="today-button"    
                      onClick={goToToday}    
                      title="Retour à aujourd'hui"    
                    >    
                      <RotateCcw className="today-icon" />    
                      <span>Aujourd'hui</span>    
                    </button>    
                  </div>    
  
                  <button    
                    className="nav-button"    
                    onClick={() => navigatePeriod("next")}    
                  >    
                    <span>Suivant</span>    
                    <ChevronRight className="nav-icon" />    
                  </button>    
                </div>    
              </div>    
  
              {/* Graphique Recharts avec axes X et Y */}    
              <div className="chart-container">  
                <ResponsiveContainer width="100%" height={400}>  
                  <BarChart  
                    data={salesData}  
                    margin={{  
                      top: 20,  
                      right: 30,  
                      left: 20,  
                      bottom: 5,  
                    }}  
                  >  
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />  
                    <XAxis  
                      dataKey="period"  
                      tick={{ fontSize: 12, fill: '#6b7280' }}  
                      axisLine={{ stroke: '#e5e7eb' }}  
                      tickLine={{ stroke: '#e5e7eb' }}  
                    />  
                    <YAxis  
                      tick={{ fontSize: 12, fill: '#6b7280' }}  
                      axisLine={{ stroke: '#e5e7eb' }}  
                      tickLine={{ stroke: '#e5e7eb' }}  
                    />  
                    <Tooltip  
                      contentStyle={{  
                        backgroundColor: 'white',  
                        border: '1px solid #e5e7eb',  
                        borderRadius: '8px',  
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'  
                      }}  
                      labelStyle={{ color: '#374151', fontWeight: '600' }}  
                    />  
                    <Legend  
                      wrapperStyle={{ paddingTop: '20px' }}  
                    />  
                    <Bar  
                      dataKey="livrees"  
                      fill="#22c55e"  
                      name="Ventes Livrées"  
                      radius={[4, 4, 0, 0]}  
                    />  
                    <Bar  
                      dataKey="annulees"  
                      fill="#ef4444"  
                      name="Ventes Annulées"  
                      radius={[4, 4, 0, 0]}  
                    />  
                  </BarChart>  
                </ResponsiveContainer>  
              </div>     
            </div>    
  
            {/* Informations supplémentaires avec protection */}    
            <div className="info-grid">    
              <div className="info-card">    
                <div className="info-card-header">    
                  <h4 className="info-title">Résumé de la période</h4>    
                </div>    
                <div className="info-content">    
                  <div className="info-row">  
                    <span className="info-label">Ventes livrées période:</span>  
                    <span className="info-value">{totalVentesLivrees.toLocaleString()} commandes</span>  
                  </div>  
                  <div className="info-row">  
                    <span className="info-label">Ventes annulées période:</span>  
                    <span className="info-value">{totalVentesAnnulees.toLocaleString()} commandes</span>  
                  </div>   
                  <div className="info-row">    
                    <span className="info-label">Période actuelle:</span>    
                    <span className="info-value info-period">{getCurrentPeriodLabel()}</span>    
                  </div>    
                  <div className="info-row">    
                    <span className="info-label">Type de vue:</span>    
                    <span className="info-value period-type">{selectedPeriod}</span>    
                  </div>    
                  <div className="info-row">    
                    <span className="info-label">Dernière mise à jour:</span>    
                    <span className="info-value">{new Date().toLocaleString('fr-FR')}</span>    
                  </div>    
                </div>    
              </div>    
  
              <div className="info-card">    
                <div className="info-card-header">    
                  <h4 className="info-title">Statistiques globales</h4>    
                </div>    
                <div className="info-content">    
                  <div className="info-row">    
                    <span className="info-label">Employés actifs:</span>    
                    <span className="info-value">{stats.totalEmployees ?? 0}</span>    
                  </div>    
                  <div className="info-row">    
                    <span className="info-label">Clients enregistrés:</span>    
                    <span className="info-value">{stats.totalClients ?? 0}</span>    
                  </div>    
                  <div className="info-row">    
                    <span className="info-label">Commandes totales:</span>    
                    <span className="info-value">{stats.totalSales ?? 0}</span>    
                  </div>    
                  <div className="help-section">    
                    <div className="help-text">    
                      📊 Données en temps réel depuis la base de données    
                    </div>    
                    <div className="help-text">    
                      🔄 Cliquez sur "Actualiser" pour mettre à jour    
                    </div>    
                  </div>    
                </div>    
              </div>    
            </div>    
          </div>    
        </div>    
      </div>    
    </div>    
  )    
}