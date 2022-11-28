import * as day from 'day';
import * as month from 'month';
import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as project from 'project';
import * as utils from 'utils';
import * as week from 'week';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();
        await this.createFiles();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        this.registerEvent(this.app.workspace.on('file-open', (file) => this.updateFiles(file)));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async createFiles() {
        // Create folders if they don't exist.
        if (!this.app.vault.getAbstractFileByPath(day.DAY_FOLDER)) {
            await this.app.vault.createFolder(day.DAY_FOLDER);
        }

        if (!this.app.vault.getAbstractFileByPath(week.WEEK_FOLDER)) {
            await this.app.vault.createFolder(week.WEEK_FOLDER);
        }

        if (!this.app.vault.getAbstractFileByPath(month.MONTH_FOLDER)) {
            await this.app.vault.createFolder(month.MONTH_FOLDER);
        }

        if (!this.app.vault.getAbstractFileByPath(project.PROJECT_FOLDER)) {
            await this.app.vault.createFolder(project.PROJECT_FOLDER);
        }


        let date = new Date();
        let path = day.dateToFilePath(date)
        if (!this.app.vault.getAbstractFileByPath(path)) {
            // Create today's file.
            this.app.vault.create(path, day.getDayTemplate(date));
        }

        path = week.dateToFilePath(date)
        if (!this.app.vault.getAbstractFileByPath(path)) {
            // Create this week's file.
            await this.app.vault.create(path, week.getWeekTemplate(date));
        }

        path = month.dateToFilePath(date)
        if (!this.app.vault.getAbstractFileByPath(path)) {
            // Create this month's file.
            await this.app.vault.create(path, month.getMonthTemplate(date));
        }

        // Also create week and month files for tomorrow if we will be in a new week/month.
        date = utils.addDays(date, 1);

        path = week.dateToFilePath(date)
        if (!this.app.vault.getAbstractFileByPath(path)) {
            // Create next week's file.
            await this.app.vault.create(path, week.getWeekTemplate(date));
        }

        path = month.dateToFilePath(date)
        if (!this.app.vault.getAbstractFileByPath(path)) {
            // Create next month's file.
            await this.app.vault.create(path, month.getMonthTemplate(date));
        }
    }

    async updateFiles(file: TFile | null) {
        // Handle the case where we've opened an empty relevant file.
        if (file) {
            const splitPath = file.path.split('/');
            const parentFolder = splitPath[0];
            const fileName = splitPath[1];
            if (parentFolder === day.DAY_FOLDER &&
                /\d\d\d\d-\d\d-\d\d\.md/.test(fileName)) {
                const date = utils.strToDate(fileName.slice(0, -3));
                const content = await this.app.vault.read(file);
                if (!content.trim()) {
                    await this.app.vault.modify(file, day.getDayTemplate(date));
                }
            } else if (parentFolder === week.WEEK_FOLDER &&
                       /\d\d\d\d-\d\d-\d\d\.md/.test(fileName)) {
                const date = utils.strToDate(fileName.slice(0, -3));
                const content = await this.app.vault.read(file);
                if (!content.trim()) {
                    await this.app.vault.modify(file, week.getWeekTemplate(date));
                }
            } else if (parentFolder === month.MONTH_FOLDER &&
                       /\d\d\d\d-\d\d.md/.test(fileName)) {
                const date = utils.strToDate(fileName.slice(0, -3));
                const content = await this.app.vault.read(file);
                if (!content.trim()) {
                    await this.app.vault.modify(file, month.getMonthTemplate(date));
                }
            }
        }


        // Handle the case where we just navigated away from a relevant file.
        const lastFiles = this.app.workspace.getLastOpenFiles();
        if (!lastFiles) {
            return;
        }

        const splitPath = lastFiles[0].split('/');
        if (splitPath.length > 2) {
            return;
        }

        const parentFolder = splitPath[0];
        const fileName = splitPath[1];
        if (parentFolder === day.DAY_FOLDER) {
            if (!/\d\d\d\d-\d\d-\d\d\.md/.test(fileName)) {
                return;
            }

            const dateStr = fileName.slice(0, -3);
            const date = utils.strToDate(dateStr);
            // Propagate changes up.
            await week.updateWeekFromDay(this.app.vault, date);
        } else if (parentFolder === week.WEEK_FOLDER) {
            if (!/\d\d\d\d-\d\d-\d\d\.md/.test(fileName)) {
                return;
            }

            const date = utils.strToDate(fileName.slice(0, -3));
            // Propagate changes down.
            await day.updateDaysFromWeek(this.app.vault, date);
            // Propagate changes up.
            await month.updateMonthFromWeek(this.app.vault, date);
        } else if (parentFolder === month.MONTH_FOLDER) {
            if (!/\d\d\d\d-\d\d\.md/.test(fileName)) {
                return;
            }

            const date = utils.strToDate(fileName.slice(0, -3));
            // Propagate changes down.
            await week.updateWeeksFromMonth(this.app.vault, date);
            // Propagate changes up.
            await project.updateProjectsFromMonth(this.app.vault, date);
        } else if (parentFolder === project.PROJECT_FOLDER) {
            const projectName = fileName.slice(0, -3);
            await month.updateMonthsFromProject(this.app.vault, projectName);
        }
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    console.log('Secret: ' + value);
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
