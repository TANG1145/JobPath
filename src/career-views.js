import {mountInterviewCalendar} from './interview-calendar.js';
import {mountJournal} from './review-journal.js';
export function mountCareerViews(options){mountInterviewCalendar({...options,pane:document.querySelector('#pane-career-interviews')});mountJournal({...options,pane:document.querySelector('#pane-career-review')});}
