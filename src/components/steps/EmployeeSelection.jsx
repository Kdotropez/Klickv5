import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const EmployeeSelection = ({ selectedShop, onNext, onBack, onReset }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [newEmployee, setNewEmployee] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState(employees);
    const [error, setError] = useState('');

    useEffect(() => {
        saveToLocalStorage(`employees_${selectedShop}`, employees);
        // Mettre à jour selectedEmployees pour inclure tous les employés par défaut
        setSelectedEmployees(employees);
    }, [employees, selectedShop]);

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setError('Le nom de l’employé ne peut pas être vide.');
            return;
        }
        if (employees.includes(newEmployee.trim().toUpperCase())) {
            setError('Cet employé existe déjà.');
            return;
        }
        const updatedEmployees = [...employees, newEmployee.trim().toUpperCase()];
        setEmployees(updatedEmployees);
        setSelectedEmployees(updatedEmployees);
        setNewEmployee('');
        setError('');
    };

    const handleDeleteEmployee = (employee) => {
        const updatedEmployees = employees.filter(e => e !== employee);
        setEmployees(updatedEmployees);
        setSelectedEmployees(selectedEmployees.filter(e => e !== employee));
    };

    const handleToggleEmployee = (employee) => {
        setSelectedEmployees(
            selectedEmployees.includes(employee)
                ? selectedEmployees.filter(e => e !== employee)
                : [...selectedEmployees, employee]
        );
        setError('');
    };

    const handleValidate = () => {
        if (selectedEmployees.length === 0) {
            setError('Veuillez sélectionner au moins un employé.');
            return;
        }
        saveToLocalStorage(`selectedEmployees_${selectedShop}`, selectedEmployees);
        onNext(selectedEmployees);
    };

    const handleReset = () => {
        setNewEmployee('');
        setSelectedEmployees(employees);
        setError('');
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection des employés</h2>
            {error && <p className="error">{error}</p>}
            <div className="employee-input" style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    placeholder="Nom de l’employé"
                    className="employee-input-field"
                    style={{ width: '160px' }}
                />
                <Button
                    className="button-base employee-add-button"
                    onClick={handleAddEmployee}
                    style={{ backgroundColor: '#1e88e5', color: '#fff' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Ajouter
                </Button>
            </div>
            <div className="employee-list">
                {employees.map(employee => (
                    <div key={employee} className="employee-item">
                        <button
                            className={`employee-button ${selectedEmployees.includes(employee) ? 'selected' : ''}`}
                            onClick={() => handleToggleEmployee(employee)}
                            style={{
                                backgroundColor: selectedEmployees.includes(employee) ? '#ffe0b2' : '#bdbdbd',
                                color: '#333',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = selectedEmployees.includes(employee) ? '#ffcc80' : '#9e9e9e'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedEmployees.includes(employee) ? '#ffe0b2' : '#bdbdbd'}
                        >
                            {employee}
                            <FaTimes
                                className="delete-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEmployee(employee);
                                }}
                            />
                        </button>
                    </div>
                ))}
            </div>
            <div className="button-group">
                <Button className="button-base button-retour" onClick={onBack}>
                    Retour
                </Button>
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

export default EmployeeSelection;