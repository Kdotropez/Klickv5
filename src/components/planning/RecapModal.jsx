import React, { useState } from 'react';
import { format, addMinutes, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapModal = ({ type, employee, shop, days, config, selectedWeek, planning, selectedEmployees, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#e6f0fa'];

    const calculateRecapData = () => {
        if (type === 'employee') {
            return days.map((day, index) => {
                const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                const slots = planning[employee]?.[dayKey] || [];
                let arrival = null, pause1 = null, return1 = null, pause2 = null, return2 = null, exit = null;
                let hours = 0;
                let inBlock = false;
                let blockCount = 0;

                for (let i = 0; i < slots.length; i++) {
                    if (slots[i] && !inBlock) {
                        if (!arrival) {
                            arrival = config.timeSlots[i];
                            inBlock = true;
                        } else if (blockCount === 1) {
                            return1 = config.timeSlots[i];
                            inBlock = true;
                        } else if (blockCount === 2) {
                            return2 = config.timeSlots[i];
                            inBlock = true;
                        }
                        hours += config.interval / 60;
                    } else if (!slots[i] && inBlock) {
                        if (!pause1) {
                            pause1 = config.timeSlots[i];
                            inBlock = false;
                            blockCount++;
                        } else if (blockCount === 1) {
                            pause2 = config.timeSlots[i];
                            inBlock = false;
                            blockCount++;
                        } else if (i > 0 && config.timeSlots[i - 1]) {
                            exit = getEndTime(config.timeSlots[i - 1], config.interval);
                            inBlock = false;
                        }
                    } else if (slots[i]) {
                        hours += config.interval / 60;
                    }
                    if (slots[i] && i === slots.length - 1 && config.timeSlots[i]) {
                        exit = getEndTime(config.timeSlots[i], config.interval);
                    }
                }

                return {
                    day: day.name,
                    arrival: arrival || '-',
                    pause1: pause1 || '-',
                    return1: return1 || '-',
                    pause2: pause2 || '-',
                    return2: return2 || '-',
                    exit: exit || '-',
                    hours: hours.toFixed(1)
                };
            });
        } else {
            return days.map((day, index) => {
                const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                const employeesData = selectedEmployees.map(emp => {
                    const slots = planning[emp]?.[dayKey] || [];
                    let arrival = null, pause1 = null, return1 = null, pause2 = null, return2 = null, exit = null;
                    let hours = 0;
                    let inBlock = false;
                    let blockCount = 0;

                    for (let i = 0; i < slots.length; i++) {
                        if (slots[i] && !inBlock) {
                            if (!arrival) {
                                arrival = config.timeSlots[i];
                                inBlock = true;
                            } else if (blockCount === 1) {
                                return1 = config.timeSlots[i];
                                inBlock = true;
                            } else if (blockCount === 2) {
                                return2 = config.timeSlots[i];
                                inBlock = true;
                            }
                            hours += config.interval / 60;
                        } else if (!slots[i] && inBlock) {
                            if (!pause1) {
                                pause1 = config.timeSlots[i];
                                inBlock = false;
                                blockCount++;
                            } else if (blockCount === 1) {
                                pause2 = config.timeSlots[i];
                                inBlock = false;
                                blockCount++;
                            } else if (i > 0 && config.timeSlots[i - 1]) {
                                exit = getEndTime(config.timeSlots[i - 1], config.interval);
                                inBlock = false;
                            }
                        } else if (slots[i]) {
                            hours += config.interval / 60;
                        }
                        if (slots[i] && i === slots.length - 1 && config.timeSlots[i]) {
                            exit = getEndTime(config.timeSlots[i], config.interval);
                        }
                    }

                    return {
                        day: day.name,
                        employee: emp,
                        arrival: arrival || '-',
                        pause1: pause1 || '-',
                        return1: return1 || '-',
                        pause2: pause2 || '-',
                        return2: return2 || '-',
                        exit: exit || '-',
                        hours: hours.toFixed(1),
                        dayIndex: index
                    };
                });
                return { day: day.name, employees: employeesData };
            });
        }
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime) return '-';
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
            doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`, 14, 30);
            doc.autoTable({
                head: [['Jour', 'Arrivée', 'Pause 1', 'Retour 1', 'Pause 2', 'Retour 2', 'Sortie', 'Heures effectives']],
                body: data.map(row => [row.day, row.arrival, row.pause1, row.return1, row.pause2, row.return2, row.exit, row.hours]),
                startY: 40,
                theme: 'grid',
                styles: { font: 'times', fontSize: 10 },
                headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
            });
        } else {
            doc.text(`Récapitulatif hebdomadaire - ${shop}`, 14, 20);
            doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`, 14, 30);
            let startY = 40;
            data.forEach((dayData, index) => {
                doc.text(dayData.day, 14, startY);
                doc.autoTable({
                    head: [['Employé', 'Arrivée', 'Pause 1', 'Retour 1', 'Pause 2', 'Retour 2', 'Sortie', 'Heures effectives']],
                    body: dayData.employees.map(row => [row.employee, row.arrival, row.pause1, row.return1, row.pause2, row.return2, row.exit, row.hours]),
                    startY: startY + 5,
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 10, fillColor: pastelColors[index % pastelColors.length] },
                    headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                });
                startY = doc.lastAutoTable.finalY + 10;
            });
        }

        doc.text('Klick-Planning - copyright © Nicolas Lefevre', 14, doc.internal.pageSize.height - 10);
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
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                    Semaine du Lundi {format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche {format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}
                </p>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            {type === 'week' && <th>Employé</th>}
                            <th>Arrivée</th>
                            <th>Pause 1</th>
                            <th>Retour 1</th>
                            <th>Pause 2</th>
                            <th>Retour 2</th>
                            <th>Sortie</th>
                            <th>Heures effectives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {type === 'employee' ? (
                            recapData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.day}</td>
                                    <td>{row.arrival}</td>
                                    <td>{row.pause1}</td>
                                    <td>{row.return1}</td>
                                    <td>{row.pause2}</td>
                                    <td>{row.return2}</td>
                                    <td>{row.exit}</td>
                                    <td>{row.hours} h</td>
                                </tr>
                            ))
                        ) : (
                            recapData.map((dayData, dayIndex) => (
                                <React.Fragment key={dayIndex}>
                                    {dayData.employees.map((row, empIndex) => (
                                        <tr key={`${dayIndex}-${empIndex}`} style={{ backgroundColor: pastelColors[dayIndex % pastelColors.length] }}>
                                            <td>{empIndex === 0 ? row.day : ''}</td>
                                            <td>{row.employee}</td>
                                            <td>{row.arrival}</td>
                                            <td>{row.pause1}</td>
                                            <td>{row.return1}</td>
                                            <td>{row.pause2}</td>
                                            <td>{row.return2}</td>
                                            <td>{row.exit}</td>
                                            <td>{row.hours} h</td>
                                        </tr>
                                    ))}
                                    {dayIndex < recapData.length - 1 && (
                                        <tr style={{ height: '10px', backgroundColor: 'transparent' }}></tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
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
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#333' }}>
                    Klick-Planning - copyright © Nicolas Lefevre
                </p>
            </div>
        </div>
    );
};

export default RecapModal;