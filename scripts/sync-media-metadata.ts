import { PrismaClient } from '@prisma/client';
import { extractMediaMetadata } from '../src/lib/media-metadata';
import { durationSeconds } from '../src/lib/achievement-totals';
import { mkdirSync, writeFileSync } from 'node:fs';
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.content.findMany();
  mkdirSync('prisma/backups', { recursive: true });
  writeFileSync(`prisma/backups/metadata-before-${Date.now()}.json`, JSON.stringify(items.map(({ id, mediaUrl, pageCount, duration }) => ({ id, mediaUrl, pageCount, duration })), null, 2));
  const queue = items.filter(i => i.type === 'BOOK' ? !i.pageCount : durationSeconds(i.duration) === null);
  const results: object[] = [];
  async function worker() {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const data = await extractMediaMetadata(item);
        const saved = await prisma.content.updateMany({ where: { id: item.id, mediaUrl: item.mediaUrl, type: item.type }, data });
        if (!saved.count) throw new Error('Source changed');
        results.push({ id: item.id, title: item.title, ...data });
        console.log('OK', item.title, JSON.stringify(data));
      } catch (error) {
        results.push({ id: item.id, title: item.title, error: error instanceof Error ? error.message : 'Failed' });
        console.log('FAILED', item.title);
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  writeFileSync('prisma/backups/metadata-sync-results.json', JSON.stringify(results, null, 2));
  console.log('Processed', results.length, 'Failed', results.filter(r => 'error' in r).length);
}
main().catch(() => { console.error('Metadata sync failed'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
