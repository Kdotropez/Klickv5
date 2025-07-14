import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const PlanningTable = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setPlanning, days }) => {
    const [selectedDay, setSelectedDay] = useState(days[0] || '');

    useEffect(() => {
        if (!selectedDay && days.length > 0) {
            setSelectedDay(days[0]);
        }
    }, [days, selectedDay]);

    useEffect(() => {
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
    }, [planning, selectedShop, selectedWeek]);

    const calculateDailyHours = (day) => {
        if (!day) return 0;
        let totalHours = 0;
        selectedEmployees.forEach((employee) => {
            if (planning[employee]?.[day]) {
                totalHours += (planning[employee][day].filter(slot => slot).length * config.interval) / 60;
            }
        });
        return totalHours;
    };

    const toggleSlot = (employee, day, slotIndex) => {
        const newPlanning = { ...planning };
        if (!newPlanning[employee]) newPlanning[employee] = {};
        if (!newPlanning[employee][day]) newPlanning[employee][day] = Array(config.timeSlots.length).fill(false);
        newPlanning[employee][day][slotIndex] = !newPlanning[employee][day][slotIndex];
        setPlanning(newPlanning);
    };

    const pastelColors = ['#d6e6ff', '#d4f4e2', '#ffe6e6', '#d0f0fa'];
    const getEmployeeColor = (index) => pastelColors[index % pastelColors.length];

    return (
        <div className="planning-container">
            <div className="day-buttons">
                {days.map((day) => (
                    <Button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        style={{ backgroundColor: selectedDay === day ? '#4a90e2' : '#50c878' }}
                    >
                        {format(new Date(day), 'EEEE', { locale: fr })} ({calculateDailyHours(day).toFixed(1)} h)
                    </Button>
                ))}
            </div>
            <div className="table-container">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th className="fixed-col">DE</th>
                            {config.timeSlots.map((slot, slotIndex) => (
                                <th key={slotIndex} className="scrollable-col">
                                    {slot.start}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="fixed-col">À</th>
                            {config.timeSlots.map((slot, slotIndex) => (
                                <th key={slotIndex} className="scrollable-col">
                                    {slot.end}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {selectedEmployees.map((employee, empIndex) => (
                            <tr key={employee}>
                                <td className="fixed-col">{employee}</td>
                                {config.timeSlots.map((slot, slotIndex) => (
                                    <td
                                        key={slotIndex}
                                        className="scrollable-col"
                                        style={{
                                            backgroundColor: planning[employee]?.[selectedDay]?.[slotIndex]
                                                ? getEmployeeColor(empIndex)
                                                : 'transparent',
                                        }}
                                        onClick={() => toggleSlot(employee, selectedDay, slotIndex)}
                                    >
                                        {planning[employee]?.[selectedDay]?.[slotIndex] ? '✅' : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlanningTable;