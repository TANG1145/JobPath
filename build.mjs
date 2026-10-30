import {build} from 'esbuild';
await build({entryPoints:['components/crystal-ball/mount.jsx'],bundle:true,format:'esm',minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},outfile:'public/visuals/crystal-ball.js',legalComments:'eof'});
import {mkdir,copyFile,cp} from 'node:fs/promises';await mkdir('dist',{recursive:true});for(const f of ['index.html','style.css'])await copyFile(f,'dist/'+f);await cp('src','dist/src',{recursive:true});console.log('Built dist/');

await cp('public','dist/public',{recursive:true});
