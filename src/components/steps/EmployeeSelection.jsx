import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const EmployeeSelection = ({ onNext, onBack, onReset, selectedShop, selectedEmployees }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [newEmployee, setNewEmployee] = useState('');
    const [error, setError] = useState('');

    const pastelColors = ['#d6e6ff', '#d4f4e2', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#e6f0fa'];

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setError('Veuillez entrer un nom d’employé.');
            return;
        }
        const employeeName = newEmployee.trim().toUpperCase();
        if (employees.includes(employeeName)) {
            setError('Cet employé existe déjà.');
            return;
        }
        const updatedEmployees = [...employees, employeeName];
        setEmployees(updatedEmployees);
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        setNewEmployee('');
        setError('');
    };

    const handleDeleteEmployee = (employee) => {
        const updatedEmployees = employees.filter((e) => e !== employee);
        setEmployees(updatedEmployees);
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        const updatedSelected = selectedEmployees.filter((e) => e !== employee);
        saveToLocalStorage(`selectedEmployees_${selectedShop}`, updatedSelected);
        onNext(updatedSelected);
    };

    const handleSelectEmployee = (employee) => {
        const updatedSelected = selectedEmployees.includes(employee)
            ? selectedEmployees.filter((e) => e !== employee)
            : [...selectedEmployees, employee];
        saveToLocalStorage(`selectedEmployees_${selectedShop}`, updatedSelected);
        onNext(updatedSelected);
    };

    const handleReset = () => {
        setEmployees([]);
        setNewEmployee('');
        setError('');
        saveToLocalStorage(`employees_${selectedShop}`, []);
        saveToLocalStorage(`selectedEmployees_${selectedShop}`, []);
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection des employés
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div className="employee-list">
                {employees.map((employee, index) => (
                    <div key={employee} className="employee-item">
                        <button
                            className="employee-button"
                            onClick={() => handleSelectEmployee(employee)}
                            style={{
                                backgroundColor: selectedEmployees.includes(employee) ? pastelColors[index % pastelColors.length] : pastelColors[index % pastelColors.length],
                                color: '#333',
                                border: `1px solid ${pastelColors[index % pastelColors.length]}`,
                            }}
                            aria-label={`Sélectionner l’employé ${employee}`}
                        >
                            <span>{employee}</span>
                            <FaTimes
                                className="delete-icon"
                                onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee); }}
                                aria-label={`Supprimer l’employé ${employee}`}
                            />
                        </button>
                    </div>
                ))}
            </div>
            <div className="employee-input">
                <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    placeholder="Ajoutez ici un Nouvel Employé"
                    className="employee-input-field"
                    aria-label="Nom de l’employé"
                />
                <Button
                    className="button-base button-primary employee-add-button"
                    onClick={handleAddEmployee}
                    aria-label="Ajouter un employé"
                >
                    Ajouter
                </Button>
            </div>
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
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
                    aria-label="Réinitialiser les employés"
                >
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default EmployeeSelection;