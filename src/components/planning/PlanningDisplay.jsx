import { useState, useEffect } from 'react';
import { format, addDays, addMinutes, startOfMonth, endOfMonth } from 'date-fns';
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
    const [feedback, setFeedback] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmployee, setResetEmployee] = useState('');
    const [showRecapModal, setShowRecapModal] = useState(null);
    const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
    const [selectedMonthlyEmployee, setSelectedMonthlyEmployee] = useState('');

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(selectedWeek), i);
        return {
            name: format(date, 'EEEE', { locale: fr }),
            date: format(date, 'd MMMM', { locale: fr }),
        };
    });

    useEffect(() => {
        setPlanning(prev => {
            const updatedPlanning = {};
            selectedEmployees.forEach(employee => {
                updatedPlanning[employee] = {};
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                    // Vérifier si des données existent et sont compatibles avec la nouvelle configuration
                    const existingSlots = prev[employee]?.[dayKey];
                    if (existingSlots && existingSlots.length === config.timeSlots.length) {
                        updatedPlanning[employee][dayKey] = [...existingSlots];
                    } else {
                        updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                    }
                }
            });
            console.log('Synchronized planning with new config:', { config, updatedPlanning });
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
            return updatedPlanning;
        });
    }, [selectedEmployees, selectedWeek, config]);

    useEffect(() => {
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
        console.log('Saved planning to localStorage:', planning);
    }, [planning, selectedShop, selectedWeek]);

    useEffect(() => {
        return () => {
            saveToLocalStorage(`lastPlanning_${selectedShop}`, {
                week: selectedWeek,
                planning: planning
            });
            console.log('Saved last planning:', { week: selectedWeek, planning });
        };
    }, [planning, selectedShop, selectedWeek]);

    const calculateDailyHours = (dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        let totalHours = 0;
        selectedEmployees.forEach(employee => {
            const slots = planning[employee]?.[dayKey] || [];
            const hours = (slots.filter(slot => slot).length * config.interval) / 60;
            totalHours += hours;
        });
        return totalHours;
    };

    const calculateEmployeeDailyHours = (employee, dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const slots = planning[employee]?.[dayKey] || [];
        return (slots.filter(slot => slot).length * config.interval) / 60;
    };

    const calculateEmployeeWeeklyHours = (employee) => {
        return days.reduce((sum, _, index) => sum + calculateEmployeeDailyHours(employee, index), 0);
    };

    const toggleSlot = (employee, slotIndex, dayIndex) => {
        console.log('toggleSlot called:', { employee, slotIndex, dayIndex, planning });
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
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
        const dayKey = format(addDays(new Date(selectedWeek), sourceDay), 'yyyy-MM-dd');
        if (copyMode === 'all') {
            const copiedData = selectedEmployees.reduce((acc, employee) => {
                acc[employee] = planning[employee]?.[dayKey] || Array(config.timeSlots.length).fill(false);
                return acc;
            }, {});
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'all', data: copiedData });
            setFeedback(`Données copiées pour ${days[sourceDay].name}`);
        } else if (copyMode === 'individual') {
            if (!sourceEmployee) {
                setFeedback('Veuillez sélectionner un employé source.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false) };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'individual', data: copiedData });
            setFeedback(`Données copiées pour ${sourceEmployee} le ${days[sourceDay].name}`);
        } else if (copyMode === 'employeeToEmployee') {
            if (!sourceEmployee || !targetEmployee) {
                setFeedback('Veuillez sélectionner les employés source et cible.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false), targetEmployee };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'employeeToEmployee', data: copiedData });
            setFeedback(`Données copiées de ${sourceEmployee} vers ${targetEmployee} pour ${days[sourceDay].name}`);
        }
    };

    const pasteDay = () => {
        const copied = loadFromLocalStorage(`copied_${selectedShop}_${selectedWeek}`);
        if (!copied || !copied.data) {
            setFeedback('Aucune donnée copiée.');
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            targetDays.forEach(dayIndex => {
                const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
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
                        const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
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
                            const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                            updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                        }
                    }
                });
                console.log('Reset planning for employee:', { employee: resetEmployee, updatedPlanning });
                setFeedback(`Planning réinitialisé pour ${resetEmployee}.`);
            }
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
            return updatedPlanning;
        });
        setShowResetModal(false);
        setResetEmployee('');
    };

    const copyWeek = () => {
        saveToLocalStorage(`week_${selectedShop}_${selectedWeek}`, planning);
        setFeedback('Semaine copiée.');
    };

    const pasteWeek = () => {
        const copiedWeek = loadFromLocalStorage(`week_${selectedShop}_${selectedWeek}`);
        if (copiedWeek) {
            setPlanning(copiedWeek);
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, copiedWeek);
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
        const monthStart = startOfMonth(new Date(selectedWeek));
        const monthEnd = endOfMonth(new Date(selectedWeek));
        const weeks = [];
        let currentWeek = monthStart;

        while (currentWeek <= monthEnd) {
            const weekKey = format(currentWeek, 'yyyy-MM-dd');
            const weekPlanning = loadFromLocalStorage(`planning_${selectedShop}_${weekKey}`);
            if (weekPlanning) {
                weeks.push({ weekStart: weekKey, planning: weekPlanning });
            }
            currentWeek = addDays(currentWeek, 7);
        }

        return weeks;
    };

    const getMonthlyRecapData = (employee) => {
        const weeks = getMonthlyWeeks();
        const recapData = [];

        weeks.forEach(({ weekStart, planning }, weekIndex) => {
            for (let i = 0; i < 7; i++) {
                const dayKey = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
                const slots = planning[employee]?.[dayKey] || [];
                let start = null, end = null, breakStart = null, breakEnd = null;

                for (let j = 0; j < slots.length; j++) {
                    if (slots[j]) {
                        if (!start) start = config.timeSlots[j];
                        end = config.timeSlots[j];
                    } else if (start && !breakStart) {
                        breakStart = config.timeSlots[j];
                    } else if (breakStart && !breakEnd && slots[j]) {
                        breakEnd = config.timeSlots[j - 1];
                        break;
                    }
                }

                const hours = (slots.filter(slot => slot).length * config.interval) / 60;
                recapData.push({
                    day: format(addDays(new Date(weekStart), i), 'd MMMM yyyy', { locale: fr }),
                    start: start || '-',
                    end: end ? getEndTime(end, config.interval) : '-',
                    breakStart: breakStart || '-',
                    breakEnd: breakEnd ? getEndTime(breakEnd, config.interval) : '-',
                    hours: hours.toFixed(1)
                });
            }
        });

        return recapData;
    };

    console.log('Rendering PlanningDisplay, showRecapModal:', showRecapModal);

    return (
        <div className="planning-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                Planning pour {selectedShop} - Semaine du {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}
            </h2>
            <div className="navigation-buttons">
                <Button className="button-base button-retour" onClick={onBack}>
                    Retour Employés
                </Button>
                <Button className="button-base button-retour" onClick={onBackToShop}>
                    Retour Boutique
                </Button>
                <Button className="button-base button-retour" onClick={onBackToWeek}>
                    Retour Semaine
                </Button>
                <Button className="button-base button-retour" onClick={onBackToConfig}>
                    Retour Configuration
                </Button>
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
            <div className="day-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                {days.map((day, index) => (
                    <Button
                        key={day.name}
                        className={`button-base button-jour ${currentDay === index ? 'selected' : ''}`}
                        onClick={() => setCurrentDay(index)}
                    >
                        <span className="day-button-content">
                            {day.name}
                            <br />
                            {day.date}
                            <br />
                            ({calculateDailyHours(index).toFixed(1)} h)
                        </span>
                    </Button>
                ))}
            </div>
            <div className="recap-buttons">
                {selectedEmployees.map(employee => (
                    <Button
                        key={employee}
                        className="button-base button-recap"
                        onClick={() => setShowRecapModal(employee)}
                    >
                        Recap {employee}: {calculateEmployeeWeeklyHours(employee).toFixed(1)} h
                    </Button>
                ))}
                <Button className="button-base button-recap" onClick={() => setShowRecapModal('week')}>
                    Récapitulatif semaine
                </Button>
                <Button className="button-base button-recap" onClick={() => setShowMonthlyRecapModal(true)}>
                    Récapitulatif mensuel
                </Button>
            </div>
            <div className="table-container">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th className="fixed-col header">DE</th>
                            {config.timeSlots.map((slot, index) => (
                                <th key={slot} className="scrollable-col">{slot}</th>
                            ))}
                            <th className="fixed-col header">Total</th>
                        </tr>
                        <tr>
                            <th className="fixed-col header">À</th>
                            {config.timeSlots.map((slot, index) => (
                                <th key={slot} className="scrollable-col">
                                    {index < config.timeSlots.length - 1
                                        ? config.timeSlots[index + 1]
                                        : getEndTime(config.timeSlots[config.timeSlots.length - 1], config.interval)}
                                </th>
                            ))}
                            <th className="fixed-col header"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedEmployees.map((employee, empIndex) => (
                            <tr key={employee}>
                                <td className="fixed-col">{employee} ({calculateEmployeeDailyHours(employee, currentDay).toFixed(1)} h)</td>
                                {config.timeSlots.map((_, slotIndex) => {
                                    const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
                                    const isChecked = planning[employee]?.[dayKey]?.[slotIndex] || false;
                                    return (
                                        <td
                                            key={`${employee}-${slotIndex}`}
                                            className="scrollable-col"
                                            style={{ backgroundColor: isChecked ? pastelColors[empIndex % pastelColors.length] : 'transparent' }}
                                            onClick={() => toggleSlot(employee, slotIndex, currentDay)}
                                        >
                                            {isChecked ? '✅' : ''}
                                        </td>
                                    );
                                })}
                                <td className="fixed-col">{calculateEmployeeDailyHours(employee, currentDay).toFixed(1)} h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Button
                className="button-base button-primary"
                onClick={() => setShowCopyPaste(!showCopyPaste)}
            >
                <FaToggleOn /> {showCopyPaste ? 'Masquer Copier/Coller' : 'Afficher Copier/Coller'}
            </Button>
            {showCopyPaste && (
                <div className="copy-paste-section">
                    <div className="copy-paste-container">
                        <h3>Copier/Coller un jour</h3>
                        <div className="copy-paste-form">
                            <div className="form-group">
                                <label>Mode de copie</label>
                                <select value={copyMode} onChange={(e) => setCopyMode(e.target.value)}>
                                    <option value="all">Tous les employés</option>
                                    <option value="individual">Employé spécifique</option>
                                    <option value="employeeToEmployee">D’un employé à un autre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Jour source</label>
                                <select value={sourceDay} onChange={(e) => setSourceDay(Number(e.target.value))}>
                                    {days.map((day, index) => (
                                        <option key={day.name} value={index}>{day.name} {day.date}</option>
                                    ))}
                                </select>
                            </div>
                            {copyMode !== 'all' && (
                                <div className="form-group">
                                    <label>Employé source</label>
                                    <select value={sourceEmployee} onChange={(e) => setSourceEmployee(e.target.value)}>
                                        <option value="">Choisir un employé</option>
                                        {selectedEmployees.map(employee => (
                                            <option key={employee} value={employee}>{employee}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {copyMode === 'employeeToEmployee' && (
                                <div className="form-group">
                                    <label>Employé cible</label>
                                    <select value={targetEmployee} onChange={(e) => setTargetEmployee(e.target.value)}>
                                        <option value="">Choisir un employé</option>
                                        {selectedEmployees.map(employee => (
                                            <option key={employee} value={employee}>{employee}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Jours cibles</label>
                                <div className="target-days-grid">
                                    {days.map((day, index) => (
                                        <div key={day.name} className="target-day-item">
                                            <input
                                                type="checkbox"
                                                checked={targetDays.includes(index)}
                                                onChange={() => {
                                                    setTargetDays(targetDays.includes(index)
                                                        ? targetDays.filter(d => d !== index)
                                                        : [...targetDays, index]);
                                                }}
                                            />
                                            {day.name} {day.date}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="button-group">
                                <Button className="button-base button-primary" onClick={copyDay}>
                                    <FaCopy /> Copier
                                </Button>
                                <Button className="button-base button-primary" onClick={pasteDay}>
                                    <FaPaste /> Coller
                                </Button>
                                <Button className="button-base button-reinitialiser" onClick={() => setFeedback('')}>
                                    Réinitialiser
                                </Button>
                            </div>
                            {feedback && <p className="feedback">{feedback}</p>}
                        </div>
                    </div>
                    <div className="copy-paste-container">
                        <h3>Copier/Coller une semaine existante</h3>
                        <div className="form-group">
                            <label>Semaine source</label>
                            <select>
                                <option value="">Choisir une semaine</option>
                            </select>
                        </div>
                        <div className="button-group">
                            <Button className="button-base button-primary" onClick={copyWeek}>
                                <FaCopy /> Copier semaine
                            </Button>
                            <Button className="button-base button-primary" onClick={pasteWeek}>
                                <FaPaste /> Coller semaine
                            </Button>
                            <Button className="button-base button-reinitialiser" onClick={() => setFeedback('')}>
                                Réinitialiser
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowResetModal(false)}>
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Confirmer la réinitialisation
                        </h3>
                        <div className="form-group">
                            <label>Réinitialiser</label>
                            <select value={resetEmployee} onChange={(e) => setResetEmployee(e.target.value)}>
                                <option value="">Choisir une option</option>
                                <option value="all">Tous les employés</option>
                                {selectedEmployees.map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                        <div className="button-group">
                            <Button className="button-base button-primary" onClick={confirmReset}>
                                Confirmer
                            </Button>
                            <Button className="button-base button-retour" onClick={() => setShowResetModal(false)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {typeof showRecapModal !== 'undefined' && showRecapModal && (
                <RecapModal
                    type={showRecapModal === 'week' ? 'week' : 'employee'}
                    employee={showRecapModal !== 'week' ? showRecapModal : null}
                    shop={selectedShop}
                    days={days}
                    config={config}
                    selectedWeek={selectedWeek}
                    planning={planning}
                    selectedEmployees={selectedEmployees}
                    onClose={() => setShowRecapModal(null)}
                />
            )}
            {showMonthlyRecapModal && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowMonthlyRecapModal(false);
                                setSelectedMonthlyEmployee('');
                            }}
                            style={{ color: '#dc3545', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Récapitulatif mensuel
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                            Mois de {format(new Date(selectedWeek), 'MMMM yyyy', { locale: fr })}
                        </p>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ fontFamily: 'Roboto, sans-serif' }}>Employé</label>
                            <select
                                value={selectedMonthlyEmployee}
                                onChange={(e) => setSelectedMonthlyEmployee(e.target.value)}
                                style={{ width: '200px', fontFamily: 'Roboto, sans-serif' }}
                            >
                                <option value="">Choisir un employé</option>
                                {selectedEmployees.map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                        {selectedMonthlyEmployee && (
                            <table style={{ fontFamily: 'Inter, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Jour</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Arrivée</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sortie</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Retour</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Fin</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Heures effectives</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getMonthlyRecapData(selectedMonthlyEmployee).map((row, index) => (
                                        <tr key={index} style={{ backgroundColor: pastelColors[index % pastelColors.length], marginBottom: '10px' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.day}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.start}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.breakStart}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.breakEnd}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.end}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.hours} h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '10px' }}>
                            Klick-Planning - copyright © Nicolas Lefevre
                        </p>
                        <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                            <Button
                                className="button-base button-retour"
                                onClick={() => {
                                    setShowMonthlyRecapModal(false);
                                    setSelectedMonthlyEmployee('');
                                }}
                            >
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningDisplay;