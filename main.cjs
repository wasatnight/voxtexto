const { app, BrowserWindow, desktopCapturer, session, protocol, ipcMain, dialog, powerSaveBlocker } = require('electron');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

app.setName('VoxTexto');
if (process.platform === 'win32') app.setAppUserModelId('dev.voxtexto.desktop');

protocol.registerSchemesAsPrivileged([{ scheme: 'voxtexto', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
const origin = 'voxtexto://app';
const trusted = (url) => url === origin || url.startsWith(origin + '/');
const root = path.join(__dirname, '../dist');
let window;
let captureLease = 0;
let sleepBlocker;
const csp = "default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://cdn.jsdelivr.net; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; media-src 'self' blob:; object-src 'none'; base-uri 'self'";

function senderAllowed(event) {
  if (event.sender !== window?.webContents || !trusted(event.senderFrame?.url || '')) throw new Error('Origen no permitido.');
}
function release() {
  captureLease = 0;
  if (sleepBlocker !== undefined && powerSaveBlocker.isStarted(sleepBlocker)) powerSaveBlocker.stop(sleepBlocker);
  sleepBlocker = undefined;
}

app.whenReady().then(() => {
  protocol.handle('voxtexto', async request => {
    try {
      const url = new URL(request.url);
      if (url.hostname !== 'app' || request.method !== 'GET') return new Response('', {status:403});
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const target = path.resolve(root, '.' + pathname);
      if (!target.startsWith(root + path.sep)) return new Response('', {status:403});
      const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
      return new Response(await readFile(target), {headers:{'Content-Type':types[path.extname(target)] || 'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});
    } catch { return new Response('Recurso no encontrado', {status:404}); }
  });
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    if (process.platform !== 'win32' || !trusted(request.frame?.url || '') || Date.now() > captureLease) return callback({});
    captureLease = 0;
    try {
      const sources = await desktopCapturer.getSources({types:['screen'], thumbnailSize:{width:0,height:0}});
      if (!sources.length) return callback({});
      callback({video:sources[0],audio:'loopback'});
    } catch { callback({}); }
  });
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(contents === window?.webContents && trusted(details.requestingUrl || contents.getURL()) && permission === 'media' && (details.mediaTypes || []).every(type => type === 'audio'));
  });
  session.defaultSession.setPermissionCheckHandler((contents, permission, requestingOrigin) => contents === window?.webContents && trusted(requestingOrigin) && ['media','display-capture'].includes(permission));
  ipcMain.handle('capture:prepare', event => {
    senderAllowed(event);
    if (process.platform !== 'win32') throw new Error('La captura del sistema está disponible en Windows.');
    captureLease = Date.now() + 15_000;
    if (sleepBlocker === undefined) sleepBlocker = powerSaveBlocker.start('prevent-app-suspension');
  });
  ipcMain.handle('capture:release', event => { senderAllowed(event); release(); });
  ipcMain.handle('file:save', async (event, {name, bytes}) => {
    senderAllowed(event);
    if (!(bytes instanceof Uint8Array) || bytes.byteLength > 100*1024*1024 || typeof name !== 'string' || !/\.(txt|docx|pdf|webm)$/.test(name)) throw new Error('Archivo no válido.');
    const safeName = path.basename(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    const extension = safeName.split('.').pop();
    const result = await dialog.showSaveDialog(window, {defaultPath:safeName,filters:[{name:extension.toUpperCase(),extensions:[extension]}]});
    if (result.canceled || !result.filePath) return false;
    await writeFile(result.filePath, bytes);
    return true;
  });
  window = new BrowserWindow({width:1320,height:920,minWidth:390,minHeight:640,title:'VoxTexto',backgroundColor:'#16151f',icon:path.join(__dirname,'../public/icons/icon-192.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  window.webContents.on('will-navigate', (event, url) => { if (!trusted(url)) event.preventDefault(); });
  window.webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(window, {type:'question',buttons:['Seguir aquí','Cerrar y descartar'],defaultId:0,cancelId:0,title:'Trabajo en curso',message:'La grabación y el texto de esta sesión no se guardan automáticamente. ¿Quieres cerrar la app?'});
    if (choice === 1) event.preventDefault();
  });
  window.on('closed', () => { release(); window = null; });
  window.loadURL(origin + '/');
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', release);
