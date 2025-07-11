import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const ShopSelection = ({ onNext, onBack, onReset, selectedShop }) => {
    const [shops, setShops] = useState(loadFromLocalStorage('shops') || []);
    const [newShop, setNewShop] = useState('');
    const [error, setError] = useState('');

    const handleAddShop = () => {
        if (!newShop.trim()) {
            setError('Veuillez entrer un nom de boutique.');
            return;
        }
        if (shops.includes(newShop.trim().toUpperCase())) {
            setError('Cette boutique existe déjà.');
            return;
        }
        const updatedShops = [...shops, newShop.trim().toUpperCase()];
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
            saveToLocalStorage('selectedShop', '');
        }
    };

    const handleSelectShop = (shop) => {
        saveToLocalStorage('selectedShop', shop);
        onNext(shop);
    };

    const handleReset = () => {
        setShops([]);
        setNewShop('');
        setError('');
        saveToLocalStorage('shops', []);
        saveToLocalStorage('selectedShop', '');
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection de la boutique</h2>
            {error && <p className="error">{error}</p>}
            <div className="shop-input">
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="Nom de la boutique (ex. CANNES)"
                />
                <Button className="button-base button-primary" onClick={handleAddShop}>
                    Ajouter
                </Button>
            </div>
            <div className="shop-list">
                {shops.map((shop) => (
                    <div key={shop} className="shop-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedShop === shop}
                                onChange={() => handleSelectShop(shop)}
                            />
                            {shop}
                        </label>
                        <FaTimes className="delete-icon" onClick={() => handleDeleteShop(shop)} />
                    </div>
                ))}
            </div>
            <div className="button-group">
                <Button className="button-base button-primary" onClick={() => selectedShop && onNext(selectedShop)} disabled={!selectedShop}>
                    Valider
                </Button>
                <Button className="button-base button-retour" onClick={onBack}>
                    Retour
                </Button>
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default ShopSelection;