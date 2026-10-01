import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('public/assets/generated',{recursive:true});
const key=process.env.GEMINI_API_KEY;
if(key){ try { const model='gemini-2.5-flash-image'; const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Create a premium abstract Arabic reading library visual direction mockup without any text or letters, deep green and sand palette, editorial geometric style.'}]}],generationConfig:{responseModalities:['IMAGE','TEXT']}})}); if(!res.ok) throw new Error('generation failed'); } catch { /* fallback assets remain available */ } }
writeFileSync('public/assets/generated/README.txt','Optional generated assets are placed here when Gemini image generation succeeds.');
