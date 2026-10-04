import { NextResponse } from "next/server";
import { prisma, requireUser, requireAdmin } from "@/lib/auth";

import { getLibraryData } from "@/lib/library-data";
import { getYouTubeThumbnail } from "@/lib/youtube";
import { extractMediaMetadata } from '@/lib/media-metadata';
import { durationSeconds } from '@/lib/achievement-totals';
import { revalidatePath } from 'next/cache';

// Keep verified measurements when only the title/category changes; refresh for a new source.
async function measurements(d: { type: string; mediaUrl: string; duration?: string }, existing?: { type: string; mediaUrl: string; pageCount: number | null; duration: string | null }) {
  const sameSource = existing?.type === d.type && existing.mediaUrl === d.mediaUrl;
  if (d.type === 'BOOK' && sameSource && existing.pageCount) return { pageCount: existing.pageCount, duration: null };
  if (d.type === 'AUDIO' && d.duration && durationSeconds(d.duration) !== null) return { pageCount: null, duration: d.duration };
  if (d.type === 'AUDIO' && sameSource && durationSeconds(existing.duration) !== null) return { pageCount: null, duration: existing.duration };
  try { return { pageCount: null, duration: null, ...await extractMediaMetadata(d) }; }
  catch { return { pageCount: null, duration: null }; }
}
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const isAdminReq = url.searchParams.get("admin") === "true" && user.role === "ADMIN";
    const { items, categories } = await getLibraryData(user.id, {
      q,
      type: type === "BOOK" || type === "AUDIO" ? type : undefined,
      category: category || undefined,
      admin: isAdminReq,
    });
    return NextResponse.json({ items, categories });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const d = await req.json();
    const url = new URL(d.mediaUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw Error();
    const measured = await measurements(d);
    let cover = d.coverImageUrl || null;
    if (d.type === "AUDIO" && !cover) {
      cover = getYouTubeThumbnail(d.mediaUrl) || null;
    }
    const item = await prisma.content.create({
      data: {
        title: d.title,
        description: d.description || "",
        type: d.type,
        mediaUrl: d.mediaUrl,
        coverImageUrl: cover,
        categoryId: d.categoryId,
        author: d.author || null,
        ...measured,
      },
    });
    revalidatePath('/achievements');
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "تعذر حفظ المادة" }, { status: 400 });
  }
}
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const d = await req.json();
    const url = new URL(d.mediaUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw Error();
    const existing = await prisma.content.findUniqueOrThrow({ where: { id: d.id } });
    const measured = await measurements(d, existing);
    let cover = d.coverImageUrl || null;
    if (d.type === "AUDIO" && !cover) {
      cover = getYouTubeThumbnail(d.mediaUrl) || null;
    }
    const item = await prisma.content.update({
      where: { id: d.id },
      data: {
        title: d.title,
        description: d.description,
        mediaUrl: d.mediaUrl,
        coverImageUrl: cover,
        categoryId: d.categoryId,
        type: d.type,
        author: d.author || null,
        ...measured,
      },
    });
    revalidatePath('/achievements');
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "تعذر التعديل" }, { status: 400 });
  }
}
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const id = new URL(req.url).searchParams.get("id")!;
    await prisma.content.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 400 });
  }
}
