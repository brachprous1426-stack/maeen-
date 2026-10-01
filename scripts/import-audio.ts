import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const prisma = new PrismaClient();
async function main() {
  const rows = JSON.parse(readFileSync('prisma/audio-links.json', 'utf8'));
  const existing = await prisma.content.findMany({ where: { type: 'AUDIO' } });
  mkdirSync('prisma/backups', { recursive: true });
  writeFileSync('prisma/backups/audio-before-import-' + Date.now() + '.json', JSON.stringify(existing, null, 2));
  await prisma.$transaction(async tx => {
    const category = await tx.category.upsert({where: {name: 'صوتيات'}, update: {}, create: {name: 'صوتيات'}});
    for (const row of rows) {
      const id = 'drive-audio-' + row.sourceId;
      const matches = existing.filter(x => x.title.trim() === row.title);
      if (matches.length > 1) throw new Error('Ambiguous title: ' + row.title);
      const data = { mediaUrl: row.mediaUrl, coverImageUrl: row.coverImageUrl };
      if (matches.length) await tx.content.update({where: {id: matches[0].id}, data});
      else await tx.content.upsert({where: {id}, update: data, create: {id, title: row.title, description: '', type: 'AUDIO', categoryId: category.id, ...data}});
    }
  });
  const saved = await prisma.content.findMany({where: {type: 'AUDIO'}});
  for (const row of rows) if (!saved.some(x => x.title === row.title && x.mediaUrl === row.mediaUrl && x.coverImageUrl === row.coverImageUrl)) throw new Error('Verification failed: ' + row.title);
  console.log('Verified links and thumbnails for ' + rows.length + ' audio items.');
}
main().catch(e => {console.error(e); process.exitCode = 1;}).finally(() => prisma.$disconnect());
