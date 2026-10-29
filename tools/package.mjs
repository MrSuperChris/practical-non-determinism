import {mkdir,copyFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Publish only the app shell. No local tooling, notes, credentials or task cache.
const files=['index.html','styles.css','theme.css','illustrated.css','src/preview.css','src/art.mjs','src/cast.mjs','src/dice3d.mjs','src/preview.mjs','assets/possibilities.png','manifest.webmanifest','sw.js','src/app.mjs','src/data.mjs','src/engine.mjs','src/storage.mjs','src/tasks.mjs','assets/icon.svg','assets/icon-192.png','assets/icon-512.png','assets/player-aid-1.png','assets/player-aid-2.png'];
for(const name of files){const target=path.join(root,'dist',name);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(root,name),target);}
const manifest=JSON.parse(await readFile(path.join(root,'dist/manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons)await readFile(path.join(root,'dist',icon.src));
console.log(`Packaged ${files.length} app files into dist/.`);
