import { useState } from 'react';
import { format, addDays, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import RecapModal from '../planning/RecapModal';
import Button from '../common/Button';
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setStep, setPlanning }) => {
    const [selectedDay, setSelectedDay] = useState(selectedWeek);
    const [modalData, setModalData] = useState(null);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [selectedResetEmployees, setSelectedResetEmployees] = useState([]);

    // Generate days of the week
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(selectedWeek), i));

    // Generate time slots
    const timeSlots = [];
    let currentTime = new Date(`2025-01-01T${config.startTime}`);
    const endTime = new Date(`2025-01-01T${config.endTime}`);
    while (currentTime < endTime) {
        timeSlots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, config.interval);
    }

    // Calculate total hours per day
    const getDayHours = (day) => {
        if (!planning) return 0; // Prevent TypeError if planning is undefined
        return selectedEmployees.reduce((total, emp) => {
            const slots = planning[format(day, 'yyyy-MM-dd')]?.[emp] || [];
            return total + (slots.length * config.interval) / 60;
        }, 0);
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
                    const totalHours = days.reduce((acc, day) => {
                        const slots = planning?.[format(day, 'yyyy-MM-dd')]?.[emp] || [];
                        return acc + (slots.length * config.interval) / 60;
                    }, 0);
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
                <table className="recap-table">
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
                        {selectedEmployees.map((emp) => (
                            <tr key={emp}>
                                <td className="fixed-col">{emp}</td>
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
                        ))}
                    </tbody>
                </table>
            </div>
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
                        <h2>Réinitialiser le planning</h2>
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