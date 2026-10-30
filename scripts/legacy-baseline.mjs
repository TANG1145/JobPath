import {mkdirSync,existsSync,writeFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {resolve} from 'node:path';
const root=resolve('.local/baseline-v07'),sha='64d2f64126aa611e770ade3370fad44cd6987e75';
if(!existsSync(root+'/BASELINE_SHA')){mkdirSync(root,{recursive:true});const archive=spawnSync('git',['archive',sha],{maxBuffer:20*1024*1024});if(archive.status)throw Error(archive.stderr.toString());const extracted=spawnSync('tar',['-x','-C',root],{input:archive.stdout});if(extracted.status)throw Error('Baseline extraction failed');writeFileSync(root+'/BASELINE_SHA',sha)}
const run=spawnSync('npx',['playwright','test','--config','playwright.legacy.config.mjs'],{stdio:'inherit'});process.exit(run.status??1);
