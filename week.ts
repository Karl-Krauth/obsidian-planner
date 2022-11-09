import { Vault } from 'obsidian';

export class Week {
    constructor(date: Date, vault: Vault) {

    }

    public getTasks(date: Date): Set<string> {
        return new Set<string>(['- [ ] newtask!']);
    }
}
