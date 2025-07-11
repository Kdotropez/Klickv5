import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCopy, FaPaste, FaToggleOn } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import { generatePDF } from '../../utils/pdfExport';
import Button from '../common/Button';
import RecapModal from './RecapModal';
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, onBack }) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`) || {});
    const [showCopyPaste, setShowCopyPaste] = useState(false);
    const [copyMode, setCopyMode] = useState('all');
    const [sourceDay, setSourceDay] = useState(0);
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployee, setTargetEmployee] = useState('');
    const [feedback, setFeedback] = useState('');
    const [showRecapModal, setShowRecapModal] = useState(null);
    const pastelColors = ['#d6e6ff', '#d4f4e2', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#e6f0fa'];

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(selectedWeek), i);
        return format(date, 'EEEE d MMMM', { locale: fr });
    });

    const calculateDailyHours = (employee, dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const slots = planning[employee]?.[dayKey] || [];
        return (slots.filter(slot => slot).length * config.interval) / 60;
    };

    const toggleSlot = (employee, slotIndex, dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const updatedPlanning = { ...planning };
        if (!updatedPlanning[employee]) updatedPlanning[employee] = {};
        if (!updatedPlanning[employee][dayKey]) updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
        updatedPlanning[employee][dayKey][slotIndex] = !updatedPlanning[employee][dayKey][slotIndex];
        setPlanning(updatedPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
    };

    const copyDay = () => {
        const dayKey = format(addDays(new Date(selectedWeek), sourceDay), 'yyyy-MM-dd');
        if (copyMode === 'all') {
            const copiedData = selectedEmployees.reduce((acc, employee) => {
                acc[employee] = planning[employee]?.[dayKey] || [];
                return acc;
            }, {});
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'all', data: copiedData });
            setFeedback(`Données copiées pour ${days[sourceDay]}`);
        } else if (copyMode === 'individual') {
            if (!sourceEmployee) {
                setFeedback('Veuillez sélectionner un employé source.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || [] };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'individual', data: copiedData });
            setFeedback(`Données copiées pour ${sourceEmployee} le ${days[sourceDay]}`);
        } else if (copyMode === 'employeeToEmployee') {
            if (!sourceEmployee || !targetEmployee) {
                setFeedback('Veuillez sélectionner les employés source et cible.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || [], targetEmployee };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'employeeToEmployee', data: copiedData });
            setFeedback(`Données copiées de ${sourceEmployee} vers ${targetEmployee} pour ${days[sourceDay]}`);
        }
    };

    const pasteDay = () => {
        const copied = loadFromLocalStorage(`copied_${selectedShop}_${selectedWeek}`);
        if (!copied || !copied.data) {
            setFeedback('Aucune donnée copiée.');
            return;
        }
        const updatedPlanning = { ...planning };
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
        setPlanning(updatedPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
        setFeedback(`Données collées pour ${targetDays.map(i => days[i]).join(', ')}`);
    };

    const resetPlanning = () => {
        setPlanning({});
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
        setFeedback('Planning réinitialisé.');
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

    const generateEmployeePDF = (employee) => {
        const dailyHours = days.map((_, index) => calculateDailyHours(employee, index));
        const totalHours = dailyHours.reduce((sum, hours) => sum + hours, 0);
        generatePDF('employee', { employee, days, dailyHours, totalHours, config, selectedWeek, planning });
    };

    const generateShopPDF = () => {
        const employeeHours = selectedEmployees.map(employee => ({
            employee,
            dailyHours: days.map((_, index) => calculateDailyHours(employee, index)),
            totalHours: days.reduce((sum, _, index) => sum + calculateDailyHours(employee, index), 0)
        }));
        generatePDF('shop', { shop: selectedShop, days, employeeHours, config, selectedWeek, planning });
    };

    const generateWeekPDF = () => {
        const employeeHours = selectedEmployees.map(employee => ({
            employee,
            dailyHours: days.map((_, index) => calculateDailyHours(employee, index)),
            totalHours: days.reduce((sum, _, index) => sum + calculateDailyHours(employee, index), 0)
        }));
        generatePDF('week', { shop: selectedShop, days, employeeHours, config, selectedWeek, planning });
    };

    return (
        <div className="planning-container">
            <h2 style={{ fontFamily: 'Roboto', sans-serif, textAlign: 'center' }}>
                Planning pour {selectedShop} - Semaine du {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}
            </h2>
            <div className="navigation-buttons">
                <Button className="button-base button-retour" onClick={onBack}>
                    Retour Employés
                </Button>
                <Button className="button-base button-reinitialiser" onClick={resetPlanning}>
                    Réinitialiser
                </Button>
            </div>
            <div className="day-buttons">
                {days.map((day, index) => (
                    <Button
                        key={day}
                        className={`button-base button-jour ${currentDay === index ? 'selected' : ''}`}
                        onClick={() => setCurrentDay(index)}
                    >
                        {day} ({calculateDailyHours(selectedEmployees, index).toFixed(1)} h)
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
                        Recap {employee}: {days.reduce((sum, _, index) => sum + calculateDailyHours(employee, index), 0).toFixed(1)} h
                    </Button>
                ))}
                <Button className="button-base button-recap" onClick={() => setShowRecapModal('week')}>
                    Récapitulatif semaine
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
                        </tr>
                        <tr>
                            <th className="fixed-col header">À</th>
                            {config.timeSlots.map((slot, index) => (
                                <th key={slot} className="scrollable-col">
                                    {config.timeSlots[index + 1] || ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {selectedEmployees.map((employee, empIndex) => (
                            <tr key={employee}>
                                <td className="fixed-col">{employee}</td>
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
            {
        showCopyPaste && (
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
                                    <option key={day} value={index}>{day}</option>
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
                                    <div key={day} className="target-day-item">
                                        <input
                                            type="checkbox"
                                            checked={targetDays.includes(index)}
                                            onChange={() => {
                                                setTargetDays(targetDays.includes(index)
                                                    ? targetDays.filter(d => d !== index)
                                                    : [...targetDays, index]);
                                            }}
                                        />
                                        {day}
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
                            {/* Ajouter la logique pour les semaines sauvegardées */}
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
        )
    }
    {
        showRecapModal && (
            <RecapModal
                type={showRecapModal === 'week' ? 'week' : 'employee'}
                employee={showRecapModal !== 'week' ? showRecapModal : null}
                shop={selectedShop}
                days={days}
                config={config}
                selectedWeek={selectedWeek}
                planning={planning}
                onClose={() => setShowRecapModal(null)}
                onExportPDF={showRecapModal === 'week' ? generateWeekPDF : () => generateEmployeePDF(showRecapModal)}
            />
        )
    }
        </div >
    );
};

export default PlanningDisplay;