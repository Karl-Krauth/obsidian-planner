import * as day from 'day';
import * as month from 'month';
import * as utils from 'utils';
import { TFile, Vault } from 'obsidian';
import { parseTask } from 'utils';

export const WEEK_FOLDER = 'Weeks';

export function getWeekTemplate(date: Date): string {
    const monday = utils.getMonday(date);
    const sunday = utils.addDays(monday, 6);

    // Add a link to the parent month and which week this is.
    const monthNum = sunday.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    let out = `# Week ${getWeekNum(monday) + 1} [${months[monthNum]}](${month.dateToFilePath(date)}) ${sunday.getFullYear()}\n`
    out += '---\n';

    // Add each weekday.
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (let i = 0; i < 7; i++) {
        const weekDate = utils.addDays(monday, i);
        out += `## [${weekDays[i]}](${day.dateToFilePath(weekDate)})\n`;
        out += '---\n\n';
    }

    return out;
}

export async function updateWeekFromDay(vault: Vault, date: Date) {
    const filePath = dateToFilePath(date);
    let file = vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        return;
    }

    const tasks = await day.getTasks(vault, date);
    await updateTasks(vault, file as TFile, tasks);
    await month.updateMonthFromWeek(vault, utils.getMonday(date));
}

export async function updateWeeksFromMonth(vault: Vault, date: Date) {
    let currMonday = utils.getMonday(date);
    let currSunday = utils.addDays(currMonday, 6);
    while (currSunday.getMonth() === date.getMonth()) {
        const filePath = dateToFilePath(currMonday);
        let file = vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            const tasks = await month.getTasks(vault, currMonday);
            await updateTasks(vault, file as TFile, tasks);
            await day.updateDaysFromWeek(vault, currMonday);
        }

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
    const file = vault.getAbstractFileByPath(dateToFilePath(date));
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    const diff = day.getDayNum(date);

    console.assert(diff <= 6, "Difference between days and weeks are greater than 6.");
    const weekStrings = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const dayString = weekStrings[diff];

    const lines = (await vault.read(file)).split("\n");
    const regexp = new RegExp(String.raw`^#+ +\[?${dayString}\]?`);
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
    // Account for the case where we have a heading.
    if (lines.length >= 1) {
        const weekStrings = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        let matches = false;
        for (const weekString of weekStrings) {
            const regex = new RegExp(String.raw`^#+ +\[?${weekString}`);
            if (regex.test(lines[0])) {
                matches = true;
            }
        }

        if (!matches) {
            output += lines[0] + '\n';
            lines.shift();
            if (lines.length >= 1 && /^---/.test(lines[0])) {
                output += lines[0] + '\n';
                lines.shift();
            }
        }
    }

    // Create the unassigned tasks preamble.
    for (const task of newTasks) {
        output += task + '\n';
    }

    // Add the original file back.
    output += lines.join('\n');

    // Write out the file.
    await vault.modify(file, output);
}

export function dateToFilePath(date: Date): string {
    const monday = utils.getMonday(date);
    const year = new String(monday.getFullYear());
    const month = (new String(monday.getMonth() + 1)).padStart(2, '0');
    const day = (new String(monday.getDate())).padStart(2, '0');
    return `${WEEK_FOLDER}/${year}-${month}-${day}.md`;
}

export function getWeekNum(date: Date): number {
    const monday = utils.getMonday(date);
    const sunday = utils.addDays(monday, 6);
    const firstDay = utils.addDays(sunday, -sunday.getDate() + 1);
    const firstMonday = utils.getMonday(firstDay);
    // Round to account for daylight savings.
    return Math.round((monday.valueOf() - firstMonday.valueOf()) / (1000 * 3600 * 24 * 7));
}
