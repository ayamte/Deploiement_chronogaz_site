# Format des Rapports Unifiés 
## Structure Commune (SAST, SCA, DAST)  
  
Tous les rapports suivent cette structure de base :  
  
```json  
{  
  "scan_metadata": {  
    "scan_type": "SAST|SCA|DAST",  
    "tool": "Nom de l'outil utilisé",  
    "scan_date": "2025-10-31T00:05:31.839630",  
    "project": "ChronoGaz",  
    "parser_version": "1.0.0"  
  },  
  "summary": {  
    "total_vulnerabilities": 42,  
    "risk_score": 67.5,  // Score 0-100  
    "severity_distribution": {  
      "critical": 2,  
      "high": 8,  
      "medium": 15,  
      "low": 17  
    }  
  },  
  "top_vulnerabilities": [...],  // Top 5 les plus critiques  
  "vulnerabilities": [...],       // Liste complète  
  "statistics": {...}             // Statistiques détaillées  
}