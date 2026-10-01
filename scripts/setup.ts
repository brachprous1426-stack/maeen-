import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('public/assets', {recursive:true});
execSync('npx prisma migrate dev --name init --skip-seed', {stdio:'inherit'});
execSync('npx prisma db seed', {stdio:'inherit'});
if(!existsSync('public/assets/pattern.svg')) writeFileSync('public/assets/pattern.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M0 80L80 0l80 80-80 80z" fill="none" stroke="#b88345" stroke-opacity=".15"/><circle cx="80" cy="80" r="4" fill="#b88345" fill-opacity=".2"/></svg>`);
if(!existsSync('public/assets/placeholder.svg')) writeFileSync('public/assets/placeholder.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="#182f2b"/><path d="M200 120l120 120-120 120L80 240z" fill="none" stroke="#d7a96b" stroke-width="5"/><text x="200" y="500" fill="#f8f2e8" text-anchor="middle" font-size="28" font-family="sans-serif">مكتبة</text></svg>`);
console.log('تم تجهيز قاعدة البيانات والأصول.');
