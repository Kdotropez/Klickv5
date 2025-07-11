import { useState } from 'react';
import { format, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaArrowRight } from 'react-icons/fa';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek }) => {
    const [selectedDate, setSelectedDate] = useState(selectedWeek || '');
    const [error, setError] = useState('');

    const handleDateChange = (e) => {
        const date = e.target.value;
        const parsedDate = new Date(date);
        if (isMonday(parsedDate)) {
            setSelectedDate(date);
            setError('');
        } else {
            setError('Veuillez sélectionner un lundi.');
        }
    };

    const handleSubmit = () => {
        if (!selectedDate) {
            setError('Veuillez sélectionner une date.');
            return;
        }
        if (!isMonday(new Date(selectedDate))) {
            setError('Veuillez sélectionner un lundi.');
            return;
        }
        saveToLocalStorage('selectedWeek', selectedDate);
        onNext(selectedDate);
    };

    const handleReset = () => {
        setSelectedDate('');
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
                <div className="calendar-input">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                    <FaArrowRight className="date-icon" />
                </div>
            </label>
            {selectedDate && (
                <p>
                    Semaine du {format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })} au{' '}
                    {format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}
                </p>
            )}
            <div className="button-group">
                <Button className="button-base button-primary" onClick={handleSubmit} disabled={!selectedDate || error}>
                    Valider
                </Button>
                <Button className="button-base button-retour" onClick={onBack}>
                    Retour
                </Button>
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default WeekSelection;