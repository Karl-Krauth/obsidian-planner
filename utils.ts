export function addDays(date: Date, days: number): Date {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay()
    const diff = d.getDate() - day + (day == 0 ? -6:1);
    return new Date(d.setDate(diff));
}

export function getNewTasks(lines: string[], tasks: Set<string>): Set<string> {
    let newTasks = new Set<string>(tasks);
    for (const line of lines) {
        const task = parseTask(line);
        if (task) {
            newTasks.delete(task);
        }
    }

    return newTasks;
}

export function updateTicks(lines: string[], tasks: Set<string>): string[] {
    let newLines: string[] = [];
    for (const line of lines) {
        const task = parseTask(removeTime(line));
        if (task && tasks.has(tickTask(task))) {
            newLines.push(tickTask(line));
        } else if (task && tasks.has(untickTask(task))) {
            newLines.push(untickTask(line));
        } else {
            newLines.push(line);
        }
    }

    return newLines;
}

export function removeTime(line: string): string {
    return line.replace(/^(\s*- \[[xX ]\] )\d\d:\d\d\s*/, '$1');
}

export function strToDate(dateStr: string): Date {
    let year = 0;
    let month = 0;
    let day = 0;
    if (dateStr.length == 10) {
        year = parseInt(dateStr.slice(0, 4));
        month = parseInt(dateStr.slice(5, 7));
        day = parseInt(dateStr.slice(8, 10));
    } else if (dateStr.length == 7) {
        year = parseInt(dateStr.slice(0, 4));
        month = parseInt(dateStr.slice(5, 7));
        day = 1;
    }
    // Convert month to zero index.
    return new Date(year, month - 1, day);
}

export function tickTask(task: string): string {
    return task.replace(/^(\s*)- \[[xX ]\]/, '$1- [x]');
}

export function untickTask(task: string): string {
    return task.replace(/^(\s*)- \[[xX ]\]/, '$1- [ ]');
}

export function parseTask(str: string): string | null {
    // Trim whitespace and normalize ticked boxes.
    const task = str.trim().replace(/^- \[X\]/, '- [x]');
    // Check if we have a task.
    if (!/^- \[[x ]\] .+/.test(task)) {
        return null;
    }

    return task;
}
