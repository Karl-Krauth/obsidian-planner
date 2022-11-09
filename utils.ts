export function strToDate(dateStr: string): Date {
    const year = parseInt(dateStr.slice(0, 4));
    // Convert month to zero index.
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    return new Date(year, month - 1, day);
}
