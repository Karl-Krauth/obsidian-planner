import { TFile, Vault } from 'obsidian';
import * as month from 'month';
import * as utils from 'utils';

export const PROJECT_FOLDER = 'Projects';

export async function updateProjectsFromMonth(vault: Vault, date: Date) {
    let projectTasks = new Map<string, Set<string>>();
    const tasks = await month.getAllTasks(vault, date)
    for (let task of tasks) {
        const projectMatch = task.match(/\[([^\s]+)\]\([^\s]+\)/);
        if (!projectMatch) {
            continue;
        }

        const project = projectMatch[1].replace(/-/g, ' ');
        let taskList = projectTasks.get(project);
        if (!taskList) {
            taskList = new Set<string>();
            projectTasks.set(project, taskList);
        }

        task = task.replace(/\s\[[^\s]+\]\([^\s]+\)/, '');
        taskList.add(task);
    }

    for (const [project, taskList] of projectTasks) {
        const file = vault.getAbstractFileByPath(getProjectPath(project));
        if (!(file instanceof TFile)) {
            continue;
        }

        // Read in the file.
        let lines = (await vault.read(file)).split('\n');

        // Update task ticks and determine which tasks are new.
        lines = utils.updateTicks(lines, taskList);
        const newTasks = utils.getNewTasks(lines, taskList);

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
}

export async function getTasks(vault: Vault, project: string): Promise<Set<string>> {
    const filePath = getProjectPath(project);
    const file = vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        return new Set<string>();
    }

    // Read in all the tasks and add a project tag.
    const lines = (await vault.read(file)).split("\n");
    let tasks = new Set<string>();
    for (const line of lines) {
        const task = utils.parseTask(line);
        if (task) {
            tasks.add(task + ` [${project.replace(/\s/g, '-')}](${filePath})`);
        }
    }

    return tasks;
}

function getProjectPath(project: string): string {
    return PROJECT_FOLDER + '/' + project + '.md';
}

