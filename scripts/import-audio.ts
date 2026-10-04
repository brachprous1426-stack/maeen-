import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const prisma = new PrismaClient();

async function main() {
  const rows = JSON.parse(readFileSync('prisma/audio-links.json', 'utf8'));
  const existing = await prisma.content.findMany({ where: { type: 'AUDIO' } });

  mkdirSync('prisma/backups', { recursive: true });
  writeFileSync('prisma/backups/audio-before-import-' + Date.now() + '.json', JSON.stringify(existing, null, 2));

  const category = await prisma.category.upsert({
    where: { name: 'صوتيات' },
    update: {},
    create: { name: 'صوتيات' }
  });

  // Update existing placeholder items with real YouTube lectures
  const placeholders = [
    {
      title: 'المدخل إلى علم الفقه',
      mediaUrl: 'https://www.youtube.com/watch?v=OQfMcVwehII',
      coverImageUrl: 'https://i.ytimg.com/vi/OQfMcVwehII/hqdefault.jpg'
    },
    {
      title: 'محاضرة ما لا يسع المربي جهله',
      mediaUrl: 'https://www.youtube.com/watch?v=slar2SEFAK4',
      coverImageUrl: 'https://i.ytimg.com/vi/slar2SEFAK4/hqdefault.jpg'
    }
  ];

  for (const p of placeholders) {
    const found = existing.find(x => x.title.trim() === p.title);
    if (found) {
      await prisma.content.update({
        where: { id: found.id },
        data: { mediaUrl: p.mediaUrl, coverImageUrl: p.coverImageUrl }
      });
      console.log(`Updated placeholder item: ${p.title}`);
    }
  }

  // Import rows safely without transaction timeout
  let importedCount = 0;
  for (const row of rows) {
    const id = 'drive-audio-' + row.sourceId;
    const matches = existing.filter(x => x.title.trim() === row.title);
    if (matches.length > 1) throw new Error('Ambiguous title: ' + row.title);

    const data = { mediaUrl: row.mediaUrl, coverImageUrl: row.coverImageUrl };
    if (matches.length) {
      await prisma.content.update({ where: { id: matches[0].id }, data });
    } else {
      await prisma.content.upsert({
        where: { id },
        update: data,
        create: {
          id,
          title: row.title,
          description: '',
          type: 'AUDIO',
          categoryId: category.id,
          ...data
        }
      });
    }
    importedCount++;
  }

  const saved = await prisma.content.findMany({ where: { type: 'AUDIO' } });
  for (const row of rows) {
    if (!saved.some(x => x.title === row.title && x.mediaUrl === row.mediaUrl && x.coverImageUrl === row.coverImageUrl)) {
      throw new Error('Verification failed: ' + row.title);
    }
  }
  console.log('Verified links and thumbnails for ' + rows.length + ' audio items.');
  console.log('Total AUDIO items in database now: ' + saved.length);
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
