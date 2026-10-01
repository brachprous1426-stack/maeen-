import ExcelJS from 'exceljs';
import type { ProgressReport } from './progress-report';

const statusName = { APPROVED: 'مكتمل', PENDING: 'قيد المراجعة', REJECTED: 'مرفوض' };

export async function createExcelReport(report: ProgressReport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'مَعين';
  workbook.created = report.generatedAt;

  const summary = workbook.addWorksheet('الملخص');
  summary.views = [{ state: 'normal', rightToLeft: true }];
  summary.columns = [{ width: 28 }, { width: 24 }];
  summary.addRow([report.title]);
  summary.addRow(['تاريخ التقرير', report.generatedAt]);
  summary.getCell('B2').numFmt = 'yyyy-mm-dd hh:mm';
  summary.addRow([]);
  summary.addRow(['المؤشر', 'القيمة']);
  summary.addRows([
    ['الطلاب', report.summary.members],
    ['الكتب المكتملة', report.summary.books],
    ['المواد المسموعة المكتملة', report.summary.audio],
    ['الطلبات المعلقة', report.summary.pending],
    ['الطلبات المرفوضة', report.summary.rejected],
  ]);
  summary.addRow([]);
  summary.addRow(['يُحسب الإنجاز بعد اعتماده فقط. يعرض الملف حالة البيانات وقت تنزيله.']);
  styleSheet(summary, 4);
  summary.getRow(1).font = { name: 'Arial', bold: true, size: 18, color: { argb: 'FF18332F' } };

  if (report.scope === 'all') {
    const groups = workbook.addWorksheet('المجموعات');
    groups.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
    groups.columns = [
      { header: 'المجموعة', width: 24 },
      { header: 'الطلاب', width: 14 },
      { header: 'كتب مكتملة', width: 18 },
      { header: 'مسموعات مكتملة', width: 20 },
      { header: 'طلبات معلقة', width: 18 },
      { header: 'طلبات مرفوضة', width: 18 },
    ];
    report.groups.forEach((group) => groups.addRow([group.name, group.members, group.books, group.audio, group.pending, group.rejected]));
    styleSheet(groups, 1);
    if (groups.rowCount > 1) groups.autoFilter = `A1:F${groups.rowCount}`;
  }

  const members = workbook.addWorksheet('الطلاب');
  members.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
  members.columns = [
    { header: 'الطالب', width: 30 },
    { header: 'المجموعة', width: 22 },
    { header: 'كتب مكتملة', width: 18 },
    { header: 'مسموعات مكتملة', width: 20 },
    { header: 'إجمالي الإنجاز', width: 18 },
    { header: 'طلبات معلقة', width: 18 },
    { header: 'طلبات مرفوضة', width: 18 },
  ];
  for (const member of report.members) {
    const approved = member.progress.filter((item) => item.status === 'APPROVED');
    const books = approved.filter((item) => item.content.type === 'BOOK').length;
    const audio = approved.length - books;
    members.addRow([
      member.name,
      member.groupName || 'بلا مجموعة',
      books,
      audio,
      approved.length,
      member.progress.filter((item) => item.status === 'PENDING').length,
      member.progress.filter((item) => item.status === 'REJECTED').length,
    ]);
  }
  styleSheet(members, 1);
  if (members.rowCount > 1) members.autoFilter = `A1:G${members.rowCount}`;

  const records = workbook.addWorksheet('سجل الإنجاز');
  records.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
  records.columns = [
    { header: 'الطالب', width: 30 },
    { header: 'المجموعة', width: 22 },
    { header: 'المادة', width: 52 },
    { header: 'التصنيف', width: 22 },
    { header: 'النوع', width: 16 },
    { header: 'الحالة', width: 20 },
    { header: 'تاريخ الطلب', width: 22 },
    { header: 'تاريخ الإكمال', width: 22 },
    { header: 'سجله', width: 16 },
  ];
  for (const member of report.members) {
    for (const item of member.progress) {
      const row = records.addRow([
        member.name,
        member.groupName || 'بلا مجموعة',
        item.content.title,
        item.content.category.name,
        item.content.type === 'BOOK' ? 'كتاب' : 'مسموع',
        statusName[item.status],
        item.requestedAt,
        item.completedAt,
        item.createdBy === 'ADMIN' ? 'المدير' : 'الطالب',
      ]);
      row.getCell(7).numFmt = 'yyyy-mm-dd hh:mm';
      row.getCell(8).numFmt = 'yyyy-mm-dd hh:mm';
    }
  }
  styleSheet(records, 1);
  if (records.rowCount > 1) records.autoFilter = `A1:I${records.rowCount}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function styleSheet(sheet: ExcelJS.Worksheet, headerRow: number) {
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'middle', horizontal: 'right' };
    row.font = { name: 'Arial', size: 12, color: { argb: 'FF24332F' } };
    row.height = 23;
  });
  const header = sheet.getRow(headerRow);
  header.height = 28;
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18332F' } };
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  });
}


