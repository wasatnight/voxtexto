const {build} = require('electron-builder');
const {cp, mkdir, writeFile} = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
(async () => {
  const manifest = require('../package.json');
  const stage = path.join(root,'desktop-package');
  await mkdir(stage,{recursive:true});
  await cp(path.join(root,'dist'),path.join(stage,'dist'),{recursive:true});
  await cp(path.join(root,'electron'),path.join(stage,'electron'),{recursive:true});
  await cp(path.join(root,'public/icons'),path.join(stage,'public/icons'),{recursive:true});
  await writeFile(path.join(stage,'package.json'),JSON.stringify({name:manifest.name,productName:'VoxTexto',version:manifest.version,main:manifest.main,description:manifest.description,author:manifest.author,license:'MIT'},null,2));
  const config={...manifest.build, directories:{app:stage,output:path.join(root,'release')},files:['dist/**/*','electron/**/*','public/**/*','package.json','!node_modules/**/*'],npmRebuild:false,electronVersion:manifest.devDependencies.electron,electronDist:path.join(root,'node_modules/electron/dist')};
  config.win={...config.win,icon:path.join(root,'src-tauri/icons/icon.ico')};
  await build({win:process.argv.includes('--dir')?['dir']:['nsis'],x64:true,config});
})().catch(error=>{console.error(error);process.exit(1);});
