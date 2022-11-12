import { TFile, Vault } from 'obsidian';
import * as utils from 'utils';

export const PROJECT_FOLDER = 'Projects';

export async function updateProjectsFromMonth(vault: Vault, date: Date) {

}

export async function getTasks(vault: Vault, project: string): Promise<Set<string>> {
    const file = vault.getAbstractFileByPath(PROJECT_FOLDER + '/' + project + '.md');
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Read in all the tasks and add a project tag.
    const lines = (await vault.read(file)).split("\n");
    let tasks = new Set<string>();
    for (const line of lines) {
        const task = utils.parseTask(line);
        if (task) {
            tasks.add(task + ' #' + project);
        }
    }

    return tasks;
}
