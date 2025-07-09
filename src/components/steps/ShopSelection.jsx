import { useState, useEffect } from 'react';
import { FaTimes, FaUndo } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const ShopSelection = ({ onNext, onBack, onReset }) => {
    const [shops, setShops] = useState(loadFromLocalStorage('shops', []));
    const [newShop, setNewShop] = useState('');
    const [selectedShop, setSelectedShop] = useState('');
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
        setShops(shops.filter((s) => s !== shop));
        if (selectedShop === shop) {
            setSelectedShop('');
        }
    };

    const handleSelectShop = (shop) => {
        setSelectedShop(shop);
        setError('');
    };

    const handleSubmit = () => {
        if (!selectedShop) {
            setError('Veuillez sélectionner une boutique.');
            return;
        }
        saveToLocalStorage('selectedShop', selectedShop);
        onNext(selectedShop);
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
            <h2>Sélection des boutiques</h2>
            {error && <p className="error">{error}</p>}
            <div className="shop-input">
                <label>
                    Ajouter une boutique :
                    <input
                        type="text"
                        value={newShop}
                        onChange={(e) => setNewShop(e.target.value)}
                        placeholder="Ex. : CANNES"
                    />
                </label>
                <Button onClick={handleAddShop}>Ajouter</Button>
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
                <Button onClick={handleSubmit}>Valider</Button>
                <Button onClick={onBack} variant="secondary">Retour</Button>
                <Button onClick={handleReset} variant="reset">
                    <FaUndo /> Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default ShopSelection;