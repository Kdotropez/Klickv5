import { useState, useEffect } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const EmployeeSelection = ({ onNext, onBack, onReset, selectedShop, selectedEmployees }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`, []) || []);
    const [newEmployee, setNewEmployee] = useState('');
    const [currentEmployees, setCurrentEmployees] = useState(selectedEmployees || []);
    const [feedback, setFeedback] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmployee, setResetEmployee] = useState('');

    useEffect(() => {
        // Charger les employés sauvegardés pour la boutique
        const storedEmployees = loadFromLocalStorage(`employees_${selectedShop}`, []) || [];
        setEmployees(storedEmployees);
        console.log('Loaded employees for shop:', selectedShop, storedEmployees);
    }, [selectedShop]);

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setFeedback('Erreur: Veuillez entrer un nom d\'employe valide.');
            return;
        }
        const newEmployeeUpperCase = newEmployee.trim().toUpperCase();
        if (employees.includes(newEmployeeUpperCase)) {
            setFeedback('Erreur: Cet employe existe deja.');
            return;
        }

        const updatedEmployees = [...employees, newEmployeeUpperCase];
        setEmployees(updatedEmployees);
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        setCurrentEmployees([...currentEmployees, newEmployeeUpperCase]);
        setNewEmployee('');
        setFeedback('Succes: Employe ajoute avec succes.');
        console.log('Added new employee:', newEmployeeUpperCase, 'Updated employees:', updatedEmployees);
    };

    const handleEmployeeSelect = (employee) => {
        if (currentEmployees.includes(employee)) {
            setCurrentEmployees(currentEmployees.filter(emp => emp !== employee));
        } else {
            setCurrentEmployees([...currentEmployees, employee]);
        }
        setFeedback('');
    };

    const handleNext = () => {
        if (currentEmployees.length === 0) {
            setFeedback('Erreur: Veuillez selectionner au moins un employe.');
            return;
        }
        onNext(currentEmployees);
    };

    const handleReset = () => {
        console.log('Opening reset modal:', { employees });
        setShowResetModal(true);
    };

    const confirmReset = () => {
        console.log('Confirm reset:', { resetEmployee, employees });
        if (!resetEmployee) {
            setFeedback('Erreur: Veuillez selectionner une option.');
            return;
        }

        if (resetEmployee === 'all') {
            // Réinitialiser tous les employés
            setEmployees([]);
            setCurrentEmployees([]);
            setFeedback('Succes: Tous les employes ont ete reinitialises.');
            saveToLocalStorage(`employees_${selectedShop}`, []);
            // Supprimer les données des employés dans les plannings
            const planningKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
            planningKeys.forEach(key => {
                const planning = loadFromLocalStorage(key, {});
                const updatedPlanning = {};
                Object.keys(planning).forEach(emp => {
                    if (!employees.includes(emp)) {
                        updatedPlanning[emp] = planning[emp];
                    }
                });
                if (Object.keys(updatedPlanning).length > 0) {
                    saveToLocalStorage(key, updatedPlanning);
                } else {
                    localStorage.removeItem(key);
                }
            });
            console.log(`Cleared all employees for shop ${selectedShop} from localStorage`);
        } else {
            // Réinitialiser un employé spécifique
            const updatedEmployees = employees.filter(emp => emp !== resetEmployee);
            setEmployees(updatedEmployees);
            setCurrentEmployees(currentEmployees.filter(emp => emp !== resetEmployee));
            saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
            setFeedback(`Succes: Employe ${resetEmployee} reinitialise.`);
            // Supprimer les données de l'employé dans les plannings
            const planningKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
            planningKeys.forEach(key => {
                const planning = loadFromLocalStorage(key, {});
                const updatedPlanning = { ...planning };
                delete updatedPlanning[resetEmployee];
                if (Object.keys(updatedPlanning).length > 0) {
                    saveToLocalStorage(key, updatedPlanning);
                } else {
                    localStorage.removeItem(key);
                }
            });
            console.log(`Cleared data for employee ${resetEmployee} from shop ${selectedShop}`);
        }

        setShowResetModal(false);
        setResetEmployee('');
    };

    return (
        <div className="employee-selection-container">
            <div style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: 'fit-content',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}>
                {selectedShop || 'Aucune boutique sélectionnée'}
            </div>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                Selection des employes
            </h2>
            {feedback && (
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('Succes') ? '#4caf50' : '#e53935', marginBottom: '10px' }}>
                    {feedback}
                </p>
            )}
            <div className="employee-input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Ajouter un employe</h3>
                <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    placeholder="Nom de l'employe"
                    style={{ padding: '8px', fontSize: '14px', width: '200px', marginBottom: '10px' }}
                />
                <Button
                    className="button-base button-primary"
                    onClick={handleAddEmployee}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Ajouter
                </Button>
            </div>
            <div className="employee-selector" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Employes existants</h3>
                {employees.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucun employe disponible.
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {employees.map(employee => (
                            <li key={employee} style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                <div
                                    style={{
                                        width: '250px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        backgroundColor: currentEmployees.includes(employee) ? '#f28c38' : '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleEmployeeSelect(employee)}
                                >
                                    <span style={{
                                        fontFamily: 'Roboto, sans-serif',
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: currentEmployees.includes(employee) ? '#fff' : '#000'
                                    }}>
                                        {employee}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <Button className="button-base button-retour" onClick={onBack}>
                    Retour
                </Button>
                <Button className="button-base button-primary" onClick={handleNext}>
                    Valider
                </Button>
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Reinitialiser
                </Button>
            </div>
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowResetModal(false)}>
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Confirmer la reinitialisation
                        </h3>
                        <div className="form-group">
                            <label>Reinitialiser</label>
                            <select value={resetEmployee} onChange={(e) => setResetEmployee(e.target.value)}>
                                <option value="">Choisir une option</option>
                                <option value="all">Tous les employes</option>
                                {employees.map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                        <div className="button-group">
                            <Button className="button-base button-primary" onClick={confirmReset}>
                                Confirmer
                            </Button>
                            <Button className="button-base button-retour" onClick={() => setShowResetModal(false)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeSelection;