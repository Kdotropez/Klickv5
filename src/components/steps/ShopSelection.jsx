import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const ShopSelection = ({ onNext, onBack, onReset, selectedShop }) => {
    const [shops, setShops] = useState(() => loadFromLocalStorage('shops') || []);
    const [newShop, setNewShop] = useState('');
    const [selected, setSelected] = useState(selectedShop || '');
    const [error, setError] = useState('');

    useEffect(() => {
        // Sauvegarder uniquement lorsque shops change explicitement
        saveToLocalStorage('shops', shops);
        console.log('Saved shops to localStorage:', shops);
    }, [shops]);

    const addShop = () => {
        if (!newShop.trim()) {
            setError('Veuillez entrer un nom de boutique.');
            return;
        }
        const upperCaseShop = newShop.trim().toUpperCase();
        if (shops.includes(upperCaseShop)) {
            setError('Cette boutique existe déjà.');
            return;
        }
        setShops([...shops, upperCaseShop]);
        setSelected(upperCaseShop);
        setNewShop('');
        setError('');
        console.log('Added shop:', upperCaseShop, 'New shops list:', [...shops, upperCaseShop]);
    };

    const removeShop = (shop) => {
        setShops(shops.filter(s => s !== shop));
        if (selected === shop) setSelected('');
        console.log('Removed shop:', shop, 'New shops list:', shops.filter(s => s !== shop));
    };

    const handleValidate = () => {
        if (!selected) {
            setError('Veuillez sélectionner une boutique.');
            return;
        }
        console.log('Validated shop:', selected);
        onNext(selected);
    };

    const handleReset = () => {
        setShops([]);
        setSelected('');
        setNewShop('');
        setError('');
        saveToLocalStorage('shops', []);
        console.log('Reset shops');
        onReset({ feedback: 'Toutes les données ont été réinitialisées.' });
    };

    const handleBack = () => {
        if (!selected) {
            setError('Veuillez sélectionner une boutique avant de continuer.');
            return;
        }
        onBack();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la boutique
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Ajouter une boutique</label>
                    <input
                        type="text"
                        value={newShop}
                        onChange={(e) => setNewShop(e.target.value)}
                        style={{ width: '200px', fontFamily: 'Roboto, sans-serif' }}
                        placeholder="Nom de la boutique"
                    />
                    <Button
                        className="button-base button-primary"
                        onClick={addShop}
                        style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', marginLeft: '8px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                    >
                        Ajouter
                    </Button>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Boutiques</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', width: '300px' }}>
                        {shops.map(shop => (
                            <div key={shop} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={selected === shop}
                                    onChange={() => setSelected(selected === shop ? '' : shop)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontFamily: 'Roboto, sans-serif', color: selected === shop ? '#ff9800' : '#333' }}>
                                    {shop}
                                </span>
                                <FaTimes
                                    style={{ color: '#e53935', cursor: 'pointer' }}
                                    onClick={() => removeShop(shop)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <Button
                    className="button-base button-primary"
                    onClick={handleValidate}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Valider
                </Button>
                <Button
                    className="button-base button-retour"
                    onClick={handleBack}
                    style={{ backgroundColor: '#0d47a1', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0b3d91'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d47a1'}
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
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#333' }}>
                Klick-Planning - copyright © Nicolas Lefèvre
            </p>
        </div>
    );
};

export default ShopSelection;