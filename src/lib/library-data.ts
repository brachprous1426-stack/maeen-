import { prisma } from "@/lib/auth";

export async function getLibraryData(
  userId: string,
  { q = "", type, category, admin = false }: {
    q?: string;
    type?: "BOOK" | "AUDIO";
    category?: string;
    admin?: boolean;
  } = {},
) {
  const [items, categories] = await Promise.all([
    prisma.content.findMany({
      where: {
        ...(q ? { title: { contains: q } } : {}),
        ...(type ? { type } : {}),
        ...(category ? { categoryId: category } : {}),
      },
      include: {
        category: true,
        progress: { where: { userId }, select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: admin ? {} : { contents: { some: type ? { type } : {} } },
    }),
  ]);
  return { items, categories };
}
