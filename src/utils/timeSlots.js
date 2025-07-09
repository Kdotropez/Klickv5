
    import { parse, addMinutes, format } from 'date-fns';

export const generateTimeSlots = (startTime, endTime, interval) => {
    const slots = [];
    let current = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());

    while (current < end) {
        const next = addMinutes(current, interval);
        slots.push({
            start: format(current, 'HH:mm'),
            end: format(next, 'HH:mm'),
        });
        current = next;
    }

    return slots;
};
