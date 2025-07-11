import { useState } from 'react';
import { format, addMinutes, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapModal = ({ type, data, onClose, config, days, selectedEmployees, selectedShop }) => {
    const [error, setError] = useState('');

    // Vérifier que les données nécessaires sont disponibles
    if (!data || !config || !days || !selectedEmployees) {
        console.error('RecapModal: Données manquantes', { data, config, days, selectedEmployees, selectedShop });
        setError('Erreur : Données manquantes pour afficher le récapitulatif.');
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                    <h3>Erreur</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Couleurs pastel pour chaque jour (7 jours)
    const dayColors = [
        '#e6f0fa', // Lundi
        '#e6ffed', // Mardi
        '#ffe6e6', // Mercredi
        '#d6e6ff', // Jeudi
        '#d4f4e2', // Vendredi
        '#f0e6fa', // Samedi
        '#fffde6', // Dimanche
    ];

    // Fonction pour calculer les périodes continues (arrivée, sortie(s), retour(s), fin)
    const getEmployeeSchedule = (employee, day) => {
        if (!data.planning || !config?.interval) {
            console.warn(`getEmployeeSchedule: Données manquantes pour ${employee} le ${format(day, 'yyyy-MM-dd')}`);
            return { arrival: '', exit1: '', return1: '', exit2: '', return2: '', end: '', hours: 0, hasSecondPause: false };
        }

        const dateKey = format(day, 'yyyy-MM-dd');
        const slots = data.planning[dateKey]?.[employee] || [];
        if (slots.length === 0) {
            return { arrival: '', exit1: '', return1: '', exit2: '', return2: '', end: '', hours: 0, hasSecondPause: false };
        }

        // Trier les créneaux pour garantir un ordre chronologique
        const sortedSlots = slots.sort((a, b) => {
            const aTime = a >= '00:00' && a < '06:00' ? `24:${a.split(':')[1]}` : a;
            const bTime = b >= '00:00' && b < '06:00' ? `24:${b.split(':')[1]}` : b;
            return aTime.localeCompare(bTime);
        });

        let arrival = sortedSlots[0];
        let exit1 = '';
        let return1 = '';
        let exit2 = '';
        let return2 = '';
        let hasSecondPause = false;
        let hours = (sortedSlots.length * config.interval) / 60;

        // Déterminer les groupes de créneaux continus
        const groups = [];
        let currentGroup = [sortedSlots[0]];
        for (let i = 1; i < sortedSlots.length; i++) {
            let currentTime = new Date(`2025-01-01T${sortedSlots[i]}`);
            let prevTime = new Date(`2025-01-01T${sortedSlots[i - 1]}`);
            if (sortedSlots[i] >= '00:00' && sortedSlots[i] < '06:00') {
                currentTime = addDays(currentTime, 1);
            }
            if (sortedSlots[i - 1] >= '00:00' && sortedSlots[i - 1] < '06:00') {
                prevTime = addDays(prevTime, 1);
            }
            const diffMinutes = (currentTime - prevTime) / 60000;
            if (diffMinutes > config.interval) {
                groups.push(currentGroup);
                currentGroup = [sortedSlots[i]];
            } else {
                currentGroup.push(sortedSlots[i]);
            }
        }
        groups.push(currentGroup);

        // Assigner les valeurs en fonction des groupes
        if (groups.length === 1) {
            // Pas de pause
            exit1 = format(addMinutes(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), config.interval), 'HH:mm');
            if (groups[0][groups[0].length - 1] >= '00:00' && groups[0][groups[0].length - 1] < '06:00') {
                exit1 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), 1), config.interval), 'HH:mm');
            }
        } else if (groups.length === 2) {
            // Une pause
            exit1 = format(addMinutes(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), config.interval), 'HH:mm');
            return1 = groups[1][0];
            if (groups[0][groups[0].length - 1] >= '00:00' && groups[0][groups[0].length - 1] < '06:00') {
                exit1 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), 1), config.interval), 'HH:mm');
            }
        } else if (groups.length >= 3) {
            // Deux pauses
            exit1 = format(addMinutes(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), config.interval), 'HH:mm');
            return1 = groups[1][0];
            exit2 = format(addMinutes(new Date(`2025-01-01T${groups[1][groups[1].length - 1]}`), config.interval), 'HH:mm');
            return2 = groups[2][0];
            hasSecondPause = true;
            if (groups[0][groups[0].length - 1] >= '00:00' && groups[0][groups[0].length - 1] < '06:00') {
                exit1 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[0][groups[0].length - 1]}`), 1), config.interval), 'HH:mm');
            }
            if (groups[1][groups[1].length - 1] >= '00:00' && groups[1][groups[1].length - 1] < '06:00') {
                exit2 = format(addMinutes(addDays(new Date(`2025-01-01T${groups[1][groups[1].length - 1]}`), 1), config.interval), 'HH:mm');
            }
        }

        // Définir la fin comme la fin du dernier créneau
        let endTime = new Date(`2025-01-01T${sortedSlots[sortedSlots.length - 1]}`);
        if (sortedSlots[sortedSlots.length - 1] >= '00:00' && sortedSlots[sortedSlots.length - 1] < '06:00') {
            endTime = addDays(endTime, 1);
        }
        const end = format(addMinutes(endTime, config.interval), 'HH:mm');

        const schedule = { arrival, exit1, return1, exit2, return2, end, hours, hasSecondPause };
        console.log(`getEmployeeSchedule: employee=${employee}, day=${dateKey}, schedule=${JSON.stringify(schedule)}`);
        return schedule;
    };

    // Générer les données pour le récapitulatif individuel
    const getIndividualRecap = (employee) => {
        return days.map((day) => {
            const schedule = getEmployeeSchedule(employee, day);
            return {
                day: format(day, 'EEEE', { locale: fr }), // Simplifier à "lundi"
                arrival: schedule.arrival,
                exit1: schedule.exit1,
                return1: schedule.return1,
                exit2: schedule.exit2,
                return2: schedule.return2,
                end: schedule.end,
                hours: schedule.hours.toFixed(1),
                hasSecondPause: schedule.hasSecondPause,
            };
        });
    };

    // Générer les données pour le récapitulatif hebdomadaire
    const getWeeklyRecap = () => {
        const recap = [];
        selectedEmployees.forEach((employee) => {
            days.forEach((day) => {
                const schedule = getEmployeeSchedule(employee, day);
                if (schedule.hours > 0) {
                    recap.push({
                        day: format(day, 'EEEE', { locale: fr }), // Simplifier à "lundi"
                        employee,
                        arrival: schedule.arrival,
                        exit1: schedule.exit1,
                        return1: schedule.return1,
                        exit2: schedule.exit2,
                        return2: schedule.return2,
                        end: schedule.end,
                        hours: schedule.hours.toFixed(1),
                        hasSecondPause: schedule.hasSecondPause,
                    });
                }
            });
        });
        console.log('getWeeklyRecap:', JSON.stringify(recap));
        return recap;
    };

    // Générer les données pour le planning individuel
    const getIndividualPlanning = (employee) => {
        return days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const slots = (data.planning[dateKey]?.[employee] || []).sort((a, b) => {
                const aTime = a >= '00:00' && a < '06:00' ? `24:${a.split(':')[1]}` : a;
                const bTime = b >= '00:00' && b < '06:00' ? `24:${b.split(':')[1]}` : b;
                return aTime.localeCompare(bTime);
            });
            return {
                day: format(day, 'EEEE', { locale: fr }), // Simplifier à "lundi"
                slots: slots.length > 0 ? slots.map((slot) => {
                    let slotTime = new Date(`2025-01-01T${slot}`);
                    if (slot >= '00:00' && slot < '06:00') {
                        slotTime = addDays(slotTime, 1);
                    }
                    return `${slot}-${format(addMinutes(slotTime, config.interval), 'HH:mm')}`;
                }).join(', ') : '-',
            };
        });
    };

    // Générer les données pour le planning de la boutique
    const getShopPlanning = () => {
        const planning = [];
        selectedEmployees.forEach((employee) => {
            days.forEach((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const slots = (data.planning[dateKey]?.[employee] || []).sort((a, b) => {
                    const aTime = a >= '00:00' && a < '06:00' ? `24:${a.split(':')[1]}` : a;
                    const bTime = b >= '00:00' && b < '06:00' ? `24:${b.split(':')[1]}` : b;
                    return aTime.localeCompare(bTime);
                });
                if (slots.length > 0) {
                    planning.push({
                        day: format(day, 'EEEE', { locale: fr }), // Simplifier à "lundi"
                        employee,
                        slots: slots.map((slot) => {
                            let slotTime = new Date(`2025-01-01T${slot}`);
                            if (slot >= '00:00' && slot < '06:00') {
                                slotTime = addDays(slotTime, 1);
                            }
                            return `${slot}-${format(addMinutes(slotTime, config.interval), 'HH:mm')}`;
                        }).join(', '),
                    });
                }
            });
        });
        console.log('getShopPlanning:', JSON.stringify(planning));
        return planning;
    };

    // Fonction pour générer le PDF
    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            let yOffset = 20;

            // Déterminer si des données contiennent deux pauses
            const hasSecondPause = type === 'employee'
                ? getIndividualRecap(data.employee).some(row => row.hasSecondPause)
                : getWeeklyRecap().some(row => row.hasSecondPause);

            // Titre du PDF
            doc.setFont('times', 'normal');
            doc.setFontSize(16);
            const title = type === 'employee' ? `Récapitulatif pour ${data.employee}` : 'Récapitulatif semaine';
            doc.text(title, pageWidth / 2, yOffset, { align: 'center' });
            yOffset += 10;

            // Afficher la semaine
            const weekText = `Semaine du ${format(days[0], 'EEEE d MMMM', { locale: fr })} au ${format(days[6], 'EEEE d MMMM', { locale: fr })}`;
            doc.setFontSize(16);
            doc.text(weekText, pageWidth / 2, yOffset, { align: 'center' });
            yOffset += 10;

            // Générer le tableau selon le type
            if (type === 'employee') {
                // Récapitulatif individuel
                const head = hasSecondPause
                    ? [['Jour', 'Arrivée', 'Sortie', 'Retour', 'Sortie', 'Retour', 'Fin', 'Heures effectives']]
                    : [['Jour', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']];
                const body = getIndividualRecap(data.employee).map((row) => hasSecondPause
                    ? [row.day, row.arrival || '-', row.exit1 || '-', row.return1 || '-', row.exit2 || '-', row.return2 || '-', row.end || '-', `${row.hours} h`]
                    : [row.day, row.arrival || '-', row.exit1 || '-', row.return1 || '-', row.end || '-', `${row.hours} h`]);
                console.log('Individual recap body:', JSON.stringify(body));
                if (body.length === 0) {
                    throw new Error('Aucune donnée valide pour le récapitulatif individuel.');
                }
                doc.autoTable({
                    startY: yOffset,
                    head,
                    body,
                    theme: 'striped',
                    headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    bodyStyles: {
                        fillColor: (rowIndex) => dayColors[rowIndex % dayColors.length] || '#fff'
                    },
                    styles: { font: 'times', fontSize: 10 },
                    margin: { top: margin, left: margin, right: margin },
                });
                yOffset = doc.lastAutoTable.finalY + 10;

                // Planning individuel
                doc.addPage();
                yOffset = 20;
                doc.text(`Planning pour ${data.employee}`, pageWidth / 2, yOffset, { align: 'center' });
                yOffset += 10;
                doc.text(weekText, pageWidth / 2, yOffset, { align: 'center' });
                yOffset += 10;
                const planningBody = getIndividualPlanning(data.employee).map((row) => [
                    row.day,
                    row.slots,
                ]);
                console.log('Individual planning body:', JSON.stringify(planningBody));
                if (planningBody.length === 0) {
                    throw new Error('Aucune donnée valide pour le planning individuel.');
                }
                doc.autoTable({
                    startY: yOffset,
                    head: [['Jour', 'Tranches horaires']],
                    body: planningBody,
                    theme: 'striped',
                    headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    bodyStyles: {
                        fillColor: (rowIndex) => dayColors[rowIndex % dayColors.length] || '#fff'
                    },
                    styles: { font: 'times', fontSize: 10 },
                    margin: { top: margin, left: margin, right: margin },
                });
            } else {
                // Récapitulatif hebdomadaire
                const recapData = getWeeklyRecap();
                console.log('Weekly recap body:', JSON.stringify(recapData));
                if (!recapData || recapData.length === 0) {
                    throw new Error('Aucune donnée valide pour le récapitulatif hebdomadaire.');
                }
                const head = hasSecondPause
                    ? [['Jour', 'Employé', 'Arrivée', 'Sortie', 'Retour', 'Sortie', 'Retour', 'Fin', 'Heures effectives']]
                    : [['Jour', 'Employé', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']];
                const body = recapData.map((row) => hasSecondPause
                    ? [row.day, row.employee, row.arrival || '-', row.exit1 || '-', row.return1 || '-', row.exit2 || '-', row.return2 || '-', row.end || '-', `${row.hours} h`]
                    : [row.day, row.employee, row.arrival || '-', row.exit1 || '-', row.return1 || '-', row.end || '-', `${row.hours} h`]);
                doc.autoTable({
                    startY: yOffset,
                    head,
                    body,
                    theme: 'striped',
                    headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    bodyStyles: {
                        fillColor: (rowIndex) => {
                            if (!recapData[rowIndex]) return '#fff';
                            const dayIndex = days.findIndex((d) => format(d, 'EEEE', { locale: fr }) === recapData[rowIndex].day);
                            return dayColors[dayIndex >= 0 ? dayIndex : 0] || '#fff';
                        }
                    },
                    styles: { font: 'times', fontSize: 10 },
                    margin: { top: margin, left: margin, right: margin },
                });
                yOffset = doc.lastAutoTable.finalY + 10;

                // Planning de la boutique
                doc.addPage();
                yOffset = 20;
                doc.text(`Planning pour ${selectedShop || 'Boutique'}`, pageWidth / 2, yOffset, { align: 'center' });
                yOffset += 10;
                doc.text(weekText, pageWidth / 2, yOffset, { align: 'center' });
                yOffset += 10;
                const shopPlanningBody = getShopPlanning();
                console.log('Shop planning body:', JSON.stringify(shopPlanningBody));
                if (!shopPlanningBody || shopPlanningBody.length === 0) {
                    throw new Error('Aucune donnée valide pour le planning de la boutique.');
                }
                doc.autoTable({
                    startY: yOffset,
                    head: [['Jour', 'Employé', 'Tranches horaires']],
                    body: shopPlanningBody.map((row) => [
                        row.day,
                        row.employee,
                        row.slots,
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    bodyStyles: {
                        fillColor: (rowIndex) => {
                            if (!shopPlanningBody[rowIndex]) return '#fff';
                            const dayIndex = days.findIndex((d) => format(d, 'EEEE', { locale: fr }) === shopPlanningBody[rowIndex].day);
                            return dayColors[dayIndex >= 0 ? dayIndex : 0] || '#fff';
                        }
                    },
                    styles: { font: 'times', fontSize: 10 },
                    margin: { top: margin, left: margin, right: margin },
                });
            }

            // Ajouter le copyright
            doc.setFontSize(8);
            doc.text('© Nicolas Lefevre 2025', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Télécharger le PDF
            const fileName = type === 'employee' ? `recap_${data.employee}_${format(new Date(days[0]), 'yyyy-MM-dd')}.pdf` : `recap_weekly_${selectedShop || 'Boutique'}_${format(new Date(days[0]), 'yyyy-MM-dd')}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Erreur lors de l’exportation PDF:', error);
            alert('Erreur lors de la génération du PDF. Veuillez vérifier la console pour plus de détails.');
        }
    };

    // Déterminer si des données contiennent deux pauses pour l’affichage de la modale
    const hasSecondPause = type === 'employee'
        ? getIndividualRecap(data.employee).some(row => row.hasSecondPause)
        : getWeeklyRecap().some(row => row.hasSecondPause);

    const recapData = type === 'employee' ? getIndividualRecap(data.employee) : getWeeklyRecap();

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    ✕
                </button>
                <h3 style={{ textAlign: 'center', fontSize: '20px' }}>{type === 'employee' ? `Récapitulatif pour ${data.employee}` : 'Récapitulatif semaine'}</h3>
                <p style={{ textAlign: 'center', fontSize: '18px', fontFamily: 'Roboto, sans-serif', margin: '10px 0' }}>
                    Semaine du {format(days[0], 'EEEE d MMMM', { locale: fr })} au {format(days[6], 'EEEE d MMMM', { locale: fr })}
                </p>
                {recapData.length === 0 ? (
                    <p>Aucune donnée disponible pour ce récapitulatif.</p>
                ) : (
                    <table className="recap-table">
                        <thead>
                            <tr>
                                <th>Jour</th>
                                {type === 'weekly' && <th>Employé</th>}
                                <th>Arrivée</th>
                                <th>Sortie</th>
                                <th>Retour</th>
                                {hasSecondPause && <th>Sortie</th>}
                                {hasSecondPause && <th>Retour</th>}
                                <th>Fin</th>
                                <th>Heures effectives</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recapData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.day}</td>
                                    {type === 'weekly' && <td>{row.employee}</td>}
                                    <td>{row.arrival || '-'}</td>
                                    <td>{row.exit1 || '-'}</td>
                                    <td>{row.return1 || '-'}</td>
                                    {hasSecondPause && <td>{row.exit2 || '-'}</td>}
                                    {hasSecondPause && <td>{row.return2 || '-'}</td>}
                                    <td>{row.end || '-'}</td>
                                    <td>{row.hours} h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="button-group">
                    <Button className="button-base button-primary" onClick={handleExportPDF}>
                        Exporter en PDF
                    </Button>
                    <Button className="button-base button-retour" onClick={onClose}>
                        Fermer
                    </Button>
                </div>
                <footer>© Nicolas Lefevre 2025</footer>
            </div>
        </div>
    );
};

export default RecapModal;