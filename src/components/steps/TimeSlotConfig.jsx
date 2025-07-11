import { useState, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import Button from '../common/Button';
import '../../assets/styles.css';

const TimeSlotConfig = ({ onNext, onReset, config }) => {
    const [interval, setInterval] = useState(config?.interval || 30);
    const [startTimeCustom, setStartTimeCustom] = useState('');
    const [endTimeCustom, setEndTimeCustom] = useState('');
    const [startTimeOption, setStartTimeOption] = useState(config?.startTime || '10:00');
    const [endTimeOption, setEndTimeOption] = useState(config?.endTime || '23:00');
    const [errors, setErrors] = useState({ interval: '', startTime: '', endTime: '' });

    const startTimeOptions = ['09:00', '09:30', '10:00', 'custom'];
    const endTimeOptions = ['19:00', '20:00', '22:00', '23:00', '24:00', '01:00', '02:00', 'custom'];

    const isValidTimeFormat = (time) => time && /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);

    useEffect(() => {
        const newErrors = { interval: '', startTime: '', endTime: '' };
        const effectiveStartTime = startTimeOption === 'custom' ? startTimeCustom : startTimeOption;
        const effectiveEndTime = endTimeOption === 'custom' ? endTimeCustom : endTimeOption;

        if (startTimeOption === 'custom' && !isValidTimeFormat(effectiveStartTime)) {
            newErrors.startTime = 'Heure de début personnalisée invalide (HH:mm).';
        } else if (!isValidTimeFormat(effectiveStartTime)) {
            newErrors.startTime = 'Heure de début invalide (HH:mm).';
        }
        if (endTimeOption === 'custom' && !isValidTimeFormat(effectiveEndTime)) {
            newErrors.endTime = 'Heure de fin personnalisée invalide (HH:mm).';
        } else if (!isValidTimeFormat(effectiveEndTime)) {
            newErrors.endTime = 'Heure de fin invalide (HH:mm).';
        }
        if (isValidTimeFormat(effectiveStartTime) && isValidTimeFormat(effectiveEndTime)) {
            const start = new Date(`2025-01-01T${effectiveStartTime}`);
            let end = new Date(`2025-01-01T${effectiveEndTime}`);
            if (effectiveEndTime <= '06:00') end = new Date(`2025-01-02T${effectiveEndTime}`);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                newErrors.startTime = 'Heure de début invalide.';
                newErrors.endTime = 'Heure de fin invalide.';
            } else if (end <= start) {
                newErrors.endTime = 'L’heure de fin doit être postérieure à l’heure de début.';
            }
        }
        if (![15, 30, 60].includes(Number(interval))) {
            newErrors.interval = 'Intervalle doit être 15, 30 ou 60 minutes.';
        }
        setErrors(newErrors);
    }, [interval, startTimeOption, endTimeOption, startTimeCustom, endTimeCustom]);

    const validateAndSave = async (e) => {
        e.preventDefault(); // Empêcher la soumission par défaut du formulaire
        if (errors.interval || errors.startTime || errors.endTime) {
            alert(`Erreur :\n${Object.values(errors).filter(e => e).join('\n')}`);
            return;
        }

        const effectiveStartTime = startTimeOption === 'custom' ? startTimeCustom : startTimeOption;
        const effectiveEndTime = endTimeOption === 'custom' ? endTimeCustom : endTimeOption;

        try {
            if (!isValidTimeFormat(effectiveStartTime) || !isValidTimeFormat(effectiveEndTime)) {
                alert('Erreur : Format de date invalide (HH:mm attendu).');
                return;
            }

            const start = new Date(`2025-01-01T${effectiveStartTime}`);
            let end = new Date(`2025-01-01T${effectiveEndTime}`);
            if (effectiveEndTime <= '06:00') end = new Date(`2025-01-02T${effectiveEndTime}`);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                alert('Erreur : Format de date invalide.');
                return;
            }
            if (end <= start) {
                alert('Erreur : L’heure de fin doit être postérieure à l’heure de début.');
                return;
            }

            const timeSlots = [];
            let currentTime = start;
            while (currentTime < end) {
                timeSlots.push(format(currentTime, 'HH:mm'));
                currentTime = addMinutes(currentTime, Number(interval));
            }

            const configData = { interval: Number(interval), startTime: effectiveStartTime, endTime: effectiveEndTime, timeSlots };
            localStorage.setItem('timeSlotConfig', JSON.stringify(configData));
            onNext(configData);
        } catch (error) {
            console.error('Error in validateAndSave:', error);
            alert('Erreur lors de la validation : Problème inattendu.');
        }
    };

    const reset = () => {
        setInterval(30);
        setStartTimeOption('10:00');
        setEndTimeOption('23:00');
        setStartTimeCustom('');
        setEndTimeCustom('');
        setErrors({ interval: '', startTime: '', endTime: '' });
        localStorage.removeItem('timeSlotConfig');
        onReset();
    };

    return (
        <div className="time-slot-config-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '15px' }}>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '24px' }}>
                Configuration des tranches horaires
            </h2>
            <form onSubmit={validateAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '500', fontSize: '16px' }}>
                        Intervalle (minutes)
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[15, 30, 60].map((value) => (
                            <label
                                key={value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '8px 12px',
                                    border: interval == value ? '2px solid #1e88e5' : '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="interval"
                                    value={value}
                                    checked={interval == value}
                                    onChange={(e) => setInterval(e.target.value)}
                                    style={{ margin: 0 }}
                                    aria-label={`${value} minutes`}
                                />
                                {value} min
                            </label>
                        ))}
                    </div>
                    {errors.interval && <p className="error" style={{ color: '#e53935', fontSize: '12px', marginTop: '5px' }}>{errors.interval}</p>}
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '500', fontSize: '16px' }}>
                        Heure de début
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {startTimeOptions.map((value) => (
                            <label
                                key={value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '8px 12px',
                                    border: startTimeOption === value ? '2px solid #1e88e5' : '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="startTimeOption"
                                    value={value}
                                    checked={startTimeOption === value}
                                    onChange={(e) => setStartTimeOption(e.target.value)}
                                    style={{ margin: 0 }}
                                    aria-label={value === 'custom' ? 'Heure de début personnalisée' : `Heure de début ${value}`}
                                />
                                {value === 'custom' ? 'Autre' : value}
                            </label>
                        ))}
                    </div>
                    {startTimeOption === 'custom' && (
                        <input
                            type="time"
                            value={startTimeCustom}
                            onChange={(e) => setStartTimeCustom(e.target.value)}
                            step={1800}
                            style={{
                                maxWidth: '250px',
                                padding: '8px',
                                borderRadius: '4px',
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '14px',
                                border: errors.startTime ? '1px solid #e53935' : '1px solid #ccc',
                                marginTop: '8px',
                            }}
                            aria-label="Heure de début personnalisée"
                            aria-describedby="startTime-error"
                        />
                    )}
                    {errors.startTime && <p id="startTime-error" className="error" style={{ color: '#e53935', fontSize: '12px', marginTop: '5px' }}>{errors.startTime}</p>}
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '500', fontSize: '16px' }}>
                        Heure de fin
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {endTimeOptions.map((value) => (
                            <label
                                key={value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '8px 12px',
                                    border: endTimeOption === value ? '2px solid #1e88e5' : '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="endTimeOption"
                                    value={value}
                                    checked={endTimeOption === value}
                                    onChange={(e) => setEndTimeOption(e.target.value)}
                                    style={{ margin: 0 }}
                                    aria-label={value === 'custom' ? 'Heure de fin personnalisée' : `Heure de fin ${value}`}
                                />
                                {value === 'custom' ? 'Autre' : value}
                            </label>
                        ))}
                    </div>
                    {endTimeOption === 'custom' && (
                        <input
                            type="time"
                            value={endTimeCustom}
                            onChange={(e) => setEndTimeCustom(e.target.value)}
                            step={1800}
                            style={{
                                maxWidth: '250px',
                                padding: '8px',
                                borderRadius: '4px',
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '14px',
                                border: errors.endTime ? '1px solid #e53935' : '1px solid #ccc',
                                marginTop: '8px',
                            }}
                            aria-label="Heure de fin personnalisée"
                            aria-describedby="endTime-error"
                        />
                    )}
                    {errors.endTime && <p id="endTime-error" className="error" style={{ color: '#e53935', fontSize: '12px', marginTop: '5px' }}>{errors.endTime}</p>}
                </div>
                <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                    <Button
                        className="button-base button-primary"
                        type="submit"
                        disabled={!!errors.interval || !!errors.startTime || !!errors.endTime}
                        style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                        aria-label="Valider la configuration"
                    >
                        Valider
                    </Button>
                    <Button
                        className="button-base button-reinitialiser"
                        onClick={reset}
                        style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                        aria-label="Réinitialiser la configuration"
                    >
                        Réinitialiser
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default TimeSlotConfig;