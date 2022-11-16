import { TFile, Vault } from 'obsidian';
import * as month from 'month';
import * as utils from 'utils';
import * as week from 'week';

export const DAY_FOLDER = 'Days'

export function getDayTemplate(date: Date): string {
    const monday = utils.getMonday(date);
    const sunday = utils.addDays(monday, 6);

    // Add a link to the parent month and which week this is.
    const monthNum = sunday.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const monthPath = month.dateToFilePath(date);
    const weekNum = getDayNum(date)
    const weekDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekNum];
    const weekPath = week.dateToFilePath(date);
    let out = `# ${weekDay} [Week ${weekNum + 1}](${weekPath}) [${months[monthNum]}](${monthPath}) ${sunday.getFullYear()}\n`
    out += '---\n';
    out += '## Day Planner\n' +
           '---\n' +
           '### Morning\n\n' +
           '### Afternoon\n\n' +
           '### Evening\n\n'

    return out;
}

export async function updateDaysFromWeek(vault: Vault, date: Date) {
    let currDate = new Date(date);
    for (let i = 0; i < 7; i++) {
        const filePath = dateToFilePath(currDate);
        let file = vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            const tasks = await week.getTasks(vault, currDate);
            await updateTasks(vault, file as TFile, tasks);
        }

        currDate = utils.addDays(currDate, 1);
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
        const task = utils.parseTask(utils.removeTime(line))
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

    const timelessLines = lines.map(utils.removeTime);
    let newTasks = utils.getNewTasks(timelessLines, tasks);

    let output = '';
    // Account for the case where we have a heading.
    if (lines.length >= 1) {
        if (!/^#+Day Planner/.test(lines[0]) && /^#+/.test(lines[0])) {
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

export function getDayNum(date: Date): number {
    const monday = utils.getMonday(date);
    // Get the string for the day of week we care about. Round to take care of daylight savings.
    return Math.round((date.valueOf() - monday.valueOf()) / (1000 * 3600 * 24));
}

export function dateToFilePath(date: Date): string {
    const year = new String(date.getFullYear());
    const month = (new String(date.getMonth() + 1)).padStart(2, '0');
    const day = (new String(date.getDate()).padStart(2, '0'));
    return `${DAY_FOLDER}/${year}-${month}-${day}.md`;
}
