import levelThreeBooks from '../src/data/level-three-books.json';
import levelTwoBooks from '../src/data/level-two-books.json';
import levelOneBooks from '../src/data/level-one-books.json';
import audioLinks from './audio-links.json';
import { PrismaClient, Role, ContentType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME || 'مدير المكتبة';
  const adminCode = (process.env.ADMIN_ACCESS_CODE || 'ADM123').toUpperCase();

  await prisma.user.upsert({
    where: { accessCode: adminCode },
    update: { name: adminName, role: Role.ADMIN, isActive: true },
    create: { name: adminName, accessCode: adminCode, role: Role.ADMIN }
  });

  const categoriesData = [
    'مواد المربين',
    'المستوى الأول',
    'المستوى الثاني',
    'المستوى الثالث',
    'المستوى الرابع',
    'المستوى الخامس',
    'صوتيات'
  ];

  const categories: Record<string, string> = {};
  for (const name of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    categories[name] = cat.id;
  }

  const items = [
    ...levelThreeBooks.map(book => ({title: book.title, author: book.author || '', categoryId: categories['المستوى الثالث'], type: ContentType.BOOK, mediaUrl: book.mediaUrl, coverImageUrl: (book as any).coverImageUrl, description: ''})),
    ...levelTwoBooks.map(book => ({title: book.title, author: book.author || '', categoryId: categories['المستوى الثاني'], type: ContentType.BOOK, mediaUrl: book.mediaUrl, coverImageUrl: (book as any).coverImageUrl, description: ''})),
    ...levelOneBooks.map(book => ({title: book.title, author: book.author || '', categoryId: categories['المستوى الأول'], type: ContentType.BOOK, mediaUrl: book.mediaUrl, coverImageUrl: (book as any).coverImageUrl, description: ''})),
    // مواد المربين
    { title: "سلسلة صناعة المربي", author: "أحمد السيد", duration: "8 مقاطع", categoryId: categories['مواد المربين'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة ما لا يسع المربي جهله", author: "محمد الدويش", duration: "محاضرة واحدة", categoryId: categories['مواد المربين'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=slar2SEFAK4', coverImageUrl: 'https://i.ytimg.com/vi/slar2SEFAK4/hqdefault.jpg', description: '' },

    // المستوى الأول
    { title: "سلسلة أبجديات الثقافة الإسلامية: النبي ﷺ في مكة", author: "أحمد السيد", duration: "7 مقاطع", categoryId: categories['المستوى الأول'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة مقاطع لكي يحبني الله", author: "أحمد السيد", duration: "6 مقاطع", categoryId: categories['المستوى الأول'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة مقاطع فتية عظماء", author: "أحمد السيد", duration: "3 مقاطع", categoryId: categories['المستوى الأول'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة مشكلة التفاهة", author: "أحمد السيد", duration: "مقطعان", categoryId: categories['المستوى الأول'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة أبجديات الثقافة الإسلامية: النبي ﷺ في المدينة", author: "أحمد السيد", duration: "10 مقاطع", categoryId: categories['المستوى الأول'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة تعزيز الهوية للجيل الصاعد", author: "أحمد السيد", duration: "5 مقاطع", categoryId: categories['المستوى الأول'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },

    // المستوى الثاني
    { title: "سلسلة أولو العزم", author: "أحمد السيد", duration: "6 مقاطع", categoryId: categories['المستوى الثاني'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة القلب المنيب", author: "أحمد السيد", duration: "محاضرة واحدة", categoryId: categories['المستوى الثاني'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },

    // المستوى الثالث
    { title: "سلسلة أعمال القلوب", author: "أحمد السيد", duration: "6 مقاطع", categoryId: categories['المستوى الثالث'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة سير وعبر للمصلحين", author: "أحمد السيد", duration: "16 مقطع", categoryId: categories['المستوى الثالث'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة شرح الأربعين النووية للنشء", author: "أحمد السيد", duration: "41 مقطع", categoryId: categories['المستوى الثالث'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },

    // المستوى الرابع
    { title: "سلسلة الهداية المعرفية", author: "أحمد السيد", duration: "سلسلة مستمرة", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة المدخل إلى اللغة العربية", author: "أحمد السيد", duration: "ساعتان تقريبا", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة المدخل إلى علوم القرآن والتفسير", author: "أحمد السيد", duration: "ساعة وثلث", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة المدخل إلى علم العقيدة", author: "أحمد السيد", duration: "ساعة وثلث", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة المدخل إلى السيرة النبوية", author: "أحمد السيد", duration: "ساعة ونصف", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "المدخل إلى علم الفقه", author: "عامر بهجت", duration: "20 مقطع", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=OQfMcVwehII', coverImageUrl: 'https://i.ytimg.com/vi/OQfMcVwehII/hqdefault.jpg', description: '' },
    { title: "محاضرة المدخل إلى علم التاريخ الإسلامي", author: "أحمد السيد", duration: "ساعة تقريباً", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة مقدمة أصولية لفهم النصوص الشرعية", author: "أحمد السيد", duration: "50 دقيقة", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة شرح البيقونية", author: "أحمد السيد", duration: "6 مقاطع", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "محاضرة التأسيس الحديثي", author: "أحمد السيد", duration: "ساعتان تقريبا", categoryId: categories['المستوى الرابع'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },

    // المستوى الخامس
    { title: "سلسلة سوية المؤمن", author: "أحمد السيد", duration: "12 مقطع", categoryId: categories['المستوى الخامس'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' },
    { title: "سلسلة لكي يكون الجيل أملا", author: "أحمد السيد", duration: "3 مقاطع", categoryId: categories['المستوى الخامس'], type: ContentType.AUDIO, mediaUrl: 'https://www.youtube.com/watch?v=placeholder', description: '' }
  ];

  const authorsToRemove = ["أحمد السيد", "إبراهيم السكران", "عبد الوهاب الطريري", "عبدالوهاب الطريري"];
  const filteredItems = items.filter(item => !authorsToRemove.includes(item.author));

  // Insert all
  for (const item of filteredItems) {
    // Generate placeholder svg for books so the title shows if no cover provided.
    // Ensure all books have clean placeholder SVG covers showing the book title if no image URL is provided.
    const coverSvg = item.type === ContentType.BOOK 
      ? `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23182f2b"/><text x="200" y="300" fill="%23f8f2e8" text-anchor="middle" font-size="28" font-family="sans-serif" style="text-wrap:balance" width="300">${encodeURIComponent(item.title)}</text><text x="200" y="350" fill="%23d7a96b" text-anchor="middle" font-size="20" font-family="sans-serif">${encodeURIComponent(item.author)}</text></svg>`
      : null;

    const finalCover = (item as any).coverImageUrl || coverSvg;

    const exists = await prisma.content.findFirst({ where: { title: item.title, categoryId: item.categoryId, type: item.type } });
    if (!exists) {
      await prisma.content.create({
        data: {
          ...item,
          coverImageUrl: finalCover
        }
      });
    } else {
      await prisma.content.update({
        where: { id: exists.id },
        data: {
          coverImageUrl: finalCover
        }
      });
    }
  }

  // Seed audio materials from audio-links.json
  const audioCategory = categories['صوتيات'];
  for (const row of audioLinks) {
    const id = 'drive-audio-' + row.sourceId;
    const data = { mediaUrl: row.mediaUrl, coverImageUrl: row.coverImageUrl };
    await prisma.content.upsert({
      where: { id },
      update: data,
      create: {
        id,
        title: row.title,
        description: '',
        type: ContentType.AUDIO,
        categoryId: audioCategory,
        ...data
      }
    });
  }

  console.log('Seed completed.');
}

main().finally(() => prisma.$disconnect());
