import { format, parse, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapModal = ({ type, data, onClose, config, days, selectedEmployees }) => {
    const isValid = () => {
        return (
            config.interval &&
            config.startTime &&
            config.endTime &&
            config.timeSlots &&
            days.length > 0 &&
            (type === 'employee' ? data.employee && data.planning : data.planning && selectedEmployees.length > 0)
        );
    };

    const calculateHours = (slots) => {
        return (slots.length * config.interval) / 60;
    };

    const getDailySummary = (employee, day) => {
        if (!data.planning[day]?.[employee] || data.planning[day][employee].length === 0) {
            return { arrival: '-', departure1: '-', return1: '-', departure2: '-', return2: '-', end: '-', hours: 0 };
        }
        const slots = data.planning[day][employee].sort();
        console.log(`Slots pour ${employee} le ${day}:`, slots); // Debug

        // Group consecutive slots into periods
        const periods = [];
        let currentPeriod = [slots[0]];
        for (let i = 1; i < slots.length; i++) {
            const prevTime = parse(slots[i - 1], 'HH:mm', new Date());
            const currTime = parse(slots[i], 'HH:mm', new Date());
            const diffMinutes = (currTime - prevTime) / (1000 * 60);
            if (diffMinutes === config.interval) {
                currentPeriod.push(slots[i]);
            } else {
                periods.push(currentPeriod);
                currentPeriod = [slots[i]];
            }
        }
        periods.push(currentPeriod);

        console.log(`Périodes pour ${employee} le ${day}:`, periods); // Debug

        // Calculate breaks between periods
        let departures = [];
        let returns = [];
        for (let i = 1; i < periods.length; i++) {
            const prevPeriodEnd = periods[i - 1][periods[i - 1].length - 1];
            const currPeriodStart = periods[i][0];
            const prevTime = parse(prevPeriodEnd, 'HH:mm', new Date());
            const endTime = addMinutes(prevTime, config.interval); // Add interval to get end of slot
            const currTime = parse(currPeriodStart, 'HH:mm', new Date());
            const diffMinutes = (currTime - prevTime) / (1000 * 60);
            if (diffMinutes >= 30) {
                departures.push(format(endTime, 'HH:mm')); // Use end of slot for departure
                returns.push(currPeriodStart);
            }
        }

        console.log(`Pauses pour ${employee} le ${day}:`, { departures, returns }); // Debug

        return {
            arrival: slots[0],
            departure1: departures[0] || '-',
            return1: returns[0] || '-',
            departure2: departures[1] || '-',
            return2: returns[1] || '-',
            end: format(addMinutes(parse(slots[slots.length - 1], 'HH:mm', new Date()), config.interval), 'HH:mm'),
            hours: calculateHours(slots),
        };
    };

    const getRestDaysAndHours = (employee) => {
        const restDays = days
            .filter((day) => getDailySummary(employee, day).hours === 0)
            .map((day) => format(new Date(day), 'EEEE', { locale: fr }).toUpperCase());
        const totalHours = calculateHours(
            days.reduce((acc, day) => acc.concat(data.planning[day]?.[employee] || []), [])
        );
        return restDays.length > 0
            ? `${employee} : ${totalHours.toFixed(1)} h, Repos : ${restDays.join(', ')}`
            : `${employee} : ${totalHours.toFixed(1)} h, Repos : aucun`;
    };

    const applyTableStyles = (doc, startY, isWeekly, selectedEmployees) => {
        const pageWidth = 297 - 25; // A4 landscape width (297mm) - 10mm left margin - 15mm right margin
        return {
            startY,
            margin: { left: 10, right: 15, top: 20, bottom: 10 },
            styles: {
                font: 'helvetica',
                fontSize: 9, // Increased for better readability
                cellPadding: 2,
                textColor: [51, 51, 51], // #333
                lineColor: [221, 221, 221], // #ddd
                lineWidth: 0.2,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [240, 240, 240], // #f0f0f0
                textColor: [51, 51, 51], // #333
                fontStyle: 'bold',
                halign: 'center', // Center headers
            },
            bodyStyles: {
                textColor: [51, 51, 51], // #333
                halign: 'center', // Center cell content
                fontStyle: 'bold', // Make table data bold
            },
            columnStyles: isWeekly
                ? {
                    0: { cellWidth: pageWidth * 0.12 }, // Jour: 12% (~32.6 mm)
                    1: { cellWidth: pageWidth * 0.12 }, // Employé: 12% (~32.6 mm)
                    2: { cellWidth: pageWidth * 0.12 }, // Arrivée: 12% (~32.6 mm)
                    3: { cellWidth: pageWidth * 0.10 }, // Sortie 1: 10% (~27.2 mm)
                    4: { cellWidth: pageWidth * 0.10 }, // Retour 1: 10% (~27.2 mm)
                    5: { cellWidth: pageWidth * 0.10 }, // Sortie 2: 10% (~27.2 mm)
                    6: { cellWidth: pageWidth * 0.10 }, // Retour 2: 10% (~27.2 mm)
                    7: { cellWidth: pageWidth * 0.10 }, // Fin: 10% (~27.2 mm)
                    8: { cellWidth: pageWidth * 0.14 }, // Heures: 14% (~38.1 mm)
                }
                : {
                    0: { cellWidth: pageWidth * 0.20 }, // Jour: 20% (~54.4 mm)
                    1: { cellWidth: pageWidth * 0.12 }, // Arrivée: 12% (~32.6 mm)
                    2: { cellWidth: pageWidth * 0.11 }, // Sortie 1: 11% (~29.9 mm)
                    3: { cellWidth: pageWidth * 0.11 }, // Retour 1: 11% (~29.9 mm)
                    4: { cellWidth: pageWidth * 0.11 }, // Sortie 2: 11% (~29.9 mm)
                    5: { cellWidth: pageWidth * 0.11 }, // Retour 2: 11% (~29.9 mm)
                    6: { cellWidth: pageWidth * 0.11 }, // Fin: 11% (~29.9 mm)
                    7: { cellWidth: pageWidth * 0.14 }, // Heures: 14% (~38.1 mm)
                },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    // Calculate the day index based on row index
                    const rowIndex = data.row.index;
                    const dayIndex = isWeekly ? Math.floor(rowIndex / selectedEmployees.length) : rowIndex; // 0 for lundi, 1 for mardi, etc.
                    const pastelColors = [
                        [230, 240, 250], // #e6f0fa (lundi)
                        [230, 255, 237], // #e6ffed (mardi)
                        [255, 230, 230], // #ffe6e6 (mercredi)
                        [208, 240, 250], // #d0f0fa (jeudi)
                        [212, 244, 226], // #d4f4e2 (vendredi)
                        [243, 228, 255], // #f3e4ff (samedi)
                        [255, 243, 224], // #fff3e0 (dimanche)
                    ];
                    if (dayIndex >= 0 && dayIndex < pastelColors.length) {
                        data.cell.styles.fillColor = pastelColors[dayIndex];
                        console.log(`Couleur appliquée pour ligne ${rowIndex}, jour ${dayIndex}: ${pastelColors[dayIndex]}`); // Debug
                    } else {
                        console.warn(`Index de jour invalide: ${dayIndex}, rowIndex: ${rowIndex}, selectedEmployees.length: ${selectedEmployees.length}`); // Debug
                    }
                }
            },
        };
    };

    const exportPDF = (employee, isWeekly = false) => {
        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });
            doc.setFont('helvetica');
            doc.setFontSize(16);
            const title = employee
                ? `Récapitulatif pour ${employee} (${calculateHours(
                    days.reduce((acc, day) => acc.concat(data.planning[day]?.[employee] || []), [])
                ).toFixed(1)} H)`
                : 'Récapitulatif hebdomadaire';
            doc.text(title, 148.5, 15, { align: 'center' }); // Center on 297mm width
            doc.setFontSize(12);
            doc.text(
                `semaine du ${format(new Date(days[0]), 'EEEE d MMMM', { locale: fr })} au ${format(
                    new Date(days[days.length - 1]),
                    'EEEE d MMMM',
                    { locale: fr }
                )}`,
                148.5,
                22,
                { align: 'center' }
            );
            const tableData = isWeekly
                ? days.flatMap((day) =>
                    selectedEmployees.map((employee) => {
                        const summary = getDailySummary(employee, day);
                        return [
                            format(new Date(day), 'EEEE', { locale: fr }).toUpperCase(),
                            employee,
                            summary.arrival,
                            summary.departure1,
                            summary.return1,
                            summary.departure2,
                            summary.return2,
                            summary.end,
                            `${summary.hours.toFixed(1)} h`,
                        ];
                    })
                )
                : days.map((day) => {
                    const summary = getDailySummary(employee, day);
                    return [
                        format(new Date(day), 'EEEE', { locale: fr }).toUpperCase(),
                        summary.arrival,
                        summary.departure1,
                        summary.return1,
                        summary.departure2,
                        summary.return2,
                        summary.end,
                        `${summary.hours.toFixed(1)} h`,
                    ];
                });
            autoTable(doc, {
                head: isWeekly
                    ? [['Jour', 'Employé', 'Arrivée', 'Sortie 1', 'Retour 1', 'Sortie 2', 'Retour 2', 'Fin', 'Heures']]
                    : [['Jour', 'Arrivée', 'Sortie 1', 'Retour 1', 'Sortie 2', 'Retour 2', 'Fin', 'Heures']],
                body: tableData,
                ...applyTableStyles(doc, 30, isWeekly, selectedEmployees),
            });
            // Add rest days and hours text below the table
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51); // #333
            const tableHeight = doc.lastAutoTable.finalY; // Get the Y position after the table
            let yOffset = tableHeight + 5; // Start 5mm below the table
            if (isWeekly) {
                selectedEmployees.forEach((emp) => {
                    const restDaysText = getRestDaysAndHours(emp);
                    doc.text(restDaysText, 10, yOffset);
                    yOffset += 5; // Add 5mm for each line
                });
            } else {
                const restDaysText = getRestDaysAndHours(employee);
                doc.text(restDaysText, 10, yOffset);
            }
            doc.setFontSize(8);
            doc.setTextColor(153, 153, 153); // #999
            doc.text('Klick-Planning - copyright © Nicolas Lefevre', 10, doc.internal.pageSize.height - 10);
            doc.save(isWeekly ? 'weekly_recap.pdf' : `recap_${employee}.pdf`);
        } catch (error) {
            console.error('Erreur détaillée lors de l\'exportation PDF:', {
                message: error.message,
                stack: error.stack,
                data: { employee, isWeekly },
            });
            alert('Une erreur s’est produite lors de l’exportation du PDF. Veuillez vérifier la console (F12 > Console) pour plus de détails.');
        }
    };

    if (!isValid()) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                    <h2>Erreur</h2>
                    <p>Données invalides. Veuillez vérifier les paramètres.</p>
                    <div className="button-group">
                        <Button onClick={onClose} variant="secondary">Fermer</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    ✕
                </button>
                <h2 className="modal-title">
                    {type === 'employee'
                        ? `Récapitulatif pour ${data.employee} (${calculateHours(
                            days.reduce((acc, day) => acc.concat(data.planning[day]?.[data.employee] || []), [])
                        ).toFixed(1)} H)`
                        : 'Récapitulatif hebdomadaire'}
                </h2>
                {type === 'employee' && (
                    <p className="modal-period">
                        semaine du {format(new Date(days[0]), 'EEEE d MMMM', { locale: fr })} au{' '}
                        {format(new Date(days[days.length - 1]), 'EEEE d MMMM', { locale: fr })}
                    </p>
                )}
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            {type === 'weekly' && <th>Employé</th>}
                            <th>Arrivée</th>
                            <th>Sortie 1</th>
                            <th>Retour 1</th>
                            <th>Sortie 2</th>
                            <th>Retour 2</th>
                            <th>Fin</th>
                            <th>Heures</th>
                        </tr>
                    </thead>
                    <tbody>
                        {type === 'employee'
                            ? days.map((day) => {
                                const summary = getDailySummary(data.employee, day);
                                return (
                                    <tr key={day}>
                                        <td>{format(new Date(day), 'EEEE', { locale: fr })}</td>
                                        <td>{summary.arrival}</td>
                                        <td>{summary.departure1}</td>
                                        <td>{summary.return1}</td>
                                        <td>{summary.departure2}</td>
                                        <td>{summary.return2}</td>
                                        <td>{summary.end}</td>
                                        <td>{summary.hours.toFixed(1)} h</td>
                                    </tr>
                                );
                            })
                            : days.flatMap((day) =>
                                selectedEmployees.map((employee) => {
                                    const summary = getDailySummary(employee, day);
                                    return (
                                        <tr key={`${day}-${employee}`}>
                                            <td>{format(new Date(day), 'EEEE', { locale: fr })}</td>
                                            <td>{employee}</td>
                                            <td>{summary.arrival}</td>
                                            <td>{summary.departure1}</td>
                                            <td>{summary.return1}</td>
                                            <td>{summary.departure2}</td>
                                            <td>{summary.return2}</td>
                                            <td>{summary.end}</td>
                                            <td>{summary.hours.toFixed(1)} h</td>
                                        </tr>
                                    );
                                })
                            )}
                    </tbody>
                </table>
                <div className="button-group">
                    {type === 'employee' && (
                        <Button onClick={() => exportPDF(data.employee)}>Exporter PDF</Button>
                    )}
                    {type === 'weekly' && (
                        <Button onClick={() => exportPDF(null, true)}>Exporter Récapitulatif Semaine PDF</Button>
                    )}
                    <Button onClick={onClose} variant="secondary">Fermer</Button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;