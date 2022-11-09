import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { DAY_FOLDER, updateDay } from 'day';
import { strToDate } from 'utils';

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
        if (file === null) {
            return;
        }

        new Notice(file.path);
        const splitPath = file.path.split('/');
        if (splitPath.length > 2) {
            return;
        }

        const parentFolder = splitPath[0];
        new Notice(parentFolder);
        if (parentFolder === DAY_FOLDER) {
            if (!/Day Planner-\d\d\d\d\d\d\d\d/.test(file.name)) {
                return;
            }

            const dateStr = file.name.split('-')[1];
            const date = strToDate(dateStr);
            updateDay(this.app.vault, date);
            new Notice('Day');
        } else if (parentFolder === 'Week Planners') {
            new Notice('Week');
        } else if (parentFolder === 'Month Planners') {
            new Notice('Month');
        } else if (parentFolder === 'Projects') {
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

