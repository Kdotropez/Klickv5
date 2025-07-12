import React, { useState, useEffect } from 'react';
import { format, startOfMonth, addDays, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek, selectedShop, planning }) => {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [localSelectedWeek, setLocalSelectedWeek] = useState(selectedWeek || '');
    const [error, setError] = useState('');
    const [savedWeeks, setSavedWeeks] = useState(loadFromLocalStorage('savedWeeks') || []);
    const [showResetModal, setShowResetModal] = useState(false);

    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2025, 6 + i, 1);
        return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: fr }).toUpperCase() };
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
                label: `Lundi ${format(currentDate, 'd MMMM', { locale: fr })} au Dimanche ${format(weekEnd, 'd MMMM', { locale: fr })}`
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

            // Sauvegarder la configuration des tranches horaires pour la semaine
            const currentConfig = loadFromLocalStorage('timeSlotConfig');
            if (currentConfig) {
                saveToLocalStorage(`timeSlotConfig_${selectedShop}_${week}`, currentConfig);
            }

            // Sauvegarder le planning actuel
            if (planning) {
                saveToLocalStorage(`planning_${selectedShop}_${week}`, planning);
                console.log('Saved current planning for new week:', { newWeek: week, planning });
            }

            saveToLocalStorage('selectedWeek', week);
            onNext({ week, config: currentConfig, planning });
        }
    };

    const handleSavedWeekSelect = (week) => {
        setLocalSelectedWeek(week);

        // Restaurer la configuration des tranches horaires et le planning pour la semaine sélectionnée
        const savedConfig = loadFromLocalStorage(`timeSlotConfig_${selectedShop}_${week}`);
        const savedPlanning = loadFromLocalStorage(`planning_${selectedShop}_${week}`);
        saveToLocalStorage('selectedWeek', week);
        onNext({ week, config: savedConfig || loadFromLocalStorage('timeSlotConfig'), planning: savedPlanning || {} });
    };

    const handleDeleteWeek = (week) => {
        const updatedSavedWeeks = savedWeeks.filter(w => w !== week);
        setSavedWeeks(updatedSavedWeeks);
        saveToLocalStorage('savedWeeks', updatedSavedWeeks);
        // Supprimer la configuration des tranches horaires et le planning associés
        localStorage.removeItem(`timeSlotConfig_${selectedShop}_${week}`);
        localStorage.removeItem(`planning_${selectedShop}_${week}`);
        if (localSelectedWeek === week) {
            setLocalSelectedWeek('');
        }
    };

    const handleReset = () => {
        setShowResetModal(true);
    };

    const confirmReset = () => {
        setSelectedMonth('');
        setLocalSelectedWeek('');
        setSavedWeeks([]);
        setError('');
        saveToLocalStorage('savedWeeks', []);
        saveToLocalStorage('selectedWeek', '');
        // Supprimer toutes les configurations de tranches horaires et plannings associés
        savedWeeks.forEach(week => {
            localStorage.removeItem(`timeSlotConfig_${selectedShop}_${week}`);
            localStorage.removeItem(`planning_${selectedShop}_${week}`);
        });
        onReset();
        setShowResetModal(false);
    };

    return (
        <div className="step-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la semaine
            </h2>
            {error && <p className="error" style={{ color: '#e53935', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
            <div className="week-selection" style={{ display: 'flex', justifyContent: 'center' }}>
                <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="month-select"
                    style={{ width: '160px' }}
                    aria-label="Sélectionner un mois"
                >
                    <option value="">Choisir 1 mois</option>
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
                        style={{ width: '300px' }}
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
                <div className="saved-weeks" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', margin: '15px 0', fontSize: '18px' }}>
                        Semaines sauvegardées
                    </h3>
                    {savedWeeks.map((week, index) => (
                        <div key={week} className="saved-week-item" style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                className="saved-week-button"
                                onClick={() => handleSavedWeekSelect(week)}
                                style={{
                                    backgroundColor: localSelectedWeek === week ? '#d6e6ff' : '#f0f0f0',
                                    color: '#333',
                                    border: '1px solid #d6e6ff',
                                    width: '350px'
                                }}
                                aria-label={`Sélectionner la semaine ${week}`}
                            >
                                {`Lundi ${format(new Date(week), 'd MMMM', { locale: fr })} au Dimanche ${format(new Date(week).setDate(new Date(week).getDate() + 6), 'd MMMM', { locale: fr })}`}
                            </button>
                            <FaTimes
                                className="delete-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWeek(week);
                                }}
                                style={{ marginLeft: '8px', color: '#e53935', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#d32f2f'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#e53935'}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <Button
                    className="button-base button-retour"
                    onClick={onBack}
                    style={{ backgroundColor: '#0d47a1', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
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
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowResetModal(false)}>
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Confirmer la réinitialisation
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Voulez-vous vraiment réinitialiser toutes les semaines sauvegardées ?
                        </p>
                        <div className="button-group">
                            <Button className="button-base button-primary" onClick={confirmReset}>
                                Confirmer
                            </Button>
                            <Button className="button-base button-retour" onClick={() => setShowResetModal(false)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeekSelection;