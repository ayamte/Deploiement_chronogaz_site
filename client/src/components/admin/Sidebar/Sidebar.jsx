import React, { useState, useEffect } from 'react'    
import {     
  MdLocalShipping as Truck,    
  MdPeople as Users,     
  MdLocationOn as MapPin,    
  MdReceipt as Receipt,    
  MdTrackChanges as Package,    
  MdLogout as LogOut,    
  MdMenu as Menu,    
  MdClose as X,    
  MdDashboard as LayoutDashboard,
  MdWarehouse as Warehouse,
  MdInventory as Inventory,
  MdPerson,    
  MdExpandMore    
    
} from 'react-icons/md'    
import logo from './logo.png'    
import "./Sidebar.css" 
import { authService } from '../../../services/authService';  
    
const menuItems = [    
  {    
    icon: LayoutDashboard,    
    label: "Dashboard",    
    href: "/dashboard",    
  },    
  {    
    icon: Truck,    
    label: "Gestion des Camions",    
    href: "/admin/gestion-camions",    
  },  
  {    
    icon: Users,    
    label: "Gestion des Clients",    
    href: "/gestionclient",    
  }, 
  {    
    icon: Users,    
    label: "Gestion des fournisseurs",    
    href: "/gestion-fournisseur",    
  }, 
  {    
    icon: Users,    
    label: "Gestion des employés",    
    href: "/gestion-chauffeur",    
  },    
    
  {    
    icon: Package,    
    label: "Suivre les commandes",    
    href: "/suivicommande",    
  },  
    {    
    icon: Package,    
    label: "Gérer les commandes",    
    href: "/gerer-commande",    
  },
  {    
    icon: Receipt,    
    label: "Gestion des produits",    
    href: "/admin/gestion-produits",    
  }, 
  {    
    icon: Receipt,    
    label: "Gestion des listes prix",    
    href: "/admin/gestion-liste-prix",    
  }, 
  {    
    icon: Receipt,    
    label: "Gestion des ums",    
    href: "/admin/gestion-ums",    
  }, 
  {    
    icon: MapPin,    
    label: "Gestion des villes",    
    href: "/gestionregion",    
  },    
  {    
    icon: Receipt,    
    label: "Bons fournisseurs",    
    href: "/gestionbon",    
  }, 
  {    
    icon: Warehouse,    
    label: "Gestion Stocks",    
    href: "/admin/gestion-depots",    
  }
]    
    
function SidebarNavigation({ userName = "Utilisateur" }) {    
  const [isCollapsed, setIsCollapsed] = useState(false)    
  const [isMobileOpen, setIsMobileOpen] = useState(false)    
  const [dropdownOpen, setDropdownOpen] = useState(false)    
  
  // Ajouter cette logique pour communiquer l'état au body  
  useEffect(() => {  
    if (isCollapsed) {  
      document.body.classList.add('sidebar-collapsed');  
    } else {  
      document.body.classList.remove('sidebar-collapsed');  
    }  
      
    // Cleanup au démontage du composant  
    return () => {  
      document.body.classList.remove('sidebar-collapsed');  
    };  
  }, [isCollapsed]);  
    
  const handleLogout = () => {  
   authService.logout();  
  }   

    
  const toggleDropdown = () => {    
    setDropdownOpen(!dropdownOpen)    
  }    
    
  const MenuItem = ({ item, isCollapsed }) => (    
    <a    
      href={item.href}    
      onClick={item.onClick}    
      className={`menu-item ${isCollapsed ? 'collapsed' : ''}`}    
    >    
      <item.icon className="menu-icon" />    
      {!isCollapsed && <span className="menu-label">{item.label}</span>}    
    </a>    
  )    
    
  return (    
    <div className="app-container">    
      {/* Mobile Overlay */}    
      {isMobileOpen && (    
        <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />    
      )}    
    
      {/* Sidebar */}    
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>    
        {/* Sidebar Header */}    
        <div className="sidebar-header">    
          <div className="header-content">    
            {!isCollapsed && <h2 className="sidebar-title">Menu</h2>}    
            <button     
              className="collapse-btn desktop-only"     
              onClick={() => setIsCollapsed(!isCollapsed)}    
            >    
              <Menu className="collapse-icon" />    
            </button>    
          </div>    
        </div>    
    
        {/* Navigation Menu */}    
        <nav className="sidebar-nav">    
          <div className="nav-items">    
            {menuItems.map((item, index) => (    
              <MenuItem key={index} item={item} isCollapsed={isCollapsed} />    
            ))}    
          </div>    
        </nav>    
    
        {/* Logout Section */}    
        <div className="logout-section">    
          <button    
            onClick={handleLogout}    
            className={`logout-btn ${isCollapsed ? 'collapsed' : ''}`}    
          >    
            <LogOut className="logout-icon" />    
            {!isCollapsed && <span className="logout-label">Déconnexion</span>}    
          </button>    
        </div>    
      </div>    
    
      {/* Header - Attaché au sidemenu */}    
      <header className="main-header">    
        <div className="header-inner">    
          <div className="header-left">    
            {/* Mobile Menu Button */}    
            <button    
              className="mobile-menu-btn mobile-only"    
              onClick={() => setIsMobileOpen(!isMobileOpen)}    
            >    
              {isMobileOpen ? <X className="mobile-menu-icon" /> : <Menu className="mobile-menu-icon" />}    
            </button>    
            <img src={logo} alt="ChronoGaz Logo" className="header-logo" />    
          </div>    
    
          <div className="header-right">    
            <div className="profile-section">    
              <div className="profileInfo" onClick={toggleDropdown}>    
                <MdPerson className="profileIcon" />    
                <span className="userName">{userName}</span>    
                <MdExpandMore className={`dropdownIcon ${dropdownOpen ? 'rotated' : ''}`} />    
              </div>    
                  
              {dropdownOpen && (    
                <div className="dropdown">    
                  <div className="dropdownItem" onClick={handleLogout}>    
                    <LogOut className="dropdownItemIcon" />    
                    <span>Déconnexion</span>    
                  </div>    
                </div>    
              )}    
            </div>    
          </div>    
        </div>    
      </header>    
    </div>    
  )    
}    
    
export default SidebarNavigation