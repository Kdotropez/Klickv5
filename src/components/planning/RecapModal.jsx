import { useState, useEffect } from 'react';
import { format, addMinutes, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapModal = ({ type, employee, shop, days, config, selectedWeek, planning, onClose, selectedEmployees }) => {
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('RecapModal props:', { type, employee, shop, days, config, selectedWeek, planning, selectedEmployees }); // Débogage
        if (!planning || !config || !days || !shop) {
            setError('Erreur : Données manquantes pour afficher le récapitulatif.');
        } else {
            setError('');
        }
    }, [planning, config, days, shop]);

    const dayColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d6e6ff', '#d4f4e2', '#f0e6fa', '#fffde6'];

    const getEmployeeSchedule = (employee, day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const slots = planning[employee]?.[dateKey] || [];
        console.log('getEmployeeSchedule:', { employee, dateKey, slots }); // Débogage
        if (!slots || slots.length === 0 || !Array.isArray(slots)) {
            return { arrival: '', exit1: '', return1: '', exit2: '', return2: '', end: '', hours: 0, hasSecondPause: false };
        }

        const sortedSlots = slots
            .filter(slot => slot && /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(slot))
            .sort((a, b) => {
                const aTime = a >= '00:00' && a < '06:00' ? `24:${a.split(':')[1]}` : a;
                const bTime = b >= '00:00' && b < '06:00' ? `24:${b.split(':')[1]}` : b;
                return aTime.localeCompare(bTime);
            });

        if (sortedSlots.length === 0) {
            return { arrival: '', exit1: '', return1: '', exit2: '', return2: '', end: '', hours: 0, hasSecondPause: false };
        }

        let arrival = sortedSlots[0];
        let exit1 = '';
        let return1 = '';
        let exit2 = '';
        let return2 = '';
        let hasSecondPause = false;
        let hours = (sortedSlots.length * config.interval) / 60;

        const groups = [];
        let currentGroup = [sortedSlots[0]];
        for (let i = 1; i < sortedSlots.length; i++) {
            let currentTime = new Date(`2025-01-01T${sortedSlots[i]}`);
            let prevTime = new Date(`2025-01-01T${sortedSlots[i - 1]}`);
            if (sortedSlots[i] >= '00:00' && sortedSlots[i] < '06:00') {
                currentTime = addDays(currentTime, 1);
            }
            if (sortedSlots[i - 1] >= '00:00' && sortedSlots[i - 1] < '06:00') {
                prevTime = addDays(prevTime, 1);
            }
            const diffMinutes = (currentTime - prevTime) / 60000;
            if (diffMinutes > config.interval) {
                groups.push(currentGroup);
                currentGroup = [sortedSlots[i]];
            } else {
                currentGroup.push(sortedSlots[i]);
            }
        }
        groups.push(currentGroup);

        if (groups.length === 1) {
            exit1 = format(addMinutes(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), config.interval), 'HH:mm');
            if (groups[0][groups[0].length - 1] >= '00:00' && groups[0][groups[0].length - 1] < '06:00') {
                exit1 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), 1), config.interval), 'HH:mm');
            }
        } else if (groups.length === 2) {
            exit1 = format(addMinutes(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), config.interval), 'HH:mm');
            return1 = groups[1][0];
            if (groups[0][groups[0].length - 1] >= '00:00' && groups[0][groups[0].length - 1] < '06:00') {
                exit1 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), 1), config.interval), 'HH:mm');
            }
        } else if (groups.length >= 3) {
            exit1 = format(addMinutes(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), config.interval), 'HH:mm');
            return1 = groups[1][0];
            exit2 = format(addMinutes(new Date(`2025-01-01T${groups[1][groups[1].length - 1]}`), config.interval), 'HH:mm');
            return2 = groups[2][0];
            hasSecondPause = true;
            if (groups[0][groups[0].length - 1] >= '00:00' && groups[0][groups[0].length - 1] < '06:00') {
                exit1 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), 1), config.interval), 'HH:mm');
            }
            if (groups[1][groups[1].length - 1] >= '00:00' && groups[1][groups[1].length - 1] < '06:00') {
                exit2 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[1][groups[1].length - 1]}`), 1), config.interval), 'HH:mm');
            }
        }

        let endTime = new Date(`2025-01-01T${sortedSlots[sortedSlots.length - 1]}`);
        if (sortedSlots[sortedSlots.length - 1] >= '00:00' && sortedSlots[sortedSlots.length - 1] < '06:00') {
            endTime = addDays(endTime, 1);
        }
        const end = format(addMinutes(endTime, config.interval), 'HH:mm');

        return { arrival, exit1, return1, exit2, return2, end, hours, hasSecondPause };
    };

    const getIndividualRecap = (employee) => {
        return days.map((day) => {
            const schedule = getEmployeeSchedule(employee, day);
            return {
                day: format(day, 'EEEE', { locale: fr }),
                arrival: schedule.arrival,
                exit1: schedule.exit1,
                return1: schedule.return1,
                exit2: schedule.exit2,
                return2: schedule.return2,
                end: schedule.end,
                hours: schedule.hours.toFixed(1),
                hasSecondPause: schedule.hasSecondPause,
            };
        });
    };

    const getWeeklyRecap = () => {
        const recap = [];
        (selectedEmployees || []).forEach((emp) => {
            days.forEach((day) => {
                const schedule = getEmployeeSchedule(emp, day);
                if (schedule.hours > 0) {
                    recap.push({
                        day: format(day, 'EEEE', { locale: fr }),
                        employee: emp,
                        arrival: schedule.arrival,
                        exit1: schedule.exit1,
                        return1: schedule.return1,
                        exit2: schedule.exit2,
                        return2: schedule.return2,
                        end: schedule.end,
                        hours: schedule.hours.toFixed(1),
                        hasSecondPause: schedule.hasSecondPause,
                    });
                }
            });
        });
        return recap;
    };

    const hasSecondPause = type === 'employee'
        ? getIndividualRecap(employee).some(row => row.hasSecondPause)
        : getWeeklyRecap().some(row => row.hasSecondPause);

    const recapData = type === 'employee' ? getIndividualRecap(employee) : getWeeklyRecap();

    if (error) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                    <h3>Erreur</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    ✕
                </button>
                <h3 style={{ textAlign: 'center', fontSize: '20px' }}>
                    {type === 'employee' ? `Récapitulatif pour ${employee}` : 'Récapitulatif semaine'}
                </h3>
                <p style={{ textAlign: 'center', fontSize: '18px', fontFamily: 'Roboto, sans-serif', margin: '10px 0' }}>
                    Semaine du {format(days[0], 'EEEE d MMMM', { locale: fr })} au {format(days[6], 'EEEE d MMMM', { locale: fr })}
                </p>
                {recapData.length === 0 ? (
                    <p>Aucune donnée disponible pour ce récapitulatif.</p>
                ) : (
                    <table className="recap-table">
                        <thead>
                            <tr>
                                <th>Jour</th>
                                {type === 'week' && <th>Employé</th>}
                                <th>Arrivée</th>
                                <th>Sortie</th>
                                <th>Retour</th>
                                {hasSecondPause && <th>Sortie</th>}
                                {hasSecondPause && <th>Retour</th>}
                                <th>Fin</th>
                                <th>Heures effectives</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recapData.map((row, index) => (
                                <tr key={index} style={{ backgroundColor: dayColors[days.findIndex(d => format(d, 'EEEE', { locale: fr }) === row.day)] || '#fff' }}>
                                    <td>{row.day}</td>
                                    {type === 'week' && <td>{row.employee}</td>}
                                    <td>{row.arrival || '-'}</td>
                                    <td>{row.exit1 || '-'}</td>
                                    <td>{row.return1 || '-'}</td>
                                    {hasSecondPause && <td>{row.exit2 || '-'}</td>}
                                    {hasSecondPause && <td>{row.return2 || '-'}</td>}
                                    <td>{row.end || '-'}</td>
                                    <td>{row.hours} h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="button-group">
                    <Button className="button-base button-retour" onClick={onClose}>
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;