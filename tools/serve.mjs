import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),port=Number(args.find(a=>a.startsWith('--port='))?.split('=')[1]||8896);
const eco=args.includes('--eco');
let token='';
if(eco){const config=JSON.parse(await readFile('C:/Users/Chris/claude/SleeperService/config.json','utf8'));token=config.ticktick_token||'';if(!token)throw Error('Eco has no configured TickTick connection');}
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){res.writeHead(403);res.end('Unexpected host');return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end('Read-only preview server');return;}
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  const pathname=decodeURIComponent(url.pathname);
  if(pathname.startsWith('/__local/')){
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
    const site=req.headers['sec-fetch-site'],origin=req.headers.origin;
    if(site&&site!=='same-origin'&&site!=='none'||origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(origin)){res.writeHead(403);res.end('{"error":"Same-origin requests only"}');return;}
    if(pathname==='/__local/status'){res.end(JSON.stringify({ticktick:!!token}));return;}
    const api=pathname.slice('/__local/ticktick'.length);
    if(!token||!pathname.startsWith('/__local/ticktick/')||!/^\/project(?:\/[\w-]+\/(?:data|task\/[\w-]+))?$/.test(api)){res.writeHead(404);res.end('{"error":"Not available"}');return;}
    const response=await fetch('https://api.ticktick.com/open/v1'+api,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
    res.statusCode=response.status;res.end(await response.text());return;
  }
  const name=pathname==='/'?'index.html':pathname.replace(/^\//,'');
  const target=path.resolve(root,name),relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(/[\\/]/).some(p=>p.startsWith('.'))||!types[path.extname(target)]){res.writeHead(404);res.end('Not found');return;}
  if(!(await stat(target)).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',types[path.extname(target)]);res.setHeader('Cache-Control','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.method==='HEAD')res.end();else res.end(await readFile(target));
 }catch(error){res.statusCode=error.code==='ENOENT'?404:502;res.end(error.code==='ENOENT'?'Not found':'Could not load this resource');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Practical Non-Determinism: http://127.0.0.1:${port}/\nTickTick: ${token?'Eco read-only connection':'connect in Settings'}\nLocal preview only; no public listener.`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
