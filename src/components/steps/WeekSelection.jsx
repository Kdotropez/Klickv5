import { useState } from 'react';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaUndo } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [error, setError] = useState('');

    const getWeekRange = (date) => {
        if (!date) return '';
        const start = new Date(date);
        const end = addDays(start, 6);
        return `du ${format(start, 'd MMMM', { locale: fr })} au ${format(end, 'd MMMM', { locale: fr })}`;
    };

    const handleDateChange = (date) => {
        if (date && isMonday(date)) {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setSelectedDate(date);
            setError('');
            saveToLocalStorage('selectedWeek', formattedDate);
            onNext(formattedDate);
        } else {
            setError('Veuillez sélectionner un lundi.');
        }
    };

    const handleReset = () => {
        setSelectedDate(null);
        setError('');
        saveToLocalStorage('selectedWeek', '');
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection de la semaine</h2>
            {error && <p className="error">{error}</p>}
            <label>
                Sélectionner un lundi :
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    filterDate={isMonday}
                    locale={fr}
                    dateFormat="d MMMM yyyy"
                    placeholderText="Sélectionnez un lundi"
                    className="calendar-input"
                    calendarClassName="large-calendar"
                />
            </label>
            {selectedDate && (
                <p>Semaine : {getWeekRange(selectedDate)}</p>
            )}
            <div className="button-group">
                <Button onClick={onBack} variant="secondary">Retour</Button>
                <Button onClick={handleReset} variant="reset">
                    <FaUndo /> Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default WeekSelection;