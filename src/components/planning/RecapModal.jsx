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

        const slots = [...data.planning[day][employee]].sort((a, b) => {
            let aDate = parse(a, 'HH:mm', new Date('2000-01-01'));
            let bDate = parse(b, 'HH:mm', new Date('2000-01-01'));
            const startTime = parse(config.startTime, 'HH:mm', new Date('2000-01-01'));
            const endTime = parse(config.endTime, 'HH:mm', new Date('2000-01-01'));
            const isNextDay = endTime <= startTime || config.endTime <= '06:00';

            if (isNextDay && a <= '06:00') aDate.setDate(aDate.getDate() + 1);
            if (isNextDay && b <= '06:00') bDate.setDate(bDate.getDate() + 1);
            return aDate - bDate;
        });

        const periods = [];
        let currentPeriod = [slots[0]];
        for (let i = 1; i < slots.length; i++) {
            let prevTime = parse(slots[i - 1], 'HH:mm', new Date('2000-01-01'));
            let currTime = parse(slots[i], 'HH:mm', new Date('2000-01-01'));
            const startTime = parse(config.startTime, 'HH:mm', new Date('2000-01-01'));
            const isNextDay = config.endTime <= '06:00' || parse(config.endTime, 'HH:mm', new Date('2000-01-01')) <= startTime;

            if (isNextDay && slots[i - 1] <= '06:00') prevTime.setDate(prevTime.getDate() + 1);
            if (isNextDay && slots[i] <= '06:00') currTime.setDate(currTime.getDate() + 1);

            const diffMinutes = (currTime - prevTime) / (1000 * 60);
            if (diffMinutes <= config.interval && diffMinutes > 0) {
                currentPeriod.push(slots[i]);
            } else {
                periods.push(currentPeriod);
                currentPeriod = [slots[i]];
            }
        }
        periods.push(currentPeriod);

        let departures = [];
        let returns = [];
        for (let i = 1; i < periods.length; i++) {
            const prevPeriodEnd = periods[i - 1][periods[i - 1].length - 1];
            const currPeriodStart = periods[i][0];
            let prevTime = parse(prevPeriodEnd, 'HH:mm', new Date('2000-01-01'));
            let currTime = parse(currPeriodStart, 'HH:mm', new Date('2000-01-01'));
            const startTime = parse(config.startTime, 'HH:mm', new Date('2000-01-01'));
            const isNextDay = config.endTime <= '06:00' || parse(config.endTime, 'HH:mm', new Date('2000-01-01')) <= startTime;

            if (isNextDay && prevPeriodEnd <= '06:00') prevTime.setDate(prevTime.getDate() + 1);
            if (isNextDay && currPeriodStart <= '06:00') currTime.setDate(currTime.getDate() + 1);

            const diffMinutes = (currTime - prevTime) / (1000 * 60);
            if (diffMinutes >= 30) {
                let endTime = parse(prevPeriodEnd, 'HH:mm', new Date('2000-01-01'));
                if (isNextDay && prevPeriodEnd <= '06:00') endTime.setDate(endTime.getDate() + 1);
                endTime = addMinutes(endTime, config.interval);
                departures.push(format(endTime, 'HH:mm'));
                returns.push(currPeriodStart);
            }
        }

        const firstSlot = slots[0];
        const lastSlot = slots[slots.length - 1];
        let endDate = parse(lastSlot, 'HH:mm', new Date('2000-01-01'));
        const startTime = parse(config.startTime, 'HH:mm', new Date('2000-01-01'));
        const isNextDay = config.endTime <= '06:00' || parse(config.endTime, 'HH:mm', new Date('2000-01-01')) <= startTime;

        if (isNextDay && lastSlot <= '06:00') {
            endDate.setDate(endDate.getDate() + 1);
        }
        const endTimeFormatted = format(addMinutes(endDate, config.interval), 'HH:mm');

        return {
            arrival: firstSlot,
            departure1: departures[0] || '-',
            return1: returns[0] || '-',
            departure2: departures[1] || '-',
            return2: returns[1] || '-',
            end: endTimeFormatted,
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
        const pageWidth = 297 - 25;
        return {
            startY,
            margin: { left: 10, right: 15, top: 20, bottom: 10 },
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 2,
                textColor: [51, 51, 51],
                lineColor: [221, 221, 221],
                lineWidth: 0.2,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [51, 51, 51],
                fontStyle: 'bold',
                halign: 'center',
            },
            bodyStyles: {
                textColor: [51, 51, 51],
                halign: 'center',
                fontStyle: 'bold',
            },
            columnStyles: isWeekly
                ? {
                    0: { cellWidth: pageWidth * 0.12 },
                    1: { cellWidth: pageWidth * 0.12 },
                    2: { cellWidth: pageWidth * 0.12 },
                    3: { cellWidth: pageWidth * 0.10 },
                    4: { cellWidth: pageWidth * 0.10 },
                    5: { cellWidth: pageWidth * 0.10 },
                    6: { cellWidth: pageWidth * 0.10 },
                    7: { cellWidth: pageWidth * 0.10 },
                    8: { cellWidth: pageWidth * 0.14 },
                }
                : {
                    0: { cellWidth: pageWidth * 0.20 },
                    1: { cellWidth: pageWidth * 0.12 },
                    2: { cellWidth: pageWidth * 0.11 },
                    3: { cellWidth: pageWidth * 0.11 },
                    4: { cellWidth: pageWidth * 0.11 },
                    5: { cellWidth: pageWidth * 0.11 },
                    6: { cellWidth: pageWidth * 0.11 },
                    7: { cellWidth: pageWidth * 0.14 },
                },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const rowIndex = data.row.index;
                    const dayIndex = isWeekly ? Math.floor(rowIndex / selectedEmployees.length) : rowIndex;
                    const pastelColors = [
                        [230, 240, 250],
                        [230, 255, 237],
                        [255, 230, 230],
                        [208, 240, 250],
                        [212, 244, 226],
                        [243, 228, 255],
                        [255, 243, 224],
                    ];
                    if (dayIndex >= 0 && dayIndex < pastelColors.length) {
                        data.cell.styles.fillColor = pastelColors[dayIndex];
                        console.log(`Couleur appliquée pour ligne ${rowIndex}, jour ${dayIndex}: ${pastelColors[dayIndex]}`);
                    } else {
                        console.warn(`Index de jour invalide: ${dayIndex}, rowIndex: ${rowIndex}, selectedEmployees.length: ${selectedEmployees.length}`);
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
            doc.text(title, 148.5, 15, { align: 'center' });
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
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            const tableHeight = doc.lastAutoTable.finalY;
            let yOffset = tableHeight + 5;
            if (isWeekly) {
                selectedEmployees.forEach((emp) => {
                    const restDaysText = getRestDaysAndHours(emp);
                    doc.text(restDaysText, 10, yOffset);
                    yOffset += 5;
                });
            } else {
                const restDaysText = getRestDaysAndHours(employee);
                doc.text(restDaysText, 10, yOffset);
            }
            doc.setFontSize(8);
            doc.setTextColor(153, 153, 153);
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
                        <Button onClick={onClose} className="button-secondary">Fermer</Button>
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
                <div className="table-container">
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
                </div>
                <div className="button-group">
                    {type === 'employee' && (
                        <Button onClick={() => exportPDF(data.employee)} className="button-primary">Exporter PDF</Button>
                    )}
                    {type === 'weekly' && (
                        <Button onClick={() => exportPDF(null, true)} className="button-primary">Exporter Récapitulatif Semaine PDF</Button>
                    )}
                    <Button onClick={onClose} className="button-secondary">Fermer</Button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;