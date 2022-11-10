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
        const task = parseTask(line);
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

export function strToDate(dateStr: string): Date {
    const year = parseInt(dateStr.slice(0, 4));
    // Convert month to zero index.
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    return new Date(year, month, day);
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
