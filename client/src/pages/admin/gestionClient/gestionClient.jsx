import { useState, useEffect } from "react"          
import {           
  MdSearch as Search,           
  MdAdd as Plus,           
  MdEdit as Edit,          
  MdDelete as Delete,          
  MdClose as X,  
  MdVisibility as Eye          
} from "react-icons/md"          
import "./gestionClient.css"               
import { clientService } from '../../../services/clientService'    
    
export default function ClientManagement() {        
  const [searchTerm, setSearchTerm] = useState("")        
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)        
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)  
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)        
  const [clients, setClients] = useState([])        
  const [editingClient, setEditingClient] = useState(null)  
  const [viewingClient, setViewingClient] = useState(null)        
  const [loading, setLoading] = useState(true)      
  const [error, setError] = useState("")      
  const [isLoading, setIsLoading] = useState(false)  
  const [cities, setCities] = useState([])  
  const [loadingCities, setLoadingCities] = useState(false)  
  const [clientAddresses, setClientAddresses] = useState([])  
  const [loadingAddresses, setLoadingAddresses] = useState(false)     
  const [companyClients, setCompanyClients] = useState([]);  
  const [loadingCompanyClients, setLoadingCompanyClients] = useState(false);  
  
      
  const [formData, setFormData] = useState({        
    // Champs communs    
    email: "",      
    telephone: "",      
    type: "",      
    statut: "ACTIF",    
          
    // Champs pour particuliers      
    prenom: "",      
    nom: "",      
    civilite: "M",      
        
    // Champs pour entreprises    
    raison_sociale: "",    
    ice: "",    
    patente: "",    
    rc: "",    
    ville_rc: "",  
  
    // Champs d'adresse structurés  
    street: "",  
    numappt: "",  
    numimmeuble: "",  
    quartier: "",  
    postal_code: "",  
    city_id: ""  
  })        
  
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
  
  const findCorrectMoralUserId = (customers, companyId) => {  
    // Chercher un client particulier qui appartient à cette entreprise  
    const companyClient = customers.find(c =>   
      c.type_client === 'PHYSIQUE' &&   
      c.user_info?.moral_user_id &&  
      c.user_info.moral_user_id !== 'undefined' &&  
      c.user_info.moral_user_id !== null  
    );  
    return companyClient?.user_info?.moral_user_id || null;  
  };  
    
  const transformClientData = (customers) => {              
    const independentClients = [];              
    const companies = [];              
      
    console.log('🔍 Données brutes reçues dans transformClientData:', customers);        
      
    // Récupérer l'utilisateur connecté pour les cas Google OAuth  
    const user = JSON.parse(localStorage.getItem('user'));  
                      
    customers.forEach(customer => {              
      console.log('🔍 Traitement du client:', customer);        
                
      if (customer.type_client === 'MORAL') {                  
        console.log('✅ Entreprise trouvée:', customer.user_info?.raison_sociale);            
        // Entreprises              
        companies.push({              
          id: customer.id,              
          nom: customer.user_info?.raison_sociale || 'N/A',              
          type: 'Entreprise',              
          telephone: customer.user_info?.telephone_principal || 'N/A',              
          email: customer.user_info?.email || 'N/A',              
          statut: customer.statut,              
          // Données détaillées pour l'édition              
          ice: customer.user_info?.ice || '',              
          raison_sociale: customer.user_info?.raison_sociale || '',              
          patente: customer.user_info?.patente || '',              
          rc: customer.user_info?.rc || '',              
          ville_rc: customer.user_info?.ville_rc || '',          
          // ✅ CORRECTION: Gérer les entreprises Google OAuth  
          moral_user_id: findCorrectMoralUserId(customers, customer.id) ||   
                        customer.user_info?.id ||   
                        (user && user.type === 'MORAL' ? user.id : null),  
          user_info: customer.user_info          
        });                
    
      } else if (customer.type_client === 'PHYSIQUE') {            
        const isIndependentClient = !customer.user_info?.moral_user_id;          
        console.log('🔍 Client particulier - user_info.moral_user_id:', customer.user_info?.moral_user_id);        
        console.log('🔍 Est indépendant?', isIndependentClient);        
                  
        if (isIndependentClient) {          
          console.log('✅ Client particulier indépendant ajouté');        
          // Clients particuliers indépendants seulement          
          independentClients.push({          
            id: customer.id,          
            nom: `${customer.user_info.first_name} ${customer.user_info.last_name}`,          
            type: 'Particulier',          
            telephone: customer.user_info?.telephone_principal || 'N/A',          
            email: customer.user_info?.email || 'N/A',          
            statut: customer.statut,          
            civilite: customer.user_info?.civilite || '',          
            prenom: customer.user_info?.first_name || '',          
            nom_seul: customer.user_info?.last_name || ''          
          });          
        } else {        
          console.log('❌ Client particulier d\'entreprise ignoré - moral_user_id:', customer.user_info?.moral_user_id);        
        }        
      } else {        
        console.log('⚠️ Type de client non reconnu:', customer.type_client);        
      }              
    });              
              
    console.log('📊 Résultat final - Particuliers indépendants:', independentClients.length);        
    console.log('📊 Résultat final - Entreprises:', companies.length);        
    console.log('📊 Liste des particuliers indépendants:', independentClients);        
    console.log('📊 Liste des entreprises:', companies);        
                      
    return [...independentClients, ...companies];              
  };

  
  
  useEffect(() => {        
    loadClients()        
  }, [])        
        
  const loadClients = async () => {      
    try {      
      const response = await clientService.getAll();      
      if (response.success) {      
        const transformedClients = transformClientData(response.data);      
        setClients(transformedClients);      
      } else {      
        setError('Erreur lors du chargement des clients');      
      }      
    } catch (err) {      
      setError('Erreur de connexion');      
      console.error('Erreur:', err);      
    } finally {      
      setLoading(false);      
    }      
  }        

