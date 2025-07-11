import { useState } from 'react';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

function App() {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState(null);
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    const handleNext = async (data) => {
        console.log('handleNext:', { step, data });
        await new Promise(resolve => setTimeout(resolve, 0));
        if (step === 1) {
            setConfig(data);
            setStep(2);
        } else if (step === 2) {
            setSelectedShop(data);
            setStep(3);
        } else if (step === 3) {
            setSelectedWeek(data);
            setStep(4);
        } else if (step === 4) {
            setSelectedEmployees(data);
            setStep(5);
        }
    };

    const handleBack = () => {
        console.log('handleBack:', { step });
        setStep(4);
    };

    const handleBackToShop = () => {
        console.log('handleBackToShop:', { step });
        setSelectedEmployees([]);
        setSelectedWeek('');
        setSelectedShop('');
        setStep(2);
    };

    const handleBackToWeek = () => {
        console.log('handleBackToWeek:', { step });
        setSelectedEmployees([]);
        setSelectedWeek('');
        setStep(3);
    };

    const handleBackToConfig = () => {
        console.log('handleBackToConfig:', { step });
        setSelectedEmployees([]);
        setSelectedWeek('');
        setSelectedShop('');
        setConfig(null);
        setStep(1);
    };

    const handleReset = () => {
        console.log('handleReset:', { step });
        if (step === 1) {
            setConfig(null);
        } else if (step === 2) {
            setSelectedShop('');
        } else if (step === 3) {
            setSelectedWeek('');
        } else if (step === 4) {
            setSelectedEmployees([]);
        } else if (step === 5) {
            setSelectedEmployees([]);
            setSelectedWeek('');
            setSelectedShop('');
            setConfig(null);
            setStep(1);
        }
    };

    return (
        <ErrorBoundary>
            <div className="App">
                {step === 1 && (
                    <TimeSlotConfig onNext={handleNext} onReset={handleReset} config={config} />
                )}
                {step === 2 && (
                    <ShopSelection onNext={handleNext} onBack={handleBack} onReset={handleReset} selectedShop={selectedShop} />
                )}
                {step === 3 && (
                    <WeekSelection onNext={handleNext} onBack={handleBack} onReset={handleReset} selectedWeek={selectedWeek} />
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
                        onBack={handleBack}
                        onBackToShop={handleBackToShop}
                        onBackToWeek={handleBackToWeek}
                        onBackToConfig={handleBackToConfig}
                        onReset={handleReset}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}

export default App;