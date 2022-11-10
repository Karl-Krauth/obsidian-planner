import { TFile, Vault } from 'obsidian';
import { parseTask } from 'utils';

export const WEEK_FOLDER = 'Week Planners';

export async function getTasks(vault: Vault, date: Date): Promise<Set<string>> {
    const mondayDate = getMonday(date);
    const file = vault.getAbstractFileByPath(dateToFilePath(mondayDate));
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Get the string for the day of week we car about.
    const diff = (date.valueOf() - mondayDate.valueOf()) / (1000 * 3600 * 24);
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

function dateToFilePath(date: Date): string {
    return `${WEEK_FOLDER}/${date.toISOString().slice(0,10).replace(/-/g,"")}.md`;
}

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay()
    const diff = d.getDate() - day + (day == 0 ? -6:1);
    return new Date(d.setDate(diff));
}
