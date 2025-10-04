// Initialisation complète de la base de données ChronoGaz MongoDB  
print('🚀 Initialisation complète de ChronoGaz MongoDB...');  
  
db = db.getSiblingDB('chronogaz_db');  
  
// Créer un utilisateur pour l'application  
db.createUser({  
  user: 'chronogaz_user',  
  pwd: 'Wr4pN8xM2tK5vL9qZ7yJ3Hx6Bn2',  
  roles: [  
    {  
      role: 'readWrite',  
      db: 'chronogaz_db'  
    }  
  ]  
});  
  
// ===== COLLECTIONS PRINCIPALES =====  
  
// Collection Users (remplace user, physical_user, moral_user, customer, employe, admin)  
db.createCollection('users', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['email', 'password_hash', 'role_id'],  
      properties: {  
        email: { bsonType: 'string' },  
        password_hash: { bsonType: 'string' },  
        role_id: { bsonType: 'objectId' },  
        statut: { enum: ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'] }  
      }  
    }  
  }  
});  
  
// Collection Roles  
db.createCollection('roles', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['code', 'nom'],  
      properties: {  
        code: { bsonType: 'string' },  
        nom: { bsonType: 'string' }  
      }  
    }  
  }  
});  
  
// Collection PhysicalUsers  
db.createCollection('physicalusers', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['user_id', 'first_name', 'last_name', 'civilite'],  
      properties: {  
        user_id: { bsonType: 'objectId' },  
        first_name: { bsonType: 'string' },  
        last_name: { bsonType: 'string' },  
        civilite: { enum: ['M', 'Mme', 'Mlle'] }  
      }  
    }  
  }  
});  
  
// Collection MoralUsers  
db.createCollection('moralusers', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['user_id', 'raison_sociale'],  
      properties: {  
        user_id: { bsonType: 'objectId' },  
        raison_sociale: { bsonType: 'string' }  
      }  
    }  
  }  
});  
  
// Collection Customers  
db.createCollection('customers', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['customer_code', 'type_client'],  
      properties: {  
        customer_code: { bsonType: 'string' },  
        type_client: { enum: ['PHYSIQUE', 'MORAL'] }  
      }  
    }  
  }  
});  
  
// Collection Employes  
db.createCollection('employes', {    
  validator: {    
    $jsonSchema: {    
      bsonType: 'object',    
      required: ['physical_user_id', 'matricule', 'fonction', 'date_embauche', 'cin', 'cnss'], // ✅ Ajouter cin et cnss  
      properties: {    
        physical_user_id: { bsonType: 'objectId' },    
        matricule: { bsonType: 'string' },    
        cin: { bsonType: 'string' }, // ✅ Ajouter  
        cnss: { bsonType: 'string' }, // ✅ Ajouter  
        fonction: { enum: ['CHAUFFEUR', 'ACCOMPAGNANT', 'MAGASINIER'] }, // ✅ Synchroniser avec le modèle  
        date_embauche: { bsonType: 'date' },  
        statut: { enum: ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_CONGE'] },  
        depot_id: { bsonType: ['objectId', 'null'] } // ✅ Permettre null  
      }    
    }    
  }    
});
  
// Collection Products  
db.createCollection('products', {    
  validator: {    
    $jsonSchema: {    
      bsonType: 'object',    
      required: ['ref', 'short_name', 'long_name'],    
      properties: {    
        ref: { bsonType: 'string' },    
        short_name: { bsonType: 'string' },    
        long_name: { bsonType: 'string' },  
        gamme: { bsonType: 'string' },  
        brand: { bsonType: 'string' },  
        description: { bsonType: 'string' },  
        image: { bsonType: 'binData' },  
        actif: { bsonType: 'bool' }  
      }    
    }    
  }    
});  
  
// Collection Commandes  
db.createCollection('commandes', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['numero_commande', 'customer_id', 'statut'], // ← Changer statut_id en statut  
      properties: {  
        numero_commande: { bsonType: 'string' },  
        customer_id: { bsonType: 'objectId' },  
        statut: { enum: ['EN_ATTENTE', 'CONFIRMEE', 'PLANIFIEE', 'EN_COURS', 'LIVREE', 'ANNULEE'] } // ← Nouveau  
      }  
    }  
  }  
});

