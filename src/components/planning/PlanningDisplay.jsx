import { useState, useEffect } from 'react';
import { format, addDays, addMinutes, startOfMonth, endOfMonth, isWithinInterval, isMonday, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCopy, FaPaste, FaToggleOn } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import RecapModal from './RecapModal';
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, planning: initialPlanning, onBack, onBackToShop, onBackToWeek, onBackToConfig, onReset }) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [planning, setPlanning] = useState(initialPlanning || {});
    const [showCopyPaste, setShowCopyPaste] = useState(false);
    const [copyMode, setCopyMode] = useState('all');
    const [sourceDay, setSourceDay] = useState(0);
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployee, setTargetEmployee] = useState('');
    const [sourceWeek, setSourceWeek] = useState('');
    const [feedback, setFeedback] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmployee, setResetEmployee] = useState('');
    const [showRecapModal, setShowRecapModal] = useState(null);
    const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
    const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
    const [selectedEmployeeForMonthlyRecap, setSelectedEmployeeForMonthlyRecap] = useState('');

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    // Valider selectedWeek et utiliser une date par défaut si invalide
    const validWeek = selectedWeek && !isNaN(new Date(selectedWeek).getTime()) ? selectedWeek : format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(validWeek), i);
        return {
            name: format(date, 'EEEE', { locale: fr }),
            date: format(date, 'd MMMM', { locale: fr }),
        };
    });

    useEffect(() => {
        console.log('Initial planning state:', { initialPlanning, selectedEmployees, validWeek });
        setPlanning(prev => {
            const updatedPlanning = {};
            selectedEmployees.forEach(employee => {
                updatedPlanning[employee] = prev[employee] || {};
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(validWeek), i), 'yyyy-MM-dd');
                    updatedPlanning[employee][dayKey] = prev[employee]?.[dayKey] && prev[employee][dayKey].length === config.timeSlots.length
                        ? [...prev[employee][dayKey]]
                        : Array(config.timeSlots.length).fill(false);
                }
            });
            console.log('Synchronized planning with new config:', { config, updatedPlanning, selectedEmployees });
            if (Object.keys(updatedPlanning).length > 0) {
                saveToLocalStorage(`planning_${selectedShop}_${validWeek}`, updatedPlanning);
                console.log('Saved planning to localStorage:', { key: `planning_${selectedShop}_${validWeek}`, planning: updatedPlanning });
            }
            return updatedPlanning;
        });
    }, [selectedEmployees, validWeek, config]);

    useEffect(() => {
        if (Object.keys(planning).length > 0) {
            saveToLocalStorage(`planning_${selectedShop}_${validWeek}`, planning);
            console.log('Saved planning to localStorage:', { key: `planning_${selectedShop}_${validWeek}`, planning });
        }
    }, [planning, selectedShop, validWeek]);

    useEffect(() => {
        return () => {
            if (Object.keys(planning).length > 0) {
                saveToLocalStorage(`lastPlanning_${selectedShop}`, {
                    week: validWeek,
                    planning: planning
                });
                console.log('Saved last planning:', { week: validWeek, planning });
            }
        };
    }, [planning, selectedShop, validWeek]);

    const calculateDailyHours = (dayIndex) => {
        const dayKey = format(addDays(new Date(validWeek), dayIndex), 'yyyy-MM-dd');
        let totalHours = 0;
        selectedEmployees.forEach(employee => {
            const slots = planning[employee]?.[dayKey] || [];
            const hours = (slots.filter(slot => slot).length * config.interval) / 60;
            totalHours += hours;
        });
        return totalHours;
    };

    const calculateEmployeeDailyHours = (employee, dayKey, weekPlanning) => {
        const slots = weekPlanning[employee]?.[dayKey] || [];
        console.log(`Calculating daily hours for ${employee} on ${dayKey}:`, { slots });
        return (slots.filter(slot => slot).length * config.interval) / 60;
    };

    const calculateEmployeeWeeklyHours = (employee, weekStart, weekPlanning) => {
        let totalHours = 0;
        for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
            totalHours += calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
        }
        console.log(`Calculating weekly hours for ${employee} starting ${weekStart}:`, { totalHours });
        return totalHours;
    };

    const toggleSlot = (employee, slotIndex, dayIndex) => {
        console.log('toggleSlot called:', { employee, slotIndex, dayIndex, planning });
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            const dayKey = format(addDays(new Date(validWeek), dayIndex), 'yyyy-MM-dd');
            if (!updatedPlanning[employee]) {
                updatedPlanning[employee] = {};
            }
            if (!updatedPlanning[employee][dayKey]) {
                updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
            }
            updatedPlanning[employee][dayKey][slotIndex] = !updatedPlanning[employee][dayKey][slotIndex];
            console.log('Updated planning:', updatedPlanning);
            return updatedPlanning;
        });
    };

    const copyDay = () => {
        const dayKey = format(addDays(new Date(validWeek), sourceDay), 'yyyy-MM-dd');
        if (copyMode === 'all') {
            const copiedData = selectedEmployees.reduce((acc, employee) => {
                acc[employee] = planning[employee]?.[dayKey] || Array(config.timeSlots.length).fill(false);
                return acc;
            }, {});
            saveToLocalStorage(`copied_${selectedShop}_${validWeek}`, { mode: 'all', data: copiedData });
            setFeedback(`Données copiées pour ${days[sourceDay].name}`);
        } else if (copyMode === 'individual') {
            if (!sourceEmployee) {
                setFeedback('Veuillez sélectionner un employé source.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false) };
            saveToLocalStorage(`copied_${selectedShop}_${validWeek}`, { mode: 'individual', data: copiedData });
            setFeedback(`Données copiées pour ${sourceEmployee} le ${days[sourceDay].name}`);
        } else if (copyMode === 'employeeToEmployee') {
            if (!sourceEmployee || !targetEmployee) {
                setFeedback('Veuillez sélectionner les employés source et cible.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false), targetEmployee };
            saveToLocalStorage(`copied_${selectedShop}_${validWeek}`, { mode: 'employeeToEmployee', data: copiedData });
            setFeedback(`Données copiées de ${sourceEmployee} vers ${targetEmployee} pour ${days[sourceDay].name}`);
        }
    };

    const pasteDay = () => {
        const copied = loadFromLocalStorage(`copied_${selectedShop}_${validWeek}`);
        if (!copied || !copied.data) {
            setFeedback('Aucune donnée copiée.');
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            targetDays.forEach(dayIndex => {
                const dayKey = format(addDays(new Date(validWeek), dayIndex), 'yyyy-MM-dd');
                if (copied.mode === 'all') {
                    Object.keys(copied.data).forEach(employee => {
                        if (!updatedPlanning[employee]) updatedPlanning[employee] = {};
                        updatedPlanning[employee][dayKey] = [...copied.data[employee]];
                    });
                } else if (copied.mode === 'individual') {
                    const employee = Object.keys(copied.data)[0];
                    if (!updatedPlanning[employee]) updatedPlanning[employee] = {};
                    updatedPlanning[employee][dayKey] = [...copied.data[employee]];
                } else if (copied.mode === 'employeeToEmployee') {
                    const employee = Object.keys(copied.data)[0];
                    const target = copied.data.targetEmployee;
                    if (!updatedPlanning[target]) updatedPlanning[target] = {};
                    updatedPlanning[target][dayKey] = [...copied.data[employee]];
                }
            });
            return updatedPlanning;
        });
        setFeedback(`Données collées pour ${targetDays.map(i => days[i].name).join(', ')}`);
    };

    const handleReset = () => {
        console.log('Opening reset modal:', { selectedEmployees });
        setShowResetModal(true);
    };

    const confirmReset = () => {
        console.log('Confirm reset:', { resetEmployee, selectedEmployees });
        if (!resetEmployee) {
            setFeedback('Veuillez sélectionner une option.');
            return;
        }
        if (!config || !config.timeSlots || !config.timeSlots.length) {
            setFeedback('Configuration des tranches horaires non valide.');
            return;
        }
        if (!selectedEmployees || selectedEmployees.length === 0) {
            setFeedback('Aucun employé sélectionné.');
            return;
        }
        setPlanning(() => {
            const updatedPlanning = {};
            if (resetEmployee === 'all') {
                selectedEmployees.forEach(employee => {
                    updatedPlanning[employee] = {};
                    for (let i = 0; i < 7; i++) {
                        const dayKey = format(addDays(new Date(validWeek), i), 'yyyy-MM-dd');
                        updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                    }
                });
                console.log('Reset full planning:', updatedPlanning);
                setFeedback('Planning complet réinitialisé.');
            } else {
                selectedEmployees.forEach(employee => {
                    updatedPlanning[employee] = employee === resetEmployee ? {} : (planning[employee] || {});
                    if (employee === resetEmployee) {
                        for (let i = 0; i < 7; i++) {
                            const dayKey = format(addDays(new Date(validWeek), i), 'yyyy-MM-dd');
                            updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                        }
                    }
                });
                console.log('Reset planning for employee:', { employee: resetEmployee, updatedPlanning });
                setFeedback(`Planning réinitialisé pour ${resetEmployee}.`);
            }
            saveToLocalStorage(`planning_${selectedShop}_${validWeek}`, updatedPlanning);
            return updatedPlanning;
        });
        setShowResetModal(false);
        setResetEmployee('');
    };

    const getAvailableWeeks = () => {
        const weeks = [];
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Available storage keys:', storageKeys);

        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            try {
                const weekDate = new Date(weekKey);
                if (isMonday(weekDate)) {
                    const weekPlanning = loadFromLocalStorage(key);
                    if (weekPlanning && Object.keys(weekPlanning).length > 0) {
                        weeks.push({
                            key: weekKey,
                            date: weekDate,
                            display: `Semaine du ${format(weekDate, 'd MMMM yyyy', { locale: fr })}`
                        });
                        console.log(`Week data for ${key}:`, weekPlanning);
                    }
                }
            } catch (e) {
                console.error(`Invalid date format for key ${key}:`, e);
            }
        });

        weeks.sort((a, b) => a.date - b.date);
        console.log('Available weeks:', weeks);
        return weeks;
    };

    const copyWeek = () => {
        if (!sourceWeek) {
            setFeedback('Veuillez sélectionner une semaine source.');
            return;
        }
        const weekPlanning = loadFromLocalStorage(`planning_${selectedShop}_${sourceWeek}`);
        if (weekPlanning && Object.keys(weekPlanning).length > 0) {
            saveToLocalStorage(`week_${selectedShop}_${validWeek}`, weekPlanning);
            setFeedback(`Semaine du ${format(new Date(sourceWeek), 'd MMMM yyyy', { locale: fr })} copiée.`);
        } else {
            setFeedback('Aucune donnée disponible pour la semaine sélectionnée.');
        }
    };

    const pasteWeek = () => {
        const copiedWeek = loadFromLocalStorage(`week_${selectedShop}_${validWeek}`);
        if (copiedWeek && Object.keys(copiedWeek).length > 0) {
            setPlanning(copiedWeek);
            saveToLocalStorage(`planning_${selectedShop}_${validWeek}`, copiedWeek);
            setFeedback('Semaine collée.');
        } else {
            setFeedback('Aucune semaine copiée.');
        }
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime) return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const getMonthlyWeeks = () => {
        const monthStart = startOfMonth(new Date(validWeek));
        const monthEnd = endOfMonth(new Date(validWeek));
        const weeks = [];

        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Storage keys found for monthly recap:', storageKeys);

        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            try {
                const weekDate = new Date(weekKey);
                if (isWithinInterval(weekDate, { start: monthStart, end: monthEnd }) && isMonday(weekDate)) {
                    const weekPlanning = loadFromLocalStorage(key);
                    if (weekPlanning && Object.keys(weekPlanning).length > 0) {
                        weeks.push({ weekStart: wall } from './components/steps/WeekSelection';
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
                                console.log('handleNext called with data:', data, 'for step:', step);
                                if (step === 1) setConfig(data);
                                if (step === 2) setSelectedShop(data);
                                if (step === 3) {
                                    // Vérifier si data est une date valide au format YYYY-MM-DD
                                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                                    if (!data || !dateRegex.test(data) || isNaN(new Date(data).getTime())) {
                                        setFeedback('❌ Veuillez sélectionner une semaine valide (format YYYY-MM-DD).');
                                        console.log('Invalid week data:', data);
                                        return;
                                    }
                                    setSelectedWeek(data);
                                }
                                if (step === 4) setSelectedEmployees(data);
                                if (step !== 3) setStep(step + 1);
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