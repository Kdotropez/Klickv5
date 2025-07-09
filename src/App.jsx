import { useState, useEffect } from 'react';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/steps/PlanningDisplay';
import ErrorBoundary from './components/common/ErrorBoundary';
import Footer from './components/common/Footer';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/localStorage';
import './index.css';

function App() {
    const [step, setStep] = useState(() => {
        const savedStep = loadFromLocalStorage('currentStep', 1);
        return typeof savedStep === 'number' && savedStep >= 1 && savedStep <= 5 ? savedStep : 1;
    });
    const [config, setConfig] = useState(() => {
        const savedConfig = loadFromLocalStorage('timeSlotConfig', {});
        return savedConfig.interval && savedConfig.startTime && savedConfig.endTime && savedConfig.timeSlots ? savedConfig : {};
    });
    const [selectedShop, setSelectedShop] = useState(() => {
        const savedShop = loadFromLocalStorage('selectedShop', '');
        return typeof savedShop === 'string' && savedShop.trim() ? savedShop : '';
    });
    const [selectedWeek, setSelectedWeek] = useState(() => {
        const savedWeek = loadFromLocalStorage('selectedWeek', '');
        return typeof savedWeek === 'string' && savedWeek.match(/^\d{4}-\d{2}-\d{2}$/) ? savedWeek : '';
    });
    const [selectedEmployees, setSelectedEmployees] = useState(() => {
        const savedEmployees = loadFromLocalStorage(`selectedEmployees_${selectedShop}`, []);
        return Array.isArray(savedEmployees) ? savedEmployees : [];
    });

    useEffect(() => {
        saveToLocalStorage('currentStep', step);
    }, [step]);

    useEffect(() => {
        const savedEmployees = loadFromLocalStorage(`selectedEmployees_${selectedShop}`, []);
        setSelectedEmployees(Array.isArray(savedEmployees) ? savedEmployees : []);
    }, [selectedShop]);

    const handleNext = (data) => {
        if (step === 1) setConfig(data);
        if (step === 2) setSelectedShop(data);
        if (step === 3) setSelectedWeek(data);
        if (step === 4) setSelectedEmployees(data);
        setStep(step + 1);
    };

    const handleBack = (targetStep) => {
        setStep(targetStep || step - 1);
    };

    const handleReset = () => {
        if (step === 1) {
            setConfig({});
            saveToLocalStorage('timeSlotConfig', {});
        }
        if (step === 2) {
            setSelectedShop('');
            saveToLocalStorage('selectedShop', '');
        }
        if (step === 3) {
            setSelectedWeek('');
            saveToLocalStorage('selectedWeek', '');
        }
        if (step === 4) {
            setSelectedEmployees([]);
            saveToLocalStorage(`selectedEmployees_${selectedShop}`, []);
        }
        if (step === 5) {
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
        }
    };

    const steps = [
        <TimeSlotConfig onNext={handleNext} onReset={handleReset} config={config} />,
        <ShopSelection onNext={handleNext} onBack={handleBack} onReset={handleReset} />,
        <WeekSelection
            onNext={handleNext}
            onBack={handleBack}
            onReset={handleReset}
            selectedShop={selectedShop}
        />,
        <EmployeeSelection
            onNext={handleNext}
            onBack={handleBack}
            onReset={handleReset}
            selectedShop={selectedShop}
            selectedWeek={selectedWeek}
        />,
        <PlanningDisplay
            config={config}
            selectedShop={selectedShop}
            selectedWeek={selectedWeek}
            selectedEmployees={selectedEmployees}
            onBack={handleBack}
            onReset={handleReset}
        />,
    ];

    return (
        <ErrorBoundary>
            <div className="app-container">
                <h1>Planning App</h1>
                {steps[step - 1]}
                <Footer />
            </div>
        </ErrorBoundary>
    );
}

export default App;