db.createCollection('depots', {    
  validator: {    
    $jsonSchema: {    
      bsonType: 'object',    
      required: ['reference', 'short_name', 'long_name'],  
      properties: {    
        reference: { bsonType: 'string' },    
        short_name: { bsonType: 'string' },    
        long_name: { bsonType: 'string' },    
        description: { bsonType: 'string' },    
        surface_area: { bsonType: 'number', minimum: 0 },    
        address: { bsonType: 'string' },  
        actif: { bsonType: 'bool' }    
      }    
    }    
  }    
});

  
// Collection Trucks  
db.createCollection('trucks', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['matricule'],  
      properties: {  
        matricule: { bsonType: 'string' },  
        carburant: { enum: ['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE'] }  
      }  
    }  
  }  
});  

// Collection Cities 
db.createCollection('cities', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['name', 'code'],  
      properties: {  
        name: { bsonType: 'string' },  
        code: { bsonType: 'string' },  
        actif: { bsonType: 'bool' }  
      }  
    }  
  }  
});
  
// Collection Depots  

db.createCollection('regions');  
db.createCollection('addresses'); 
db.createCollection('useraddresses');
db.createCollection('categories');  
db.createCollection('ums');  
db.createCollection('statutcommandes');  
db.createCollection('planifications');  
db.createCollection('livraisons');  
db.createCollection('stockdepots');  
db.createCollection('stocklines');  
db.createCollection('fournisseurs');  
  
// ===== DONNÉES DE BASE =====  
  
