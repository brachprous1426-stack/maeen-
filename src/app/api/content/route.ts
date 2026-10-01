import { NextResponse } from "next/server";
import { prisma, requireUser, requireAdmin } from "@/lib/auth";

import { getYouTubeThumbnail } from "@/lib/youtube";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const isAdminReq = url.searchParams.get("admin") === "true" && user.role === "ADMIN";
    const items = await prisma.content.findMany({
      where: {
        title: { contains: q },
        ...(type ? { type: type as "BOOK" | "AUDIO" } : {}),
        ...(category ? { categoryId: category } : {}),
      },
      include: {
        category: true,
        progress: { where: { userId: user.id }, select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    
    let categories;
    if (isAdminReq) {
      categories = await prisma.category.findMany();
    } else {
      categories = await prisma.category.findMany({
        where: {
          contents: {
            some: type ? { type: type as "BOOK" | "AUDIO" } : {},
          },
        },
      });
    }
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
        pageCount: d.pageCount ? parseInt(d.pageCount) : null,
        duration: d.duration || null,
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "تعذر حفظ المادة" }, { status: 400 });
  }
}
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const d = await req.json();
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
        pageCount: d.pageCount ? parseInt(d.pageCount) : null,
        duration: d.duration || null,
      },
    });
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
