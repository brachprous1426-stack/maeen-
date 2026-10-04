import { NextResponse } from 'next/server';
import { requireAdmin, prisma } from '@/lib/auth';
import { extractMediaMetadata } from '@/lib/media-metadata';
import { revalidatePath } from 'next/cache';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 60;
export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'غير مصرح' }, { status: 403 }); }
  try {
    const upload = req.headers.get('content-type')?.includes('multipart/form-data') ? await req.formData() : null;
    const { id } = upload ? { id: upload.get('id') } : await req.json();
    if (typeof id !== 'string') return NextResponse.json({ error: 'اختر المادة' }, { status: 400 });
    const item = await prisma.content.findUniqueOrThrow({ where: { id } });
    let data: { pageCount: number } | { duration: string };
    if (upload) {
      const file = upload.get('file');
      if (item.type !== 'BOOK' || !(file instanceof File) || !file.size || file.size > 100 * 1024 * 1024) throw new Error('اختر ملف PDF للكتاب، بحجم أقل من ١٠٠ ميجابايت');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
      if (!pdf.getPageCount()) throw new Error('الملف لا يحتوي صفحات');
      data = { pageCount: pdf.getPageCount() };
    } else data = await extractMediaMetadata(item);
    // Do not apply measurements if the source changed while it was downloading.
    const saved = await prisma.content.updateMany({ where: { id, mediaUrl: item.mediaUrl, type: item.type }, data });
    if (!saved.count) throw new Error('تغير رابط المادة أثناء القراءة؛ أعد المحاولة');
    revalidatePath('/achievements');
    revalidatePath('/books');
    revalidatePath('/audio');
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && !error.message.includes('prisma') ? error.message : 'تعذر قراءة المصدر' }, { status: 400 });
  }
}