// Insérer les rôles  
const roleAdmin = db.roles.insertOne({  
  code: 'ADMIN',  
  nom: 'Administrateur',  
  description: 'Accès complet au système',  
  niveau_acces: 5,  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const roleClient = db.roles.insertOne({  
  code: 'CLIENT',  
  nom: 'Client',  
  description: 'Accès client pour commandes',  
  niveau_acces: 1,  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const roleEmploye = db.roles.insertOne({  
  code: 'EMPLOYE',  
  nom: 'Employé',  
  description: 'Accès employé pour livraisons',  
  niveau_acces: 2,  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  

const roleEmployeMagasin = db.roles.insertOne({  
  code: 'EMPLOYE_MAGASIN',  
  nom: 'Employé Magasin',  
  description: 'Accès employé magasin pour gestion stock',  
  niveau_acces: 2,  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});

  
// Insérer les adresses  
db.createCollection('addresses', {  
  validator: {  
    $jsonSchema: {  
      bsonType: 'object',  
      required: ['user_id', 'street', 'city_id', 'region_id'],  
      properties: {  
        user_id: { bsonType: 'objectId' },  
        numappt: { bsonType: 'string' },  
        numimmeuble: { bsonType: 'string' },  
        street: { bsonType: 'string' },  
        city_id: { bsonType: 'objectId' },  
        region_id: { bsonType: 'objectId' },  
        postal_code: { bsonType: 'string' },  
        is_principal: { bsonType: 'bool' },  
        latitude: { bsonType: 'number' },  
        longitude: { bsonType: 'number' },  
        type_adresse: {   
          enum: ['DOMICILE', 'TRAVAIL', 'LIVRAISON', 'FACTURATION']   
        },  
        actif: { bsonType: 'bool' }  
      }  
    }  
  }  
});
  
// Insérer les utilisateurs  
const userAdmin = db.users.insertOne({  
  email: 'admin@chronogaz.ma',  
  password_hash: '$2b$12$LQv3c1yqBwEHxPuNYkGOaOapswbQ.vAbnq.JjSO7hZGaNxz5HiDAa', // "admin123"  
  role_id: roleAdmin.insertedId,  
  statut: 'ACTIF',  
  last_login: null,  
  email_verified: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const userClient = db.users.insertOne({  
  email: 'client@example.ma',  
  password_hash: '$2b$10$example_hash_client',  
  role_id: roleClient.insertedId,  
  statut: 'ACTIF',  
  last_login: null,  
  email_verified: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const userEmploye = db.users.insertOne({  
  email: 'chauffeur@chronogaz.ma',  
  password_hash: '$2b$10$example_hash_employe',  
  role_id: roleEmploye.insertedId,  
  statut: 'ACTIF',  
  last_login: null,  
  email_verified: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
// Insérer les utilisateurs physiques  
const physicalAdmin = db.physicalusers.insertOne({  
  user_id: userAdmin.insertedId,  
  first_name: 'Admin',  
  last_name: 'ChronoGaz',  
  civilite: 'M',  
  telephone_principal: '0612345678',  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const physicalClient = db.physicalusers.insertOne({  
  user_id: userClient.insertedId,  
  first_name: 'Jean',  
  last_name: 'Dupont',  
  civilite: 'M',  
  cin: 'AB123456',  
  telephone_principal: '0687654321',  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const physicalEmploye = db.physicalusers.insertOne({  
  user_id: userEmploye.insertedId,  
  first_name: 'Ahmed',  
  last_name: 'Alami',  
  civilite: 'M',  
  cin: 'CD789012',  
  telephone_principal: '0698765432',  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
// Insérer le client  
db.customers.insertOne({  
  customer_code: 'CLI-P000001',  
  type_client: 'PHYSIQUE',  
  physical_user_id: physicalClient.insertedId,  
  moral_user_id: null,  
  statut: 'ACTIF',  
  credit_limite: 5000.00,  
  credit_utilise: 0.00,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
// Insérer l'employé  
db.employes.insertOne({  
  physical_user_id: physicalEmploye.insertedId,  
  matricule: 'EMP001',  
  fonction: 'CHAUFFEUR',  
  date_embauche: new Date('2024-01-15'),  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
// Insérer les catégories  
const categoryButane = db.categories.insertOne({  
  code: 'GAZ_BUT',  
  nom: 'Gaz Butane',  
  description: 'Bouteilles et équipements gaz butane',  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const categoryPropane = db.categories.insertOne({  
  code: 'GAZ_PROP',  
  nom: 'Gaz Propane',  
  description: 'Bouteilles et équipements gaz propane',  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
// Insérer les unités de mesure  
const umUnite = db.ums.insertOne({  
  code: 'UNITE',  
  nom: 'Unité',  
  symbole: 'u',  
  type: 'UNITE',  
  facteur_conversion: 1,  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
const umKg = db.ums.insertOne({  
  code: 'KG',  
  nom: 'Kilogramme',  
  symbole: 'kg',  
  type: 'POIDS',  
  facteur_conversion: 1,  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
// Insérer les produits  
db.products.insertMany([    
  {    
    ref: 'BUT-13KG',    
    short_name: 'Butane 13kg',    
    long_name: 'Bouteille de gaz butane 13kg',    
    gamme: 'BUTANE',  
    brand: 'ChronoGaz',  
    description: 'Bouteille de gaz butane pour usage domestique',  
    actif: true,    
    createdAt: new Date(),    
    updatedAt: new Date()    
  },    
  {    
    ref: 'BUT-6KG',    
    short_name: 'Butane 6kg',    
    long_name: 'Bouteille de gaz butane 6kg',    
    gamme: 'BUTANE',  
    brand: 'ChronoGaz',  
    description: 'Bouteille de gaz butane pour usage domestique',  
    actif: true,    
    createdAt: new Date(),    
    updatedAt: new Date()    
  },    
  {    
    ref: 'PROP-13KG',    
    short_name: 'Propane 13kg',    
    long_name: 'Bouteille de gaz propane 13kg',    
    gamme: 'PROPANE',  
    brand: 'ChronoGaz',  
    description: 'Bouteille de gaz propane pour usage domestique',  
    actif: true,    
    createdAt: new Date(),    
    updatedAt: new Date()    
  }    
]);

db.addresses.insertMany([  
  {  
    user_id: userClient.insertedId,  
    numappt: '12',  
    numimmeuble: '45',  
    street: 'Rue Mohammed V',  
    city_id: cityCasablanca.insertedId,  
    region_id: region2Mars.insertedId,  
    postal_code: '20000',  
    is_principal: true,  
    type_adresse: 'DOMICILE',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  },  
  {  
    user_id: userEmploye.insertedId,  
    street: 'Avenue Hassan II',  
    city_id: cityCasablanca.insertedId,  
    region_id: regionMaarif.insertedId,  
    postal_code: '20100',  
    is_principal: true,  
    type_adresse: 'DOMICILE',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  }  
]);


  
 
  

// Insérer les statuts de commande  
const statutNouvelle = db.statutcommandes.insertOne({  
  code: 'NOUVELLE',  
  nom: 'Nouvelle',  
  description: 'Commande nouvellement créée',  
  ordre_affichage: 1,  
  couleur: '#007bff',  
  actif: true,  
  createdAt: new Date(),  
  updatedAt: new Date()  
});  
  
db.statutcommandes.insertMany([  
  {  
    code: 'CONFIRMEE',  
    nom: 'Confirmée',  
    description: 'Commande confirmée par le client',  
    ordre_affichage: 2,  
    couleur: '#28a745',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  },  
  {  
    code: 'PLANIFIEE',  
    nom: 'Planifiée',  
    description: 'Commande planifiée pour livraison',  
    ordre_affichage: 3,  
    couleur: '#ffc107',  
    actif: true,  
    createdAt: new Date(),
    updatedAt: new Date()  
  },  
  {  
    code: 'EN_COURS',  
    nom: 'En cours',  
    description: 'Livraison en cours',  
    ordre_affichage: 4,  
    couleur: '#fd7e14',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  },  
  {  
    code: 'LIVREE',  
    nom: 'Livrée',  
    description: 'Commande livrée avec succès',  
    ordre_affichage: 5,  
    couleur: '#20c997',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  },  
  {  
    code: 'ANNULEE',  
    nom: 'Annulée',  
    description: 'Commande annulée',  
    ordre_affichage: 6,  
    couleur: '#dc3545',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  }  
]);  
  
// Insérer les camions  
db.trucks.insertMany([    
  {    
    matricule: 'CAM001',    
    marque: 'Mercedes',    
    modele: 'Sprinter',    
    annee_construction: 2022,    
    capacite_charge: 3500.00,    
    carburant: 'DIESEL',    
    gps_actif: true,    
    region_id: regionCasa.insertedId,    
    status: 'Disponible', // Ajouté  
    createdAt: new Date(),    
    updatedAt: new Date()    
  },    
  {    
    matricule: 'CAM002',    
    marque: 'Renault',    
    modele: 'Master',    
    annee_construction: 2021,    
    capacite_charge: 3000.00,    
    carburant: 'DIESEL',    
    gps_actif: true,    
    region_id: regionRabat.insertedId,    
    status: 'Disponible', // Ajouté  
    createdAt: new Date(),    
    updatedAt: new Date()    
  }    
]);  
  
// Insérer les dépôts  
// Insérer les dépôts avec la nouvelle structure  
db.depots.insertMany([  
  {  
    reference: 'DEP-CASA-01',  
    short_name: 'Dépôt Casa Centre',   
    long_name: 'Dépôt Casablanca Centre',  
    description: 'Dépôt principal de Casablanca',  
    surface_area: 2500.0,  
    address: '123 Rue Mohammed V, Casablanca',  
    actif: true,  
    createdAt: new Date(),  
    updatedAt: new Date()  
  }  
]);
  
// ===== INDEX POUR PERFORMANCES =====  
  
// Index Users  
db.users.createIndex({ email: 1 }, { unique: true });  
db.users.createIndex({ role_id: 1 });  
db.users.createIndex({ statut: 1 });  
  
// Index PhysicalUsers  
db.physicalusers.createIndex({ user_id: 1 }, { unique: true });  
db.physicalusers.createIndex({ cin: 1 }, { unique: true, sparse: true });  
  
// Index Customers  
db.customers.createIndex({ customer_code: 1 }, { unique: true });  
db.customers.createIndex({ type_client: 1 });  
  
// Index Employes  
db.employes.createIndex({ matricule: 1 }, { unique: true });  
db.employes.createIndex({ physical_user_id: 1 }, { unique: true });  
  
// Index Products  
db.products.createIndex({ ref: 1 }, { unique: true });    
db.products.createIndex({ gamme: 1 });    
db.products.createIndex({ actif: 1 });  
db.products.createIndex({ brand: 1 }); 
  
// Index Trucks  
db.trucks.createIndex({ matricule: 1 }, { unique: true });  
db.trucks.createIndex({ region_id: 1 });  
  
// Index Roles  
db.roles.createIndex({ code: 1 }, { unique: true });  

// Index Depots  
db.depots.createIndex({ reference: 1 }, { unique: true });  
db.depots.createIndex({ actif: 1 });

// Index Cities  
db.cities.createIndex({ name: 1 }, { unique: true });  
db.cities.createIndex({ code: 1 }, { unique: true });  
db.cities.createIndex({ actif: 1 });  
  
// Index Regions (modifier l'existant)  
db.regions.createIndex({ code: 1 }, { unique: true });  
db.regions.createIndex({ city_id: 1 });  
db.regions.createIndex({ actif: 1 });  
  
// Index Addresses  
db.addresses.createIndex({ user_id: 1 });  
db.addresses.createIndex({ city_id: 1 });  
db.addresses.createIndex({ region_id: 1 });  
db.addresses.createIndex({ is_principal: 1 });  
db.addresses.createIndex({ actif: 1 });
  
print('✅ Base de données ChronoGaz complète initialisée avec succès!');  
print('📊 Collections créées avec validation');  
print('🔍 Index créés pour optimiser les performances');  
print('📝 Données d\'exemple insérées');  
print('👥 Utilisateurs créés: admin@chronogaz.ma, client@example.ma, chauffeur@chronogaz.ma');