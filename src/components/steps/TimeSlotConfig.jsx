import { useState } from 'react';
import { addMinutes, format, parse } from 'date-fns';
import Button from '../common/Button';
import { saveToLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const TimeSlotConfig = ({ onNext, onReset, config }) => {
    const [interval, setInterval] = useState(config?.interval || 15);
    const [startTime, setStartTime] = useState(config?.startTime || '09:00');
    const [endTime, setEndTime] = useState(config?.endTime || '19:00');
    const [error, setError] = useState('');

    const intervals = [15, 30, 60];
    const startTimes = ['09:00', '09:30', '10:00', 'other'];
    const endTimes = ['19:00', '20:00', '22:00', '23:00', '24:00', '01:00', '02:00', 'other'];

    const validateTimeFormat = (time) => {
        // Accepter les heures de 00:00 à 23:59 et 24:00
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$|^24:00$/;
        return timeRegex.test(time);
    };

    const generateTimeSlots = () => {
        const slots = [];
        let currentTime = parse(startTime, 'HH:mm', new Date(2025, 0, 1));
        const end = endTime === '24:00' ? parse('00:00', 'HH:mm', new Date(2025, 0, 2)) : parse(endTime, 'HH:mm', new Date(2025, 0, 1));

        while (currentTime < end) {
            slots.push(format(currentTime, 'HH:mm'));
            currentTime = addMinutes(currentTime, interval);
        }

        return slots;
    };

    const handleValidate = () => {
        if (!validateTimeFormat(startTime)) {
            setError('Heure de début invalide (HH:mm).');
            return;
        }
        if (!validateTimeFormat(endTime)) {
            setError('Heure de fin invalide (HH:mm).');
            return;
        }
        if (!intervals.includes(Number(interval))) {
            setError('Intervalle invalide (15, 30 ou 60 minutes).');
            return;
        }

        const start = parse(startTime, 'HH:mm', new Date(2025, 0, 1));
        const end = endTime === '24:00' ? parse('00:00', 'HH:mm', new Date(2025, 0, 2)) : parse(endTime, 'HH:mm', new Date(2025, 0, 1));

        if (start >= end) {
            setError('L’heure de fin doit être postérieure à l’heure de début.');
            return;
        }

        const timeSlots = generateTimeSlots();
        const newConfig = { interval: Number(interval), startTime, endTime, timeSlots };
        saveToLocalStorage('timeSlotConfig', newConfig);
        onNext(newConfig);
    };

    const handleReset = () => {
        setInterval(15);
        setStartTime('09:00');
        setEndTime('19:00');
        setError('');
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Configuration des tranches horaires
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Intervalle (minutes)</label>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        {intervals.map((int) => (
                            <label key={int} style={{ fontFamily: 'Roboto, sans-serif' }}>
                                <input
                                    type="radio"
                                    name="interval"
                                    value={int}
                                    checked={interval === int}
                                    onChange={(e) => setInterval(Number(e.target.value))}
                                />
                                {int} min
                            </label>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Heure de début</label>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {startTimes.map((time) => (
                            <label key={time} style={{ fontFamily: 'Roboto, sans-serif' }}>
                                <input
                                    type="radio"
                                    name="startTime"
                                    value={time}
                                    checked={startTime === time}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                                {time === 'other' ? 'Autre' : time}
                            </label>
                        ))}
                    </div>
                    {startTime === 'other' && (
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{ width: '160px', fontFamily: 'Roboto, sans-serif', marginTop: '10px' }}
                        />
                    )}
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Heure de fin</label>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {endTimes.map((time) => (
                            <label key={time} style={{ fontFamily: 'Roboto, sans-serif' }}>
                                <input
                                    type="radio"
                                    name="endTime"
                                    value={time}
                                    checked={endTime === time}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                                {time === 'other' ? 'Autre' : time}
                            </label>
                        ))}
                    </div>
                    {endTime === 'other' && (
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            style={{ width: '160px', fontFamily: 'Roboto, sans-serif', marginTop: '10px' }}
                        />
                    )}
                </div>
            </div>
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <Button
                    className="button-base button-primary"
                    onClick={handleValidate}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Valider
                </Button>
                <Button
                    className="button-base button-reinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                >
                    Réinitialiser
                </Button>
            </div>
            <footer style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#333' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </footer>
        </div>
    );
};

export default TimeSlotConfig;