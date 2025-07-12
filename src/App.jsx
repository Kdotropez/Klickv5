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
    const [config, setConfig] = useState(loadFromLocalStorage('timeSlotConfig') || {});
    const [selectedShop, setSelectedShop] = useState(loadFromLocalStorage('selectedShop') || '');
    const [selectedWeek, setSelectedWeek] = useState(loadFromLocalStorage('selectedWeek') || '');
    const [selectedEmployees, setSelectedEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`) || {});
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        saveToLocalStorage('selectedShop', selectedShop);
        saveToLocalStorage(`employees_${selectedShop}`, selectedEmployees);
        saveToLocalStorage('selectedWeek', selectedWeek);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
    }, [selectedShop, selectedEmployees, selectedWeek, planning]);

    const handleNext = (data) => {
        if (step === 1) setConfig(data);
        if (step === 2) setSelectedShop(data);
        if (step === 3) setSelectedWeek(data);
        if (step === 4) setSelectedEmployees(data);
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleBackToShop = () => {
        setStep(2);
    };

    const handleBackToWeek = () => {
        setStep(3);
    };

    const handleBackToConfig = () => {
        setStep(1);
    };

    const handleReset = () => {
        setConfig({});
        setSelectedShop('');
        setSelectedWeek('');
        setSelectedEmployees([]);
        setPlanning({});
        setStep(1);
        localStorage.clear();
        setFeedback('Toutes les données ont été réinitialisées.');
    };

    const exportLocalStorage = () => {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data_localStorage.json';
        a.click();
        URL.revokeObjectURL(url);
        setFeedback('✅ Données exportées dans votre dossier de téléchargement (ex. : C:\\Users\\lefev\\Downloads\\data_localStorage.json). Copiez ce fichier sur une clé USB pour le transférer.');
    };

    const importLocalStorage = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setFeedback('❌ Aucun fichier sélectionné.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                localStorage.clear();
                for (let key in data) {
                    localStorage.setItem(key, data[key]);
                }
                // Mettre à jour l'état pour refléter les données importées
                setConfig(loadFromLocalStorage('timeSlotConfig') || {});
                setSelectedShop(loadFromLocalStorage('selectedShop') || '');
                setSelectedWeek(loadFromLocalStorage('selectedWeek') || '');
                setSelectedEmployees(loadFromLocalStorage(`employees_${selectedShop}`) || []);
                setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`) || {});
                setFeedback('✅ Données importées avec succès depuis le fichier JSON !');
            } catch (error) {
                setFeedback('❌ Erreur de lecture du fichier JSON');
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
                    📤 Exporter
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
                        📥 Importer
                    </Button>
                </label>
            </div>
            {feedback && (
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('succès') ? '#4caf50' : '#e53935', marginBottom: '10px' }}>
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
                />
            )}
            {step === 4 && (
                <EmployeeSelection
                    onNext={handleNext}
                    onBack={handleBack}
                    onReset={handleReset}
                    selectedShop={selectedShop}
                    selectedEmployees={selectedEmployees}
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
                Klick-Planning - copyright © Nicolas Lefèvre
            </p>
        </div>
    );
};

export default App;