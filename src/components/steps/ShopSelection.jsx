import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const ShopSelection = ({ onNext, onBack, onReset, selectedShop }) => {
    const [shops, setShops] = useState(loadFromLocalStorage('shops') || []);
    const [newShop, setNewShop] = useState('');
    const [localSelectedShop, setLocalSelectedShop] = useState(selectedShop || '');
    const [error, setError] = useState('');

    useEffect(() => {
        saveToLocalStorage('shops', shops);
    }, [shops]);

    const handleAddShop = () => {
        if (!newShop.trim()) {
            setError('Le nom de la boutique ne peut pas être vide.');
            return;
        }
        if (shops.includes(newShop.trim().toUpperCase())) {
            setError('Cette boutique existe déjà.');
            return;
        }
        setShops([...shops, newShop.trim().toUpperCase()]);
        setNewShop('');
        setError('');
    };

    const handleDeleteShop = (shop) => {
        setShops(shops.filter(s => s !== shop));
        if (localSelectedShop === shop) {
            setLocalSelectedShop('');
        }
    };

    const handleSelectShop = (shop) => {
        setLocalSelectedShop(shop);
        setError('');
        saveToLocalStorage('selectedShop', shop);
        onNext(shop);
    };

    const handleReset = () => {
        setNewShop('');
        setLocalSelectedShop('');
        setError('');
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection de la boutique</h2>
            {error && <p className="error">{error}</p>}
            <div className="shop-input" style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="Nom de la boutique"
                    className="shop-input-field"
                    style={{ width: '160px' }}
                />
                <Button
                    className="button-base shop-add-button"
                    onClick={handleAddShop}
                    style={{ backgroundColor: '#1e88e5', color: '#fff' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Ajouter
                </Button>
            </div>
            <div className="shop-list">
                {shops.map(shop => (
                    <div key={shop} className="shop-item">
                        <button
                            className="shop-button"
                            onClick={() => handleSelectShop(shop)}
                            style={{
                                backgroundColor: localSelectedShop === shop ? '#ffe0b2' : '#ff9800',
                                color: '#333',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = localSelectedShop === shop ? '#ffcc80' : '#f57c00'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = localSelectedShop === shop ? '#ffe0b2' : '#ff9800'}
                        >
                            {shop}
                            <FaTimes
                                className="delete-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShop(shop);
                                }}
                            />
                        </button>
                    </div>
                ))}
            </div>
            <div className="button-group">
                {onBack && (
                    <Button className="button-base button-retour" onClick={onBack}>
                        Retour
                    </Button>
                )}
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default ShopSelection;