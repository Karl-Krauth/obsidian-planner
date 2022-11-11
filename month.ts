import { TFile, Vault } from 'obsidian';
import * as utils from 'utils';

export const MONTH_FOLDER = 'Month Planners';

export async function updateMonthFromWeek(vault: Vault, date: Date) {

}

export async function updateMonthsFromProject(vault: Vault, project: string) {

}

export async function getTasks(vault: Vault, date: Date): Promise<Set<string>> {
    const monday = utils.getMonday(date);
    if (monday.getTime() !== date.getTime()) {
        return new Set<string>();
    }

    const file = vault.getAbstractFileByPath(dateToFilePath(date));
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Get the string for the week we care about. Round to take care of daylight savings.
    const sunday = utils.addDays(monday, 6);
    const firstDay = utils.addDays(sunday, -sunday.getDate() + 1);
    const firstMonday = utils.getMonday(firstDay);
    const diff = Math.round((monday.valueOf() - firstMonday.valueOf()) / (1000 * 3600 * 24 * 7));
    const weekStrings = ["week 1", "week 2", "week 3", "week 4", "week 5"];
    const weekString = weekStrings[diff];
    console.log(monday, firstMonday);
    console.log(diff);
    console.log(weekString);

    const lines = (await vault.read(file)).split("\n");
    const regexp = new RegExp(String.raw`^#+ +${weekString}`);
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

    console.log(tasks);
    return tasks;
}

function dateToFilePath(date: Date): string {
    const sunday = utils.addDays(date, 6);
    const firstDay = utils.addDays(sunday, -sunday.getDate() + 1);
    return `${MONTH_FOLDER}/${firstDay.toISOString().slice(0, 7).replace(/-/g, "")}.md`;
}
