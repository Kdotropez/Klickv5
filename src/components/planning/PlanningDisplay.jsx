import { useState } from 'react';
import { format, addDays, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaToggleOn, FaCopy, FaPaste, FaUndo } from 'react-icons/fa';
import RecapModal from '../planning/RecapModal';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setStep, setPlanning }) => {
    const [selectedDay, setSelectedDay] = useState(selectedWeek);
    const [modalData, setModalData] = useState(null);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [selectedResetEmployees, setSelectedResetEmployees] = useState([]);
    const [showCopyPaste, setShowCopyPaste] = useState(false);
    const [copyMode, setCopyMode] = useState('all');
    const [sourceDay, setSourceDay] = useState(selectedWeek);
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployee, setTargetEmployee] = useState('');
    const [copiedData, setCopiedData] = useState(null);
    const [feedback, setFeedback] = useState('');

    // Generate days of the week
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(selectedWeek), i));
    console.log(`PlanningDisplay: selectedWeek=${selectedWeek}, days=${JSON.stringify(days.map(d => format(d, 'yyyy-MM-dd')))}`);

    // Generate time slots
    const timeSlots = [];
    console.log(`PlanningDisplay: config=${JSON.stringify(config)}`);
    if (!config?.startTime || !config?.endTime || !config?.interval) {
        console.error(`PlanningDisplay: config is invalid: ${JSON.stringify(config)}`);
        return <div>Erreur : Configuration des tranches horaires invalide.</div>;
    }
    let currentTime = new Date(`2025-01-01T${config.startTime}`);
    const endTime = new Date(`2025-01-01T${config.endTime}`);
    if (config.endTime <= config.startTime || config.endTime <= '06:00') {
        endTime.setDate(endTime.getDate() + 1);
    }
    while (currentTime < endTime) {
        timeSlots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, config.interval);
    }
    console.log(`PlanningDisplay: timeSlots=${JSON.stringify(timeSlots)}`);

    // Calculate total hours per employee for the selected day
    const getEmployeeDailyHours = (employee, day) => {
        if (!planning || !config?.interval) {
            console.warn(`getEmployeeDailyHours: planning=${JSON.stringify(planning)}, config.interval=${config?.interval}`);
            return 0;
        }
        const dateKey = format(day, 'yyyy-MM-dd');
        const slots = planning[dateKey]?.[employee] || [];
        const hours = (slots.length * config.interval) / 60;
        console.log(`getEmployeeDailyHours: employee=${employee}, day=${dateKey}, slots=${JSON.stringify(slots)}, interval=${config.interval}, hours=${hours}`);
        return hours;
    };

    // Calculate total hours per employee for the week
    const getEmployeeWeeklyHours = (employee) => {
        if (!planning || !config?.interval) {
            console.warn(`getEmployeeWeeklyHours: planning=${JSON.stringify(planning)}, config.interval=${config?.interval}`);
            return 0;
        }
        const total = days.reduce((acc, day) => {
            const slots = planning[format(day, 'yyyy-MM-dd')]?.[employee] || [];
            return acc + (slots.length * config.interval) / 60;
        }, 0);
        console.log(`getEmployeeWeeklyHours: employee=${employee}, total=${total}`);
        return total;
    };

    // Calculate total hours per day
    const getDayHours = (day) => {
        if (!planning || !config?.interval) {
            console.warn(`getDayHours: planning=${JSON.stringify(planning)}, config.interval=${config?.interval}`);
            return 0;
        }
        const total = selectedEmployees.reduce((total, emp) => {
            const slots = planning[format(day, 'yyyy-MM-dd')]?.[emp] || [];
            return total + (slots.length * config.interval) / 60;
        }, 0);
        console.log(`getDayHours: day=${format(day, 'yyyy-MM-dd')}, total=${total}`);
        return total;
    };

    // Handle cell click to toggle slot
    const handleCellClick = (employee, time) => {
        const dateKey = format(selectedDay, 'yyyy-MM-dd');
        const newPlanning = { ...planning };
        if (!newPlanning[dateKey]) newPlanning[dateKey] = {};
        if (!newPlanning[dateKey][employee]) newPlanning[dateKey][employee] = [];

        const slots = newPlanning[dateKey][employee];
        if (slots.includes(time)) {
            newPlanning[dateKey][employee] = slots.filter((t) => t !== time);
        } else {
            newPlanning[dateKey][employee] = [...slots, time].sort();
        }
        console.log(`handleCellClick: employee=${employee}, time=${time}, newPlanning=${JSON.stringify(newPlanning)}`);
        setPlanning(newPlanning);
        localStorage.setItem(`planning_${selectedShop}_${selectedWeek}`, JSON.stringify(newPlanning));
    };

    // Handle reset modal
    const handleReset = () => {
        setResetModalOpen(true);
    };

    const confirmReset = (resetAll = false) => {
        const newPlanning = { ...planning };
        if (resetAll) {
            days.forEach((day) => {
                delete newPlanning[format(day, 'yyyy-MM-dd')];
            });
            alert('Planning réinitialisé pour tous les employés');
        } else if (selectedResetEmployees.length > 0) {
            days.forEach((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                if (newPlanning[dateKey]) {
                    selectedResetEmployees.forEach((emp) => {
                        delete newPlanning[dateKey][emp];
                    });
                    if (Object.keys(newPlanning[dateKey]).length === 0) {
                        delete newPlanning[dateKey];
                    }
                }
            });
            alert(`Planning réinitialisé pour ${selectedResetEmployees.join(', ')}`);
        }
        setPlanning(newPlanning);
        localStorage.setItem(`planning_${selectedShop}_${selectedWeek}`, JSON.stringify(newPlanning));
        setResetModalOpen(false);
        setSelectedResetEmployees([]);
    };

    // Open recap modal
    const openRecapModal = (type, employee = null) => {
        setModalData({ type, employee, planning });
    };

    // Copy/Paste functionality
    const handleCopyDay = () => {
        if (copyMode === 'all') {
            setCopiedData({ mode: 'all', data: planning[sourceDay] || {} });
            setFeedback(`Données copiées pour ${format(new Date(sourceDay), 'EEEE', { locale: fr })}`);
        } else if (copyMode === 'individual' && sourceEmployee) {
            setCopiedData({ mode: 'individual', employee: sourceEmployee, data: planning[sourceDay]?.[sourceEmployee] || [] });
            setFeedback(`Données copiées pour ${sourceEmployee} le ${format(new Date(sourceDay), 'EEEE', { locale: fr })}`);
        } else if (copyMode === 'employeeToEmployee' && sourceEmployee && targetEmployee) {
            setCopiedData({ mode: 'employeeToEmployee', sourceEmployee, targetEmployee, data: planning[sourceDay]?.[sourceEmployee] || [] });
            setFeedback(`Données copiées de ${sourceEmployee} pour ${targetEmployee} le ${format(new Date(sourceDay), 'EEEE', { locale: fr })}`);
        } else {
            setFeedback('Veuillez sélectionner les options nécessaires.');
        }
    };

    const handlePasteDay = () => {
        if (!copiedData || targetDays.length === 0) {
            setFeedback('Aucune donnée copiée ou aucun jour cible sélectionné.');
            return;
        }

        const updatedPlanning = { ...planning };
        targetDays.forEach((day) => {
            if (!updatedPlanning[day]) updatedPlanning[day] = {};
            if (copiedData.mode === 'all') {
                updatedPlanning[day] = { ...copiedData.data };
            } else if (copiedData.mode === 'individual') {
                updatedPlanning[day][copiedData.employee] = [...(copiedData.data || [])];
            } else if (copiedData.mode === 'employeeToEmployee') {
                updatedPlanning[day][copiedData.targetEmployee] = [...(copiedData.data || [])];
            }
        });
        setPlanning(updatedPlanning);
        localStorage.setItem(`planning_${selectedShop}_${selectedWeek}`, JSON.stringify(updatedPlanning));
        setFeedback(`Données collées pour ${targetDays.map((day) => format(new Date(day), 'EEEE', { locale: fr })).join(', ')}`);
    };

    const handleResetCopyPaste = () => {
        setCopiedData(null);
        setSourceDay(selectedWeek);
        setTargetDays([]);
        setSourceEmployee('');
        setTargetEmployee('');
        setCopyMode('all');
        setFeedback('');
    };

    console.log('PlanningDisplay: Rendering with improved copy-paste section');

    return (
        <div className="planning-container">
            <h2>Planning pour {selectedShop}</h2>
            <p>
                semaine du {format(new Date(selectedWeek), 'EEEE d MMMM', { locale: fr })} au{' '}
                {format(addDays(new Date(selectedWeek), 6), 'EEEE d MMMM', { locale: fr })}
            </p>
            <p>Employés: {selectedEmployees.join(', ')}</p>
            <div className="button-group">
                <Button className="button-retour" onClick={() => setStep(2)}>
                    Retour Boutique
                </Button>
                <Button className="button-retour" onClick={() => setStep(3)}>
                    Retour Semaine
                </Button>
                <Button className="button-retour" onClick={() => setStep(4)}>
                    Retour Employés
                </Button>
                <Button className="button-retour" onClick={() => setStep(1)}>
                    Retour Configuration
                </Button>
                <Button className="button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
            <div className="button-group">
                {selectedEmployees.map((emp) => {
                    const totalHours = getEmployeeWeeklyHours(emp);
                    return (
                        <Button
                            key={emp}
                            className="button-recap"
                            onClick={() => openRecapModal('employee', emp)}
                        >
                            Récap {emp}: {totalHours.toFixed(1)} h
                        </Button>
                    );
                })}
                <Button className="button-recap" onClick={() => openRecapModal('weekly')}>
                    Récapitulatif semaine
                </Button>
            </div>
            <div className="button-group">
                {days.map((day) => {
                    const dayHours = getDayHours(day);
                    return (
                        <Button
                            key={day}
                            className="button-jour"
                            onClick={() => setSelectedDay(day)}
                            style={{ backgroundColor: selectedDay === day ? '#424242' : undefined }}
                        >
                            {format(day, 'EEEE', { locale: fr })} ({dayHours.toFixed(1)} h)
                        </Button>
                    );
                })}
            </div>
            <div className="planning-table">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th className="fixed-col">DE</th>
                            {timeSlots.map((time) => (
                                <th key={time} className="scrollable-col">
                                    {time}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="fixed-col">À</th>
                            {timeSlots.map((time) => (
                                <th key={time} className="scrollable-col">
                                    {format(addMinutes(new Date(`2025-01-01T${time}`), config.interval), 'HH:mm')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {selectedEmployees.map((emp) => {
                            const dailyHours = getEmployeeDailyHours(emp, selectedDay);
                            console.log(`Rendering employee: ${emp}, dailyHours=${dailyHours}`);
                            return (
                                <tr key={emp}>
                                    <td className="fixed-col">{emp} ({dailyHours.toFixed(1)} H)</td>
                                    {timeSlots.map((time) => (
                                        <td
                                            key={time}
                                            className="scrollable-col"
                                            onClick={() => handleCellClick(emp, time)}
                                            style={{
                                                backgroundColor: planning?.[format(selectedDay, 'yyyy-MM-dd')]?.[emp]?.includes(time)
                                                    ? '#d6e6ff'
                                                    : 'transparent',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {planning?.[format(selectedDay, 'yyyy-MM-dd')]?.[emp]?.includes(time) ? '✅' : ''}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Button onClick={() => setShowCopyPaste(!showCopyPaste)} className="button-primary">
                <FaToggleOn /> {showCopyPaste ? 'Masquer Copier/Coller' : 'Afficher Copier/Coller'}
            </Button>
            {showCopyPaste && (
                <div className="copy-paste-section">
                    <div className="copy-paste-container">
                        <h3>Copier/Coller un jour</h3>
                        <div className="copy-paste-form">
                            <div className="form-group">
                                <label>Mode de copie :</label>
                                <select value={copyMode} onChange={(e) => setCopyMode(e.target.value)} style={{ padding: '8px', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}>
                                    <option value="all">Tous les employés</option>
                                    <option value="individual">Employé individuel</option>
                                    <option value="employeeToEmployee">D’un employé à un autre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Jour source :</label>
                                <select value={sourceDay} onChange={(e) => setSourceDay(e.target.value)} style={{ padding: '8px', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}>
                                    {days.map((day) => (
                                        <option key={day} value={day}>
                                            {format(new Date(day), 'EEEE', { locale: fr })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {copyMode !== 'all' && (
                                <div className="form-group">
                                    <label>Employé source :</label>
                                    <select value={sourceEmployee} onChange={(e) => setSourceEmployee(e.target.value)} style={{ padding: '8px', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}>
                                        <option value="">Sélectionner</option>
                                        {selectedEmployees.map((emp) => (
                                            <option key={emp} value={emp}>{emp}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {copyMode === 'employeeToEmployee' && (
                                <div className="form-group">
                                    <label>Employé cible :</label>
                                    <select value={targetEmployee} onChange={(e) => setTargetEmployee(e.target.value)} style={{ padding: '8px', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}>
                                        <option value="">Sélectionner</option>
                                        {selectedEmployees.map((emp) => (
                                            <option key={emp} value={emp}>{emp}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Jours cibles :</label>
                                <div className="target-days-grid">
                                    {days.map((day) => (
                                        <label key={day} className="target-day-item">
                                            <input
                                                type="checkbox"
                                                checked={targetDays.includes(day)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setTargetDays([...targetDays, day]);
                                                    } else {
                                                        setTargetDays(targetDays.filter((d) => d !== day));
                                                    }
                                                }}
                                            />
                                            {format(new Date(day), 'EEEE', { locale: fr })}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="button-group">
                                <Button onClick={handleCopyDay} className="button-primary">
                                    <FaCopy /> Copier
                                </Button>
                                <Button onClick={handlePasteDay} className="button-primary">
                                    <FaPaste /> Coller
                                </Button>
                                <Button onClick={handleResetCopyPaste} className="button-reset">
                                    <FaUndo /> Réinitialiser
                                </Button>
                            </div>
                            {feedback && <p className="feedback">{feedback}</p>}
                        </div>
                    </div>
                </div>
            )}
            {modalData && (
                <RecapModal
                    type={modalData.type}
                    data={modalData}
                    onClose={() => setModalData(null)}
                    config={config}
                    days={days}
                    selectedEmployees={selectedEmployees}
                />
            )}
            {resetModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setResetModalOpen(false)}>
                            ✕
                        </button>
                        <h3>Réinitialiser le planning</h3>
                        <p>Sélectionnez les employés à réinitialiser ou réinitialisez tout :</p>
                        <div>
                            {selectedEmployees.map((emp) => (
                                <label key={emp} style={{ display: 'block', margin: '5px 0' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedResetEmployees.includes(emp)}
                                        onChange={() => {
                                            setSelectedResetEmployees((prev) =>
                                                prev.includes(emp)
                                                    ? prev.filter((e) => e !== emp)
                                                    : [...prev, emp]
                                            );
                                        }}
                                    />
                                    {emp}
                                </label>
                            ))}
                        </div>
                        <div className="button-group">
                            <Button className="button-retour" onClick={() => confirmReset(true)}>
                                Tout réinitialiser
                            </Button>
                            <Button
                                className="button-retour"
                                onClick={() => confirmReset(false)}
                                disabled={selectedResetEmployees.length === 0}
                            >
                                Confirmer
                            </Button>
                            <Button className="modal-close" onClick={() => setResetModalOpen(false)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningDisplay;