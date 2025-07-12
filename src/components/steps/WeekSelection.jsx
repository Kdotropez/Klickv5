import { useState, useEffect } from 'react';
import { format, addDays, isMonday, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaArrowRight } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek }) => {
    const [weekStart, setWeekStart] = useState(selectedWeek || '');
    const [error, setError] = useState('');

    useEffect(() => {
        saveToLocalStorage('selectedWeek', weekStart);
    }, [weekStart]);

    const handleValidate = () => {
        if (!weekStart || isNaN(new Date(weekStart).getTime())) {
            setError('Veuillez sélectionner un lundi valide.');
            return;
        }
        if (!isMonday(new Date(weekStart))) {
            setError('La date sélectionnée doit être un lundi.');
            return;
        }
        console.log('Validated weekStart:', weekStart);
        onNext(weekStart);
    };

    const handleReset = () => {
        setWeekStart('');
        setError('');
        saveToLocalStorage('selectedWeek', '');
        onReset();
    };

    const getWeekRange = (date) => {
        if (!date || isNaN(new Date(date).getTime())) return '';
        return `Lundi ${format(new Date(date), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(date), 6), 'd MMMM yyyy', { locale: fr })}`;
    };

    const getSavedWeeks = () => {
        const weeks = [];
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('planning_'));
        storageKeys.forEach(key => {
            const weekKey = key.split('_')[2];
            if (weekKey && !isNaN(new Date(weekKey).getTime()) && isMonday(new Date(weekKey))) {
                weeks.push(weekKey);
            }
        });
        return weeks.sort().map(week => ({
            value: week,
            label: getWeekRange(week)
        }));
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la semaine
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Mois</label>
                    <select
                        className="month-select"
                        style={{ width: '160px', fontFamily: 'Roboto, sans-serif' }}
                        onChange={(e) => {
                            const monthDate = new Date(e.target.value);
                            const monday = startOfWeek(monthDate, { weekStartsOn: 1 });
                            setWeekStart(format(monday, 'yyyy-MM-dd'));
                        }}
                    >
                        <option value="">Choisir un mois</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const date = new Date(2025, i, 1);
                            return (
                                <option key={i} value={format(date, 'yyyy-MM-dd')}>
                                    {format(date, 'MMMM yyyy', { locale: fr })}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Semaine <FaArrowRight /></label>
                    <input
                        type="date"
                        value={weekStart}
                        onChange={(e) => setWeekStart(e.target.value)}
                        style={{ width: '300px', fontFamily: 'Roboto, sans-serif' }}
                    />
                    {weekStart && (
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '10px' }}>
                            {getWeekRange(weekStart)}
                        </p>
                    )}
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>Semaines sauvegardées</label>
                    <select
                        className="week-select"
                        style={{ width: '350px', fontFamily: 'Roboto, sans-serif' }}
                        value={weekStart}
                        onChange={(e) => setWeekStart(e.target.value)}
                    >
                        <option value="">Choisir une semaine sauvegardée</option>
                        {getSavedWeeks().map(week => (
                            <option key={week.value} value={week.value}>
                                {week.label}
                            </option>
                        ))}
                    </select>
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
                    className="button-base button-retour"
                    onClick={onBack}
                    style={{ backgroundColor: '#0d47a1', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0b3d91'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d47a1'}
                >
                    Retour
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
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#333' }}>
                Klick-Planning - copyright © Nicolas Lefèvre
            </p>
        </div>
    );
};

export default WeekSelection;