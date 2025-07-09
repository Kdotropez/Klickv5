import { useState } from 'react';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaArrowRight, FaUndo } from 'react-icons/fa';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [error, setError] = useState('');

    const getWeekRange = (date) => {
        if (!date) return '';
        const start = new Date(date);
        const end = addDays(start, 6);
        return `du ${format(start, 'd MMMM', { locale: fr })} au ${format(end, 'd MMMM', { locale: fr })}`;
    };

    const handleSubmit = () => {
        if (!selectedDate) {
            setError('Veuillez sélectionner une date.');
            return;
        }
        const date = new Date(selectedDate);
        if (!isMonday(date)) {
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
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <FaArrowRight className="date-icon" />
            </label>
            {selectedDate && (
                <p>Semaine : {getWeekRange(selectedDate)}</p>
            )}
            <div className="button-group">
                <Button onClick={handleSubmit}>Valider</Button>
                <Button onClick={onBack} variant="secondary">Retour</Button>
                <Button onClick={handleReset} variant="reset">
                    <FaUndo /> Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default WeekSelection;