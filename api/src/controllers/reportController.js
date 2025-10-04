const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Truck = require('../models/Truck');

// Statistiques générales du module Produits & Stock
exports.getDashboardStats = async (req, res) => {
  try {
    // Statistiques des produits
    const totalProducts = await Product.countDocuments({ actif: true });
    const productsByType = await Product.aggregate([
      { $match: { actif: true } },
      { $group: { _id: '$type_gaz', count: { $sum: 1 } } }
    ]);

    // Statistiques des stocks
    const stockStats = await Stock.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalValue: { 
            $sum: { 
              $multiply: ['$quantity', '$productInfo.prix_unitaire'] 
            } 
          },
          depotCount: { $addToSet: '$depot' }
        }
      }
    ]);

    // Alertes de stock bas
    const lowStockAlerts = await Stock.find()
      .populate('product', 'reference nom_court')
      .then(stocks => stocks.filter(stock => stock.isLowStock()).length);

    // Statistiques des camions
    const truckStats = await Truck.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          byType: productsByType
        },
        stock: {
          totalQuantity: stockStats[0]?.totalQuantity || 0,
          totalValue: stockStats[0]?.totalValue || 0,
          depotCount: stockStats[0]?.depotCount.length || 0,
          lowStockAlerts
        },
        trucks: {
          byStatus: truckStats
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Rapport d'inventaire par dépôt
exports.getInventoryReport = async (req, res) => {
  try {
    const { depot, startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (depot) matchQuery.depot = depot;

    const inventory = await Stock.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$depot',
          items: {
            $push: {
              product: '$productInfo.nom_court',
              reference: '$productInfo.reference',
              type: '$productInfo.type_gaz',
              quantity: '$quantity',
              minStock: '$minStock',
              isLowStock: { $lte: ['$quantity', '$minStock'] },
              value: { $multiply: ['$quantity', '$productInfo.prix_unitaire'] }
            }
          },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { 
            $sum: { $multiply: ['$quantity', '$productInfo.prix_unitaire'] } 
          },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$quantity', '$minStock'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Rapport de mouvements de stock
exports.getStockMovements = async (req, res) => {
  try {
    const { depot, productId, startDate, endDate, limit = 100 } = req.query;

    
    res.status(200).json({
      success: true,
      message: 'Cette fonctionnalité nécessite l\'implémentation d\'un système de traçabilité des mouvements de stock',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Rapport d'utilisation des camions
exports.getTruckUtilizationReport = async (req, res) => {  
  try {  
    const { startDate, endDate, region } = req.query;  
      
    let matchQuery = { status: { $ne: 'Hors service' } };
    if (region) matchQuery.region = region;  
  
    const utilization = await Truck.aggregate([  
      { $match: matchQuery },  
      {  
        $group: {  
          _id: '$region',  
          trucks: {  
            $push: {  
              matricule: '$matricule',  
              brand: '$brand',  
              modele: '$modele',  
              status: '$status',  
              capacite: '$capacite'  
            }  
          },  
          total: { $sum: 1 },  
          disponible: {  
            $sum: { $cond: [{ $eq: ['$status', 'Disponible'] }, 1, 0] }  
          },  
          enLivraison: {  
            $sum: { $cond: [{ $eq: ['$status', 'En livraison'] }, 1, 0] }  
          },  
          enMaintenance: {  
            $sum: { $cond: [{ $eq: ['$status', 'En maintenance'] }, 1, 0] }  
          }  
        }  
      }  
    ]);  
  
    res.status(200).json({  
      success: true,  
      data: utilization  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};

// Rapport de maintenance des camions
exports.getMaintenanceReport = async (req, res) => {
  try {
    const trucks = await Truck.find({ active: true })
      .select('registrationNumber brand model mileage lastMaintenanceDate nextMaintenanceDate')
      .sort({ nextMaintenanceDate: 1 });

    const maintenanceData = trucks.map(truck => ({
      truck: `${truck.brand} ${truck.model} - ${truck.registrationNumber}`,
      mileage: truck.mileage,
      lastMaintenance: truck.lastMaintenanceDate,
      nextMaintenance: truck.nextMaintenanceDate,
      isOverdue: truck.isMaintenanceDue(),
      daysUntilMaintenance: truck.nextMaintenanceDate ? 
        Math.ceil((truck.nextMaintenanceDate - new Date()) / (1000 * 60 * 60 * 24)) : null
    }));

    const summary = {
      total: trucks.length,
      overdueCount: maintenanceData.filter(t => t.isOverdue).length,
      upcomingWeek: maintenanceData.filter(t => 
        t.daysUntilMaintenance !== null && t.daysUntilMaintenance <= 7 && t.daysUntilMaintenance >= 0
      ).length
    };

    res.status(200).json({
      success: true,
      summary,
      data: maintenanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export des données en CSV (exemple pour les produits)
exports.exportProductsCSV = async (req, res) => {
  try {
    const products = await Product.find({ actif: true })
      .select('reference nom_court nom_long type_gaz capacite prix_unitaire')
      .sort({ nom_court: 1 });

    // En-têtes CSV
    let csv = 'Référence,Nom Court,Nom Long,Type de Gaz,Capacité,Prix Unitaire\n';
    
    // Données
    products.forEach(product => {
      csv += `"${product.reference}","${product.nom_court}","${product.nom_long || ''}","${product.type_gaz}",${product.capacite},${product.prix_unitaire || 0}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
