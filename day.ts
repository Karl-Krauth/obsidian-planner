import { strToDate } from 'utils';
import { Week } from 'week';

export const DAY_FOLDER = 'Day Planners'

export function updateDay(file: TFile) {
    if (!/Day Planner-\d\d\d\d\d\d\d\d/.test(file.name)) {
        return;
    }

    const dateStr = file.name.split('-')[1];
    const date = strToDate(dateStr);
    let day = new Day(file);
    const week = new Week(date);

    day.updateTasks(getTasks(date));
    day.commit();
}

class Day {
    private tasks: string[];

    constructor(file: TFile) {

    }

    public updateTasks(tasks: string[]) {
        
    }

    public commit() {
        
    }
}