const loadCompanyClients = async (client) => {  
  try {  
    console.log('🏢 Chargement des clients pour l\'entreprise:', client);  
    setLoadingCompanyClients(true);  
      
    // ✅ CORRECTION: Utiliser directement l'ID de l'entreprise sélectionnée  
    let moralUserId;  
    let isGoogleOAuth = false;  
      
    // Pour les entreprises dans la liste admin, utiliser l'ID de l'entreprise elle-même  
    if (client.type === 'Entreprise') {  
      // Vérifier si c'est une entreprise Google OAuth  
      if (client.user_info && client.user_info.type === 'MORAL') {  
        // Pour Google OAuth, utiliser l'ID du user_info  
        moralUserId = client.user_info.id;  
        isGoogleOAuth = true;  
        console.log('🔍 Entreprise Google OAuth - utilisation de user_info.id:', moralUserId);  
      } else {  
        // Pour les entreprises normales, utiliser l'ID de l'entreprise  
        moralUserId = client.id;  
        console.log('🏢 Entreprise normale - utilisation de client.id:', moralUserId);  
      }  
    }  
      
    if (!moralUserId) {  
      console.log('❌ Impossible de trouver l\'ID du MoralUser valide');  
      setCompanyClients([]);  
      return;  
    }  
      
    // Utiliser la route appropriée  
    const apiUrl = isGoogleOAuth     
      ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/company/oauth/${moralUserId}`    
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/company/${moralUserId}`;  
      
    console.log('🌐 URL API utilisée:', apiUrl);  
    console.log('🔍 Est Google OAuth:', isGoogleOAuth);  
      
    const response = await fetch(apiUrl, {  
      headers: {  
        'Authorization': `Bearer ${localStorage.getItem('token')}`,  
        'Content-Type': 'application/json'  
      }  
    });  
      
    console.log('🌐 Réponse API status:', response.status);  
    const data = await response.json();  
    console.log('🌐 Données reçues de l\'API:', data);  
      
    if (data.success && data.data) {  
      console.log('📊 Nombre de clients trouvés:', data.data.length);  
      const formattedClients = data.data.map(client => ({  
        id: client.id,  
        nom: `${client.user_info.first_name} ${client.user_info.last_name}`,  
        prenom: client.user_info.first_name,  
        nom_famille: client.user_info.last_name,  
        email: client.user_info.email  
      }));  
      console.log('✅ Clients formatés:', formattedClients);  
      setCompanyClients(formattedClients);  
    } else {  
      console.log('⚠️ Aucun client trouvé ou erreur API:', data.message);  
      setCompanyClients([]);  
    }  
  } catch (err) {  
    console.error('❌ Erreur lors du chargement des clients de l\'entreprise:', err);  
    setCompanyClients([]);  
  } finally {  
    setLoadingCompanyClients(false);  
  }  
};

        
  const filteredClients = clients.filter((client) =>        
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||        
    client.type.toLowerCase().includes(searchTerm.toLowerCase()) ||        
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||        
    client.statut.toLowerCase().includes(searchTerm.toLowerCase())        
  )        
        
  // Calculer les statistiques    
  const totalClients = clients.length        
  const particuliers = clients.filter((client) => client.type === "Particulier").length        
  const entreprises = clients.filter((client) => client.type === "Entreprise").length        
        
  const handleInputChange = (field, value) => {        
    setFormData((prev) => ({        
      ...prev,        
      [field]: value,        
    }))        
  }        
  
  // Fonction pour recharger les clients après modification  
  const reloadClients = async () => {  
    try {  
      const updatedResponse = await clientService.getAll();  
      if (updatedResponse.success) {  
        const transformedClients = transformClientData(updatedResponse.data);  
        setClients(transformedClients);  
      }  
    } catch (err) {  
      console.error('Erreur lors du rechargement:', err);  
    }  
  };  
  
  // Fonction corrigée - suppression des sélecteurs  
  const resetForm = () => {  
    setFormData({      
      email: "",    
      telephone: "",    
      type: "",    
      statut: "ACTIF",  
      prenom: "",    
      nom: "",    
      civilite: "M",    
      raison_sociale: "",    
      ice: "",    
      patente: "",    
      rc: "",    
      ville_rc: "",  
      // Champs d'adresse structurés  
      street: "",  
      numappt: "",  
      numimmeuble: "",  
      quartier: "",  
      postal_code: "",  
      city_id: ""  
    });  
  };  
        
  // handleAddSubmit corrigé avec champs d'adresse structurés  
  const handleAddSubmit = async (e) => {        
    e.preventDefault()        
    setIsLoading(true)      
    setError("")      
      
    try {      
      const clientData = {      
        type_client: formData.type === 'Particulier' ? 'PHYSIQUE' : 'MORAL',      
        profile: formData.type === 'Particulier' ? {        
          first_name: formData.prenom,        
          last_name: formData.nom,        
          civilite: formData.civilite,      
          telephone_principal: formData.telephone,        
          email: formData.email,  
          // Champs d'adresse structurés  
          street: formData.street,  
          numappt: formData.numappt,  
          numimmeuble: formData.numimmeuble,  
          quartier: formData.quartier,  
          postal_code: formData.postal_code,  
          city_id: formData.city_id  
        } : {        
          raison_sociale: formData.raison_sociale,      
          ice: formData.ice,    
          patente: formData.patente,    
          rc: formData.rc,    
          ville_rc: formData.ville_rc,    
          telephone_principal: formData.telephone,      
          email: formData.email,  
          // Champs d'adresse structurés  
          street: formData.street,  
          numappt: formData.numappt,  
          numimmeuble: formData.numimmeuble,  
          quartier: formData.quartier,  
          postal_code: formData.postal_code,  
          city_id: formData.city_id  
        },  
        statut: formData.statut  
      };      
      console.log('📤 Données envoyées depuis le client:', clientData);  
      const response = await clientService.create(clientData);      
            
      if (response.success) {      
        await reloadClients();  
        setIsAddDialogOpen(false);      
        resetForm();  
      } else {      
        setError(response.message || "Erreur lors de l'ajout du client");      
      }      
    } catch (err) {      
      setError("Erreur lors de l'ajout du client");      
      console.error('Erreur:', err);      
    } finally {      
      setIsLoading(false);      
    }      
  }        
      
  const handleAddClick = () => {        
    resetForm();  
    setIsAddDialogOpen(true)        
  }        
        
  // handleEditSubmit corrigé - suppression du champ adresse  
  const handleEditSubmit = async (e) => {        
    e.preventDefault()        
    setIsLoading(true)      
    setError("")      
      
    try {        
      const clientData = {      
        type_client: formData.type === 'Particulier' ? 'PHYSIQUE' : 'MORAL',      
        profile: formData.type === 'Particulier' ? {      
          first_name: formData.prenom,      
          last_name: formData.nom,      
          civilite: formData.civilite,    
          telephone_principal: formData.telephone,      
          email: formData.email  
        } : {      
          raison_sociale: formData.raison_sociale,      
          ice: formData.ice,    
          patente: formData.patente,    
          rc: formData.rc,    
          ville_rc: formData.ville_rc,    
          telephone_principal: formData.telephone,      
          email: formData.email  
        },  
        statut: formData.statut  
      };      
      
      const response = await clientService.update(editingClient.id, clientData);      
            
      if (response.success) {      
        await reloadClients();  
        setIsEditDialogOpen(false);      
        setEditingClient(null);      
        resetForm();  
      } else {      
        setError(response.message || "Erreur lors de la modification du client");      
      }      
    } catch (err) {      
      setError("Erreur lors de la modification du client");      
      console.error('Erreur:', err);      
    } finally {      
      setIsLoading(false);      
    }      
  }        
        
  // handleEdit corrigé - suppression des sélecteurs  
  const handleEdit = (client) => {    
    setEditingClient(client)    
      
    setFormData({    
      email: client.email,    
      telephone: client.telephone,    
      type: client.type,    
      statut: client.statut || "ACTIF",    
      // Pour particuliers    
      prenom: client.prenom || "",    
      nom: client.nom_seul || "",    
      civilite: client.civilite || "M",    
      // Pour entreprises    
      raison_sociale: client.raison_sociale || (client.type === "Entreprise" ? client.nom : ""),    
      ice: client.ice || "",    
      patente: client.patente || "",  
      rc: client.rc || "",  
      ville_rc: client.ville_rc || "",  
      // Pas de champs d'adresse pour l'édition  
      street: "",  
      numappt: "",  
      numimmeuble: "",  
      quartier: "",  
      postal_code: "",  
      city_id: ""  
    })    
    setIsEditDialogOpen(true)    
  }  
  
  // Nouvelle fonction pour voir les détails du client  
  const handleViewDetails = async (client) => {  
    setViewingClient(client);  
    setLoadingAddresses(true);  
    setIsDetailDialogOpen(true);  
      
    try {  
      // Charger les adresses du client  
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customer/${client.id}/addresses`, {  
        headers: {  
          'Authorization': `Bearer ${localStorage.getItem('token')}`,  
          'Content-Type': 'application/json'  
        }  
      });  
        
      const data = await response.json();  
      if (data.success) {  
        setClientAddresses(data.addresses || []);  
      } else {  
        setClientAddresses([]);  
      }  
        
      // Si c'est une entreprise, charger ses clients particuliers  
      if (client.type === 'Entreprise') {    
        console.log('🏢 Entreprise détectée, chargement des clients pour:', client.nom, 'ID:', client.id);  
        await loadCompanyClients(client);    
      } else {  
        console.log('👤 Client particulier, pas de chargement de sous-clients');  
      } 
    } catch (err) {  
      console.error('Erreur lors du chargement des détails:', err);  
      setClientAddresses([]);  
    } finally {  
      setLoadingAddresses(false);  
    }  
  };
        
  const handleDelete = async (clientId) => {        
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {        
      try {      
        setError("");      
        const response = await clientService.delete(clientId);      
              
        if (response.success) {      
          setClients(clients.filter(client => client.id !== clientId));      
        } else {      
          setError(response.message || "Erreur lors de la suppression du client");      
        }      
      } catch (err) {      
        setError("Erreur lors de la suppression du client");      
        console.error('Erreur:', err);      
      }      
    }        
  }        
        
  const getTypeBadge = (type) => {        
    switch (type) {        
      case "Particulier":        
        return <span className="badge badge-particulier">Particulier</span>        
      case "Entreprise":        
        return <span className="badge badge-professionnel">Entreprise</span>        
      default:        
        return <span className="badge badge-default">{type}</span>        
    }        
  }  
  
  const getStatutBadge = (statut) => {  
    switch (statut) {  
      case "ACTIF":  
        return <span className="badge badge-success">Actif</span>  
      case "INACTIF":  
        return <span className="badge badge-secondary">Inactif</span>  
      case "SUSPENDU":  
        return <span className="badge badge-warning">Suspendu</span>  
      case "EN_ATTENTE":  
        return <span className="badge badge-info">En attente</span>  
      default:  
        return <span className="badge badge-default">{statut}</span>  
    }  
  }  
      
  if (loading) {      
    return (      
      <div className="client-management-layout">      
        <div className="client-management-wrapper">      
          <div style={{ padding: '20px', textAlign: 'center' }}>      
            Chargement des clients...      
          </div>      
        </div>      
      </div>      
    );      
  }      
        
  return (        
    <div className="client-management-layout">    
      <div className="client-management-wrapper">        
        <div className="client-management-container">        
          <div className="client-management-content">        
            {/* En-tête */}        
            <div className="page-header">        
              <h1 className="page-title">Gestion des Clients</h1>          
              <p className="page-subtitle">Gérez votre base de clients</p>            
            </div>            
          
            {/* Affichage des erreurs */}          
            {error && (          
              <div className="error-alert" style={{           
                backgroundColor: '#fee',           
                color: '#c33',           
                padding: '10px',           
                borderRadius: '4px',      
                marginBottom: '20px'           
              }}>          
                {error}          
              </div>          
            )}          
            
            {/* Statistiques */}            
            <div className="stats-grid">            
              <div className="stat-card gradient-card">            
                <div className="stat-card-header">            
                  <div className="stat-content">            
                    <h3 className="stat-label">Total Clients</h3>            
                    <div className="stat-value">{totalClients}</div>            
                    <p className="stat-description">Clients enregistrés</p>            
                  </div>            
                </div>            
              </div>            
                      
              <div className="stat-card gradient-card">            
                <div className="stat-card-header">            
                  <div className="stat-content">            
                    <h3 className="stat-label">Particuliers</h3>            
                    <div className="stat-value">{particuliers}</div>            
                    <p className="stat-description">Clients particuliers</p>            
                  </div>            
                </div>            
              </div>            
                      
              <div className="stat-card gradient-card">            
                <div className="stat-card-header">           
                  <div className="stat-content">              
                    <h3 className="stat-label">Entreprises</h3>              
                    <div className="stat-value">{entreprises}</div>              
                    <p className="stat-description">Clients entreprises</p>              
                  </div>              
                </div>              
              </div>              
            </div>              
              
            {/* Bouton Ajouter Client */}              
            <div className="action-section">              
              <button className="add-button" onClick={handleAddClick}>              
                <Plus className="button-icon" />              
                Ajouter Client              
              </button>              
            </div>              
              
            {/* Barre de recherche */}              
            <div className="search-section">              
              <div className="search-container">              
                <Search className="search-icon" />              
                <input              
                  type="text"              
                  placeholder="Rechercher par nom, type, email ou statut..."              
                  value={searchTerm}              
                  onChange={(e) => setSearchTerm(e.target.value)}              
                  className="search-input"              
                />              
              </div>              
            </div>              
              
            {/* Tableau des clients avec icône œil */}              
            <div className="table-card">              
              <div className="table-header">              
                <h3 className="table-title">Liste des Clients</h3>              
              </div>              
              <div className="table-content">              
                <div className="table-container">              
                  <table className="clients-table">              
                    <thead>              
                      <tr>              
                        <th>Nom</th>              
                        <th>Type</th>              
                        <th>Téléphone</th>              
                        <th>Email</th>       
                        <th>Statut</th>             
                        <th>Actions</th>              
                      </tr>              
                    </thead>              
                    <tbody>              
                      {filteredClients.map((client) => (              
                        <tr key={client.id}>              
                          <td className="font-medium">{client.nom}</td>              
                          <td>{getTypeBadge(client.type)}</td>              
                          <td>{client.telephone}</td>              
                          <td>{client.email}</td>              
                          <td>{getStatutBadge(client.statut)}</td>      
                          <td>              
                            <div className="action-buttons">  
                              <button   
                                className="view-action-button"  
                                onClick={() => handleViewDetails(client)}  
                                title="Voir les détails"  
                              >  
                                <Eye className="action-icon" />  
                              </button>              
                              <button               
                                className="edit-action-button"              
                                onClick={() => handleEdit(client)}              
                              >              
                                <Edit className="action-icon" />              
                              </button>              
                              <button               
                                className="delete-action-button"              
                                onClick={() => handleDelete(client.id)}              
                              >              
                                <Delete className="action-icon" />              
                              </button>              
                            </div>              
                          </td>              
                        </tr>              
                      ))}              
                    </tbody>              
                  </table>              
                  {filteredClients.length === 0 && (              
                    <div className="no-results">              
                      Aucun client trouvé pour votre recherche.              
                    </div>              
                  )}              
                </div>              
              </div>              
            </div>              
              
            {/* Modal d'ajout avec champs d'adresse structurés */}              
            {isAddDialogOpen && (              
              <div className="modal-overlay" onClick={() => setIsAddDialogOpen(false)}>              
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>              
                  <div className="modal-header">              
                    <h3 className="modal-title">Ajouter un Client</h3>              
                    <button               
                      className="modal-close"              
                      onClick={() => setIsAddDialogOpen(false)}              
                    >              
                      <X className="close-icon" />              
                    </button>              
                  </div>              
                  <form onSubmit={handleAddSubmit} className="modal-form">              
                    <div className="form-grid">              
                      {/* Email et Type */}      
                      <div className="form-group">        
                        <label className="form-label">Email *</label>        
                        <input        
                          type="email"        
                          value={formData.email}        
                          onChange={(e) => handleInputChange("email", e.target.value)}        
                          className="form-input"        
                          required        
                        />        
                      </div>        
        
                      <div className="form-group">        
                        <label className="form-label">Type *</label>        
                        <select        
                          value={formData.type}        
                          onChange={(e) => handleInputChange("type", e.target.value)}        
                          className="form-select"        
                          required        
                        >        
                          <option value="">Sélectionner un type</option>        
                          <option value="Particulier">Particulier</option>        
                          <option value="Entreprise">Entreprise</option>        
                        </select>        
                      </div>        
        
                      {/* Champs spécifiques aux particuliers */}        
                      {formData.type === "Particulier" && (        
                        <>        
                          <div className="form-group">        
                            <label className="form-label">Nom *</label>        
                            <input        
                              type="text"        
                              value={formData.nom}        
                              onChange={(e) => handleInputChange("nom", e.target.value)}        
                              className="form-input"        
                              required        
                            />        
                          </div>        
                                
                          <div className="form-group">        
                            <label className="form-label">Prénom *</label>        
                            <input        
                              type="text"        
                              value={formData.prenom}        
                              onChange={(e) => handleInputChange("prenom", e.target.value)}        
                              className="form-input"        
                              required        
                            />        
                          </div>        
                                
                          <div className="form-group">        
                            <label className="form-label">Téléphone *</label>        
                            <input        
                              type="tel"        
                              value={formData.telephone}        
                              onChange={(e) => handleInputChange("telephone", e.target.value)}        
                              className="form-input"        
                              required        
                            />        
                          </div>        
                              
                          <div className="form-group">        
                            <label className="form-label">Civilité *</label>        
                            <select        
                              value={formData.civilite}        
                              onChange={(e) => handleInputChange("civilite", e.target.value)}        
                              className="form-select"        
                              required        
                            >        
                              <option value="M">M.</option>        
                              <option value="Mme">Mme</option>        
                              <option value="Mlle">Mlle</option>        
                            </select>        
                          </div>        
                              
                          {/* Section Adresse structurée */}  
                          <div className="form-section">  
                            <h4 className="section-title">Adresse principale</h4>  
                              
                            <div className="form-group">  
                              <label className="form-label">Rue *</label>  
                              <input  
                                type="text"  
                                value={formData.street}  
                                onChange={(e) => handleInputChange("street", e.target.value)}  
                                className="form-input"  
                                placeholder="Nom de la rue"  
                                required  
                              />  
                            </div>  
  
                            <div className="form-row">  
                              <div className="form-group">  
                                <label className="form-label">N° Immeuble</label>  
                                <input  
                                  type="text"  
                                  value={formData.numimmeuble}  
                                  onChange={(e) => handleInputChange("numimmeuble", e.target.value)}  
                                  className="form-input"  
                                  placeholder="Numéro d'immeuble"  
                                />  
                              </div>  
                              <div className="form-group">  
                                <label className="form-label">N° Appartement</label>  
                                <input  
                                  type="text"  
                                  value={formData.numappt}  
                                  onChange={(e) => handleInputChange("numappt", e.target.value)}  
                                  className="form-input"  
                                  placeholder="Numéro d'appartement"  
                                />  
                              </div>  
                            </div>  
  
                            <div className="form-group">  
                              <label className="form-label">Quartier</label>  
                              <input  
                                type="text"  
                                value={formData.quartier}  
                                onChange={(e) => handleInputChange("quartier", e.target.value)}  
                                className="form-input"  
                                placeholder="Nom du quartier"  
                              />  
                            </div>  
  
                            <div className="form-row">  
                              <div className="form-group">  
                                <label className="form-label">Code postal</label>  
                                <input  
                                  type="text"  
                                  value={formData.postal_code}  
                                  onChange={(e) => handleInputChange("postal_code", e.target.value)}  
                                  className="form-input"  
                                  placeholder="Ex: 20000"  
                                />  
                              </div>  
                              <div className="form-group">  
                                <label className="form-label">Ville *</label>  
                                <select  
                                  value={formData.city_id}  
                                  onChange={(e) => handleInputChange("city_id", e.target.value)}  
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
                              
                          <div className="form-group">        
                            <label className="form-label">Statut *</label>        
                            <select        
                              value={formData.statut}        
                              onChange={(e) => handleInputChange("statut", e.target.value)}        
                              className="form-select"        
                              required        
                            >        
                              <option value="ACTIF">Actif</option>        
                              <option value="INACTIF">Inactif</option>        
                              <option value="SUSPENDU">Suspendu</option>        
                              <option value="EN_ATTENTE">En attente</option>        
                            </select>        
                          </div>        
                        </>        
                      )}        
      
                      {/* Champs spécifiques aux entreprises */}        
                      {formData.type === "Entreprise" && (        
                        <>        
                          <div className="form-group">        
                            <label className="form-label">Raison sociale *</label>        
                            <input        
                              type="text"        
                              value={formData.raison_sociale}        
                              onChange={(e) => handleInputChange("raison_sociale", e.target.value)}        
                              className="form-input"        
                              required        
                            />        
                          </div>        
  
                          <div className="form-group">        
                            <label className="form-label">Téléphone *</label>        
                            <input        
                              type="tel"        
                              value={formData.telephone}        
                              onChange={(e) => handleInputChange("telephone", e.target.value)}        
                              className="form-input"        
                              required        
                            />        
                          </div>        
  
                          <div className="form-group">        
                            <label className="form-label">ICE</label>        
                            <input        
                              type="text"        
                              value={formData.ice}        
                              onChange={(e) => handleInputChange("ice", e.target.value)}        
                              className="form-input"        
                            />        
                          </div>        
                                
                          <div className="form-group">        
                            <label className="form-label">Patente</label>        
                            <input        
                              type="text"        
                              value={formData.patente}        
                              onChange={(e) => handleInputChange("patente", e.target.value)}        
                              className="form-input"        
                            />        
                          </div>        
                                
                          <div className="form-group">        
                            <label className="form-label">RC</label>        
                            <input        
                              type="text"        
                              value={formData.rc}        
                              onChange={(e) => handleInputChange("rc", e.target.value)}        
                              className="form-input"        
                            />        
                          </div>        
                                
                          <div className="form-group">        
                            <label className="form-label">Ville RC</label>        
                            <input        
                              type="text"        
                              value={formData.ville_rc}        
                              onChange={(e) => handleInputChange("ville_rc", e.target.value)}        
                              className="form-input"        
                            />        
                          </div>        
  
                          {/* Section Adresse structurée pour entreprises */}  
                          <div className="form-section">  
                            <h4 className="section-title">Adresse principale</h4>  
                              
                            <div className="form-group">  
                              <label className="form-label">Rue *</label>  
                              <input  
                                type="text"  
                                value={formData.street}  
                                onChange={(e) => handleInputChange("street", e.target.value)}  
                                className="form-input"  
                                placeholder="Nom de la rue"  
                                required  
                              />  
                            </div>  
  
                            <div className="form-row">  
                              <div className="form-group">  
                                <label className="form-label">N° Immeuble</label>  
                                <input  
                                  type="text"  
                                  value={formData.numimmeuble}  
                                  onChange={(e) => handleInputChange("numimmeuble", e.target.value)}  
                                  className="form-input"  
                                  placeholder="Numéro d'immeuble"  
                                />  
                              </div>  
                              <div className="form-group">  
                                <label className="form-label">N° Appartement</label>  
                                <input  
                                  type="text"  
                                  value={formData.numappt}  
                                  onChange={(e) => handleInputChange("numappt", e.target.value)}  
                                  className="form-input"  
                                  placeholder="Numéro d'appartement"  
                                />  
                              </div>  
                            </div>  
  
                            <div className="form-group">  
                              <label className="form-label">Quartier</label>  
                              <input  
                                type="text"  
                                value={formData.quartier}  
                                onChange={(e) => handleInputChange("quartier", e.target.value)}  
                                className="form-input"  
                                placeholder="Nom du quartier"  
                              />  
                            </div>  
  
                            <div className="form-row">  
                              <div className="form-group">  
                                <label className="form-label">Code postal</label>  
                                <input  
                                  type="text"  
                                  value={formData.postal_code}  
                                  onChange={(e) => handleInputChange("postal_code", e.target.value)}  
                                  className="form-input"  
                                  placeholder="Ex: 20000"  
                                />  
                              </div>  
                              <div className="form-group">  
                                <label className="form-label">Ville *</label>  
                                <select  
                                  value={formData.city_id}  
                                  onChange={(e) => handleInputChange("city_id", e.target.value)}  
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
  
                          <div className="form-group">        
                            <label className="form-label">Statut *</label>        
                            <select        
                              value={formData.statut}        
                              onChange={(e) => handleInputChange("statut", e.target.value)}        
                              className="form-select"        
                              required        
                            >        
                              <option value="ACTIF">Actif</option>        
                              <option value="INACTIF">Inactif</option>        
                              <option value="SUSPENDU">Suspendu</option>        
                              <option value="EN_ATTENTE">En attente</option>        
                            </select>        
                          </div>        
                        </>        
                      )}        
                    </div>              
                    <div className="form-actions">              
                      <button               
                        type="button"              
                        onClick={() => setIsAddDialogOpen(false)}              
                        className="cancel-button"              
                      >              
                        Annuler       
                      </button>                
                      <button                 
                        type="submit"                
                        className="submit-button"                
                        disabled={isLoading}                
                      >                
                        {isLoading ? "Ajout..." : "Ajouter"}                
                      </button>                
                    </div>                
                  </form>                
                </div>                
              </div>                
            )}                
                
            {/* Modal de modification - SANS champ adresse */}                
            {isEditDialogOpen && (                
              <div className="modal-overlay" onClick={() => setIsEditDialogOpen(false)}>                
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>                
                  <div className="modal-header">                
                    <h3 className="modal-title">Modifier le Client</h3>                
                    <button                 
                      className="modal-close"                
                      onClick={() => setIsEditDialogOpen(false)}                
                    >                
                      <X className="close-icon" />                
                    </button>                
                  </div>                
                  <form onSubmit={handleEditSubmit} className="modal-form">                
                    <div className="form-grid">                
                      {/* Email et Type */}        
                      <div className="form-group">          
                        <label className="form-label">Email *</label>          
                        <input          
                          type="email"          
                          value={formData.email}          
                          onChange={(e) => handleInputChange("email", e.target.value)}          
                          className="form-input"          
                          required          
                        />          
                      </div>          
          
                      <div className="form-group">          
                        <label className="form-label">Type *</label>          
                        <select          
                          value={formData.type}          
                          onChange={(e) => handleInputChange("type", e.target.value)}          
                          className="form-select"          
                          required          
                        >          
                          <option value="">Sélectionner un type</option>          
                          <option value="Particulier">Particulier</option>          
                          <option value="Entreprise">Entreprise</option>          
                        </select>          
                      </div>          
          
                      {/* Champs spécifiques aux particuliers */}          
                      {formData.type === "Particulier" && (          
                        <>          
                          <div className="form-group">          
                            <label className="form-label">Nom *</label>          
                            <input          
                              type="text"          
                              value={formData.nom}          
                              onChange={(e) => handleInputChange("nom", e.target.value)}          
                              className="form-input"          
                              required          
                            />          
                          </div>          
                                
                          <div className="form-group">          
                            <label className="form-label">Prénom *</label>          
                            <input          
                              type="text"          
                              value={formData.prenom}          
                              onChange={(e) => handleInputChange("prenom", e.target.value)}          
                              className="form-input"          
                              required          
                            />          
                          </div>          
                                
                          <div className="form-group">          
                            <label className="form-label">Téléphone *</label>          
                            <input          
                              type="tel"          
                              value={formData.telephone}          
                              onChange={(e) => handleInputChange("telephone", e.target.value)}          
                              className="form-input"          
                              required          
                            />          
                          </div>          
                              
                          <div className="form-group">          
                            <label className="form-label">Civilité *</label>          
                            <select          
                              value={formData.civilite}          
                              onChange={(e) => handleInputChange("civilite", e.target.value)}          
                              className="form-select"          
                              required          
                            >          
                              <option value="M">M.</option>          
                              <option value="Mme">Mme</option>          
                              <option value="Mlle">Mlle</option>          
                            </select>          
                          </div>          
                                
                          <div className="form-group">          
                            <label className="form-label">Statut *</label>          
                            <select          
                              value={formData.statut}          
                              onChange={(e) => handleInputChange("statut", e.target.value)}          
                              className="form-select"          
                              required          
                            >          
                              <option value="ACTIF">Actif</option>          
                              <option value="INACTIF">Inactif</option>          
                              <option value="SUSPENDU">Suspendu</option>          
                              <option value="EN_ATTENTE">En attente</option>          
                            </select>          
                          </div>          
                        </>          
                      )}          
        
                      {/* Champs spécifiques aux entreprises */}          
                      {formData.type === "Entreprise" && (          
                        <>          
                          <div className="form-group">          
                            <label className="form-label">Raison sociale *</label>          
                            <input          
                              type="text"          
                              value={formData.raison_sociale}          
                              onChange={(e) => handleInputChange("raison_sociale", e.target.value)}          
                              className="form-input"          
                              required          
                            />          
                          </div>          
        
                          <div className="form-group">          
                            <label className="form-label">Téléphone *</label>          
                            <input          
                              type="tel"          
                              value={formData.telephone}          
                              onChange={(e) => handleInputChange("telephone", e.target.value)}          
                              className="form-input"          
                              required          
                            />          
                          </div>          
        
                          <div className="form-group">          
                            <label className="form-label">ICE</label>          
                            <input          
                              type="text"          
                              value={formData.ice}          
                              onChange={(e) => handleInputChange("ice", e.target.value)}          
                              className="form-input"          
                            />          
                          </div>          
                                  
                          <div className="form-group">          
                            <label className="form-label">Patente</label>          
                            <input          
                              type="text"          
                              value={formData.patente}          
                              onChange={(e) => handleInputChange("patente", e.target.value)}          
                              className="form-input"          
                            />          
                          </div>          
                                  
                          <div className="form-group">          
                            <label className="form-label">RC</label>          
                            <input          
                              type="text"          
                              value={formData.rc}          
                              onChange={(e) => handleInputChange("rc", e.target.value)}          
                              className="form-input"          
                            />          
                          </div>          
                                  
                          <div className="form-group">          
                            <label className="form-label">Ville RC</label>          
                            <input          
                              type="text"          
                              value={formData.ville_rc}          
                              onChange={(e) => handleInputChange("ville_rc", e.target.value)}          
                              className="form-input"          
                            />          
                          </div>          
        
                          <div className="form-group">          
                            <label className="form-label">Statut *</label>          
                            <select          
                              value={formData.statut}          
                              onChange={(e) => handleInputChange("statut", e.target.value)}          
                              className="form-select"          
                              required          
                            >          
                              <option value="ACTIF">Actif</option>          
                              <option value="INACTIF">Inactif</option>          
                              <option value="SUSPENDU">Suspendu</option>          
                              <option value="EN_ATTENTE">En attente</option>          
                            </select>          
                          </div>        
                        </>          
                      )}          
                    </div>                
                    <div className="form-actions">                
                      <button                 
                        type="button"                
                        onClick={() => setIsEditDialogOpen(false)}                
                        className="cancel-button"                
                      >
                        Annuler                
                      </button>                
                      <button                 
                        type="submit"                
                        className="submit-button"                
                        disabled={isLoading}                
                      >                
                        {isLoading ? "Modification..." : "Modifier"}                
                      </button>                
                    </div>                
                  </form>                
                </div>                
              </div>                
            )}  
  
            {/* Nouveau Modal de détails du client avec adresses */}    
            {isDetailDialogOpen && (    
              <div className="modal-overlay" onClick={() => setIsDetailDialogOpen(false)}>    
                <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>    
                  <div className="modal-header">    
                    <h3 className="modal-title">Détails du Client</h3>    
                    <button     
                      className="modal-close"    
                      onClick={() => setIsDetailDialogOpen(false)}    
                    >    
                      <X className="close-icon" />    
                    </button>    
                  </div>    
                      
                  <div className="detail-content">    
                    {viewingClient && (    
                      <>    
                        {/* Informations générales */}    
                        <div className="detail-section">    
                          <h4 className="section-title">Informations Générales</h4>    
                          <div className="detail-grid">    
                            <div className="detail-item">    
                              <span className="detail-label">Nom :</span>    
                              <span className="detail-value">{viewingClient.nom}</span>    
                            </div>    
                            <div className="detail-item">    
                              <span className="detail-label">Type :</span>    
                              <span className="detail-value">{viewingClient.type}</span>    
                            </div>    
                            <div className="detail-item">    
                              <span className="detail-label">Email :</span>    
                              <span className="detail-value">{viewingClient.email}</span>    
                            </div>    
                            <div className="detail-item">    
                              <span className="detail-label">Téléphone :</span>    
                              <span className="detail-value">{viewingClient.telephone}</span>    
                            </div>    
                            <div className="detail-item">    
                              <span className="detail-label">Statut :</span>    
                              <span className="detail-value">{getStatutBadge(viewingClient.statut)}</span>    
                            </div>    
                                
                            {/* Champs spécifiques selon le type */}    
                            {viewingClient.type === "Particulier" && viewingClient.civilite && (    
                              <div className="detail-item">    
                                <span className="detail-label">Civilité :</span>    
                                <span className="detail-value">{viewingClient.civilite}</span>    
                              </div>    
                            )}    
                                
                            {viewingClient.type === "Entreprise" && (    
                              <>    
                                {viewingClient.ice && (    
                                  <div className="detail-item">    
                                    <span className="detail-label">ICE :</span>    
                                    <span className="detail-value">{viewingClient.ice}</span>    
                                  </div>    
                                )}    
                                {viewingClient.rc && (    
                                  <div className="detail-item">    
                                    <span className="detail-label">RC :</span>    
                                    <span className="detail-value">{viewingClient.rc}</span>    
                                  </div>    
                                )}    
                                {viewingClient.patente && (    
                                  <div className="detail-item">    
                                    <span className="detail-label">Patente :</span>    
                                    <span className="detail-value">{viewingClient.patente}</span>    
                                  </div>    
                                )}    
                                {viewingClient.ville_rc && (    
                                  <div className="detail-item">    
                                    <span className="detail-label">Ville RC :</span>    
                                    <span className="detail-value">{viewingClient.ville_rc}</span>    
                                  </div>    
                                )}    
                              </>    
                            )}    
                          </div>    
                        </div>    
              
                        {/* Section Adresses */}    
                        <div className="detail-section">    
                          <h4 className="section-title">Adresses du Client</h4>    
                          {loadingAddresses ? (    
                            <div className="loading-addresses">    
                              <p>Chargement des adresses...</p>    
                            </div>    
                          ) : clientAddresses.length > 0 ? (    
                            <div className="addresses-list">    
                              {clientAddresses.map((address, index) => (    
                                <div key={index} className="address-card">    
                                  <div className="address-header">    
                                    <span className="address-type">{address.type_adresse}</span>    
                                    {address.is_principal && (    
                                      <span className="principal-badge">Principale</span>    
                                    )}    
                                  </div>    
                                  <div className="address-details">    
                                    <p className="address-street">    
                                      {address.street}    
                                      {address.numimmeuble && `, Imm. ${address.numimmeuble}`}    
                                      {address.numappt && `, Apt. ${address.numappt}`}    
                                    </p>    
                                    {address.quartier && (    
                                      <p className="address-quartier">Quartier: {address.quartier}</p>    
                                    )}    
                                    <p className="address-city">    
                                      <strong>Ville:</strong> {address.city?.name || address.city?.nom || 'Ville non spécifiée'}    
                                    </p>   
                                    {(address.latitude && address.longitude) && (    
                                      <p className="address-coordinates">    
                                        GPS: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}    
                                      </p>    
                                    )}    
                                  </div>    
                                </div>    
                              ))}    
                            </div>    
                          ) : (    
                            <div className="no-addresses">    
                              <p>Aucune adresse enregistrée pour ce client.</p>    
                            </div>    
                          )}    
                        </div>    
              
                        {/* ✅ NOUVELLE SECTION: Clients de l'entreprise - seulement pour les entreprises */}  
                        {viewingClient && viewingClient.type === 'Entreprise' && (  
                          <div className="detail-section">  
                            <h4 className="section-title">Clients Particuliers de l'Entreprise</h4>  
                            {loadingCompanyClients ? (  
                              <div className="loading-company-clients">  
                                <p>Chargement des clients de l'entreprise...</p>  
                              </div>  
                            ) : companyClients.length > 0 ? (  
                              <div className="company-clients-list">  
                                {companyClients.map((client, index) => (  
                                  <div key={index} className="company-client-card">  
                                    <div className="client-info">  
                                      <p className="client-name">  
                                        <strong>{client.prenom} {client.nom_famille}</strong>  
                                      </p>  
                                      <p className="client-email">Email: {client.email}</p>  
                                    </div>  
                                  </div>  
                                ))}  
                              </div>  
                            ) : (  
                              <div className="no-company-clients">  
                                <p>Aucun client particulier créé par cette entreprise.</p>  
                              </div>  
                            )}  
                          </div>  
                        )}
                      </>    
                    )}    
                  </div>    
                </div>    
              </div>    
            )}
          </div>                
        </div>                
      </div>                
    </div>                
  )                
}