import { TFile, Vault } from 'obsidian';
import * as project from 'project';
import * as utils from 'utils';
import * as week from 'week';

export const MONTH_FOLDER = 'Months';

export function getMonthTemplate(date: Date): string {
    date = getFirstDay(date);
    let out = '';
    let currMonday = utils.getMonday(date);
    let currSunday = utils.addDays(currMonday, 6);
    for (let i = 0; i < 5; i++) {
        if (currSunday.getMonth() !== date.getMonth()) {
            break;
        }

        const filePath = week.dateToFilePath(currMonday);
        out += `# [Week ${i + 1}](${filePath})\n`
        out += '---\n\n';
        currMonday = utils.addDays(currMonday, 7);
        currSunday = utils.addDays(currSunday, 7);
    }

    return out;
}

export async function updateMonthFromWeek(vault: Vault, date: Date) {
    const filePath = dateToFilePath(date);
    let file = vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        return;
    }

    const tasks = await week.getAllTasks(vault, date);
    await updateTasks(vault, file as TFile, tasks);
    await project.updateProjectsFromMonth(vault, getFirstDay(date));
}

export async function updateMonthsFromProject(vault: Vault, projectName: string) {
    let tasks = await project.getTasks(vault, projectName);
    let currMonthFile: TFile | null = null;
    let currMonthDate = new Date();

    for (const file of vault.getMarkdownFiles()) {
        if (file.path.slice(0, MONTH_FOLDER.length) != MONTH_FOLDER) {
            continue;
        }

        if (!/\d\d\d\d-\d\d/.test(file.basename)) {
            continue;
        }

        const date = utils.strToDate(file.basename);
        const now = new Date();
        const currMonthDay = utils.addDays(utils.getMonday(now), 6).getMonth();
        const currMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (date < currMonth) {
            continue;
        }

        if (date.getTime() === currMonth.getTime()) {
            currMonthFile = file;
            currMonthDate = date;
        }

        // Read in the file.
        let lines = (await vault.read(file)).split('\n');

        // Update task ticks and remove tasks owned by this month.
        lines = utils.updateTicks(lines, tasks);
        for (const line of lines) {
            const task = utils.parseTask(line);
            if (task) {
                tasks.delete(task);
            }
        }

        await vault.modify(file, lines.join('\n'));
        await week.updateWeeksFromMonth(vault, date);
    }


    // Read in the file for this month if it exists.
    if (currMonthFile) {
        const input = await vault.read(currMonthFile);
        let output = '';
        for (const task of tasks) {
            output += task + '\n';
        }

        await vault.modify(currMonthFile, output + input);
        await week.updateWeeksFromMonth(vault, currMonthDate);
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
        const task = utils.parseTask(line);
        if (task) {
            tasks.add(task);
        }
    }

    return tasks;
}

export async function getTasks(vault: Vault, date: Date): Promise<Set<string>> {
    const file = vault.getAbstractFileByPath(dateToFilePath(date));
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Get the string for the week we care about. Round to take care of daylight savings.
    const weekString = `week ${week.getWeekNum(date) + 1}`;

    const lines = (await vault.read(file)).split("\n");
    const regexp = new RegExp(String.raw`^#+ +\[?${weekString}\]?`);
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

        const task = utils.parseTask(lines[i]);
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
    if (lines.length >= 1 && !/^#+ +\[?week/.test(lines[0].toLowerCase())) {
        output += lines[0] + '\n';
        lines.shift();
        if (lines.length >= 1 && /^---/.test(lines[0])) {
            output += lines[0] + '\n';
            lines.shift();
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
    const firstDay = getFirstDay(date);
    return `${MONTH_FOLDER}/${firstDay.getFullYear()}-${(new String(firstDay.getMonth() + 1)).padStart(2, '0')}.md`;
}

function getFirstDay(date: Date): Date {
    const monday = utils.getMonday(date);
    const sunday = utils.addDays(monday, 6);
    return utils.addDays(sunday, -sunday.getDate() + 1);
}
