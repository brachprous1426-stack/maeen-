import PptxGenJS from 'pptxgenjs';
import type { ProgressReport } from './progress-report';

const pine = '18332F';
const ink = '24332F';
const muted = '64736B';

export async function createPowerPointReport(report: ProgressReport) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.rtlMode = true;
  pptx.author = 'منصة معين';
  pptx.subject = report.title;
  pptx.title = report.title;
  pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };

  const cover = pptx.addSlide();
  cover.background = { color: 'F6F2EA' };
  cover.addText(report.title, { x: 0.8, y: 0.9, w: 11.7, h: 0.85, fontFace: 'Arial', fontSize: 38, bold: true, color: pine, align: 'right', rtlMode: true, breakLine: false });
  cover.addText('منصة معين', { x: 0.8, y: 1.82, w: 11.7, h: 0.45, fontFace: 'Arial', fontSize: 21, color: muted, align: 'right', rtlMode: true });
  cover.addText(`الطلاب: ${report.summary.members}     الكتب المكتملة: ${report.summary.books}     المسموعات المكتملة: ${report.summary.audio}`, {
    x: 0.8, y: 3.05, w: 11.7, h: 0.7, fontFace: 'Arial', fontSize: 23, color: ink, align: 'right', rtlMode: true,
  });
  cover.addText(`الطلبات المعلقة: ${report.summary.pending}     الطلبات المرفوضة: ${report.summary.rejected}`, {
    x: 0.8, y: 4.0, w: 11.7, h: 0.6, fontFace: 'Arial', fontSize: 22, color: ink, align: 'right', rtlMode: true,
  });
  cover.addText(`تاريخ التقرير: ${formatDate(report.generatedAt)}\nيُحسب الإنجاز بعد اعتماده فقط.`, {
    x: 0.8, y: 5.65, w: 11.7, h: 0.8, fontFace: 'Arial', fontSize: 16, color: muted, align: 'right', rtlMode: true,
  });

  if (report.scope === 'all') {
    addTableSlides(pptx, 'إنجاز المجموعات',
      ['المجموعة', 'الطلاب', 'الكتب', 'المسموعات', 'المعلق'],
      report.groups.map((group) => [group.name, group.members, group.books, group.audio, group.pending]),
      [4.2, 1.5, 1.7, 1.8, 1.8]);
  }

  if (report.scope !== 'student') {
    addTableSlides(pptx, 'متابعة الطلاب',
      ['الطالب', 'المجموعة', 'الكتب', 'المسموعات', 'المعلق'],
      report.members.map((member) => [
        member.name,
        member.groupName || 'بلا مجموعة',
        member.progress.filter((item) => item.status === 'APPROVED' && item.content.type === 'BOOK').length,
        member.progress.filter((item) => item.status === 'APPROVED' && item.content.type === 'AUDIO').length,
        member.progress.filter((item) => item.status === 'PENDING').length,
      ]),
      [4.2, 2.6, 1.3, 1.8, 1.1]);
  }

  const records = report.members.flatMap((member) => member.progress.map((item) => ({ member, item })));
  if (report.scope === 'student') {
    addTableSlides(pptx, 'سجل الطالب',
      ['المادة', 'النوع', 'الحالة', 'التاريخ'],
      records.map(({ item }) => [
        item.content.title,
        item.content.type === 'BOOK' ? 'كتاب' : 'مسموع',
        statusName(item.status),
        formatDate(item.completedAt || item.requestedAt),
      ]),
      [6.1, 1.5, 1.8, 1.6]);
  } else {
    const pending = records.filter(({ item }) => item.status === 'PENDING');
    addTableSlides(pptx, 'الطلبات المعلقة',
      ['الطالب', 'المادة', 'تاريخ الطلب'],
      pending.map(({ member, item }) => [member.name, item.content.title, formatDate(item.requestedAt)]),
      [3.2, 5.9, 1.9]);
  }

  const output = await pptx.write({ outputType: 'nodebuffer', compression: true });
  return new Uint8Array(output as Buffer);
}

function addTableSlides(
  pptx: PptxGenJS,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  widths: number[],
) {
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  for (let page = 0; page < pages; page++) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(pages > 1 ? `${title} (${page + 1} من ${pages})` : title, {
      x: 0.7, y: 0.45, w: 11.9, h: 0.7, fontFace: 'Arial', fontSize: 31, bold: true, color: pine, align: 'right', rtlMode: true,
    });
    const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);
    if (pageRows.length === 0) {
      slide.addText('لا توجد بيانات في هذه القائمة حتى الآن.', {
        x: 0.8, y: 2.1, w: 11.6, h: 0.7, fontFace: 'Arial', fontSize: 23, color: muted, align: 'right', rtlMode: true,
      });
      continue;
    }
    const tableRows = [
      headers.map((text) => ({ text, options: { bold: true, color: 'FFFFFF', fill: { color: pine } } })),
      ...pageRows.map((row) => row.map((value) => ({ text: String(value) }))),
    ];
    slide.addTable(tableRows, {
      x: 0.85, y: 1.5, w: 11.0, colW: widths, rowH: 0.57,
      fontFace: 'Arial', fontSize: 15, color: ink, align: 'right', valign: 'middle',
      margin: 0.12, border: { type: 'solid', color: 'E8E3D9', pt: 0.5 },
      fill: { color: 'FFFFFF' },
    });
  }
}

function statusName(status: 'APPROVED' | 'PENDING' | 'REJECTED') {
  return status === 'APPROVED' ? 'مكتمل' : status === 'PENDING' ? 'قيد المراجعة' : 'مرفوض';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}


