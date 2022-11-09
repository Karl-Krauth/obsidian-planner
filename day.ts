import { TFile, Vault } from 'obsidian';
import { parseTask, strToDate, tickTask, untickTask } from 'utils';
import { Week } from 'week';

export const DAY_FOLDER = 'Day Planners'

export async function updateDay(vault: Vault, file: TFile) {
    if (!/Day Planner-\d\d\d\d\d\d\d\d/.test(file.name)) {
        return;
    }

    const dateStr = file.name.split('-')[1];
    const date = strToDate(dateStr);
    const week = new Week(date, vault);

    await updateTasks(vault, file, week.getTasks(date));
}

async function updateTasks(vault: Vault, file: TFile, tasks: Set<string>) {
    // Read in the file.
    const lines = (await vault.read(file)).split('\n');

    // Update task ticks and determine which tasks are new.
    let newTasks = new Set<string>(tasks)
    for (let i = 0; i < lines.length; i++) {
        const task = parseTask(removeTime(lines[i]));
        if (task) {
            console.log(task);
            if (tasks.has(tickTask(task))) {
                lines[i] = tickTask(lines[i]);
                newTasks.delete(task);
            } else if (tasks.has(untickTask(task))) {
                lines[i] = untickTask(lines[i]);
                newTasks.delete(task);
            }
        }
    }

    let output = '';
    // Create the unassigned tasks preamble.
    for (const task of newTasks) {
        output += task + '\n';
    }

    // Add the original file back.
    for (const line of lines) {
        output += line + '\n';
    }

    // Write out the file.
    await vault.modify(file, output);
}

function removeTime(line: string): string {
    return line.replace(/^(\s*- \[[xX ]\])\d\d:\d\d\s*/, '$1');
}
