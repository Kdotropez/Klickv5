import { useState } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const TimeSlotConfig = ({ onNext, onReset, config }) => {
    const [interval, setInterval] = useState(config?.interval || 30);
    const [startHour, setStartHour] = useState(config?.startTime ? parseInt(config.startTime.split(':')[0]) : 9);
    const [startMinute, setStartMinute] = useState(config?.startTime ? parseInt(config.startTime.split(':')[1]) : 0);
    const [endHour, setEndHour] = useState(config?.endTime ? parseInt(config.endTime.split(':')[0]) : 1);
    const [endMinute, setEndMinute] = useState(config?.endTime ? parseInt(config.endTime.split(':')[1]) : 0);
    const [error, setError] = useState('');

    const generateTimeSlots = (start, end, interval) => {
        const slots = [];
        const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
        let endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60; // Ajouter 24 heures si l’heure de fin est le lendemain
        }

        let currentMinutes = startMinutes;
        while (currentMinutes < endMinutes) {
            const startHour = Math.floor(currentMinutes / 60) % 24;
            const startMinute = currentMinutes % 60;
            const startSlot = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
            currentMinutes += interval;
            const endHour = Math.floor(currentMinutes / 60) % 24;
            const endMinute = currentMinutes % 60;
            const endSlot = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            slots.push({ start: startSlot, end: endSlot });
        }
        return slots;
    };

    const handleIncrement = (setter, type, maxValue) => {
        setter((prev) => (prev >= maxValue ? 0 : prev + (type === 'minute' ? 15 : 1)));
    };

    const handleDecrement = (setter, type, minValue, maxValue) => {
        setter((prev) => (prev <= minValue ? maxValue : prev - (type === 'minute' ? 15 : 1)));
    };

    const handleSubmit = () => {
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        console.log(`handleSubmit: startTime=${startTime}, endTime=${endTime}, interval=${interval}`);

        if (!startTime || !endTime) {
            setError('Veuillez sélectionner une heure de début et de fin.');
            console.error('Erreur: startTime ou endTime manquant');
            return;
        }

        // Convertir en minutes pour comparaison
        const startMinutes = startHour * 60 + startMinute;
        let endMinutes = endHour * 60 + endMinute;
        const isNextDay = endTime <= startTime || endTime <= '06:00';

        console.log(`startMinutes=${startMinutes}, endMinutes=${endMinutes}, isNextDay=${isNextDay}`);

        if (isNextDay) {
            endMinutes += 24 * 60; // Ajouter 24 heures si l’heure de fin est le lendemain
        }

        if (endMinutes <= startMinutes) {
            setError('L’heure de fin doit être postérieure à l’heure de début.');
            console.error(`Erreur: endMinutes (${endMinutes}) <= startMinutes (${startMinutes})`);
            return;
        }

        if (isNextDay && endTime > '06:00') {
            setError('L’heure de fin ne peut pas dépasser 06:00 le lendemain.');
            console.error(`Erreur: endTime (${endTime}) dépasse 06:00 le lendemain`);
            return;
        }

        if (![15, 30, 60].includes(Number(interval))) {
            setError('L’intervalle doit être 15, 30 ou 60 minutes.');
            console.error(`Erreur: intervalle invalide (${interval})`);
            return;
        }

        const timeSlots = generateTimeSlots(startTime, endTime, interval);
        console.log('timeSlots générés:', timeSlots);
        const configData = { interval: Number(interval), startTime, endTime, timeSlots };
        saveToLocalStorage('timeSlotConfig', configData);
        onNext(configData);
    };

    const handleReset = () => {
        setInterval(30);
        setStartHour(9);
        setStartMinute(0);
        setEndHour(1);
        setEndMinute(0);
        setError('');
        saveToLocalStorage('timeSlotConfig', {});
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Configuration des tranches horaires</h2>
            {error && <p className="error">{error}</p>}
            <div className="time-slot-config">
                <label className="time-slot-label">
                    Intervalle (minutes) :
                    <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={60}>60</option>
                    </select>
                </label>
                <label className="time-slot-label">
                    Heure de début :
                    <div className="time-picker-container">
                        <div className="time-picker">
                            <button
                                className="time-picker-button"
                                onClick={() => handleIncrement(setStartHour, 'hour', 23)}
                            >
                                <FaChevronUp />
                            </button>
                            <span className="time-value">{startHour.toString().padStart(2, '0')}</span>
                            <button
                                className="time-picker-button"
                                onClick={() => handleDecrement(setStartHour, 'hour', 0, 23)}
                            >
                                <FaChevronDown />
                            </button>
                        </div>
                        <span className="time-separator">:</span>
                        <div className="time-picker">
                            <button
                                className="time-picker-button"
                                onClick={() => handleIncrement(setStartMinute, 'minute', 45)}
                            >
                                <FaChevronUp />
                            </button>
                            <span className="time-value">{startMinute.toString().padStart(2, '0')}</span>
                            <button
                                className="time-picker-button"
                                onClick={() => handleDecrement(setStartMinute, 'minute', 0, 45)}
                            >
                                <FaChevronDown />
                            </button>
                        </div>
                    </div>
                </label>
                <label className="time-slot-label">
                    Heure de fin :
                    <div className="time-picker-container">
                        <div className="time-picker">
                            <button
                                className="time-picker-button"
                                onClick={() => handleIncrement(setEndHour, 'hour', 23)}
                            >
                                <FaChevronUp />
                            </button>
                            <span className="time-value">{endHour.toString().padStart(2, '0')}</span>
                            <button
                                className="time-picker-button"
                                onClick={() => handleDecrement(setEndHour, 'hour', 0, 23)}
                            >
                                <FaChevronDown />
                            </button>
                        </div>
                        <span className="time-separator">:</span>
                        <div className="time-picker">
                            <button
                                className="time-picker-button"
                                onClick={() => handleIncrement(setEndMinute, 'minute', 45)}
                            >
                                <FaChevronUp />
                            </button>
                            <span className="time-value">{endMinute.toString().padStart(2, '0')}</span>
                            <button
                                className="time-picker-button"
                                onClick={() => handleDecrement(setEndMinute, 'minute', 0, 45)}
                            >
                                <FaChevronDown />
                            </button>
                        </div>
                    </div>
                </label>
            </div>
            <div className="button-group">
                <Button onClick={handleSubmit}>Valider</Button>
                <Button onClick={handleReset} variant="reset">Réinitialiser</Button>
            </div>
        </div>
    );
};

export default TimeSlotConfig;