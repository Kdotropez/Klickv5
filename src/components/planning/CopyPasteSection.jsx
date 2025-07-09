import { useState } from 'react';
import { FaToggleOn, FaCopy, FaPaste, FaUndo } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const CopyPasteSection = ({ planning, setPlanning, selectedShop, selectedWeek, selectedEmployees, days }) => {
    const [showSection, setShowSection] = useState(false);
    const [copyMode, setCopyMode] = useState('all');
    const [sourceDay, setSourceDay] = useState(days[0] || '');
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployee, setTargetEmployee] = useState('');
    const [feedback, setFeedback] = useState('');
    const [showWeekModal, setShowWeekModal] = useState(false);
    const [sourceWeek, setSourceWeek] = useState('');

    const availableWeeks = Object.keys(localStorage)
        .filter((key) => key.startsWith(`planning_${selectedShop}_`) && key !== `planning_${selectedShop}_${selectedWeek}`)
        .map((key) => key.replace(`planning_${selectedShop}_`, ''));

    const handleCopyDay = () => {
        if (!sourceDay) {
            setFeedback('Veuillez sélectionner un jour source.');
            return;
        }
        setFeedback(`Données copiées pour ${format(new Date(sourceDay), 'EEEE', { locale: fr })}`);
    };

    const handlePasteDay = () => {
        if (!sourceDay || targetDays.length === 0) {
            setFeedback('Veuillez sélectionner un jour source et au moins un jour cible.');
            return;
        }
        const newPlanning = { ...planning };
        targetDays.forEach((targetDay) => {
            if (copyMode === 'all') {
                newPlanning[targetDay] = { ...newPlanning[sourceDay] };
            } else if (copyMode === 'individual' && sourceEmployee) {
                if (!newPlanning[targetDay]) newPlanning[targetDay] = {};
                newPlanning[targetDay][sourceEmployee] = [...(newPlanning[sourceDay]?.[sourceEmployee] || [])];
            } else if (copyMode === 'employeeToEmployee' && sourceEmployee && targetEmployee) {
                if (!newPlanning[targetDay]) newPlanning[targetDay] = {};
                newPlanning[targetDay][targetEmployee] = [...(newPlanning[sourceDay]?.[sourceEmployee] || [])];
            }
        });
        setPlanning(newPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, newPlanning);
        setFeedback(`Données collées pour les jours sélectionnés.`);
    };

    const handleResetCopyPaste = () => {
        setCopyMode('all');
        setSourceDay(days[0] || '');
        setTargetDays([]);
        setSourceEmployee('');
        setTargetEmployee('');
        setFeedback('');
    };

    const handleCopyWeek = () => {
        if (!sourceWeek) {
            setFeedback('Veuillez sélectionner une semaine source.');
            return;
        }
        setShowWeekModal(true);
    };

    const handlePasteWeek = () => {
        const sourcePlanning = JSON.parse(localStorage.getItem(`planning_${selectedShop}_${sourceWeek}`) || '{}');
        setPlanning(sourcePlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, sourcePlanning);
        setFeedback(`Semaine copiée depuis ${sourceWeek}.`);
        setShowWeekModal(false);
    };

    return (
        <div className="copy-paste-section">
            <Button onClick={() => setShowSection(!showSection)}>
                <FaToggleOn /> {showSection ? 'Masquer' : 'Afficher'} Copier/Coller
            </Button>
            {showSection && (
                <div className="copy-paste-container">
                    <h3>Copier/Coller un jour</h3>
                    <label>
                        Mode de copie :
                        <select value={copyMode} onChange={(e) => setCopyMode(e.target.value)}>
                            <option value="all">Tous les employés</option>
                            <option value="individual">Employé spécifique</option>
                            <option value="employeeToEmployee">D’un employé à un autre</option>
                        </select>
                    </label>
                    <label>
                        Jour source :
                        <select value={sourceDay} onChange={(e) => setSourceDay(e.target.value)}>
                            {days.map((day) => (
                                <option key={day} value={day}>
                                    {format(new Date(day), 'EEEE', { locale: fr })}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="target-days">
                        Jours cibles :
                        {days.map((day) => (
                            <label key={day}>
                                <input
                                    type="checkbox"
                                    checked={targetDays.includes(day)}
                                    onChange={() => {
                                        if (targetDays.includes(day)) {
                                            setTargetDays(targetDays.filter((d) => d !== day));
                                        } else {
                                            setTargetDays([...targetDays, day]);
                                        }
                                    }}
                                />
                                {format(new Date(day), 'EEEE', { locale: fr })}
                            </label>
                        ))}
                    </div>
                    {copyMode !== 'all' && (
                        <label>
                            Employé source :
                            <select value={sourceEmployee} onChange={(e) => setSourceEmployee(e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {selectedEmployees.map((employee) => (
                                    <option key={employee} value={employee}>
                                        {employee}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {copyMode === 'employeeToEmployee' && (
                        <label>
                            Employé cible :
                            <select value={targetEmployee} onChange={(e) => setTargetEmployee(e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {selectedEmployees.map((employee) => (
                                    <option key={employee} value={employee}>
                                        {employee}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div className="button-group">
                        <Button onClick={handleCopyDay}>
                            <FaCopy /> Copier
                        </Button>
                        <Button onClick={handlePasteDay}>
                            <FaPaste /> Coller
                        </Button>
                        <Button onClick={handleResetCopyPaste} variant="reset">
                            <FaUndo /> Réinitialiser
                        </Button>
                    </div>
                    {feedback && <p className="feedback">{feedback}</p>}
                    <h3>Copier/Coller une semaine</h3>
                    <label>
                        Semaine source :
                        <select value={sourceWeek} onChange={(e) => setSourceWeek(e.target.value)}>
                            <option value="">Sélectionner...</option>
                            {availableWeeks.map((week) => (
                                <option key={week} value={week}>
                                    {week}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="button-group">
                        <Button onClick={handleCopyWeek}>
                            <FaCopy /> Copier semaine
                        </Button>
                        <Button onClick={handlePasteWeek}>
                            <FaPaste /> Coller semaine
                        </Button>
                        <Button onClick={handleResetCopyPaste} variant="reset">
                            <FaUndo /> Réinitialiser
                        </Button>
                    </div>
                    {showWeekModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <button className="modal-close" onClick={() => setShowWeekModal(false)}>
                                    ✕
                                </button>
                                <h2>Confirmer le collage de la semaine</h2>
                                <p>Voulez-vous vraiment coller les données de la semaine {sourceWeek} ?</p>
                                <div className="button-group">
                                    <Button onClick={handlePasteWeek}>Confirmer</Button>
                                    <Button onClick={() => setShowWeekModal(false)} variant="secondary">Annuler</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CopyPasteSection;