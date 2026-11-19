// node tools/anim_harness/shoot.js NAME [width] [file]  -> tools/anim_harness/out/NAME/v<variant>_s<step>.png; reports JS errors.
// [file] is the scenario file when it differs from NAME (tlb10 lives in tlb.js). Needs playwright with chromium.
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const name=process.argv[2], W=+(process.argv[3]||850);
 const out=path.join(__dirname,'out',name); fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:W,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file://'+path.join(__dirname,'preview.html')+'?a='+name+(process.argv[4]?'&f='+process.argv[4]:'')); await p.waitForTimeout(200);
 const nv = await p.evaluate(n=>window.OS_ANIMS[n].variants.length, name);
 const files=[];
 for (let v=0; v<nv; v++){
   const tabs=await p.$$('.anim-tab'); if (tabs.length) await tabs[v].click();
   const ns=await p.evaluate(([n,v])=>window.OS_ANIMS[n].variants[v].steps.length,[name,v]);
   for (let s=0;s<ns;s++){ await p.waitForTimeout(950); const f=path.join(out,`v${v}_s${String(s).padStart(2,'0')}.png`); await (await p.$('.anim')).screenshot({path:f}); files.push(f);
     if (s<ns-1) await p.click('.anim-bar .anim-btn:nth-of-type(3)'); }
 }
 console.log(name, 'variants', nv, 'shots', files.length, errs.length? 'ERRORS: '+errs.join(' | '):'no errors');
 await b.close(); })();
