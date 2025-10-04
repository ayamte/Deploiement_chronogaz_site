import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Send, MessageSquare, Clock, Shield, Zap, Smartphone } from 'lucide-react';
import DriverInfo from '../../components/client/ServiceEvaluationPage/DriverInfo';
import StarRating from '../../components/client/ServiceEvaluationPage/StarRating';
import Title from '../../components/client/ServiceEvaluationPage/Title';
import evaluationService from '../../services/evaluationService';
import livraisonService from '../../services/livraisonService';
import './ServiceEvaluation.css'; 

const ServiceEvaluation = () => {
    const { livraisonId } = useParams();
    const navigate = useNavigate();
    
    const [rapidite, setRapidite] = useState(0);
    const [professionalisme, setProfessionalisme] = useState(0);
    const [securite, setSecurite] = useState(0);
    const [facilite, setFacilite] = useState(0);
    const [commentaire, setCommentaire] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState(null);

    useEffect(() => {
        const loadDeliveryData = async () => {
            try {
                if (!livraisonId) {
                    setError('ID de livraison manquant');
                    return;
                }

                // Vérifier si une évaluation existe déjà
                const existingEvaluation = await evaluationService.getEvaluationByLivraison(livraisonId);
                if (existingEvaluation) {
                    setError('Cette livraison a déjà été évaluée');
                    return;
                }

                // Récupérer les informations de la livraison
                const livraison = await livraisonService.getLivraisonById(livraisonId);
                if (!livraison || livraison.etat !== 'LIVRE') {
                    setError('Livraison non trouvée ou non livrée');
                    return;
                }

                setDeliveryInfo({  
                    driver: `${livraison.livreur?.physical_user_id?.first_name || ''} ${livraison.livreur?.physical_user_id?.last_name || ''}`.trim() || 'Livreur',  
                    driverPhone: livraison.livreur?.physical_user_id?.telephone_principal || 'Non disponible',  
                    orderId: livraison.commande?.numero_commande || livraison._id  
                });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDeliveryData();
    }, [livraisonId]);

    const evaluationCriteria = [
        {
            label: "Rapidité de livraison",
            icon: Clock,
            rating: rapidite,
            setRating: setRapidite
        },
        {
            label: "Professionnalisme du livreur",
            icon: Star,
            rating: professionalisme,
            setRating: setProfessionalisme
        },
        {
            label: "Sécurité et qualité",
            icon: Shield,
            rating: securite,
            setRating: setSecurite
        },
        {
            label: "Facilité d'utilisation de l'app",
            icon: Smartphone,
            rating: facilite,
            setRating: setFacilite
        }
    ];

    const handleSubmit = async () => {
        if (rapidite === 0 || professionalisme === 0 || securite === 0 || facilite === 0) {
            alert('Veuillez évaluer tous les critères avant d\'envoyer.');
            return;
        }

        try {
            setLoading(true);
            await evaluationService.createEvaluation({
                livraison_id: livraisonId,
                rapidite,
                professionalisme,
                securite,
                facilite,
                commentaire
            });
            
            setIsSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageRating = () => {
        return ((rapidite + professionalisme + securite + facilite) / 4).toFixed(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/Orderhistory')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Retour à l'historique
                    </button>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50">
         

                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Merci pour votre évaluation !</h2>
                        <p className="text-gray-600 mb-4">
                            Votre avis nous aide à améliorer nos services.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 inline-block">
                            <p className="text-sm text-gray-600">Note moyenne attribuée</p>
                            <div className="flex items-center justify-center space-x-2 mt-2">
                                <span className="text-3xl font-bold" style={{color: '#1F55A3'}}>
                                    {calculateAverageRating()}
                                </span>
                                <Star size={32} className="text-yellow-400 fill-current" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/Orderhistory')}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Retour à l'historique
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (  
        <div className="page-content-wrapper">  
            <div className="min-h-screen bg-gray-50">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 shadow-lg" style={{background: 'linear-gradient(135deg, #1F55A3 0%, #245FA6 100%)'}}>
                                <div className="max-w-4xl mx-auto text-center">
                                    <h1 className="text-3xl font-bold">Évaluation du service</h1>
                                    <p className="text-lg opacity-90 mt-2">Votre avis compte pour nous</p>
                                </div>
                            </div>

                            

                            <div className="max-w-4xl mx-auto p-6">
                            {deliveryInfo && (  
                                <div className="flex justify-center mb-6">  
                                    <div className="w-full max-w-md">  
                                        <DriverInfo   
                                            driver={deliveryInfo.driver}  
                                            driverPhone={deliveryInfo.driverPhone}  
                                            orderId={deliveryInfo.orderId}  
                                        />  
                                    </div>  
                                </div>  
                            )}

                                {/* Critères d'évaluation */}
                                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                    <h3 className="text-xl font-bold mb-6" style={{color: '#1F55A3'}}>
                                        Évaluez votre expérience
                                    </h3>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {evaluationCriteria.map((criteria, index) => (
                                            <StarRating
                                                key={index}
                                                label={criteria.label}
                                                icon={criteria.icon}
                                                rating={criteria.rating}
                                                setRating={criteria.setRating}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Commentaire optionnel */}
                                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <MessageSquare size={20} style={{color: '#4DAEBD'}} />
                                        <h3 className="text-lg font-semibold" style={{color: '#1F55A3'}}>
                                            Commentaire (optionnel)
                                        </h3>
                                    </div>
                                    
                                    <textarea
                                        value={commentaire}
                                        onChange={(e) => setCommentaire(e.target.value)}
                                        placeholder="Partagez votre expérience ou suggérez des améliorations..."
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows="4"
                                        maxLength={500}
                                    />
                                    
                                    <div className="text-right mt-2">
                                        <span className="text-sm text-gray-500">
                                            {commentaire.length}/500 caractères
                                        </span>
                                    </div>
                                </div>

                                {/* Résumé et bouton d'envoi */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold" style={{color: '#1F55A3'}}>
                                                Résumé de votre évaluation
                                            </h3>
                                            {(rapidite > 0 || professionalisme > 0 || securite > 0 || facilite > 0) && (
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <span className="text-gray-600">Note moyenne:</span>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-xl font-bold" style={{color: '#1F55A3'}}>
                                                            {calculateAverageRating()}
                                                        </span>
                                                        <Star size={20} className="text-yellow-400 fill-current" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="px-8 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-all flex items-center space-x-2 shadow-md disabled:opacity-50"
                                            style={{backgroundColor: '#4DAEBD'}}
                                        >
                                            <Send size={20} />
                                            <span>{loading ? 'Envoi...' : 'Envoyer l\'évaluation'}</span>
                                        </button>
                                    </div>
                                </div>          
                            </div>
                        </div>
                    </div>  
    );
};

export default ServiceEvaluation;