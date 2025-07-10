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
        let current = new Date(`2000-01-01T${start}`);
        const endDate = new Date(`2000-01-01T${end}`);
        if (end <= start) {
            endDate.setDate(endDate.getDate() + 1);
        }

        while (current < endDate) {
            const startSlot = current.toTimeString().slice(0, 5);
            current = new Date(current.getTime() + interval * 60000);
            const endSlot = current.toTimeString().slice(0, 5);
            slots.push({ start: startSlot, end: endSlot });
        }
        return slots;
    };

    const handleIncrement = (setter, value, maxValue) => {
        setter((prev) => (prev >= maxValue ? 0 : prev + (value === 'minute' ? 15 : 1)));
    };

    const handleDecrement = (setter, value, minValue) => {
        setter((prev) => (prev <= minValue ? maxValue : prev - (value === 'minute' ? 15 : 1)));
    };

    const handleSubmit = () => {
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        if (!startTime || !endTime) {
            setError('Veuillez sélectionner une heure de début et de fin.');
            return;
        }
        const start = new Date(`2000-01-01T${startTime}`);
        let end = new Date(`2000-01-01T${endTime}`);
        if (end <= start) {
            end = new Date(`2000-01-02T${endTime}`);
        }
        if (endTime > '06:00' && end.getDate() === 1) {
            setError('L’heure de fin ne peut pas dépasser 06:00 le lendemain.');
            return;
        }
        if (![15, 30, 60].includes(Number(interval))) {
            setError('L’intervalle doit être 15, 30 ou 60 minutes.');
            return;
        }

        const timeSlots = generateTimeSlots(startTime, endTime, interval);
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
                                onClick={() => handleDecrement(setStartHour, 'hour', 0)}
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
                                onClick={() => handleDecrement(setStartMinute, 'minute', 0)}
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
                                onClick={() => handleDecrement(setEndHour, 'hour', 0)}
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
                                onClick={() => handleDecrement(setEndMinute, 'minute', 0)}
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