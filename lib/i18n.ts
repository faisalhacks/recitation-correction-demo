/**
 * Every user-facing string in the app, and the formatters Arabic needs.
 *
 * There is one locale, so this is a plain table rather than an i18n runtime:
 * no key lookup, no fallback chain, no missing-translation state to design for.
 * The value of keeping it in one file is review — the whole voice of the
 * product is readable top to bottom, and nothing drifts into a component.
 *
 * Two rules that are easy to get wrong, enforced here instead of at each call
 * site:
 *
 *  1. Counted nouns. Arabic agreement is not singular/plural. It is one form
 *     for 1, a dual for 2, a plural for 3-10, and a singular again for 0 and
 *     11+. Porting the English `n === 1 ? "turn" : "turns"` shape gets it wrong
 *     twice over, so counted strings go through `plural()`.
 *  2. Digits. Numbers stay Western here, matching what the real client shows
 *     and what shipped Arabic phone apps do; Arabic-Indic digits belong in the
 *     mushaf beside the ayah marker and nowhere else. Never send these through
 *     `toLocaleString("ar")` — `ar` resolves to the `arab` numbering system and
 *     would convert them silently.
 */

export type PluralForms = {
  /** Exactly one. The numeral is normally left out: "اية واحدة". */
  one: string;
  /** Exactly two — Arabic has a real dual. The numeral is left out here too. */
  two: string;
  /** 3-10: numeral plus the plural. */
  few: string;
  /** 0, and 11 and up: numeral plus the singular. */
  many: string;
};

export function plural(n: number, forms: PluralForms): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

const AYAHS: PluralForms = {
  one: "آية واحدة",
  two: "آيتان",
  few: "آيات",
  many: "آية",
};
const MARKS: PluralForms = {
  one: "ملاحظة واحدة",
  two: "ملاحظتان",
  few: "ملاحظات",
  many: "ملاحظة",
};
const MISTAKES: PluralForms = {
  one: "خطأ واحد",
  two: "خطآن",
  few: "أخطاء",
  many: "خطأ",
};
const EVENTS: PluralForms = {
  one: "حدث واحد",
  two: "حدثان",
  few: "أحداث",
  many: "حدثًا",
};
const TURNS: PluralForms = {
  one: "دورة واحدة",
  two: "دورتان",
  few: "دورات",
  many: "دورة",
};

/* -------------------------------------------------------------------------- */
/* numbers and time                                                            */
/* -------------------------------------------------------------------------- */

const pad = (n: number): string => String(n).padStart(2, "0");

/** The call timer: H:MM:SS past an hour, M:SS below it, as the client shows. */
export function fmtCallTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Floor time on the participants list.
 *
 * The client writes this "54m0s". Latin unit letters inside an otherwise Arabic
 * row read as a missing translation, so the units are Arabic — د for دقيقة, ث
 * for ثانية — while the digits stay Western like every other number in the
 * chrome.
 */
