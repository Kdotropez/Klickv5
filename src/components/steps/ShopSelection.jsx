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
    };

    const handleValidate = () => {
        if (!localSelectedShop) {
            setError('Veuillez sélectionner une boutique.');
            return;
        }
        saveToLocalStorage('selectedShop', localSelectedShop);
        onNext(localSelectedShop);
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
                <Button className="button-base shop-add-button" onClick={handleAddShop}>
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
                                backgroundColor: localSelectedShop === shop ? '#d4f4e2' : '#4caf50',
                                color: '#333',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = localSelectedShop === shop ? '#a5d6a7' : '#388e3c'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = localSelectedShop === shop ? '#d4f4e2' : '#4caf50'}
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
                <Button className="button-base button-validate" onClick={handleValidate}>
                    Valider
                </Button>
            </div>
        </div>
    );
};

export default ShopSelection;