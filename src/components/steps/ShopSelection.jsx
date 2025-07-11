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
            <div className="shop-input" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="Nom de la boutique (ex. CANNES)"
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        flex: '1',
                        minWidth: '200px'
                    }}
                    aria-label="Nom de la boutique"
                />
                <Button
                    className="button-base button-primary"
                    onClick={handleAddShop}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                    aria-label="Ajouter une boutique"
                >
                    Ajouter
                </Button>
            </div>
            <div className="shop-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {shops.map((shop, index) => (
                    <div key={shop} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                            onClick={() => handleSelectShop(shop)}
                            style={{
                                backgroundColor: selectedShop === shop ? pastelColors[index % pastelColors.length] : '#f0f0f0',
                                color: selectedShop === shop ? '#fff' : '#333',
                                padding: '10px',
                                borderRadius: '6px',
                                border: `1px solid ${pastelColors[index % pastelColors.length]}`,
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '14px',
                                cursor: 'pointer',
                                flex: '1',
                                transition: 'transform 0.2s, background-color 0.2s',
                                transform: selectedShop === shop ? 'scale(1.05)' : 'none'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = selectedShop === shop ? 'scale(1.05)' : 'scale(1)'}
                            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.target.style.transform = 'scale(1.05)'}
                            aria-label={`Sélectionner la boutique ${shop}`}
                        >
                            {shop}
                        </button>
                        <FaTimes
                            className="delete-icon"
                            onClick={() => handleDeleteShop(shop)}
                            style={{ cursor: 'pointer', color: '#e53935', fontSize: '16px' }}
                            aria-label={`Supprimer la boutique ${shop}`}
                        />
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