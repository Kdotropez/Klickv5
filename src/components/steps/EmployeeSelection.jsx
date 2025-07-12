import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const EmployeeSelection = ({ onNext, onBack, onReset, selectedShop, selectedEmployees }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [newEmployee, setNewEmployee] = useState('');
    const [localSelectedEmployees, setSelectedEmployees] = useState(selectedEmployees || employees);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(null);

    useEffect(() => {
        saveToLocalStorage(`employees_${selectedShop}`, employees);
        if (!selectedEmployees) {
            setSelectedEmployees(employees);
        }
    }, [employees, selectedShop, selectedEmployees]);

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setError('Le nom de l’employé ne peut pas être vide.');
            return;
        }
        if (employees.includes(newEmployee.toUpperCase())) {
            setError('Cet employé existe déjà.');
            return;
        }
        const updatedEmployees = [...employees, newEmployee.toUpperCase()];
        setEmployees(updatedEmployees);
        setSelectedEmployees([...localSelectedEmployees, newEmployee.toUpperCase()]);
        setNewEmployee('');
        setError('');
    };

    const handleEmployeeToggle = (employee) => {
        setSelectedEmployees(prev =>
            prev.includes(employee) ? prev.filter(e => e !== employee) : [...prev, employee]
        );
    };

    const handleDeleteEmployee = (employee) => {
        setShowDeleteModal(employee);
    };

    const confirmDelete = () => {
        setEmployees(employees.filter(e => e !== showDeleteModal));
        setSelectedEmployees(localSelectedEmployees.filter(e => e !== showDeleteModal));
        setShowDeleteModal(null);
    };

    const handleValidate = () => {
        if (localSelectedEmployees.length === 0) {
            setError('Veuillez sélectionner au moins un employé.');
            return;
        }
        onNext(localSelectedEmployees);
    };

    const handleReset = () => {
        setEmployees([]);
        setSelectedEmployees([]);
        setNewEmployee('');
        setError('');
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection des employés
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    placeholder="Nom de l’employé"
                    className="employee-input-field"
                    style={{ width: '160px' }}
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
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#333', fontSize: '14px', marginBottom: '10px' }}>
                Orange = employé activé, gris = désactivé. Cliquez pour changer, puis sur Valider.
            </p>
            {employees.length > 0 && (
                <div className="employee-list" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {employees.map(employee => (
                        <div key={employee} className="employee-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <Button
                                className="button-base employee-button"
                                onClick={() => handleEmployeeToggle(employee)}
                                style={{
                                    backgroundColor: localSelectedEmployees.includes(employee) ? '#ffe0b2' : '#bdbdbd',
                                    color: '#333',
                                    border: localSelectedEmployees.includes(employee) ? '1px solid #ffcc80' : '1px solid #9e9e9e',
                                    width: '200px',
                                    padding: '8px 16px',
                                    fontSize: '14px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = localSelectedEmployees.includes(employee) ? '#ffcc80' : '#9e9e9e'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = localSelectedEmployees.includes(employee) ? '#ffe0b2' : '#bdbdbd'}
                            >
                                {employee}
                            </Button>
                            <FaTimes
                                className="delete-icon"
                                onClick={() => handleDeleteEmployee(employee)}
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
                    className="button-base button-primary"
                    onClick={handleValidate}
                    style={{
                        backgroundColor: '#1e88e5',
                        color: '#fff',
                        padding: '8px 16px',
                        fontSize: '14px',
                        width: employees.length > 0 ? '200px' : 'auto'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Valider
                </Button>
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
                            Voulez-vous vraiment supprimer l’employé {showDeleteModal} ?
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

export default EmployeeSelection;