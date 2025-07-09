import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { FaUndo } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import Footer from '../common/Footer';
import PlanningTable from '../planning/PlanningTable';
import CopyPasteSection from '../planning/CopyPasteSection';
import RecapModal from '../planning/RecapModal';
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, onBack }) => {
    const [showModal, setShowModal] = useState(false);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}));
    const [recapModal, setRecapModal] = useState(null);

    const isValid = () => {
        const isValidWeek = typeof selectedWeek === 'string' && selectedWeek.match(/^\d{4}-\d{2}-\d{2}$/) && !isNaN(new Date(selectedWeek).getTime());
        return (
            config.interval &&
            config.startTime &&
            config.endTime &&
            config.timeSlots &&
            selectedShop &&
            isValidWeek &&
            Array.isArray(selectedEmployees) &&
            selectedEmployees.length > 0
        );
    };

    const days = isValid()
        ? Array.from({ length: 7 }, (_, i) =>
            format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd')
        )
        : [];

    const calculateEmployeeHours = (employee) => {
        return days
            .reduce((acc, day) => acc + (planning[day]?.[employee]?.length || 0) * config.interval, 0) / 60;
    };

    const handleReset = () => {
        setShowModal(true);
    };

    const confirmReset = () => {
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
        setPlanning({});
        setShowModal(false);
    };

    const cancelReset = () => {
        setShowModal(false);
    };

    const showEmployeeRecap = (employee) => {
        setRecapModal({ type: 'employee', employee });
    };

    const showWeeklyRecap = () => {
        setRecapModal({ type: 'weekly' });
    };

    const closeRecapModal = () => {
        setRecapModal(null);
    };

    if (!isValid()) {
        return (
            <div className="step-container">
                <h2>Erreur</h2>
                <p>Veuillez compléter toutes les étapes précédentes correctement.</p>
                <div className="navigation-buttons">
                    <Button onClick={() => onBack(1)}>Retour Configuration</Button>
                    <Button onClick={() => onBack(2)}>Retour Boutique</Button>
                    <Button onClick={() => onBack(3)}>Retour Semaine</Button>
                    <Button onClick={() => onBack(4)}>Retour Employés</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="step-container">
            <h2>Planning pour {selectedShop}</h2>
            <p>
                Semaine du {selectedWeek && new Date(selectedWeek).toLocaleDateString('fr-FR')} au{' '}
                {selectedWeek && new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR')}
            </p>
            <p>Employés: {selectedEmployees.join(', ')}</p>
            <div className="navigation-buttons">
                <Button onClick={() => onBack(2)}>Retour Boutique</Button>
                <Button onClick={() => onBack(3)}>Retour Semaine</Button>
                <Button onClick={() => onBack(4)}>Retour Employés</Button>
                <Button onClick={() => onBack(1)}>Retour Configuration</Button>
                <Button onClick={handleReset} variant="reset">
                    <FaUndo /> Réinitialiser
                </Button>
            </div>
            <div className="recap-buttons">
                {selectedEmployees.map((employee) => (
                    <Button key={employee} onClick={() => showEmployeeRecap(employee)}>
                        Récap {employee}: {calculateEmployeeHours(employee).toFixed(1)} h
                    </Button>
                ))}
                <Button onClick={showWeeklyRecap}>Récapitulatif semaine</Button>
            </div>
            <PlanningTable
                config={config}
                selectedShop={selectedShop}
                selectedWeek={selectedWeek}
                selectedEmployees={selectedEmployees}
                planning={planning}
                setPlanning={setPlanning}
                days={days}
            />
            <CopyPasteSection
                planning={planning}
                setPlanning={setPlanning}
                selectedShop={selectedShop}
                selectedWeek={selectedWeek}
                selectedEmployees={selectedEmployees}
                days={days}
            />
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={cancelReset}>
                            ✕
                        </button>
                        <h2>Confirmer la réinitialisation</h2>
                        <p>Voulez-vous vraiment réinitialiser le planning ?</p>
                        <div className="button-group">
                            <Button onClick={confirmReset}>Confirmer</Button>
                            <Button onClick={cancelReset} variant="secondary">Annuler</Button>
                        </div>
                    </div>
                </div>
            )}
            {recapModal && (
                <RecapModal
                    type={recapModal.type}
                    data={recapModal.type === 'employee' ? { employee: recapModal.employee, planning } : { planning }}
                    onClose={closeRecapModal}
                    config={config}
                    days={days}
                    selectedEmployees={selectedEmployees}
                />
            )}
            <Footer />
        </div>
    );
};

export default PlanningDisplay;