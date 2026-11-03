// Wraps src/game.html (artifact form, no document skeleton) into a standalone index.html.
import {readFileSync,writeFileSync} from 'node:fs';
const here=new URL('.',import.meta.url);
const body=readFileSync(new URL('src/game.html',here),'utf8');
writeFileSync(new URL('index.html',here),`<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
console.log('wrote sentence-city/index.html');
