import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { prisma, requireAdmin } from "@/lib/auth";
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function code() {
  return Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join(
    "",
  );
}
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(
      await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          progress: {
            where: { status: "APPROVED" },
            include: { content: true },
          },
        },
      }),
    );
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
}
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { name, role, supervisorId, groupName } = await req.json();
    let accessCode = code();
    while (await prisma.user.findUnique({ where: { accessCode } }))
      accessCode = code();
    return NextResponse.json(
      await prisma.user.create({
        data: {
          name,
          accessCode,
          role: role || "USER",
          supervisorId: supervisorId || null,
          groupName: groupName || null,
        },
      }),
    );
  } catch {
    return NextResponse.json({ error: "تعذر إنشاء المستخدم" }, { status: 400 });
  }
}
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const { id, action, role, groupName, supervisorId, level } = await req.json();
    if (action === "setLevel") {
      return NextResponse.json(
        await prisma.user.update({
          where: { id },
          data: { maxAllowedLevel: level, sessionVersion: { increment: 1 } },
        }),
      );
    }
    if (action === "regenerate") {
      let accessCode = code();
      while (await prisma.user.findUnique({ where: { accessCode } }))
        accessCode = code();
      return NextResponse.json(
        await prisma.user.update({
          where: { id },
          data: { accessCode, sessionVersion: { increment: 1 } },
        }),
      );
    }
    if (action === "update_profile") {
      return NextResponse.json(
        await prisma.user.update({
          where: { id },
          data: {
            role: role || undefined,
            groupName: groupName || null,
            supervisorId: supervisorId || null,
          },
        }),
      );
    }
    return NextResponse.json(
      await prisma.user.update({
        where: { id },
        data: { isActive: action === "activate" },
      }),
    );
  } catch {
    return NextResponse.json({ error: "تعذر التعديل" }, { status: 400 });
  }
}
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    await prisma.user.delete({
      where: { id: new URL(req.url).searchParams.get("id")! },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 400 });
  }
}
