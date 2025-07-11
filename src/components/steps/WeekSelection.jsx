import { useState, useEffect } from 'react';
import { format, startOfMonth, addDays, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek }) => {
    const [selectedMonth, setSelectedMonth] = useState('2025-07');
    const [localSelectedWeek, setLocalSelectedWeek] = useState(selectedWeek || '');
    const [error, setError] = useState('');
    const [savedWeeks, setSavedWeeks] = useState(loadFromLocalStorage('savedWeeks') || []);

    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2025, 6 + i, 1);
        return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: fr }) };
    });

    const getWeeksForMonth = (month) => {
        const [year, monthIndex] = month.split('-').map(Number);
        const startDate = startOfMonth(new Date(year, monthIndex - 1, 1));
        const weeks = [];
        let currentDate = startDate;
        const endOfMonth = new Date(year, monthIndex, 0);

        while (currentDate.getDay() !== 1 && currentDate <= endOfMonth) {
            currentDate = addDays(currentDate, 1);
        }

        while (currentDate <= endOfMonth) {
            const weekEnd = addDays(currentDate, 6);
            weeks.push({
                value: format(currentDate, 'yyyy-MM-dd'),
                label: `Du ${format(currentDate, 'd MMMM', { locale: fr })} au ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`
            });
            currentDate = addWeeks(currentDate, 1);
        }
        return weeks;
    };

    const weeks = selectedMonth ? getWeeksForMonth(selectedMonth) : [];

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
        setLocalSelectedWeek('');
        setError('');
    };

    const handleWeekChange = (e) => {
        const week = e.target.value;
        setLocalSelectedWeek(week);
        setError('');
        if (week) {
            const updatedSavedWeeks = Array.from(new Set([...savedWeeks, week]));
            setSavedWeeks(updatedSavedWeeks);
            saveToLocalStorage('savedWeeks', updatedSavedWeeks);
            saveToLocalStorage('selectedWeek', week);
            onNext(week);
        }
    };

    const handleSavedWeekSelect = (week) => {
        setLocalSelectedWeek(week);
        saveToLocalStorage('selectedWeek', week);
        onNext(week);
    };

    const handleReset = () => {
        setSelectedMonth('2025-07');
        setLocalSelectedWeek('');
        setError('');
        saveToLocalStorage('selectedWeek', '');
        onReset();
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la semaine
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div className="week-selection">
                <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="month-select"
                    aria-label="Sélectionner un mois"
                >
                    <option value="">Choisir un mois</option>
                    {months.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </select>
                {selectedMonth && (
                    <select
                        value={localSelectedWeek}
                        onChange={handleWeekChange}
                        className="week-select"
                        aria-label="Sélectionner une semaine"
                    >
                        <option value="">Choisir une semaine</option>
                        {weeks.map((week) => (
                            <option key={week.value} value={week.value}>
                                {week.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            {savedWeeks.length > 0 && (
                <div className="saved-weeks">
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', margin: '15px 0', fontSize: '18px' }}>
                        Semaines sauvegardées
                    </h3>
                    {savedWeeks.map((week, index) => (
                        <div key={week} className="saved-week-item">
                            <button
                                className="saved-week-button"
                                onClick={() => handleSavedWeekSelect(week)}
                                style={{
                                    backgroundColor: localSelectedWeek === week ? '#d6e6ff' : '#f0f0f0',
                                    color: '#333',
                                    border: '1px solid #d6e6ff',
                                }}
                                aria-label={`Sélectionner la semaine ${week}`}
                            >
                                {`Du ${format(new Date(week), 'd MMMM', { locale: fr })} au ${format(new Date(week).setDate(new Date(week).getDate() + 6), 'd MMMM yyyy', { locale: fr })}`}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <Button
                    className="button-base button-retour"
                    onClick={onBack}
                    style={{ backgroundColor: '#6c757d', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    aria-label="Retour à l’étape précédente"
                >
                    Retour
                </Button>
                <Button
                    className="button-base button-reinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    aria-label="Réinitialiser la sélection"
                >
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default WeekSelection;