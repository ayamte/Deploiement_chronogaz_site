const Employe = require('../models/Employe');



const getEmployeesByFunction = async (req, res) => {
  try {
    const { fonction } = req.params; // Récupère la fonction depuis l'URL
    const employees = await Employe.find({ fonction: fonction, actif: true })
      .populate('physical_user_id', 'first_name last_name');

    const formattedEmployees = employees.map(e => ({
        id: e._id,
        name: `${e.physical_user_id.first_name} ${e.physical_user_id.last_name}`
    }));

    res.status(200).json({ success: true, data: formattedEmployees });
  } catch (error) {
    console.error(`Erreur lors de la récupération des employés avec la fonction ${fonction}:`, error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};


module.exports = {
    getEmployeesByFunction
}