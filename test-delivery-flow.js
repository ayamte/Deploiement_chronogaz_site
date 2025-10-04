// Script de test pour vérifier le flux de livraison
// À exécuter dans la console du navigateur côté client

console.log('🧪 Test du flux de livraison - Début');

// Fonction pour tester la connexion WebSocket
function testWebSocketConnection() {
  console.log('🔌 Test de connexion WebSocket...');
  
  // Vérifier si le WebSocket est connecté
  if (window.websocketService && window.websocketService.isConnected) {
    console.log('✅ WebSocket connecté');
    return true;
  } else {
    console.log('❌ WebSocket non connecté');
    return false;
  }
}

// Fonction pour simuler l'écoute des événements
function testEventListeners() {
  console.log('👂 Test des listeners d\'événements...');
  
  // Simuler l'écoute de delivery_started
  if (window.websocketService) {
    const unsubscribe = window.websocketService.subscribe('delivery_started', (data) => {
      console.log('🚚 Événement delivery_started reçu:', data);
      console.log('  - Order ID:', data.orderId);
      console.log('  - Delivery ID:', data.deliveryId);
      console.log('  - Planification ID:', data.planificationId);
    });
    
    console.log('✅ Listener delivery_started configuré');
    
    // Nettoyer après 30 secondes
    setTimeout(() => {
      unsubscribe();
      console.log('🧹 Listener delivery_started nettoyé');
    }, 30000);
  }
}

// Fonction pour tester l'identification WebSocket
function testWebSocketIdentification(deliveryId) {
  console.log('🆔 Test d\'identification WebSocket...');
  
  if (window.websocketService && deliveryId) {
    window.websocketService.identify(null, deliveryId, 'customer');
    console.log('✅ Identification envoyée pour delivery ID:', deliveryId);
  } else {
    console.log('❌ Impossible d\'identifier - WebSocket ou deliveryId manquant');
  }
}

// Fonction pour tester la récupération des données de commande
async function testOrderDataFetch(orderId) {
  console.log('📋 Test de récupération des données de commande...');
  
  try {
    const response = await fetch(`/api/commands/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Données de commande récupérées:', data);
      
      if (data.data?.livraison) {
        console.log('✅ Livraison trouvée:', data.data.livraison._id);
        return data.data.livraison._id;
      } else {
        console.log('⚠️ Pas de livraison associée à cette commande');
        return null;
      }
    } else {
      console.log('❌ Erreur lors de la récupération:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error);
    return null;
  }
}

// Fonction principale de test
async function runDeliveryFlowTest(orderId) {
  console.log('🚀 Démarrage du test complet du flux de livraison');
  console.log('📋 Order ID:', orderId);
  
  // 1. Tester la connexion WebSocket
  const wsConnected = testWebSocketConnection();
  if (!wsConnected) {
    console.log('❌ Test arrêté - WebSocket non connecté');
    return;
  }
  
  // 2. Configurer les listeners
  testEventListeners();
  
  // 3. Récupérer les données de commande
  const deliveryId = await testOrderDataFetch(orderId);
  
  // 4. S'identifier si on a un ID de livraison
  if (deliveryId) {
    testWebSocketIdentification(deliveryId);
  }
  
  console.log('✅ Test complet terminé');
  console.log('📝 Instructions:');
  console.log('   1. Connectez-vous en tant que chauffeur');
  console.log('   2. Cliquez sur "Démarrer route" pour cette commande');
  console.log('   3. Observez les logs dans cette console');
  console.log('   4. Vérifiez que la carte apparaît');
}

// Fonction utilitaire pour obtenir l'ID de commande depuis l'URL
function getCurrentOrderId() {
  const path = window.location.pathname;
  const match = path.match(/\/Trackorder\/([^\/]+)/);
  return match ? match[1] : null;
}

// Auto-exécution si on est sur une page de tracking
const currentOrderId = getCurrentOrderId();
if (currentOrderId) {
  console.log('🎯 ID de commande détecté:', currentOrderId);
  console.log('💡 Exécutez: runDeliveryFlowTest("' + currentOrderId + '")');
} else {
  console.log('💡 Exécutez: runDeliveryFlowTest("VOTRE_ORDER_ID")');
}

// Exposer les fonctions globalement pour utilisation manuelle
window.testDeliveryFlow = {
  runDeliveryFlowTest,
  testWebSocketConnection,
  testEventListeners,
  testWebSocketIdentification,
  testOrderDataFetch,
  getCurrentOrderId
};

console.log('🧪 Script de test chargé. Utilisez window.testDeliveryFlow pour accéder aux fonctions.');
