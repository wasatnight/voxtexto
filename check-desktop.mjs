import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, stat, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const env = {...process.env};
delete env.ELECTRON_RUN_AS_NODE;
const args=[...(process.env.VOXTEXTO_PACKAGED_EXE ? [] : [root]),'--disable-gpu',`--user-data-dir=${path.join(root,'test-results','electron-profile')}`,'--enable-logging=stderr'];
// Only for CI environments whose outer sandbox cannot host Chromium's sandbox.
// The distributed app keeps its renderer sandbox enabled.
if (process.env.VOXTEXTO_CI_OUTER_SANDBOX === '1') args.push('--no-sandbox');
const app = await electron.launch({args,env,executablePath:process.env.VOXTEXTO_PACKAGED_EXE,timeout:60000});
try {
  const page = await app.firstWindow();
  assert.equal(await app.evaluate(({app}) => app.getName()), 'VoxTexto');
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.getByRole('button',{name:'Grabar audio del sistema',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.voxDesktop.platform),'win32');
  const language=page.getByRole('combobox',{name:'Idioma del audio'});
  await language.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.ok((await language.textContent()).includes('Latinoamérica'));
  await language.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Escape');
  assert.ok((await language.textContent()).includes('Latinoamérica'));
  await language.click();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  const report = path.join(root,'docs');
  await mkdir(report,{recursive:true});
  await page.screenshot({path:path.join(report,'escritorio-inicio.png')});
  await page.evaluate(() => {
    let microphoneCalls=0;
    window.__microphoneCalls=()=>microphoneCalls;
    const synthetic = () => {
      const context=new AudioContext();
      const source=context.createOscillator();
      const volume=context.createGain();
      volume.gain.value=.15;
      const output=context.createMediaStreamDestination();
      source.connect(volume).connect(output);
      source.start();
      output.stream.getAudioTracks()[0].addEventListener('ended',()=>{source.stop();void context.close();});
      return output.stream;
    };
    Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:async()=>synthetic()});
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{microphoneCalls++;return synthetic();}});
  });
  await page.getByRole('checkbox',{name:'Incluir mi micrófono'}).check();
  await page.getByRole('button',{name:'Grabar audio del sistema',exact:true}).click();
  await page.getByRole('button',{name:'Detener y revisar'}).waitFor();
  await page.waitForTimeout(1300);
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  const paused=await page.locator('.recording-time').textContent();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('.recording-time').textContent(),paused);
  await page.screenshot({path:path.join(report,'escritorio-grabacion.png')});
  await page.getByRole('button',{name:'Reanudar',exact:true}).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button',{name:'Detener y revisar'}).click();
  await page.getByRole('button',{name:'Guardar audio',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.__microphoneCalls()),1);
  assert.ok(await page.locator('audio').getAttribute('src'));
  const savePath=path.join(root,'docs','prueba-sintetica.webm');
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},savePath);
  await page.getByRole('button',{name:'Guardar audio',exact:true}).click();
  await page.getByText('Grabación guardada en tu equipo.',{exact:true}).waitFor();
  assert.ok((await stat(savePath)).size>1000);
  // Decode the generated WebM to verify it contains audio, without ASR/model downloads.
  const duration=await page.evaluate(async values=>{
    const bytes=new Uint8Array(values).buffer;
    const context=new AudioContext();
    const data=await context.decodeAudioData(bytes);
    const result={duration:data.duration,channels:data.numberOfChannels,peak:Math.max(...data.getChannelData(0).subarray(0,30000))};
    await context.close();return result;
  },Array.from(await readFile(savePath)));
  assert.ok(duration.duration>1.5 && duration.duration<4.5, JSON.stringify(duration));
  assert.ok(duration.peak>.01);
  await page.screenshot({path:path.join(report,'escritorio-revision.png')});
  const originalUrl=await page.locator('audio').getAttribute('src');
  await page.evaluate(()=>{
    window.__revoked=[];
    const revoke=URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL=url=>{window.__revoked.push(url);revoke(url);};
  });
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Eliminar audio',exact:true}).click();
  assert.equal(await page.locator('audio').getAttribute('src'),originalUrl);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Eliminar audio',exact:true}).click();
  await page.getByRole('button',{name:'Seleccionar audio',exact:true}).waitFor();
  assert.equal(await page.locator('audio').count(),0);
  assert.ok((await page.evaluate(()=>window.__revoked)).includes(originalUrl));
  assert.equal(await page.getByRole('button',{name:'Guardar audio',exact:true}).count(),0);
  await page.getByRole('button',{name:'Cambiar modo claro u oscuro'}).click();
  await language.click();
  await page.keyboard.press('End');
  await page.screenshot({path:path.join(report,'escritorio-selector-oscuro.png')});
  assert.ok(await page.getByRole('listbox').evaluate(list=>list.scrollTop>0));
  await page.keyboard.press('Escape');
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Nueva transcripción',exact:true}).click();
  await page.evaluate(() => {
    const realNow=performance.now.bind(performance);
    window.__clockOffset=0;
    Object.defineProperty(performance,'now',{configurable:true,value:()=>realNow()+window.__clockOffset});
  });
  await page.getByRole('button',{name:'Grabar audio del sistema',exact:true}).click();
  await page.getByRole('button',{name:'Detener y revisar'}).waitFor();
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{window.__clockOffset=3600*1000;});
  await page.getByRole('button',{name:'Guardar audio',exact:true}).waitFor();
  await page.getByText('Se alcanzó el máximo de 60 minutos.',{exact:true}).waitFor();
  await page.evaluate(()=>{window.__clockOffset=0;});
  await page.getByRole('button',{name:'Nueva transcripción',exact:true}).click();
  await page.evaluate(()=>Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:async()=>{throw new DOMException('Denied','NotAllowedError');}}));
  await page.getByRole('button',{name:'Grabar audio del sistema',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'No se pudo acceder al audio'}).waitFor();
  await page.getByRole('button',{name:'Grabar audio del sistema',exact:true}).waitFor();
  if (process.env.SPANISH_FIXTURE) {
    page.on('console', message => { if (message.type() === 'error') console.log('RENDERER',message.text()); });
    await page.getByRole('button',{name:'Nueva transcripción',exact:true}).click();
    await page.locator('#audio-input').setInputFiles(process.env.SPANISH_FIXTURE);
    await page.getByRole('button',{name:'Opciones de procesamiento'}).click();
    await page.getByLabel('Motor local').selectOption('wasm');
    await page.getByRole('button',{name:'Transcribir audio',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.segment textarea') || document.querySelector('.alert.error'), null, {timeout:300000});
    assert.equal(await page.getByRole('alert').count(),0,await page.getByRole('alert').allTextContents());
    assert.ok(await page.getByRole('textbox').count());
    await page.getByText('Idioma usado: español',{exact:true}).waitFor();
    for (const format of ['txt','docx','pdf']) {
      const file=path.join(report,`transcripcion-prueba.${format}`);
      await app.evaluate(({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});},file);
      await page.getByLabel('Formato de descarga').selectOption(format);
      await page.getByRole('button',{name:'Descargar',exact:true}).click();
      await page.waitForFunction(()=>!document.querySelector('.export-controls button:disabled'));
      assert.ok((await stat(file)).size>0);
    }
    await page.screenshot({path:path.join(report,'escritorio-transcripcion.png')});
    console.log('Verified real Spanish speech transcription and native TXT/DOCX/PDF exports.');
  }
  assert.deepEqual(errors,[]);
  console.log('Electron verified: app opens, synthetic system/microphone mix, pause/resume, WebM decode, native save, permission denial recovery. No real device audio captured.');
} finally {
  await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
}
