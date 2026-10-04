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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { maxAllowedLevel: true } });
  const maxLevel = user?.maxAllowedLevel || 1;

  const hiddenCategoryNames: string[] = [];
  if (!admin) {
    if (maxLevel < 2) hiddenCategoryNames.push("المستوى الثاني");
    if (maxLevel < 3) hiddenCategoryNames.push("المستوى الثالث");
  }

  const [items, categories] = await Promise.all([
    prisma.content.findMany({
      where: {
        ...(q ? { title: { contains: q } } : {}),
        ...(type ? { type } : {}),
        ...(category ? { categoryId: category } : {}),
        ...(hiddenCategoryNames.length > 0 ? { category: { name: { notIn: hiddenCategoryNames } } } : {}),
      },
      include: {
        category: true,
        progress: { where: { userId }, select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: admin ? {} : { 
        contents: { some: type ? { type } : {} },
        ...(hiddenCategoryNames.length > 0 ? { name: { notIn: hiddenCategoryNames } } : {}),
      },
    }),
  ]);
  return { items, categories };
}
