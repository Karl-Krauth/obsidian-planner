import { TFile, Vault } from 'obsidian';
import { parseTask, tickTask, untickTask } from 'utils';
import { getTasks } from 'week';

export const DAY_FOLDER = 'Day Planners'

export async function updateWeekFromDay(vault: Vault, date: Date) {

}

export async function updateDay(vault: Vault, date: Date) {
    const file = vault.getAbstractFileByPath(dateToFilePath(date));
    if (!(file instanceof TFile)) {
        return;
    }

    const tasks = await getTasks(vault, date);
    await updateTasks(vault, file, tasks);
}

async function updateTasks(vault: Vault, file: TFile, tasks: Set<string>) {
    // Read in the file.
    const lines = (await vault.read(file)).split('\n');

    // Update task ticks and determine which tasks are new.
    let newTasks = new Set<string>(tasks)
    for (let i = 0; i < lines.length; i++) {
        const task = parseTask(removeTime(lines[i]));
        if (task) {
            if (tasks.has(tickTask(task))) {
                lines[i] = tickTask(lines[i]);
                newTasks.delete(tickTask(task));
            } else if (tasks.has(untickTask(task))) {
                lines[i] = untickTask(lines[i]);
                newTasks.delete(untickTask(task));
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

function dateToFilePath(date: Date): string {
    return `${DAY_FOLDER}/Day Planner-${date.toISOString().slice(0,10).replace(/-/g,"")}.md`;
}
