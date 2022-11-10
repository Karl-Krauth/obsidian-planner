import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as day from 'day';
import * as month from 'month';
import * as utils from 'utils';
import * as project from 'project';
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

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        this.registerEvent(this.app.workspace.on('file-open', (file) => this.updateFile(file)));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async updateFile(file: TFile | null) {
        const lastFiles = this.app.workspace.getLastOpenFiles();
        if (!lastFiles) {
            return;
        }

        new Notice(lastFiles[0]);
        const splitPath = lastFiles[0].split('/');
        if (splitPath.length > 2) {
            return;
        }

        const parentFolder = splitPath[0];
        const fileName = splitPath[1];
        new Notice(parentFolder);
        if (parentFolder === day.DAY_FOLDER) {
            if (!/Day Planner-\d\d\d\d\d\d\d\d/.test(fileName)) {
                return;
            }

            const dateStr = fileName.split('-')[1];
            const date = utils.strToDate(dateStr);
            await day.updateWeekFromDay(this.app.vault, date);
            new Notice('Day');
        } else if (parentFolder === week.WEEK_FOLDER) {
            if (!/\d\d\d\d\d\d\d\d/.test(fileName)) {
                return;
            }

            const date = utils.strToDate(fileName);
            await week.updateDaysFromWeek(this.app.vault, date);
            await week.updateMonthFromWeek(this.app.vault, date);
            new Notice('Week');
        } else if (parentFolder === month.MONTH_FOLDER) {
            if (!/\d\d\d\d\d\d/.test(fileName)) {
                return;
            }

            const date = utils.strToDate(fileName);
            await month.updateWeeksFromMonth(this.app.vault, date);
            await month.updateProjectsFromMonth(this.app.vault, date);
            new Notice('Month');
        } else if (parentFolder === project.PROJECT_FOLDER) {
            const projectName = fileName.slice(0, -3);
            await project.updateMonthsFromProject(this.app.vault, projectName);
            new Notice('Project');
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

