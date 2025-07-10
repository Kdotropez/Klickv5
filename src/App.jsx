import { useState } from 'react';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import { loadFromLocalStorage } from './utils/localStorage';
import './assets/styles.css';

const App = () => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState(loadFromLocalStorage('timeSlotConfig') || {});
    const [selectedShop, setSelectedShop] = useState(loadFromLocalStorage('selectedShop') || '');
    const [selectedWeek, setSelectedWeek] = useState(loadFromLocalStorage('selectedWeek') || '');
    const [selectedEmployees, setSelectedEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`) || []);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`) || {});

    const handleReset = () => {
        setStep(1);
        setConfig({});
        setSelectedShop('');
        setSelectedWeek('');
        setSelectedEmployees([]);
        setPlanning({});
        localStorage.clear();
    };

    return (
        <div className="app-container">
            {step === 1 && (
                <TimeSlotConfig
                    onNext={(configData) => {
                        setConfig(configData);
                        setStep(2);
                    }}
                    onReset={handleReset}
                    config={config}
                />
            )}
            {step === 2 && (
                <ShopSelection
                    onNext={(shop) => {
                        setSelectedShop(shop);
                        setStep(3);
                    }}
                    onBack={() => setStep(1)}
                    onReset={handleReset}
                    selectedShop={selectedShop}
                />
            )}
            {step === 3 && (
                <WeekSelection
                    onNext={(week) => {
                        setSelectedWeek(week);
                        setStep(4);
                    }}
                    onBack={() => setStep(2)}
                    onReset={handleReset}
                    selectedWeek={selectedWeek}
                />
            )}
            {step === 4 && (
                <EmployeeSelection
                    onNext={(employees) => {
                        setSelectedEmployees(employees);
                        setStep(5);
                    }}
                    onBack={() => setStep(3)}
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
                    setPlanning={setPlanning}
                    setStep={setStep}
                />
            )}
            <footer>Klick-Planning - copyright © Nicolas Lefèvre</footer>
        </div>
    );
};

export default App;