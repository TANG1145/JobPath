import {readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
// Explicit primary-program scope. Catalog snapshots and legacy decorative code excluded.
const excluded=new Set(['additional-jobs.js','campus-jobs.js','catalog.js','jobs.js','learning-resources.js','opportunity-categories.js','recruitment-catalog.js','ball-physics.js']);
const files=['server.mjs','build.mjs',...['src','backend'].flatMap(dir=>readdirSync(dir).filter(f=>/\.(?:js|mjs)$/.test(f)&&!excluded.has(f)&&statSync(path.join(dir,f)).isFile()).map(f=>dir+'/'+f))];
let total=0;for(const file of files){const lines=readFileSync(file,'utf8').split(/\r?\n/).filter(l=>l.trim()&&!/^\s*\/\//.test(l)).length;total+=lines;console.log(`${String(lines).padStart(5)}  ${file}`)}
console.log(`主体程序有效非空行合计：${total}，共 ${files.length} 文件。`);
console.log('口径：server/build、src与backend中的主体JS模块；排除空行、独立//注释、目录/资源数据、旧装饰代码、依赖、构建产物、测试、文档和HTML/CSS。块注释行仍计入；非复杂度或成员贡献证明。');