export function fmtSpeaking(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec} ث`;
  return `${m} د ${sec} ث`;
}

/* -------------------------------------------------------------------------- */
/* the strings                                                                 */
/* -------------------------------------------------------------------------- */

export const t = {
  common: {
    close: "إغلاق",
    /** The scrim is a real control: tapping it dismisses the sheet. It needs
     *  its own name, not the sheet's title. */
    dismiss: "إغلاق اللوحة",
  },

  /** The meeting chrome: cloned from the client, translated into Arabic. */
  meeting: {
    subject: "حلقة تلاوة — الأستاذ (تجريبي)",

    prejoinTitle: "الانضمام إلى الاجتماع",
    prejoinJoin: "الانضمام إلى الاجتماع",
    prejoinLowBandwidth: "الانضمام بوضع توفير البيانات",
    prejoinNamePlaceholder: "اكتب اسمك",
    prejoinNeedName: "اكتب اسمك للمتابعة",
    prejoinAudioOptions: "خيارات الصوت",

    micMuted: "الميكروفون مكتوم، اضغط لإلغاء الكتم",
    micOpen: "الميكروفون مفعَّل، اضغط للكتم",
    mute: "كتم الصوت",
    unmute: "إلغاء الكتم",

    minimize: "تصغير الاجتماع",
    restore: "إظهار الاجتماع",
    flipCamera: "تبديل الكاميرا",
    audioOutput: "مكبر الصوت",
    participants: "المشاركون",
    chat: "الدردشة",
    tileView: "عرض الشبكة",
    speakerView: "عرض المتحدث",
    more: "المزيد",
    leave: "مغادرة",

    moreCarMode: "وضع القيادة",
    moreLowBandwidth: "تفعيل وضع توفير البيانات",
    moreStats: "إحصاءات المشاركين",
    moreBreakout: "الغرف الجانبية",
    moreRaiseHand: "رفع اليد",
    moreShareScreen: "مشاركة الشاشة",

    chatTitle: "الدردشة والترجمة النصية",
    chatPlaceholder: "Aa",
    chatSend: "إرسال",
    chatEmpty: "لا توجد رسائل بعد",
    chatEmptyHint: "اكتب رسالة ليراها الجميع في الحلقة.",

    statsTitle: "إحصاءات المشاركين",
    statsSearch: "بحث",
    statsMe: "(أنا)",
    statsLeft: "غادر",
    statsNoResults: "لا أحد بهذا الاسم",
    statsExplain: "الوقت المحتسب هو مدة التلاوة في الحلقة.",

    leaveTitle: "مغادرة الاجتماع؟",
    leaveBody: "يمكنك العودة إلى الحلقة في أي وقت.",
    leaveConfirm: "مغادرة",
    leaveCancel: "إلغاء",
    callEnded: "تم إنهاء المكالمة",
    rejoin: "الانضمام من جديد",

    closeChat: "إغلاق الدردشة",
    closeStats: "إغلاق الإحصاءات",
    closePrejoin: "إغلاق شاشة الانضمام",
    dismissSheet: "إغلاق القائمة",
    /** For cloned controls that are real in the client but have nothing to
     *  act on here. Nothing in this UI is allowed to look live and do nothing. */
    notInDemo: "غير متاح في هذا العرض التجريبي",

    moderator: "مشرف",
    you: "أنت",

    /** Said plainly rather than hidden: nothing here carries real audio. */
    noMediaNote: "لا يوجد صوت أو فيديو في هذا العرض التجريبي.",
  },

  landing: {
    title: "عرض تجريبي لتصحيح التلاوة",
    subtitle:
      "عرض تجريبي حيّ لتسجيل الأخطاء كلمةً كلمةً أثناء حلقة تلاوة. لا شيء هنا يكتشف الأخطاء تلقائيًا، وهذا العرض غير تابع لأي جهة.",
    joinAsStudent: "الدخول كطالب",
    joinAsTeacher: "الدخول كأستاذ",
    twoTabsNote:
      "صُمم هذا العرض ليُفتح في علامتي تبويب: افتح أحد الدورين هنا، ثم الآخر في علامة تبويب ثانية. يبقى الدوران متزامنَين.",
    openStudentNewTab: "فتح شاشة الطالب في علامة تبويب جديدة",
    openTeacherNewTab: "فتح شاشة الأستاذ في علامة تبويب جديدة",
  },

  range: {
    cancelAria: "إلغاء",
    title: "قبل أن تنضم",
    sectionWhat: "ما الذي ستتم تلاوته؟",
    surahLabel: "السورة",
    fromAyahLabel: "من آية",
    toAyahLabel: "إلى آية",
    typeLabel: "النوع",
    typeAria: "نوع التلاوة",
    teacherSeesNote:
      "يرى الأستاذ هذا النطاق فور انضمامك، ويسجّل ملاحظاته على هذه الآيات بالتحديد.",
    submitJoin: "الانضمام إلى الحلقة",
    submitSaveRange: "حفظ النطاق",
    noCachedSurahs: "لا توجد سور متاحة.",
    partialCache: (from: number, to: number, total: number, surah: string) =>
      `الآيات ${from}–${to} فقط من أصل ${total} متاحة لسورة ${surah} في هذا العرض.`,
    startsAt: (surah: number, from: number, count: number) =>
      `تبدأ من ${surah}:${from} · ${plural(count, AYAHS)} مختارة`,
  },

  queue: {
    progressButton: "التقدّم",
    recitingNowTitle: "التلاوة الآن",
    willSeeNotesLater: "ستظهر لك ملاحظات الأستاذ عند انتهاء دورك.",
    waitingTitle: "بانتظار دورك",
    waitingSoonAdded: "ستُضاف إلى قائمة الانتظار قريبًا.",
    positionInLine: (n: number) => `ترتيبك في الطابور: ${n}`,
    teacherOnBreak: "الأستاذ في استراحة",
    breakWillResume: "ستُستأنف الحلقة قريبًا.",
    changeRange: "تغيير النطاق",
    statusWaiting: "بالانتظار",
    statusReciting: "قيد التلاوة",
    statusDone: "اكتمل",
    startTurn: "بدء الدور",
    startAnotherTurn: "بدء دور آخر",
    openCorrectionView: "فتح شاشة التصحيح",
    finishOtherFirst: (name: string) => `يجب إنهاء دور ${name} أولًا`,
    currentStudentFallback: "الطالب الحالي",
    nobodyReciting: "لا أحد يتلو الآن",
    openParticipantsHint: "افتح قائمة المشاركين لبدء دور أحد الطلاب.",
    breakOffTitle: "لا توجد استراحة حاليًا",
    breakOffHint: "يمكن استدعاء الطلاب كالمعتاد.",
    breakOnHint: "يرى الطلاب المنتظرون هذا أيضًا.",
    endBreak: "إنهاء الاستراحة",
    takeBreak: "أخذ استراحة",
    auditLogButton: "سجلّ الأحداث",
    noStudentsInQueue: "لا يوجد طلاب في قائمة الانتظار",
    studentsWillAppear: "سيظهر الطلاب هنا عند انضمامهم إلى الحلقة.",
  },

  summary: {
    turnOf: (name: string) => `دور ${name}`,
    totals: "الإجمالي",
    statAyahs: "الآيات",
    statWords: "الكلمات",
    statMarks: "الملاحظات",
    passage: "المقطع",
    markedWords: "الكلمات المسجَّلة",
    cleanTurnTitle: "دور نظيف",
    cleanTurnBody: "لم تُسجَّل أي أخطاء هذه المرة. لا شيء للمراجعة.",
    outsideCurrentRange: "خارج النطاق الحالي",
    noNoteAdded: "لم تُضَف ملاحظة",
    viewProgress: "عرض التقدّم",
    backToMeeting: "العودة إلى الاجتماع",
  },

  progress: {
    backAria: "رجوع",
    title: "التقدّم",
    yourTurns: "دوراتك",
    noTurnsYetTitle: "لم تتلُ أي دور بعد",
    noTurnsYetBody: "خُذ دورك في قائمة الانتظار وستظهر أرقامك هنا.",
    wholeHalaqah: "الحلقة بأكملها",
    mostCommonMistake: "الخطأ الأكثر تكرارًا",
    noMistakesRecordedYet: "لم تُسجَّل أي أخطاء بعد.",
    mistakesPerTurn: "الأخطاء في كل دور",
    noTurnsCompletedYet: "لم يكتمل أي دور في هذه الحلقة بعد.",
    sampleChip: "عيّنة",
    breakdownByType: "التوزيع حسب نوع الخطأ",
    noMistakesMarkedYet: "لم تُسجَّل أي أخطاء في هذه الدورات بعد.",
    statTurnsCompleted: "الدورات المكتملة",
    statAyahsRecited: "الآيات المتلوّة",
    statWordsRecited: "الكلمات المتلوّة",
    statTotalMistakes: "إجمالي الأخطاء",
    statAvgMistakesPerTurn: "متوسط الأخطاء لكل دور",
    statAccuracy: "نسبة الإتقان",
    marksCount: (n: number) => plural(n, MARKS),
    mistakesCount: (n: number) => plural(n, MISTAKES),
    sampleNote: (n: number) => `يشمل ${plural(n, TURNS)} تجريبية`,
    turnLabel: (i: number) => `الدور ${i}`,
  },

  correction: {
    closeAria: "إغلاق شاشة التصحيح",
    title: "التصحيح",
    elapsedAria: (duration: string) => `الوقت المنقضي للدور: ${duration}`,
    recitingNow: "التلاوة الآن",
    markedCount: (n: number) => `${plural(n, MARKS)} مسجَّلة`,
    outsideRangeNote: (n: number) => `${plural(n, MARKS)} خارج النطاق الحالي.`,
    tapWordHint: "اضغط على كلمة لتسجيل خطأ",
    changeRange: "تغيير النطاق",
    finishTurn: "إنهاء الدور",
    markMistakeSheetTitle: "تسجيل خطأ",
    mistakeTypeAria: "نوع الخطأ",
    noteSrLabel: "ملاحظة (اختياري)",
    notePlaceholder: "أضف ملاحظة (اختياري)",
    saveMark: "حفظ الملاحظة",
    remove: "إزالة",
    surahFallback: (n: number) => `سورة ${n}`,
  },

  audit: {
    backAria: "رجوع",
    title: "سجلّ الأحداث",
    eventsCount: (n: number) => plural(n, EVENTS),
    description:
      "هذا هو السجلّ الخام لهذه الجلسة، يُضاف إليه ولا يُحذف منه شيء أبدًا. إزالة ملاحظة تضيف حدث «إزالة» جديدًا بدل محو الأصل، والحالة التي تراها في بقية الشاشات هي إعادة تشغيل لهذا السجلّ بالترتيب.",
    noEventsTitle: "لا توجد أحداث بعد",
    noEventsBody: "ستظهر هنا إجراءات الأستاذ فور حدوثها.",
    exportLabeledData: "تصدير البيانات المُصنَّفة",
    removedChip: "أُزيلت",
    addedChip: "أُضيفت",
    changedBy: (who: string) => `غيّره ${who}`,
    theStudent: "الطالب",
    breakOnChip: "بدء الاستراحة",
    breakOffChip: "إنهاء الاستراحة",
  },

  demo: {
    disclaimer: "عرض تجريبي مفاهيمي — غير تابع لأي جهة.",
    quranSourcePrefix: "نص القرآن من",
    startOver: "البدء من جديد",
    resetDemoData: "إعادة تعيين بيانات العرض",
  },
} as const;
