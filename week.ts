import * as day from 'day';
import * as month from 'month';
import * as utils from 'utils';
import { TFile, Vault } from 'obsidian';
import { parseTask } from 'utils';

export const WEEK_FOLDER = 'Week Planners';
const WEEK_TEMPLATE = '# Monday\n' +
                      '---\n\n' +
                      '# Tuesday\n' +
                      '---\n\n' +
                      '# Wednesday\n' +
                      '---\n\n' +
                      '# Thursday\n' +
                      '---\n\n' +
                      '# Friday\n' +
                      '---\n\n' +
                      '# Saturday\n' +
                      '---\n\n' +
                      '# Sunday\n'
                      '---\n\n';

export async function updateWeekFromDay(vault: Vault, date: Date) {
    const mondayDate = utils.getMonday(date);
    const filePath = dateToFilePath(mondayDate);
    let file = vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        file = await vault.create(filePath, WEEK_TEMPLATE);
    }

    const tasks = await day.getTasks(vault, date);
    await updateTasks(vault, file as TFile, tasks);
}

export async function updateWeeksFromMonth(vault: Vault, date: Date) {
    let currMonday = utils.getMonday(date);
    let currSunday = utils.addDays(currMonday, 6);
    while (currSunday.getMonth() === date.getMonth()) {
        const filePath = dateToFilePath(currMonday);
        let file = vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            file = await vault.create(filePath, WEEK_TEMPLATE);
        }

        const tasks = await month.getTasks(vault, currMonday);
        await updateTasks(vault, file as TFile, tasks);
        currMonday = utils.addDays(currMonday, 7);
        currSunday = utils.addDays(currSunday, 7);
    }
}

export async function getAllTasks(vault: Vault, date: Date): Promise<Set<string>> {
    const file = vault.getAbstractFileByPath(dateToFilePath(date));
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Read in all the tasks.
    const lines = (await vault.read(file)).split("\n");
    let tasks = new Set<string>();
    for (const line of lines) {
        const task = parseTask(line);
        if (task) {
            tasks.add(task);
        }
    }

    return tasks;
}

export async function getTasks(vault: Vault, date: Date): Promise<Set<string>> {
    const mondayDate = utils.getMonday(date);
    const file = vault.getAbstractFileByPath(dateToFilePath(mondayDate));
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Get the string for the day of week we care about. Round to take care of daylight savings.
    const diff = Math.round((date.valueOf() - mondayDate.valueOf()) / (1000 * 3600 * 24));
    console.assert(diff <= 6, "Difference between days and weeks are greater than 6.");
    const weekStrings = ["mo", "tu", "we", "th", "fr", "sa", "su"];
    const dayString = weekStrings[diff];

    const lines = (await vault.read(file)).split("\n");
    const regexp = new RegExp(String.raw`^#+ +${dayString}`);
    // Iterate until we reach the start of the relevant weekday.
    let i = 0;
    for (; i < lines.length; i++) {
        if (regexp.test(lines[i].toLowerCase())) {
            i += 1;
            break;
        }
    }

    // Read in all the tasks until we reach a different heading.
    let tasks = new Set<string>();
    for (;i < lines.length; i++) {
        if (/^#+ /.test(lines[i])) {
            break;
        }

        const task = parseTask(lines[i]);
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
    const newTasks = utils.getNewTasks(lines, tasks);

    let output = '';
    // Create the unassigned tasks preamble.
    for (const task of newTasks) {
        output += task + '\n';
    }

    // Add the original file back.
    output += lines.join('\n') + '\n';

    // Write out the file.
    await vault.modify(file, output);
}

function dateToFilePath(date: Date): string {
    return `${WEEK_FOLDER}/${date.toISOString().slice(0,10).replace(/-/g,"")}.md`;
}
