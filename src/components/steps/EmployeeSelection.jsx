import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const EmployeeSelection = ({ onNext, onBack, onReset, selectedShop, selectedEmployees }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [newEmployee, setNewEmployee] = useState('');
    const [error, setError] = useState('');

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setError('Veuillez entrer un nom d’employé.');
            return;
        }
        if (employees.includes(newEmployee.trim().toUpperCase())) {
            setError('Cet employé existe déjà.');
            return;
        }
        const updatedEmployees = [...employees, newEmployee.trim().toUpperCase()];
        setEmployees(updatedEmployees);
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        setNewEmployee('');
        setError('');
    };

    const handleDeleteEmployee = (employee) => {
        const updatedEmployees = employees.filter((e) => e !== employee);
        setEmployees(updatedEmployees);
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        if (selectedEmployees.includes(employee)) {
            const updatedSelected = selectedEmployees.filter((e) => e !== employee);
            saveToLocalStorage(`employees_${selectedShop}`, updatedSelected);
        }
    };

    const handleSelectEmployee = (employee) => {
        const updatedSelected = selectedEmployees.includes(employee)
            ? selectedEmployees.filter((e) => e !== employee)
            : [...selectedEmployees, employee];
        saveToLocalStorage(`employees_${selectedShop}`, updatedSelected);
        onNext(updatedSelected);
    };

    const handleReset = () => {
        setEmployees([]);
        setNewEmployee('');
        setError('');
        saveToLocalStorage(`employees_${selectedShop}`, []);
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection des employés</h2>
            {error && <p className="error">{error}</p>}
            <div className="shop-input">
                <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    placeholder="Nom de l’employé (ex. TITOUNE)"
                />
                <Button className="button-base button-primary" onClick={handleAddEmployee}>
                    Ajouter
                </Button>
            </div>
            <div className="shop-list">
                {employees.map((employee) => (
                    <div key={employee} className="shop-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedEmployees.includes(employee)}
                                onChange={() => handleSelectEmployee(employee)}
                            />
                            {employee}
                        </label>
                        <FaTimes className="delete-icon" onClick={() => handleDeleteEmployee(employee)} />
                    </div>
                ))}
            </div>
            <div className="button-group">
                <Button className="button-base button-primary" onClick={() => selectedEmployees.length > 0 && onNext(selectedEmployees)} disabled={selectedEmployees.length === 0}>
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

export default EmployeeSelection;