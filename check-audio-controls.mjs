import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('http://voxtexto.test/**',async route=>{
  let name=new URL(route.request().url()).pathname;if(name.endsWith('/'))name+='index.html';
  const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png'};
  try{await route.fulfill({body:await readFile(path.join(root,'build',name)),contentType:types[path.extname(name)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing file'});}
 });
 const page=await context.newPage();
 await page.addInitScript(()=>{
  window.Worker=class {onmessage;postMessage(){setTimeout(()=>this.onmessage?.({data:{type:'complete',segments:[{id:'sample',start:0,end:1,text:'Texto de prueba editable.'}],engine:'CPU local'}}),800);}terminate(){}};
 });
 await page.goto('http://voxtexto.test/app/');
 const language=page.getByRole('combobox',{name:'Idioma del audio'});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  await language.click();
  await page.keyboard.press('End');
  const rect=await page.getByRole('listbox').boundingBox();
  assert.ok(rect.x>=0 && rect.x+rect.width<=width && rect.y>=0 && rect.y+rect.height<=900);
  await page.keyboard.press('Escape');
 }
 const wav=Buffer.alloc(44+16000*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
 const fixture={name:'prueba.wav',mimeType:'audio/wav',buffer:wav};
 await page.locator('#audio-input').setInputFiles(fixture);
 await page.getByRole('button',{name:'Eliminar audio',exact:true}).click();
 await page.getByRole('button',{name:'Seleccionar audio',exact:true}).waitFor();
 assert.equal(await page.locator('#audio-input').inputValue(),'');
 await page.locator('#audio-input').setInputFiles(fixture);
 await page.getByRole('button',{name:'Transcribir audio',exact:true}).click();
 assert.ok(await page.getByRole('button',{name:'Eliminar audio',exact:true}).isDisabled());
 await page.getByRole('textbox').waitFor();
 await page.getByRole('textbox').fill('Mi corrección debe conservarse si cancelo.');
 page.once('dialog',dialog=>dialog.dismiss());
 await page.getByRole('button',{name:'Eliminar audio',exact:true}).click();
 assert.equal(await page.getByRole('textbox').inputValue(),'Mi corrección debe conservarse si cancelo.');
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Eliminar audio',exact:true}).click();
 await page.getByRole('button',{name:'Seleccionar audio',exact:true}).waitFor();
 assert.equal(await page.getByRole('textbox').count(),0);
 await page.locator('#audio-input').setInputFiles(fixture);
 await page.getByRole('button',{name:'Eliminar audio',exact:true}).waitFor();
 console.log('Verified web: styled language menu fits mobile/desktop; delete loaded audio, reload same file, disable during ASR, cancel preserves edits, confirm clears session. ASR worker simulated for UI state tests.');
}finally{await browser.close();}
