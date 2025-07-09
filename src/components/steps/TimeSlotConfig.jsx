import { useState } from 'react';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const TimeSlotConfig = ({ onNext, onReset, config }) => {
    const [interval, setInterval] = useState(config?.interval || 30);
    const [startTime, setStartTime] = useState(config?.startTime || '09:00');
    const [endTime, setEndTime] = useState(config?.endTime || '23:00');
    const [error, setError] = useState('');

    const generateTimeSlots = (start, end, interval) => {
        const slots = [];
        let current = new Date(`2000-01-01T${start}`);
        const endDate = new Date(`2000-01-01T${end}`);

        while (current <= endDate) {
            const startSlot = current.toTimeString().slice(0, 5);
            current = new Date(current.getTime() + interval * 60000);
            const endSlot = current.toTimeString().slice(0, 5);
            slots.push({ start: startSlot, end: endSlot });
        }
        return slots;
    };

    const handleSubmit = () => {
        if (!startTime || !endTime) {
            setError('Veuillez sélectionner une heure de début et de fin.');
            return;
        }
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        if (end <= start) {
            setError('L’heure de fin doit être postérieure à l’heure de début.');
            return;
        }
        if (![15, 30, 60].includes(Number(interval))) {
            setError('L’intervalle doit être 15, 30 ou 60 minutes.');
            return;
        }
        if (endTime > '23:59') {
            setError('L’heure de fin ne peut pas dépasser 23:59.');
            return;
        }

        const timeSlots = generateTimeSlots(startTime, endTime, interval);
        const configData = { interval: Number(interval), startTime, endTime, timeSlots };
        saveToLocalStorage('timeSlotConfig', configData);
        onNext(configData);
    };

    const handleReset = () => {
        setInterval(30);
        setStartTime('09:00');
        setEndTime('23:00');
        setError('');
        saveToLocalStorage('timeSlotConfig', {});
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Configuration des tranches horaires</h2>
            {error && <p className="error">{error}</p>}
            <label>
                Intervalle (minutes) :
                <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                </select>
            </label>
            <label>
                Heure de début :
                <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min="00:00"
                    max="23:59"
                />
            </label>
            <label>
                Heure de fin :
                <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    min={startTime}
                    max="23:59"
                />
            </label>
            <div className="button-group">
                <Button onClick={handleSubmit}>Valider</Button>
                <Button onClick={handleReset} variant="reset">Réinitialiser</Button>
            </div>
        </div>
    );
};

export default TimeSlotConfig;