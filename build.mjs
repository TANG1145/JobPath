import {build} from 'esbuild';
await build({entryPoints:['components/strands/mount.jsx'],bundle:true,format:'esm',minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},outfile:'public/visuals/strands.js',legalComments:'eof'});
import {mkdir,copyFile,cp,rm} from 'node:fs/promises';await mkdir('dist',{recursive:true});for(const f of ['index.html','style.css','explore.html','explore.css'])await copyFile(f,'dist/'+f);await rm('dist/src',{recursive:true,force:true});await cp('src','dist/src',{recursive:true});console.log('Built dist/');

await cp('public','dist/public',{recursive:true});
