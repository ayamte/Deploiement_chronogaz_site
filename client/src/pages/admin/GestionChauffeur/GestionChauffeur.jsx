import { useState, useEffect } from "react"      
import {       
  MdSearch as Search,       
  MdAdd as Plus,          
  MdEdit as Edit,      
  MdDelete as Delete,      
  MdClose as X      
} from "react-icons/md"      
import "./GestionChauffeur.css"      
import { employeeService } from '../../../services/employeeService'    
import depotService from '../../../services/depotService' // Import ajouté
import SidebarNavigation from '../../../components/admin/Sidebar/Sidebar';
    
export default function GestionChauffeur() {      
  const [searchTerm, setSearchTerm] = useState("")      
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)      
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)      
  const [chauffeurs, setChauffeurs] = useState([])      
  const [editingChauffeur, setEditingChauffeur] = useState(null)      
  const [loading, setLoading] = useState(true)    
  const [error, setError] = useState("")    
  const [isLoading, setIsLoading] = useState(false)    
    
  const [formData, setFormData] = useState({        
    nom: "",        
    type: "",        
    telephone: "",        
    email: "",        
    cin: "",  
    cnss: "",  
    matricule: "",  
    civilite: "M",
    statut: "ACTIF",
    depot_id: "" // Champ ajouté pour l'affectation
  })

  const [depots, setDepots] = useState([])
    
  // Charger les employés depuis l'API avec la structure corrigée
  useEffect(() => {    
    const fetchEmployees = async () => {    
      try {    
        setLoading(true);    
        const response = await employeeService.getAll();    
        
        console.log('Response from API:', response);
            
        if (response.success) {    
          // CORRIGÉ: Utiliser la structure réelle de l'API (user_info au lieu de physical_user_id)
          const transformedEmployees = response.data.map(employee => ({  
              id: employee.id,       
              nom: employee.user_info ?         
                `${employee.user_info.first_name} ${employee.user_info.last_name}` : 'N/A',        
              type: employee.fonction === 'CHAUFFEUR' ? 'Chauffeur' :       
                    employee.fonction === 'ACCOMPAGNANT' ? 'Accompagnant' :       
                    employee.fonction === 'MAGASINIER' ? 'Magasinier' : 'N/A',        
              telephone: employee.user_info?.telephone_principal || 'N/A',        
              email: employee.user_info?.email || 'N/A',        
              cin: employee.cin || 'N/A',    
              cnss: employee.cnss || 'N/A',    
              matricule: employee.matricule || 'N/A',  
              civilite: employee.user_info?.civilite || 'M',  
              statut: employee.statut || 'ACTIF',  
              depot_id: employee.depot_id || '',  
              depot_name: employee.depot_info?.short_name || 'Non affecté' // Si le backend populate le dépôt  
            }));
          
          console.log('Transformed employees:', transformedEmployees);
          setChauffeurs(transformedEmployees);    
        } else {    
          setError("Erreur lors du chargement des employés");    
        }    
      } catch (err) {    
        setError("Erreur de connexion à l'API");    
        console.error('Erreur:', err);    
      } finally {    
        setLoading(false);    
      }    
    };    

    const fetchDepots = async () => {  
      try {  
        const response = await depotService.getAllDepots()  
        setDepots(response.data || [])  
      } catch (error) {  
        console.error('Erreur chargement dépôts:', error)  
      }  
    }  
    
    fetchEmployees()
    fetchDepots()      
  }, []);    
    
  // Filtrer les chauffeurs selon le terme de recherche      
  const filteredChauffeurs = chauffeurs.filter(      
    (chauffeur) =>      
      chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||      
      chauffeur.type.toLowerCase().includes(searchTerm.toLowerCase()) ||      
      chauffeur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      chauffeur.cin.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      chauffeur.matricule.toLowerCase().includes(searchTerm.toLowerCase()),      
  )      
  
  // Calculer les statistiques
  const totalChauffeurs = chauffeurs.length      
  const chauffeursPrincipaux = chauffeurs.filter((c) => c.type === "Chauffeur").length      
  const accompagnants = chauffeurs.filter((c) => c.type === "Accompagnant").length      
  const magasiniers = chauffeurs.filter((c) => c.type === "Magasinier").length  
      
  const handleInputChange = (field, value) => {      
    setFormData((prev) => ({      
      ...prev,      
      [field]: value,      
    }))      
  }      
    
  const handleAddSubmit = async (e) => {        
    e.preventDefault()        
    setIsLoading(true)      
    setError("")      
    
    try {      
      // Logique de division du nom
      const nameParts = formData.nom.trim().split(' ');  
      const firstName = nameParts[0];  
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];  
    
      const employeeData = {        
        fonction: formData.type === 'Chauffeur' ? 'CHAUFFEUR' :       
                formData.type === 'Accompagnant' ? 'ACCOMPAGNANT' :       
                formData.type === 'Magasinier' ? 'MAGASINIER' : 'CHAUFFEUR',        
        profile: {        
          first_name: firstName,        
          last_name: lastName,        
          civilite: formData.civilite,  
          telephone_principal: formData.telephone,        
          email: formData.email,    
          cin: formData.cin,  
          cnss: formData.cnss  
        },        
        statut: formData.statut,  
        date_embauche: new Date(),  
        depot_id: formData.type === 'Magasinier' ? formData.depot_id : null // Seulement pour magasiniers  
      };     
    
      const response = await employeeService.create(employeeData);      
            
      if (response.success) {      
        // Recharger la liste des employés      
        const updatedResponse = await employeeService.getAll();      
        if (updatedResponse.success) {      
          // CORRIGÉ: Utiliser la même transformation que dans useEffect
          const transformedEmployees = updatedResponse.data.map(employee => ({      
            id: employee.id,      
            nom: employee.user_info ?       
              `${employee.user_info.first_name} ${employee.user_info.last_name}` : 'N/A',      
            type: employee.fonction === 'CHAUFFEUR' ? 'Chauffeur' :     
                  employee.fonction === 'ACCOMPAGNANT' ? 'Accompagnant' :     
                  employee.fonction === 'MAGASINIER' ? 'Magasinier' : 'N/A',      
            telephone: employee.user_info?.telephone_principal || 'N/A',      
            email: employee.user_info?.email || 'N/A',      
            cin: employee.cin || 'N/A',    
            cnss: employee.cnss || 'N/A',    
            matricule: employee.matricule || 'N/A',
            civilite: employee.user_info?.civilite || 'M',
            statut: employee.statut || 'ACTIF',
            depot_id: employee.depot_id || '',
            depot_name: employee.depot_info?.short_name || 'Non affecté'
          }));      
          setChauffeurs(transformedEmployees);      
        }      
            
        setIsAddDialogOpen(false);      
        setFormData({      
          nom: "",      
          type: "",      
          telephone: "",      
          email: "",      
          cin: "",    
          cnss: "",    
          matricule: "",
          civilite: "M",
          statut: "ACTIF",
          depot_id: "" // Réinitialiser depot_id
        });      
      } else {      
        setError(response.message || "Erreur lors de l'ajout de l'employé");      
      }      
    } catch (err) {      
      setError("Erreur lors de l'ajout de l'employé");      
      console.error('Erreur:', err);      
    } finally {      
      setIsLoading(false);      
    }      
  }   
    
  const handleAddClick = () => {      
    setFormData({      
      nom: "",      
      type: "",      
      telephone: "",      
      email: "",      
      cin: "",  
      cnss: "",  
      matricule: "",
      civilite: "M",
      statut: "ACTIF",
      depot_id: "" // Réinitialiser depot_id
    })      
    setIsAddDialogOpen(true)      
  }      
    
  const handleEditSubmit = async (e) => {        
    e.preventDefault()        
    setIsLoading(true)      
    setError("")      
    
    try {      
      // Logique de division du nom
      const nameParts = formData.nom.trim().split(' ');  
      const firstName = nameParts[0];  
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];  
    
      const employeeData = {      
        fonction: formData.type === 'Chauffeur' ? 'CHAUFFEUR' :     
                formData.type === 'Accompagnant' ? 'ACCOMPAGNANT' :     
                formData.type === 'Magasinier' ? 'MAGASINIER' : 'CHAUFFEUR',      
        profile: {      
          first_name: firstName,      
          last_name: lastName,      
          civilite: formData.civilite,
          telephone_principal: formData.telephone,      
          email: formData.email,  
          cin: formData.cin,
          cnss: formData.cnss
        },
        statut: formData.statut,
        depot_id: formData.type === 'Magasinier' ? formData.depot_id : null // Inclure depot_id pour modification
      };      
    
      const response = await employeeService.update(editingChauffeur.id, employeeData);      
            
      if (response.success) {      
        // Recharger la liste des employés      
        const updatedResponse = await employeeService.getAll();      
        if (updatedResponse.success) {      
          // CORRIGÉ: Utiliser la même transformation
          const transformedEmployees = updatedResponse.data.map(employee => ({      
            id: employee.id,      
            nom: employee.user_info ?       
              `${employee.user_info.first_name} ${employee.user_info.last_name}` : 'N/A',      
            type: employee.fonction === 'CHAUFFEUR' ? 'Chauffeur' :     
                  employee.fonction === 'ACCOMPAGNANT' ? 'Accompagnant' :     
                  employee.fonction === 'MAGASINIER' ? 'Magasinier' : 'N/A',      
            telephone: employee.user_info?.telephone_principal || 'N/A',      
            email: employee.user_info?.email || 'N/A',      
            cin: employee.cin || 'N/A',    
            cnss: employee.cnss || 'N/A',    
            matricule: employee.matricule || 'N/A',
            civilite: employee.user_info?.civilite || 'M',
            statut: employee.statut || 'ACTIF',
            depot_id: employee.depot_id || '',
            depot_name: employee.depot_info?.short_name || 'Non affecté'
          }));      
          setChauffeurs(transformedEmployees);      
        }      
            
        setIsEditDialogOpen(false);      
        setEditingChauffeur(null);      
        setFormData({      
          nom: "",      
          type: "",      
          telephone: "",      
          email: "",      
          cin: "",    
          cnss: "",    
          matricule: "",
          civilite: "M",
          statut: "ACTIF",
          depot_id: "" // Réinitialiser depot_id
        });      
      } else {      
        setError(response.message || "Erreur lors de la modification de l'employé");      
      }      
    } catch (err) {      
      setError("Erreur lors de la modification de l'employé");      
      console.error('Erreur:', err);      
    } finally {      
      setIsLoading(false);      
    }      
  }     
    
  const handleEdit = (chauffeur) => {      
    setEditingChauffeur(chauffeur)      
    setFormData({      
      nom: chauffeur.nom,      
      type: chauffeur.type,      
      telephone: chauffeur.telephone,      
      email: chauffeur.email,      
      cin: chauffeur.cin,  
      cnss: chauffeur.cnss,  
      matricule: chauffeur.matricule,
      civilite: chauffeur.civilite || "M",
      statut: chauffeur.statut || "ACTIF",
      depot_id: chauffeur.depot_id || "" // Inclure depot_id pour modification
    })      
    setIsEditDialogOpen(true)      
  }      
    
  const handleDelete = async (chauffeurId) => {      
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {      
      try {    
        setError("");    
        const response = await employeeService.delete(chauffeurId);    
            
        if (response.success) {    
          setChauffeurs(chauffeurs.filter(chauffeur => chauffeur.id !== chauffeurId));    
        } else {    
          setError(response.message || "Erreur lors de la suppression de l'employé");    
        }    
      } catch (err) {    
        setError("Erreur lors de la suppression de l'employé");    
        console.error('Erreur:', err);    
      }    
    }      
  }      
    
  const getTypeBadge = (type) => {      
    switch (type) {      
      case "Chauffeur":      
        return <span className="badge badge-chauffeur">Chauffeur</span>      
      case "Accompagnant":      
        return <span className="badge badge-accompagnant">Accompagnant</span>      
      case "Magasinier":      
        return <span className="badge badge-magasinier">Magasinier</span>      
      default:      
        return <span className="badge badge-default">{type}</span>      
    }      
  }      
    
  if (loading) {    
    return (    
      <div className="chauffeur-management-layout">
        <SidebarNavigation/>    
        <div className="chauffeur-management-wrapper">    
          <div style={{ padding: '20px', textAlign: 'center' }}>    
            Chargement des employés...    
          </div>    
        </div>    
      </div>    
    );    
  }    
      
  return (      
    <div className="chauffeur-management-layout">
      <SidebarNavigation/>  
      <div className="chauffeur-management-wrapper">      
        <div className="chauffeur-management-container">      
          <div className="chauffeur-management-content">      
            {/* En-tête */}
            <div className="page-header">      
              <h1 className="page-title">Gestion des Employés</h1>        
              <p className="page-subtitle">Gérez votre équipe de chauffeurs, accompagnants et magasiniers</p>        
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
        
            {/* 4 Cards avec magasiniers */}        
            <div className="stats-grid">        
              <div className="stat-card gradient-card">        
                <div className="stat-card-header">        
                  <div className="stat-content">        
                    <h3 className="stat-label">Total Personnel</h3>        
                    <div className="stat-value">{totalChauffeurs}</div>        
                    <p className="stat-description">Membres de l'équipe</p>        
                  </div>        
                </div>        
              </div>        
                    
              <div className="stat-card gradient-card">        
                <div className="stat-card-header">        
                  <div className="stat-content">        
                    <h3 className="stat-label">Chauffeurs</h3>        
                    <div className="stat-value">{chauffeursPrincipaux}</div>        
                    <p className="stat-description">Chauffeurs principaux</p>        
                  </div>        
                </div>        
              </div>        
                    
              <div className="stat-card gradient-card">        
                <div className="stat-card-header">        
                  <div className="stat-content">        
                    <h3 className="stat-label">Accompagnants</h3>        
                    <div className="stat-value">{accompagnants}</div>        
                    <p className="stat-description">Accompagnants</p>        
                  </div>        
                </div>        
              </div>        
                    
              <div className="stat-card gradient-card">        
                <div className="stat-card-header">        
                  <div className="stat-content">        
                    <h3 className="stat-label">Magasiniers</h3>        
                    <div className="stat-value">{magasiniers}</div>        
                    <p className="stat-description">Employés magasin</p>        
                  </div>        
                </div>        
              </div>        
            </div>       
        
            {/* Bouton Ajouter Employé */}        
            <div className="action-section">        
              <button className="add-button" onClick={handleAddClick}>        
                <Plus className="button-icon" />        
                Ajouter Employé        
              </button>       
            </div>        
        
            {/* Barre de recherche */}        
            <div className="search-section">        
              <div className="search-container">        
                <Search className="search-icon" />        
                <input        
                  type="text"        
                  placeholder="Rechercher par nom, type, email, CIN ou matricule..."        
                  value={searchTerm}        
                  onChange={(e) => setSearchTerm(e.target.value)}        
                  className="search-input"        
                />        
              </div>        
            </div>        
        
            {/* Tableau */}        
            <div className="table-card">        
              <div className="table-header">        
                <h3 className="table-title">Liste du Personnel</h3>        
              </div>        
              <div className="table-content">        
                <div className="table-container">        
                  <table className="chauffeurs-table">        
                    <thead>          
                      <tr>          
                        <th>Nom</th>          
                        <th>Type</th>          
                        <th>Téléphone</th>          
                        <th>Email</th>          
                        <th>CIN</th>          
                        <th>CNSS</th>          
                        <th>Matricule</th>  
                        <th>Actions</th>          
                      </tr>          
                    </thead>       
                    <tbody>        
                      {filteredChauffeurs.map((chauffeur, index) => (        
                        <tr key={chauffeur.id || `employee-${index}`}>        
                          <td className="font-medium">{chauffeur.nom}</td>        
                          <td>{getTypeBadge(chauffeur.type)}</td>        
                          <td>{chauffeur.telephone}</td>        
                          <td>{chauffeur.email}</td>        
                          <td>{chauffeur.cin}</td>        
                          <td>{chauffeur.cnss}</td>
                          <td className="font-mono">{chauffeur.matricule}</td>
                          <td>        
                            <div className="action-buttons">        
                              <button         
                                className="edit-action-button"        
                                onClick={() => handleEdit(chauffeur)}        
                              >        
                                <Edit className="action-icon" />        
                              </button>        
                              <button         
                                className="delete-action-button"        
                                onClick={() => handleDelete(chauffeur.id)}        
                              >        
                                <Delete className="action-icon" />        
                              </button>        
                            </div>        
                          </td>        
                        </tr>        
                      ))}        
                    </tbody>        
                  </table>        
                  {filteredChauffeurs.length === 0 && (        
                    <div className="no-results">        
                      Aucun employé trouvé pour votre recherche.        
                    </div>        
                  )}        
                </div>        
              </div>        
            </div>        
        
            {/* Modal d'ajout */}        
            {isAddDialogOpen && (        
              <div className="modal-overlay" onClick={() => setIsAddDialogOpen(false)}>        
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>        
                  <div className="modal-header">        
                    <h3 className="modal-title">Ajouter un Employé</h3>        
                    <button         
                      className="modal-close"        
                      onClick={() => setIsAddDialogOpen(false)}        
                    >        
                      <X className="close-icon" />        
                    </button>        
                  </div>        
                  <form onSubmit={handleAddSubmit} className="modal-form">        
                    <div className="form-grid">        
                      <div className="form-group">        
                        <label htmlFor="add-nom" className="form-label">Nom complet *</label>        
                        <input        
                          id="add-nom"        
                          type="text"        
                          placeholder="Ex: Ahmed Alami"        
                          value={formData.nom}        
                          onChange={(e) => handleInputChange("nom", e.target.value)}        
                          className="form-input"        
                          required        
                        />        
                      </div>        
        
                      <div className="form-group">        
                        <label htmlFor="add-type" className="form-label">Type *</label>        
                        <select        
                          id="add-type"        
                          value={formData.type}        
                          onChange={(e) => handleInputChange("type", e.target.value)}        
                          className="form-select"        
                          required        
                        >        
                          <option value="">Sélectionner un type</option>        
                          <option value="Chauffeur">Chauffeur</option>        
                          <option value="Accompagnant">Accompagnant</option>        
                          <option value="Magasinier">Magasinier</option>        
                        </select>        
                      </div>        
        
                      <div className="form-group">        
                        <label htmlFor="add-telephone" className="form-label">Téléphone *</label>        
                        <input        
                          id="add-telephone"        
                          type="tel"        
                          placeholder="Ex: 0612345678"        
                          value={formData.telephone}        
                          onChange={(e) => handleInputChange("telephone", e.target.value)}        
                          className="form-input"        
                          required        
                        />        
                      </div>        
        
                      <div className="form-group">        
                        <label htmlFor="add-email" className="form-label">Email *</label>        
                        <input        
                          id="add-email"        
                          type="email"        
                          placeholder="Ex: ahmed.alami@chronogaz.ma"        
                          value={formData.email}        
                          onChange={(e) => handleInputChange("email", e.target.value)}        
                          className="form-input"        
                          required        
                        />        
                      </div>        
        
                      <div className="form-group">        
                        <label htmlFor="add-cin" className="form-label">CIN *</label>        
                        <input        
                          id="add-cin"        
                          type="text"        
                          placeholder="Ex: AB123456"        
                          value={formData.cin}        
                          onChange={(e) => handleInputChange("cin", e.target.value)}        
                          className="form-input"        
                          required        
                        />        
                      </div>        
        
                      <div className="form-group">        
                        <label htmlFor="add-cnss" className="form-label">CNSS *</label>        
                        <input        
                          id="add-cnss"        
                          type="text"        
                          placeholder="Ex: 123456789"        
                          value={formData.cnss}        
                          onChange={(e) => handleInputChange("cnss", e.target.value)}        
                          className="form-input"        
                          required        
                        />        
                      </div>    
  
                      <div className="form-group">          
                        <label htmlFor="add-civilite" className="form-label">Civilité *</label>          
                        <select          
                          id="add-civilite"          
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
                        <label htmlFor="add-statut" className="form-label">Statut *</label>          
                        <select          
                          id="add-statut"          
                          value={formData.statut}          
                          onChange={(e) => handleInputChange("statut", e.target.value)}          
                          className="form-select"          
                          required          
                        >          
                          <option value="ACTIF">Actif</option>          
                          <option value="INACTIF">Inactif</option>          
                          <option value="SUSPENDU">Suspendu</option>          
                          <option value="EN_CONGE">En congé</option>          
                        </select>          
                      </div>

                      {/* Affectation dépôt - seulement pour les magasiniers */}
                      {formData.type === "Magasinier" && (
                        <div className="form-group">
                          <label htmlFor="depot-select" className="form-label">Dépôt d'affectation</label>
                          <select
                            id="depot-select"
                            value={formData.depot_id}
                            onChange={(e) => handleInputChange("depot_id", e.target.value)}
                            className="form-select"
                          >
                            <option value="">Sélectionner un dépôt</option>
                            {depots.map((depot) => (
                              <option key={depot._id} value={depot._id}>
                                {depot.short_name} - {depot.reference}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>        
        
                    <div className="form-actions">        
                      <button         
                        type="button"         
                        className="cancel-button"         
                        onClick={() => setIsAddDialogOpen(false)}        
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
        
            {/* Modal de modification */}        
            {isEditDialogOpen && (        
              <div className="modal-overlay" onClick={() => setIsEditDialogOpen(false)}>        
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>        
                  <div className="modal-header">        
                    <h3 className="modal-title">Modifier l'Employé</h3>          
                    <button           
                      className="modal-close"          
                      onClick={() => setIsEditDialogOpen(false)}          
                    >          
                      <X className="close-icon" />          
                    </button>          
                  </div>          
                  <form onSubmit={handleEditSubmit} className="modal-form">          
                    <div className="form-grid">          
                      <div className="form-group">          
                        <label htmlFor="edit-nom" className="form-label">Nom complet *</label>          
                        <input          
                          id="edit-nom"          
                          type="text"          
                          placeholder="Ex: Ahmed Alami"          
                          value={formData.nom}          
                          onChange={(e) => handleInputChange("nom", e.target.value)}          
                          className="form-input"          
                          required          
                        />          
                      </div>          
          
                      <div className="form-group">          
                        <label htmlFor="edit-type" className="form-label">Type *</label>          
                        <select          
                          id="edit-type"          
                          value={formData.type}          
                          onChange={(e) => handleInputChange("type", e.target.value)}          
                          className="form-select"          
                          required          
                        >          
                          <option value="">Sélectionner un type</option>          
                          <option value="Chauffeur">Chauffeur</option>          
                          <option value="Accompagnant">Accompagnant</option>          
                          <option value="Magasinier">Magasinier</option>          
                        </select>          
                      </div>          
          
                      <div className="form-group">          
                        <label htmlFor="edit-telephone" className="form-label">Téléphone *</label>          
                        <input          
                          id="edit-telephone"          
                          type="tel"          
                          placeholder="Ex: 0612345678"          
                          value={formData.telephone}          
                          onChange={(e) => handleInputChange("telephone", e.target.value)}          
                          className="form-input"          
                          required          
                        />          
                      </div>          
          
                      <div className="form-group">          
                        <label htmlFor="edit-email" className="form-label">Email *</label>          
                        <input          
                          id="edit-email"          
                          type="email"          
                          placeholder="Ex: ahmed.alami@chronogaz.ma"          
                          value={formData.email}          
                          onChange={(e) => handleInputChange("email", e.target.value)}          
                          className="form-input"          
                          required          
                        />          
                      </div>          
          
                      <div className="form-group">          
                        <label htmlFor="edit-cin" className="form-label">CIN *</label>          
                        <input          
                          id="edit-cin"          
                          type="text"          
                          placeholder="Ex: AB123456"          
                          value={formData.cin}          
                          onChange={(e) => handleInputChange("cin", e.target.value)}          
                          className="form-input"          
                          required          
                        />          
                      </div>          
          
                      <div className="form-group">          
                        <label htmlFor="edit-cnss" className="form-label">CNSS *</label>          
                        <input          
                          id="edit-cnss"          
                          type="text"          
                          placeholder="Ex: 123456789"          
                          value={formData.cnss}          
                          onChange={(e) => handleInputChange("cnss", e.target.value)}          
                          className="form-input"          
                          required          
                        />          
                      </div>          
    
                      <div className="form-group">          
                        <label htmlFor="edit-civilite" className="form-label">Civilité *</label>          
                        <select          
                          id="edit-civilite"          
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
                        <label htmlFor="edit-statut" className="form-label">Statut *</label>          
                        <select          
                          id="edit-statut"          
                          value={formData.statut}          
                          onChange={(e) => handleInputChange("statut", e.target.value)}          
                          className="form-select"          
                          required          
                        >          
                          <option value="ACTIF">Actif</option>          
                          <option value="INACTIF">Inactif</option>          
                          <option value="SUSPENDU">Suspendu</option>          
                          <option value="EN_CONGE">En congé</option>          
                        </select>          
                      </div>  
  
                      {/* Affectation dépôt - seulement pour les magasiniers */}  
                      {formData.type === "Magasinier" && (  
                        <div className="form-group">  
                          <label htmlFor="edit-depot-select" className="form-label">Dépôt d'affectation</label>  
                          <select  
                            id="edit-depot-select"  
                            value={formData.depot_id}  
                            onChange={(e) => handleInputChange("depot_id", e.target.value)}  
                            className="form-select"  
                          >  
                            <option value="">Sélectionner un dépôt</option>  
                            {depots.map((depot) => (  
                              <option key={depot._id} value={depot._id}>  
                                {depot.short_name} - {depot.reference}  
                              </option>  
                            ))}  
                          </select>  
                        </div>  
                      )}  
                    </div>          
          
                    <div className="form-actions">          
                      <button           
                        type="button"           
                        className="cancel-button"           
                        onClick={() => setIsEditDialogOpen(false)}          
                      >          
                        Annuler          
                      </button>          
                      <button           
                        type="submit"           
                        className="submit-button"           
                        disabled={isLoading}          
                      >          
                        {isLoading ? "Modification..." : "Sauvegarder"}          
                      </button>          
                    </div>          
                  </form>          
                </div>          
              </div>          
            )}          
          </div>          
        </div>          
      </div>          
    </div>          
  )          
}