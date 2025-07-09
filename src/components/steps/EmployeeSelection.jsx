import { useState, useEffect } from 'react';
import { FaTimes, FaUndo } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const EmployeeSelection = ({ onNext, onBack, onReset, selectedShop, selectedWeek }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`, []));
    const [newEmployee, setNewEmployee] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState(loadFromLocalStorage(`selectedEmployees_${selectedShop}_${selectedWeek}`, []));
    const [error, setError] = useState('');

    useEffect(() => {
        saveToLocalStorage(`employees_${selectedShop}`, employees);
    }, [employees, selectedShop]);

    useEffect(() => {
        saveToLocalStorage(`selectedEmployees_${selectedShop}_${selectedWeek}`, selectedEmployees);
    }, [selectedEmployees, selectedShop, selectedWeek]);

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setError('Le nom de l’employé ne peut pas être vide.');
            return;
        }
        if (employees.includes(newEmployee.trim().toUpperCase())) {
            setError('Cet employé existe déjà.');
            return;
        }
        setEmployees([...employees, newEmployee.trim().toUpperCase()]);
        setNewEmployee('');
        setError('');
    };

    const handleDeleteEmployee = (employee) => {
        setEmployees(employees.filter((e) => e !== employee));
        setSelectedEmployees(selectedEmployees.filter((e) => e !== employee));
    };

    const handleSelectEmployee = (employee) => {
        if (selectedEmployees.includes(employee)) {
            setSelectedEmployees(selectedEmployees.filter((e) => e !== employee));
        } else {
            setSelectedEmployees([...selectedEmployees, employee]);
        }
    };

    const handleSubmit = () => {
        if (selectedEmployees.length === 0) {
            setError('Veuillez sélectionner au moins un employé.');
            return;
        }
        saveToLocalStorage(`selectedEmployees_${selectedShop}_${selectedWeek}`, selectedEmployees);
        onNext(selectedEmployees);
    };

    const handleReset = () => {
        setEmployees([]);
        setNewEmployee('');
        setSelectedEmployees([]);
        setError('');
        saveToLocalStorage(`employees_${selectedShop}`, []);
        saveToLocalStorage(`selectedEmployees_${selectedShop}_${selectedWeek}`, []);
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection des employés</h2>
            {error && <p className="error">{error}</p>}
            <div className="shop-input">
                <label>
                    Ajouter un employé :
                    <input
                        type="text"
                        value={newEmployee}
                        onChange={(e) => setNewEmployee(e.target.value)}
                        placeholder="Ex. : TITOUNE"
                    />
                </label>
                <Button onClick={handleAddEmployee}>Ajouter</Button>
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
                <Button onClick={handleSubmit}>Valider</Button>
                <Button onClick={onBack} variant="secondary">Retour</Button>
                <Button onClick={handleReset} variant="reset">
                    <FaUndo /> Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default EmployeeSelection;