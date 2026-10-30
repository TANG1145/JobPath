import config from './playwright.config.mjs';import {resolve} from 'node:path';
export default {...config,outputDir:'.local/v08-legacy-results',testDir:'./e2e/legacy',testIgnore:[],webServer:{...config.webServer,cwd:resolve('.local/baseline-v07')},reporter:[['list']]};
