import { useState } from 'react';
import { format, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapModal = ({ type, employee, shop, days, config, selectedWeek, planning, selectedEmployees, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);

    const calculateRecapData = () => {
        if (type === 'employee') {
            return days.map((day, index) => {
                const dayKey = format(addMinutes(new Date(selectedWeek), index * 24 * 60), 'yyyy-MM-dd');
                const slots = planning[employee]?.[dayKey] || [];
                let arrival = null, exit = null, returnTime = null, end = null;
                let hours = 0;

                for (let i = 0; i < slots.length; i++) {
                    if (slots[i]) {
                        if (!arrival) arrival = config.timeSlots[i];
                        exit = getEndTime(config.timeSlots[i], config.interval);
                        hours += config.interval / 60;
                    } else if (arrival && !returnTime) {
                        returnTime = config.timeSlots[i];
                    } else if (slots[i] && returnTime) {
                        end = getEndTime(config.timeSlots[i], config.interval);
                        hours += config.interval / 60;
                    }
                }

                return {
                    day: day.name,
                    arrival: arrival || '-',
                    exit: returnTime || exit || '-',
                    return: returnTime || '-',
                    end: end || exit || '-',
                    hours: hours.toFixed(1)
                };
            });
        } else {
            return selectedEmployees.flatMap(emp =>
                days.map((day, index) => {
                    const dayKey = format(addMinutes(new Date(selectedWeek), index * 24 * 60), 'yyyy-MM-dd');
                    const slots = planning[emp]?.[dayKey] || [];
                    let arrival = null, exit = null, returnTime = null, end = null;
                    let hours = 0;

                    for (let i = 0; i < slots.length; i++) {
                        if (slots[i]) {
                            if (!arrival) arrival = config.timeSlots[i];
                            exit = getEndTime(config.timeSlots[i], config.interval);
                            hours += config.interval / 60;
                        } else if (arrival && !returnTime) {
                            returnTime = config.timeSlots[i];
                        } else if (slots[i] && returnTime) {
                            end = getEndTime(config.timeSlots[i], config.interval);
                            hours += config.interval / 60;
                        }
                    }

                    return {
                        day: day.name,
                        employee: emp,
                        arrival: arrival || '-',
                        exit: returnTime || exit || '-',
                        return: returnTime || '-',
                        end: end || exit || '-',
                        hours: hours.toFixed(1)
                    };
                })
            );
        }
    };

    const getEndTime = (startTime, interval) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const exportToPDF = () => {
        setIsExporting(true);
        const doc = new jsPDF();
        const data = calculateRecapData();

        doc.setFont('times');
        doc.setFontSize(12);

        if (type === 'employee') {
            doc.text(`Récapitulatif individuel pour ${employee} - ${shop}`, 14, 20);
            doc.autoTable({
                head: [['Jour', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']],
                body: data.map(row => [row.day, row.arrival, row.exit, row.return, row.end, row.hours]),
                startY: 30,
                theme: 'grid',
                styles: { font: 'times', fontSize: 10 },
                headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
            });
        } else {
            doc.text(`Récapitulatif hebdomadaire - ${shop}`, 14, 20);
            doc.autoTable({
                head: [['Jour', 'Employé', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']],
                body: data.map(row => [row.day, row.employee, row.arrival, row.exit, row.return, row.end, row.hours]),
                startY: 30,
                theme: 'grid',
                styles: { font: 'times', fontSize: 10 },
                headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
            });
        }

        doc.text('© Nicolas Lefèvre 2025', 14, doc.internal.pageSize.height - 10);
        doc.save(`recap_${type}_${employee || 'week'}_${shop}.pdf`);
        setIsExporting(false);
    };

    const recapData = calculateRecapData();

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose} disabled={isExporting}>
                    ✕
                </button>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    {type === 'employee' ? `Récapitulatif pour ${employee}` : `Récapitulatif semaine - ${shop}`}
                </h3>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            {type === 'week' && <th>Employé</th>}
                            <th>Arrivée</th>
                            <th>Sortie</th>
                            <th>Retour</th>
                            <th>Fin</th>
                            <th>Heures effectives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recapData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.day}</td>
                                {type === 'week' && <td>{row.employee}</td>}
                                <td>{row.arrival}</td>
                                <td>{row.exit}</td>
                                <td>{row.return}</td>
                                <td>{row.end}</td>
                                <td>{row.hours} h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="button-group">
                    <Button
                        className="button-base button-primary"
                        onClick={exportToPDF}
                        disabled={isExporting}
                    >
                        Exporter en PDF
                    </Button>
                    <Button className="button-base button-retour" onClick={onClose} disabled={isExporting}>
                        Fermer
                    </Button>
                </div>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '10px' }}>
                    © Nicolas Lefèvre 2025
                </p>
            </div>
        </div>
    );
};

export default RecapModal;