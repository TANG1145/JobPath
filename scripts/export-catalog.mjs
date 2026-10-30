import {catalog} from '../src/catalog.js';
import {publicJobs,historicalJobs,jobCatalogVersion} from '../src/jobs.js';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('public/catalog/v1',{recursive:true});
writeFileSync('public/catalog/v1/resources.json',JSON.stringify({version:1,publicationStatus:'partially-reviewed',resources:catalog},null,2)+'\n');
writeFileSync('public/catalog/v1/jobs.json',JSON.stringify({version:jobCatalogVersion,publicationStatus:'checked-excerpts',jobs:[...publicJobs,...historicalJobs]},null,2)+'\n');
