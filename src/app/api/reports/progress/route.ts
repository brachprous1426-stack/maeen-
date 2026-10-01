import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProgressReport, ReportAccessError, type ReportFormat, type ReportScope } from '@/lib/progress-report';
import { createExcelReport } from '@/lib/report-excel';
import { createPowerPointReport } from '@/lib/report-powerpoint';

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const query = new URL(request.url).searchParams;
  const scope = query.get('scope');
  const format = query.get('format');
  const id = query.get('id') || undefined;
  if (!['all', 'group', 'student'].includes(scope || '') || !['xlsx', 'pptx'].includes(format || '')) {
    return NextResponse.json({ error: 'طلب تقرير غير صالح' }, { status: 400 });
  }

  try {
    const report = await getProgressReport(user, scope as ReportScope, id);
    const bytes = format === 'xlsx' ? await createExcelReport(report) : await createPowerPointReport(report);
    const extension = format as ReportFormat;
    const date = report.generatedAt.toISOString().slice(0, 10);
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': extension === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="progress-${scope}-${date}.${extension}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof ReportAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Progress report export failed:', error);
    return NextResponse.json({ error: 'تعذر إنشاء التقرير' }, { status: 500 });
  }
}
