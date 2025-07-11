import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const ShopSelection = ({ onNext, onBack, onReset }) => {
    const [shops, setShops] = useState(loadFromLocalStorage('shops') || []);
    const [newShop, setNewShop] = useState('');
    const [selectedShop, setSelectedShop] = useState(loadFromLocalStorage('selectedShop') || '');
    const [error, setError] = useState('');

    const pastelColors = ['#d6e6ff', '#d4f4e2', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#e6f0fa'];

    const handleAddShop = () => {
        if (!newShop.trim()) {
            setError('Veuillez entrer un nom de boutique.');
            return;
        }
        const shopName = newShop.trim().toUpperCase();
        if (shops.includes(shopName)) {
            setError('Cette boutique existe déjà.');
            return;
        }
        const updatedShops = [...shops, shopName];
        setShops(updatedShops);
        saveToLocalStorage('shops', updatedShops);
        setNewShop('');
        setError('');
    };

    const handleDeleteShop = (shop) => {
        const updatedShops = shops.filter((s) => s !== shop);
        setShops(updatedShops);
        saveToLocalStorage('shops', updatedShops);
        if (selectedShop === shop) {
            setSelectedShop('');
            saveToLocalStorage('selectedShop', '');
        }
    };

    const handleSelectShop = (shop) => {
        setSelectedShop(shop);
        saveToLocalStorage('selectedShop', shop);
        onNext(shop);
    };

    const handleReset = () => {
        setShops([]);
        setNewShop('');
        setSelectedShop('');
        setError('');
        saveToLocalStorage('shops', []);
        saveToLocalStorage('selectedShop', '');
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la boutique
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div className="shop-input">
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="Ajoutez ici une Nouvelle Boutique"
                    className="shop-input-field"
                    aria-label="Nom de la boutique"
                />
                <Button
                    className="button-base button-primary shop-add-button"
                    onClick={handleAddShop}
                    aria-label="Ajouter une boutique"
                >
                    Ajouter
                </Button>
            </div>
            <div className="shop-list">
                {shops.map((shop, index) => (
                    <div key={shop} className="shop-item">
                        <button
                            className="shop-button"
                            onClick={() => handleSelectShop(shop)}
                            style={{
                                backgroundColor: pastelColors[index % pastelColors.length],
                                color: '#333',
                                border: `1px solid ${pastelColors[index % pastelColors.length]}`,
                            }}
                            aria-label={`Sélectionner la boutique ${shop}`}
                        >
                            <span>{shop}</span>
                            <FaTimes
                                className="delete-icon"
                                onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop); }}
                                aria-label={`Supprimer la boutique ${shop}`}
                            />
                        </button>
                    </div>
                ))}
            </div>
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <Button
                    className="button-base button-retour"
                    onClick={onBack}
                    style={{ backgroundColor: '#6c757d', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    aria-label="Retour à l’étape précédente"
                >
                    Retour
                </Button>
                <Button
                    className="button-base button-reinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    aria-label="Réinitialiser les boutiques"
                >
                    Réinitialiser
                </Button>
            </div>
            <footer style={{ textAlign: 'center', marginTop: '15px', fontFamily: 'Roboto, sans-serif', fontSize: '12px' }}>
                © Nicolas Lefèvre 2025
            </footer>
        </div>
    );
};

export default ShopSelection;