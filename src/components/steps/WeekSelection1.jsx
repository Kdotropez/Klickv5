import { useState, useEffect } from 'react';
import { format, addDays, isMonday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaArrowRight } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek, selectedShop }) => {
    const [week, setWeek] = useState(selectedWeek ? format(new Date(selectedWeek), 'yyyy-MM-dd') : '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (week && !isMonday(parseISO(week))) {
            setError('Veuillez sélectionner un lundi.');
        } else {
            setError('');
        }
    }, [week]);

    const handleValidate = () => {
        if (!week) {
            setError('Veuillez sélectionner une semaine.');
            return;
        }
        if (!isMonday(parseISO(week))) {
            setError('Veuillez sélectionner un lundi.');
            return;
        }

        // Copier le dernier planning sauvegardé pour la nouvelle semaine
        const lastPlanning = loadFromLocalStorage(`lastPlanning_${selectedShop}`);
        if (lastPlanning && lastPlanning.planning) {
            saveToLocalStorage(`planning_${selectedShop}_${week}`, lastPlanning.planning);
            console.log('Copied last planning to new week:', { newWeek: week, planning: lastPlanning.planning });
        }

        onNext(week);
    };

    const handleReset = () => {
        setWeek('');
        onReset();
    };

    return (
        <div className="step-container">
            <h2>Sélection de la semaine</h2>
            {error && <p className="error">{error}</p>}
            <div className="week-selection">
                <label>Sélectionner un lundi</label>
                <input
                    type="date"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                    className="calendar-input"
                />
                {week && (
                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                        Semaine du {format(parseISO(week), 'EEEE d MMMM', { locale: fr })}
                        <FaArrowRight className="date-icon" />
                        {format(addDays(parseISO(week), 6), 'EEEE d MMMM', { locale: fr })}
                    </p>
                )}
            </div>
            <div className="button-group">
                {onBack && (
                    <Button className="button-base button-retour" onClick={onBack}>
                        Retour
                    </Button>
                )}
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
                <Button className="button-base button-validate" onClick={handleValidate}>
                    Valider
                </Button>
            </div>
        </div>
    );
};

export default WeekSelection;