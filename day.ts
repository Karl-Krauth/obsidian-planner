import { TFile, Vault } from 'obsidian';
import * as utils from 'utils';
import * as week from 'week';

export const DAY_FOLDER = 'Day Planners'

export async function updateDaysFromWeek(vault: Vault, date: Date) {
    let currDate = new Date(date);
    for (let i = 0; i < 7; i++) {
        currDate.setDate(currDate.getDate() + i);
        const filePath = dateToFilePath(currDate);
        let file = vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            file = await vault.create(filePath, '');
        }

        const tasks = await week.getTasks(vault, date);
        await updateTasks(vault, file as TFile, tasks);
    }
}

export async function getTasks(vault: Vault, date: Date): Promise<Set<string>> {
    let tasks = new Set<string>();
    const file = vault.getAbstractFileByPath(dateToFilePath(date));
    if (!(file instanceof TFile)) {
        return tasks;
    }

    const lines = (await vault.read(file)).split('\n');
    for (const line of lines) {
        const task = utils.parseTask(removeTime(line))
        if (task) {
            tasks.add(task);
        }
    }

    return tasks;
}

async function updateTasks(vault: Vault, file: TFile, tasks: Set<string>) {
    // Read in the file.
    let lines = (await vault.read(file)).split('\n');

    // Update task ticks and determine which tasks are new.
    lines = utils.updateTicks(lines, tasks);

    const timelessLines = lines.map(removeTime);
    let newTasks = utils.getNewTasks(timelessLines, tasks);

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
