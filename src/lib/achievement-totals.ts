export function durationSeconds(value: string | null): number | null {
  if (!value) return null;
  const text = value.trim().replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  if (/^\d+:\d{2}(:\d{2})?$/.test(text)) {
    const parts = text.split(':').map(Number);
    if (parts.slice(1).some(n => n > 59)) return null;
    const seconds = parts.reduce((total, n) => total * 60 + n, 0);
    return seconds > 0 ? seconds : null;
  }
  const minutes = text.match(/^(\d+(?:\.\d+)?)\s*(?:دقيقة|دقائق|min)?$/i);
  return minutes && Number(minutes[1]) > 0 ? Math.round(Number(minutes[1]) * 60) : null;
}

export type TotalsInput = {
  progress: { status: string; content: { type: string; pageCount: number | null; duration: string | null } }[];
  achievements: { type: string; amount: number }[];
};
export function achievementTotals(student: TotalsInput) {
  let readingAuto = 0, listeningSeconds = 0, missingBooks = 0, missingAudio = 0, books = 0, audio = 0;
  for (const entry of student.progress) {
    if (entry.status !== 'APPROVED') continue;
    if (entry.content.type === 'BOOK') {
      books++;
      if (entry.content.pageCount && entry.content.pageCount > 0) readingAuto += entry.content.pageCount;
      else missingBooks++;
    } else {
      audio++;
      const seconds = durationSeconds(entry.content.duration);
      if (seconds !== null) listeningSeconds += seconds;
      else missingAudio++;
    }
  }
  const readingManual = student.achievements.filter(a => a.type === 'READING').reduce((s, a) => s + a.amount, 0);
  const listeningManual = student.achievements.filter(a => a.type === 'LISTENING').reduce((s, a) => s + a.amount, 0);
  return { readingAuto, listeningAuto: listeningSeconds / 60, readingManual, listeningManual,
    readingTotal: Math.max(0, readingAuto + readingManual),
    listeningTotal: Math.max(0, (listeningSeconds + listeningManual * 60) / 60), missingBooks, missingAudio, books, audio };
}

export function canAdjust(actor: { id: string; role: string }, student: { role: string; supervisorId: string | null }) {
  return student.role === 'USER' && (actor.role === 'ADMIN' || (actor.role === 'SUPERVISOR' && student.supervisorId === actor.id));
}
