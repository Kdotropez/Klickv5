import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const EmployeeSelection = ({ onNext, onBack, onReset, selectedShop, selectedEmployees }) => {
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [newEmployee, setNewEmployee] = useState('');
    const [selected, setSelected] = useState(selectedEmployees || []);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('Loaded employees for shop:', { selectedShop, employees });
        saveToLocalStorage(`employees_${selectedShop}`, employees);
        console.log('Saved employees to localStorage:', { key: `employees_${selectedShop}`, employees });
    }, [employees, selectedShop]);

    const addEmployee = () => {
        if (!newEmployee.trim()) {
            setError('Veuillez entrer un nom d’employé.');
            return;
        }
        const upperCaseEmployee = newEmployee.trim().toUpperCase();
        if (employees.includes(upperCaseEmployee)) {
            setError('Cet employé existe déjà.');
            return;
        }
        setEmployees([...employees, upperCaseEmployee]);
        setSelected([...selected, upperCaseEmployee]);
        setNewEmployee('');
        setError('');
        console.log('Added employee:', upperCaseEmployee, 'New employees list:', [...employees, upperCaseEmployee]);
    };

    const removeEmployee = (employee) => {
        setEmployees(employees.filter(e => e !== employee));
        setSelected(selected.filter(e => e !== employee));
        console.log('Removed employee:', employee, 'New employees list:', employees.filter(e => e !== employee));
    };

    const toggleEmployee = (employee) => {
        if (selected.includes(employee)) {
            setSelected(selected.filter(e => e !== employee));
        } else {
            setSelected([...selected, employee]);
        }
        console.log('Toggled employee:', employee, 'New selected list:', selected.includes(employee) ? selected.filter(e => e !== employee) : [...selected, employee]);
    };

    const handleValidate = () => {
        if (selected.length === 0) {
            setError('Veuillez sélectionner au moins un employé.');
            return;
        }
        saveToLocalStorage(`employees_${selectedShop}`, employees);
        console.log('Validated employees:', { selected, shop: selectedShop });
        onNext(selected);
    };

    const handleReset = () => {
        setEmployees([]);
        setSelected([]);
        setNewEmployee('');
        setError('');
        saveToLocalStorage(`employees_${selectedShop}`, []);
        console.log('Reset employees for shop:', selectedShop);
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection des employés pour {selectedShop}
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Ajouter un employé</label>
                    <input
                        type="text"
                        value={newEmployee}
                        onChange={(e) => setNewEmployee(e.target.value)}
                        style={{ width: '200px', fontFamily: 'Roboto, sans-serif' }}
                        placeholder="Nom de l'employé"
                    />
                    <Button
                        className="button-base button-primary"
                        onClick={addEmployee}
                        style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', marginLeft: '8px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                    >
                        Ajouter
                    </Button>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Employés</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', width: '300px' }}>
                        {employees.map(employee => (
                            <div key={employee} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(employee)}
                                    onChange={() => toggleEmployee(employee)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontFamily: 'Roboto, sans-serif', color: selected.includes(employee) ? '#ff9800' : '#333' }}>
                                    {employee}
                                </span>
                                <FaTimes
                                    style={{ color: '#e53935', cursor: 'pointer' }}
                                    onClick={() => removeEmployee(employee)}
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
                    onClick={onBack}
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

export default EmployeeSelection;