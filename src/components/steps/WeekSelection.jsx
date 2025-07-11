import { useState } from 'react';
import { format, startOfWeek, addWeeks, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek }) => {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedWeek, setSelectedWeek] = useState(selectedWeek || '');
    const [error, setError] = useState('');

    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2025, 6 + i, 1);
        return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: fr }) };
    });

    const getWeeksForMonth = (month) => {
        const [year, monthIndex] = month.split('-').map(Number);
        const startDate = new Date(year, monthIndex - 1, 1);
        const weeks = [];
        let currentMonday = startOfWeek(startDate, { weekStartsOn: 1 });
        if (!isMonday(currentMonday)) {
            currentMonday = addWeeks(currentMonday, 1);
        }
        while (currentMonday.getMonth() === monthIndex - 1 && currentMonday.getFullYear() === year) {
            const weekEnd = new Date(currentMonday);
            weekEnd.setDate(currentMonday.getDate() + 6);
            weeks.push({
                value: format(currentMonday, 'yyyy-MM-dd'),
                label: `Du ${format(currentMonday, 'd MMMM', { locale: fr })} au ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`
            });
            currentMonday = addWeeks(currentMonday, 1);
        }
        return weeks;
    };

    const weeks = selectedMonth ? getWeeksForMonth(selectedMonth) : [];

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
        setSelectedWeek('');
        setError('');
    };

    const handleWeekChange = (e) => {
        const week = e.target.value;
        setSelectedWeek(week);
        setError('');
    };

    const handleSubmit = () => {
        if (!selectedWeek) {
            setError('Veuillez sélectionner une semaine.');
            return;
        }
        saveToLocalStorage('selectedWeek', selectedWeek);
        onNext(selectedWeek);
    };

    const handleReset = () => {
        setSelectedMonth('');
        setSelectedWeek('');
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
                        value={selectedWeek}
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
                <Button
                    className="button-base button-primary week-submit-button"
                    onClick={handleSubmit}
                    disabled={!selectedWeek}
                    aria-label="Valider la semaine"
                >
                    Valider
                </Button>
            </div>
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