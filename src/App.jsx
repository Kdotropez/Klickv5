import { useState, useEffect } from 'react';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import Button from './components/common/Button';
import './assets/styles.css';

const App = () => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState(loadFromLocalStorage('timeSlotConfig', {}) || {});
    const [selectedShop, setSelectedShop] = useState(loadFromLocalStorage('selectedShop', '') || '');
    const [selectedWeek, setSelectedWeek] = useState(loadFromLocalStorage('selectedWeek', '') || '');
    const [selectedEmployees, setSelectedEmployees] = useState(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || []);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        saveToLocalStorage('selectedShop', selectedShop);
        saveToLocalStorage('selectedWeek', selectedWeek);
        saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
        console.log('Saved to localStorage:', { selectedShop, selectedWeek, selectedEmployees, planning });
    }, [selectedShop, selectedEmployees, selectedWeek, planning]);

    useEffect(() => {
        if (selectedShop && selectedWeek) {
            const newPlanning = loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {};
            setPlanning(newPlanning);
            const newSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || [];
            setSelectedEmployees(newSelectedEmployees);
            console.log('Reloaded from localStorage:', {
                planningKey: `planning_${selectedShop}_${selectedWeek}`,
                planning: newPlanning,
                employeesKey: `selected_employees_${selectedShop}_${selectedWeek}`,
                employees: newSelectedEmployees
            });
        }
    }, [selectedShop, selectedWeek]);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const handleNext = (data) => {
        console.log('handleNext called with data:', data, 'for step:', step);
        setFeedback('');
        if (step === 1) {
            setConfig(data);
            setStep(step + 1);
        } else if (step === 2) {
            setSelectedShop(data);
            setSelectedEmployees(loadFromLocalStorage(`selected_employees_${data}_${selectedWeek}`, []) || []);
            setPlanning(loadFromLocalStorage(`planning_${data}_${selectedWeek}`, {}) || {});
            saveToLocalStorage('selectedShop', data);
            setStep(step + 1);
        } else if (step === 3) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!data || !dateRegex.test(data) || isNaN(new Date(data).getTime())) {
                setFeedback('Erreur: Veuillez sélectionner une semaine valide (format YYYY-MM-DD).');
                console.log('Invalid week data:', data);
                return;
            }
            setSelectedWeek(data);
            setSelectedEmployees(loadFromLocalStorage(`selected_employees_${selectedShop}_${data}`, []) || []);
            setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${data}`, {}) || {});
            setStep(step + 1);
        } else if (step === 4) {
            setSelectedEmployees(data);
            saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, data);
            setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        console.log('handleBack called, current step:', step);
        if (step > 1) {
            setStep(step - 1);
            const storedSelectedShop = loadFromLocalStorage('selectedShop', '') || '';
            setSelectedShop(storedSelectedShop);
            setSelectedEmployees(loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []) || []);
            setPlanning(loadFromLocalStorage(`planning_${storedSelectedShop}_${selectedWeek}`, {}) || {});
            console.log('Returning to step:', step - 1, 'Restored selectedShop:', storedSelectedShop, 'Restored employees:', loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []));
        }
    };

    const handleBackToShop = () => {
        console.log('handleBackToShop called');
        setStep(2);
        const storedSelectedShop = loadFromLocalStorage('selectedShop', '') || '';
        setSelectedShop(storedSelectedShop);
        setSelectedEmployees(loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []) || []);
        setPlanning(loadFromLocalStorage(`planning_${storedSelectedShop}_${selectedWeek}`, {}) || {});
        console.log('Restored selectedShop:', storedSelectedShop, 'Restored employees:', loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []));
    };

    const handleBackToWeek = () => {
        console.log('handleBackToWeek called');
        setStep(3);
        setSelectedWeek(loadFromLocalStorage('selectedWeek', '') || '');
        setSelectedEmployees(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || []);
        setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
    };

    const handleBackToConfig = () => {
        console.log('handleBackToConfig called');
        setStep(1);
        setConfig(loadFromLocalStorage('timeSlotConfig', {}) || {});
        setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
    };

    const handleReset = ({ feedback: resetFeedback }) => {
        setConfig({});
        setSelectedShop('');
        setSelectedWeek('');
        setSelectedEmployees([]);
        setPlanning({});
        setStep(1);
        localStorage.clear();
        setFeedback(resetFeedback || 'Succès: Toutes les données ont été réinitialisées.');
        console.log('Reset all data and cleared localStorage');
    };

    const exportLocalStorage = () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = loadFromLocalStorage(key, null);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setFeedback('Succès: Données exportées avec succès dans votre dossier de téléchargement.');
    };

    const validateImportedData = (data) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validKeys = ['shops', 'selectedWeek', 'timeSlotConfig'];
        const errors = [];

        for (const key in data) {
            if (!validKeys.includes(key) && !key.startsWith('employees_') && !key.startsWith('selected_employees_') && !key.startsWith('planning_') && !key.startsWith('copied_') && !key.startsWith('lastPlanning_')) {
                errors.push(`Clé non reconnue: ${key}`);
            }
            if (key.startsWith('planning_') || key === 'selectedWeek') {
                const datePart = key.startsWith('planning_') ? key.split('_')[2] : data[key];
                if (datePart && (!dateRegex.test(datePart) || isNaN(new Date(datePart).getTime()))) {
                    errors.push(`Date invalide dans ${key}: ${datePart}`);
                }
            }
            if (key === 'shops' && !Array.isArray(data[key])) {
                errors.push('La clé "shops" doit être un tableau.');
            }
            if (key === 'timeSlotConfig') {
                const config = data[key];
                if (!config || typeof config !== 'object' || !config.interval || !config.startTime || !config.endTime || !Array.isArray(config.timeSlots)) {
                    errors.push('La clé "timeSlotConfig" doit contenir interval, startTime, endTime et timeSlots.');
                }
            }
            if (key.startsWith('employees_') && !Array.isArray(data[key])) {
                errors.push(`La clé ${key} doit être un tableau.`);
            }
            if (key.startsWith('selected_employees_') && !Array.isArray(data[key])) {
                errors.push(`La clé ${key} doit être un tableau.`);
            }
        }

        return errors.length === 0 ? null : errors.join('; ');
    };

    const importLocalStorage = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setFeedback('Erreur: Aucun fichier sélectionné.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const validationError = validateImportedData(data);
                if (validationError) {
                    setFeedback(`Erreur: Erreur dans les données importées: ${validationError}`);
                    console.error('Validation error:', validationError);
                    return;
                }

                localStorage.clear();
                for (const key in data) {
                    saveToLocalStorage(key, data[key]);
                }
                setConfig(loadFromLocalStorage('timeSlotConfig', {}) || {});
                setSelectedShop(loadFromLocalStorage('selectedShop', '') || '');
                setSelectedWeek(loadFromLocalStorage('selectedWeek', '') || '');
                setSelectedEmployees(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || []);
                setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
                setFeedback('Succès: Données importées avec succès depuis le fichier JSON.');
            } catch (error) {
                setFeedback('Erreur: Erreur de lecture du fichier JSON.');
                console.error('Error reading JSON file:', error);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="app-container">
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                <Button
                    className="button-base button-primary"
                    onClick={exportLocalStorage}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Exporter
                </Button>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="file"
                        accept=".json"
                        onChange={importLocalStorage}
                        style={{ display: 'none' }}
                    />
                    <Button
                        className="button-base button-primary"
                        onClick={(e) => e.target.previousSibling.click()}
                        style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                    >
                        Importer
                    </Button>
                </label>
            </div>
            {feedback && (
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('Succès') ? '#4caf50' : '#e53935', marginBottom: '10px' }}>
                    {feedback}
                </p>
            )}
            {step === 1 && (
                <TimeSlotConfig
                    onNext={handleNext}
                    onReset={handleReset}
                    config={config}
                />
            )}
            {step === 2 && (
                <ShopSelection
                    onNext={handleNext}
                    onBack={handleBack}
                    onReset={handleReset}
                    selectedShop={selectedShop}
                />
            )}
            {step === 3 && (
                <WeekSelection
                    onNext={handleNext}
                    onBack={handleBack}
                    onReset={handleReset}
                    selectedWeek={selectedWeek}
                    selectedShop={selectedShop}
                />
            )}
            {step === 4 && (
                <EmployeeSelection
                    onNext={handleNext}
                    onBack={handleBack}
                    onReset={handleReset}
                    selectedShop={selectedShop}
                    selectedEmployees={selectedEmployees}
                    selectedWeek={selectedWeek}
                />
            )}
            {step === 5 && (
                <PlanningDisplay
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    onBack={handleBack}
                    onBackToShop={handleBackToShop}
                    onBackToWeek={handleBackToWeek}
                    onBackToConfig={handleBackToConfig}
                    onReset={handleReset}
                />
            )}
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#333' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </p>
        </div>
    );
};

export default App;