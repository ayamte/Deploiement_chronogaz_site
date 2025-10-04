import { useState, useEffect } from "react"
import {   
  MdSearch as Search,   
  MdDelete as Delete,
  MdClose as X,
  MdAttachFile as AttachFile,
  MdVisibility as Eye
} from "react-icons/md"
import blFrsService from "../../../services/blFrsService"
import "./gestionBon.css"

export default function SupplierVoucherManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierVouchers, setSupplierVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)

  // Charger les données réelles au montage du composant
  useEffect(() => {
    console.log("🚀 Composant monté - Chargement des données BLFRS")
    loadBLFRS()
  }, [])

  const loadBLFRS = async () => {
    try {
      console.log("📡 Début du chargement des BLFRS...")
      setLoading(true)
      setError(null)
      
      console.log("🔄 Appel de blFrsService.getAllBLFRS()")
      const response = await blFrsService.getAllBLFRS()
      
      console.log("📥 Réponse reçue:", response)
      console.log("✅ Success:", response?.success)
      console.log("📊 Data:", response?.data)
      console.log("📈 Nombre de bons:", response?.data?.length)
      
      if (response.success) {
        console.log("✅ Données chargées avec succès")
        setSupplierVouchers(response.data)
        
        // Log détaillé des données reçues
        response.data.forEach((voucher, index) => {
          console.log(`📋 Bon ${index + 1}:`, {
            id: voucher._id,
            reference: voucher.bl_reference,
            date: voucher.bl_date,
            fournisseur: voucher.fournisseur_id?.nom,
            depot: voucher.depot_id?.short_name, // Corrigé: utilise short_name
            livreur: voucher.livreur_employee_id?.physical_user_id?.first_name,
            magasinier: voucher.magasin_employee_id?.physical_user_id?.first_name,
            hasAttachment: !!voucher.attachment
          })
        })
      } else {
        console.error("❌ Erreur dans la réponse:", response.error)
        setError("Erreur lors du chargement des bons de livraison")
      }
    } catch (err) {
      console.error("💥 Erreur lors du chargement:", err)
      console.error("📄 Stack trace:", err.stack)
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
      console.log("🏁 Fin du chargement")
    }
  }

  // Filtrer les bons selon le terme de recherche
  const filteredVouchers = supplierVouchers.filter(
    (voucher) => {
      const searchLower = searchTerm.toLowerCase()
      const matches = 
        voucher.bl_reference?.toLowerCase().includes(searchLower) ||
        voucher.fournisseur_id?.nom?.toLowerCase().includes(searchLower) ||
        voucher.depot_id?.short_name?.toLowerCase().includes(searchLower) || // Corrigé: utilise short_name
        voucher.bl_date?.includes(searchTerm) ||
        voucher.livreur_employee_id?.physical_user_id?.first_name?.toLowerCase().includes(searchLower) ||
        voucher.magasin_employee_id?.physical_user_id?.first_name?.toLowerCase().includes(searchLower)
      
      if (searchTerm && matches) {
        console.log("🔍 Bon trouvé dans la recherche:", voucher.bl_reference)
      }
      
      return matches
    }
  )

  console.log("🔍 Résultats filtrés:", filteredVouchers.length, "sur", supplierVouchers.length)

  const handleDelete = async (voucherId) => {
    console.log("🗑️ Tentative de suppression du bon:", voucherId)
    
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon ?")) {
      try {
        console.log("📡 Appel de blFrsService.deleteBLFRS avec ID:", voucherId)
        const response = await blFrsService.deleteBLFRS(voucherId)
        
        console.log("📥 Réponse suppression:", response)
        
        if (response.success) {
          console.log("✅ Bon supprimé avec succès")
          setSupplierVouchers(prev => {
            const updated = prev.filter(voucher => voucher._id !== voucherId)
            console.log("📊 Liste mise à jour:", updated.length, "bons restants")
            return updated
          })
        } else {
          console.error("❌ Erreur lors de la suppression:", response.error)
          alert("Erreur lors de la suppression: " + response.error)
        }
      } catch (error) {
        console.error("💥 Erreur suppression:", error)
        console.error("📄 Stack trace:", error.stack)
        alert("Erreur lors de la suppression")
      }
    } else {
      console.log("❌ Suppression annulée par l'utilisateur")
    }
  }

  const handleViewDetails = async (voucher) => {
    console.log("👁️ Affichage des détails pour le bon:", voucher._id)
    console.log("📋 Données du bon:", voucher)
    
    try {
      console.log("📡 Appel de blFrsService.getBLFRSById avec ID:", voucher._id)
      const response = await blFrsService.getBLFRSById(voucher._id)
      
      console.log("📥 Réponse détails complète:", response)
      console.log("✅ Success:", response?.success)
      console.log("📊 Data reçue:", response?.data)
      
      if (response.success) {
        console.log("✅ Détails chargés avec succès")
        console.log("📋 Données détaillées:", {
          reference: response.data.bl_reference,
          lignes: response.data.lignes?.length || 0,
          fournisseur: response.data.fournisseur_id,
          depot: response.data.depot_id,
          employees: {
            livreur: response.data.livreur_employee_id,
            magasinier: response.data.magasin_employee_id
          }
        })
        
        setSelectedVoucher(response.data)
        setIsDetailModalOpen(true)
      } else {
        console.error("❌ Erreur lors du chargement des détails:", response.error)
        alert("Erreur lors du chargement des détails: " + response.error)
      }
    } catch (error) {
      console.error("💥 Erreur détails:", error)
      console.error("📄 Stack trace:", error.stack)
      console.error("🔍 Type d'erreur:", typeof error)
      console.error("🔍 Propriétés de l'erreur:", Object.keys(error))
      alert("Erreur lors du chargement des détails")
    }
  }

  const handleViewAttachment = (voucher) => {  
    console.log("📎 Tentative d'ouverture du fichier pour:", voucher.bl_reference)  
    console.log("📄 Attachment présent:", !!voucher.attachment)  
    console.log("📄 Type d'attachment:", typeof voucher.attachment)  
    console.log("📄 Structure de l'attachment:", voucher.attachment)  
      
    if (voucher.attachment && voucher.attachment.data) {  
      try {  
        console.log("🔄 Conversion du Buffer en Blob...")  
        console.log("📊 Taille du buffer:", voucher.attachment.data.length || "inconnue")  
        console.log("📊 Type de buffer:", voucher.attachment.type)  
          
        // Convertir le Buffer en Uint8Array puis en Blob  
        const uint8Array = new Uint8Array(voucher.attachment.data)  
        console.log("✅ Uint8Array créé, taille:", uint8Array.length)  
          
        const blob = new Blob([uint8Array], { type: 'application/pdf' })  
        console.log("✅ Blob créé, taille:", blob.size)  
          
        const url = URL.createObjectURL(blob)  
        console.log("✅ URL créée:", url)  
          
        window.open(url, '_blank')  
        console.log("✅ Fichier ouvert dans un nouvel onglet")  
          
        // Nettoyer l'URL après utilisation  
        setTimeout(() => {  
          URL.revokeObjectURL(url)  
          console.log("🧹 URL nettoyée")  
        }, 1000)  
      } catch (error) {  
        console.error("💥 Erreur lors de l'ouverture du fichier:", error)  
        console.error("📄 Stack trace:", error.stack)  
        alert("Erreur lors de l'ouverture du fichier")  
      }  
    } else {  
      console.log("❌ Aucun fichier attaché ou structure incorrecte")  
      console.log("📄 Attachment reçu:", voucher.attachment)  
    }  
  }

  const getEmployeeName = (voucher) => {
    console.log("👤 Récupération du nom de l'employé pour:", voucher.bl_reference)
    console.log("👤 Livreur:", voucher.livreur_employee_id)
    console.log("👤 Magasinier:", voucher.magasin_employee_id)
    
    if (voucher.livreur_employee_id?.physical_user_id) {
      const user = voucher.livreur_employee_id.physical_user_id
      const name = `${user.first_name} ${user.last_name} (Livreur)`
      console.log("✅ Nom livreur:", name)
      return name
    }
    if (voucher.magasin_employee_id?.physical_user_id) {
      const user = voucher.magasin_employee_id.physical_user_id
      const name = `${user.first_name} ${user.last_name} (Magasinier)`
      console.log("✅ Nom magasinier:", name)
      return name
    }
    console.log("❌ Aucun employé spécifié")
    return "Non spécifié"
  }

  // Log de l'état actuel
  console.log("🎯 État actuel du composant:", {
    loading,
    error,
    totalVouchers: supplierVouchers.length,
    filteredVouchers: filteredVouchers.length,
    searchTerm,
    isDetailModalOpen,
    selectedVoucher: selectedVoucher?.bl_reference
  })

  if (loading) {
    console.log("⏳ Affichage du loader")
    return (
      <div className="supplier-management-layout">
        <div className="supplier-management-wrapper">
          <div className="supplier-management-container">
            <div className="supplier-management-content">
              <div className="loading-message">Chargement des bons de livraison...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    console.log("❌ Affichage de l'erreur:", error)
    return (
      <div className="supplier-management-layout">
        <div className="supplier-management-wrapper">
          <div className="supplier-management-container">
            <div className="supplier-management-content">
              <div className="error-message">{error}</div>
              <button onClick={loadBLFRS} className="retry-button">Réessayer</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log("🎨 Rendu du composant principal")

  return (
    <div className="supplier-management-layout">
      <div className="supplier-management-wrapper">
        <div className="supplier-management-container">
          <div className="supplier-management-content">
            {/* En-tête */}
            <div className="supplier-page-header">
              <h1 className="supplier-page-title">Gestion des Bons des Fournisseurs</h1>
              <p className="supplier-page-subtitle">Consultez et gérez les bons de livraison des fournisseurs</p>
            </div>

            {/* Barre de recherche */}
            <div className="supplier-search-section">
              <div className="supplier-search-container">
                <Search className="supplier-search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par code, fournisseur, dépôt, employé ou date..."
                  value={searchTerm}
                  onChange={(e) => {
                    console.log("🔍 Recherche:", e.target.value)
                    setSearchTerm(e.target.value)
                  }}
                  className="supplier-search-input"
                />
              </div>
            </div>

            {/* Tableau */}
            <div className="supplier-table-card">
              <div className="supplier-table-header">
                <h3 className="supplier-table-title">Liste des Bons des Fournisseurs ({filteredVouchers.length})</h3>
              </div>
              <div className="supplier-table-content">
                <div className="supplier-table-container">
                  <table className="supplier-vouchers-table">
                    <thead>
                      <tr>
                        <th>Code du Bon</th>
                        <th>Date</th>
                        <th>Fournisseur</th>
                        <th>Dépôt</th>
                        <th>Employé</th>
                        {/* Supprimé: colonne Statut */}
                        <th>Fichier</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVouchers.map((voucher, index) => {
                        console.log(`📋 Rendu ligne ${index + 1}:`, voucher.bl_reference)  
                        return (  
                          <tr key={voucher._id}>  
                            <td className="supplier-font-medium">{voucher.bl_reference}</td>  
                            <td>{new Date(voucher.bl_date).toLocaleDateString('fr-FR')}</td>  
                            <td>{voucher.fournisseur_id?.nom || 'Non spécifié'}</td>  
                            <td>{voucher.depot_id?.short_name || 'Non spécifié'}</td> {/* Corrigé: utilise short_name */}  
                            <td>{getEmployeeName(voucher)}</td>  
                            {/* Supprimé: colonne Statut */}  
                            <td>  
                              {voucher.attachment ? (    
                                <button     
                                  className="supplier-view-bon-button"    
                                  onClick={() => handleViewAttachment(voucher)}    
                                >    
                                  <AttachFile className="supplier-bon-icon" />    
                                  Voir    
                                </button>    
                              ) : (    
                                <span className="supplier-no-bon">Aucun</span>    
                              )}    
                            </td>    
                            <td>    
                              <div className="supplier-action-buttons">    
                                <button     
                                  className="supplier-view-action-button"    
                                  onClick={() => handleViewDetails(voucher)}    
                                  title="Voir les détails"    
                                >    
                                  <Eye className="supplier-action-icon" />    
                                </button>    
                                <button     
                                  className="supplier-delete-action-button"    
                                  onClick={() => handleDelete(voucher._id)}    
                                  title="Supprimer"    
                                >    
                                  <Delete className="supplier-action-icon" />    
                                </button>    
                              </div>    
                            </td>    
                          </tr>    
                        )    
                      })}    
                    </tbody>    
                  </table>    
    
                  {filteredVouchers.length === 0 && (    
                    <div className="supplier-no-results">    
                      Aucun bon trouvé pour votre recherche.    
                    </div>    
                  )}    
                </div>    
              </div>    
            </div>    
          </div>    
        </div>    
      </div>    
    
      {/* Modal de détails */}    
      {isDetailModalOpen && selectedVoucher && (    
        <div className="supplier-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>    
          <div className="supplier-modal-content detail-modal" onClick={(e) => e.stopPropagation()}>    
            <div className="supplier-modal-header">    
              <h2 className="supplier-modal-title">Détails du Bon {selectedVoucher.bl_reference}</h2>    
              <button className="supplier-modal-close" onClick={() => setIsDetailModalOpen(false)}>    
                <X className="supplier-close-icon" />    
              </button>    
            </div>    
                  
            <div className="detail-modal-body">    
              <div className="detail-section">    
                <h3>Informations générales</h3>    
                <div className="detail-grid">    
                  <div className="detail-item">    
                    <label>Code du bon:</label>    
                    <span>{selectedVoucher.bl_reference}</span>    
                  </div>    
                  <div className="detail-item">    
                    <label>Date:</label>    
                    <span>{new Date(selectedVoucher.bl_date).toLocaleDateString('fr-FR')}</span>    
                  </div>    
                  <div className="detail-item">    
                    <label>Date d'entrée:</label>    
                    <span>{selectedVoucher.entry_date ? new Date(selectedVoucher.entry_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span>    
                  </div>    
                  {/* Supprimé: section Statut */}  
                </div>    
              </div>    
    
              <div className="detail-section">    
                <h3>Fournisseur et Dépôt</h3>    
                <div className="detail-grid">    
                  <div className="detail-item">    
                    <label>Fournisseur:</label>    
                    <span>{selectedVoucher.fournisseur_id?.nom || 'Non spécifié'}</span>    
                  </div>    
                  <div className="detail-item">    
                    <label>Code fournisseur:</label>    
                    <span>{selectedVoucher.fournisseur_id?.code || 'Non spécifié'}</span>    
                  </div>    
                  <div className="detail-item">    
                    <label>Dépôt:</label>    
                    <span>{selectedVoucher.depot_id?.short_name || 'Non spécifié'}</span> {/* Corrigé: utilise short_name */}  
                  </div>    
                  <div className="detail-item">    
                    <label>Code dépôt:</label>    
                    <span>{selectedVoucher.depot_id?.reference || 'Non spécifié'}</span> {/* Corrigé: utilise reference */}  
                  </div>    
                </div>    
              </div>    
    
              <div className="detail-section">    
                <h3>Employés</h3>    
                <div className="detail-grid">    
                  <div className="detail-item">    
                    <label>Livreur:</label>    
                    <span>    
                      {selectedVoucher.livreur_employee_id?.physical_user_id  
                        ? `${selectedVoucher.livreur_employee_id.physical_user_id.first_name} ${selectedVoucher.livreur_employee_id.physical_user_id.last_name}`  
                        : 'Non spécifié'  
                      }    
                    </span>    
                  </div>    
                  <div className="detail-item">    
                    <label>Magasinier:</label>    
                    <span>    
                      {selectedVoucher.magasin_employee_id?.physical_user_id  
                        ? `${selectedVoucher.magasin_employee_id.physical_user_id.first_name} ${selectedVoucher.magasin_employee_id.physical_user_id.last_name}`  
                        : 'Non spécifié'  
                      }    
                    </span>    
                  </div>    
                </div>    
              </div>    
    
              {selectedVoucher.commentaires && (    
                <div className="detail-section">    
                  <h3>Commentaires</h3>    
                  <p className="detail-comments">{selectedVoucher.commentaires}</p>    
                </div>    
              )}    
    
              {selectedVoucher.lignes && selectedVoucher.lignes.length > 0 && (    
                <div className="detail-section">    
                  <h3>Lignes de livraison</h3>    
                  <div className="detail-table-container">    
                    <table className="detail-lines-table">    
                      <thead>    
                        <tr>    
                          <th>Produit</th>    
                          <th>Quantité</th>    
                          <th>Unité</th>    
                          <th>Prix unitaire</th>    
                          <th>Total</th>    
                        </tr>    
                      </thead>    
                      <tbody>    
                        {selectedVoucher.lignes.map((ligne, index) => (    
                          <tr key={index}>    
                            <td>{ligne.product_id?.short_name || 'Produit non spécifié'}</td>    
                            <td>{ligne.quantity}</td> {/* Corrigé: utilise quantity au lieu de quantite */}  
                            <td>{ligne.um_id?.unitemesure || 'N/A'}</td>    
                            <td>{ligne.prix_unitaire ? `${ligne.prix_unitaire.toFixed(2)} MAD` : 'N/A'}</td>    
                            <td>{ligne.quantity && ligne.prix_unitaire ? `${(ligne.quantity * ligne.prix_unitaire).toFixed(2)} MAD` : ligne.total_ligne ? `${ligne.total_ligne.toFixed(2)} MAD` : 'N/A'}</td> {/* Corrigé: utilise quantity et total_ligne */}  
                          </tr>    
                        ))}    
                      </tbody>    
                    </table>    
                  </div>    
                </div>    
              )}    
            </div>    
          </div>    
        </div>    
      )}    
    </div>    
  )    
}