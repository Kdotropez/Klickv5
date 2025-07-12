import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const ShopSelection = ({ onNext, onBack, onReset, selectedShop }) => {
    const [shops, setShops] = useState(loadFromLocalStorage('shops') || []);
    const [newShop, setNewShop] = useState('');
    const [localSelectedShop, setSelectedShop] = useState(selectedShop || '');
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(null);

    useEffect(() => {
        saveToLocalStorage('shops', shops);
    }, [shops]);

    const handleAddShop = () => {
        if (!newShop.trim()) {
            setError('Le nom de la boutique ne peut pas être vide.');
            return;
        }
        if (shops.includes(newShop.toUpperCase())) {
            setError('Cette boutique existe déjà.');
            return;
        }
        setShops([...shops, newShop.toUpperCase()]);
        setNewShop('');
        setError('');
    };

    const handleShopSelect = (shop) => {
        setSelectedShop(shop);
        onNext(shop);
    };

    const handleDeleteShop = (shop) => {
        setShowDeleteModal(shop);
    };

    const confirmDelete = () => {
        setShops(shops.filter(s => s !== showDeleteModal));
        if (localSelectedShop === showDeleteModal) {
            setSelectedShop('');
        }
        setShowDeleteModal(null);
    };

    const handleReset = () => {
        setShops([]);
        setSelectedShop('');
        setNewShop('');
        setError('');
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la boutique
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="Nom de la boutique"
                    className="shop-input-field"
                    style={{ width: '160px' }}
                />
                <Button
                    className="button-base button-primary"
                    onClick={handleAddShop}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Ajouter
                </Button>
            </div>
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#333', fontSize: '14px', marginBottom: '10px' }}>
                Cliquez sur le nom d'une boutique pour continuer
            </p>
            {shops.length > 0 && (
                <div className="shop-list" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {shops.map(shop => (
                        <div key={shop} className="shop-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <Button
                                className="button-base shop-button"
                                onClick={() => handleShopSelect(shop)}
                                style={{
                                    backgroundColor: '#ff9800',
                                    color: '#fff',
                                    border: '1px solid #f57c00',
                                    width: '200px',
                                    padding: '8px 16px',
                                    fontSize: '14px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f57c00'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
                            >
                                {shop}
                            </Button>
                            <FaTimes
                                className="delete-icon"
                                onClick={() => handleDeleteShop(shop)}
                                style={{ marginLeft: '8px', color: '#e53935', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#d32f2f'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#e53935'}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <Button
                    className="button-base button-retour"
                    onClick={onBack}
                    style={{ backgroundColor: '#0d47a1', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                >
                    Retour
                </Button>
                <Button
                    className="button-base button-reinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                >
                    Réinitialiser
                </Button>
            </div>
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowDeleteModal(null)}>
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Confirmer la suppression
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Voulez-vous vraiment supprimer la boutique {showDeleteModal} ?
                        </p>
                        <div className="button-group">
                            <Button className="button-base button-primary" onClick={confirmDelete}>
                                Confirmer
                            </Button>
                            <Button className="button-base button-retour" onClick={() => setShowDeleteModal(null)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopSelection;