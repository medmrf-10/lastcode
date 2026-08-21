/**
 * ============================================================================
 * 🧠 FSRS-6 (Free Spaced Repetition Scheduler - Version 6)
 * ============================================================================
 * 
 * محرك التكرار المتباعد الرياضي النقي (Pure TypeScript / Zero Dependencies).
 * كود مستقل بنسبة 100%، يمكنك استخدامه، تعديله، أو مشاركته مع أي شخص بحرية.
 * 
 * @license MIT
 */

export type Rating = 1 | 2 | 3 | 4; // 1: Again (إعادة), 2: Hard (صعب), 3: Good (جيد), 4: Easy (سهل)
export type State = "new" | "learning" | "review" | "relearning";

export interface CardMemoryState {
  stability: number;   // S: الاستقرار بالأيام
  difficulty: number;  // D: الصعوبة (من 1 إلى 10)
  state: State;        // الحالة الحالية للبطاقة
  reps: number;        // إجمالي المراجعات الناجحة
  lapses: number;      // إجمالي مرات النسيان (Again)
  lastReview?: Date;   // تاريخ آخر مراجعة
}

export interface ReviewPreview {
  rating: Rating;
  ratingLabel: string;
  nextState: State;
  nextStability: number;
  nextDifficulty: number;
  nextIntervalDays: number;
  nextDue: Date;
  intervalArabic: string;
}

export interface FSRSOptions {
  requestRetention?: number; // نسبة الاسترجاع المستهدفة (الافتراضي: 90% أي 0.90)
  maximumInterval?: number;  // الحد الأقصى للمراجعة بالأيام (الافتراضي: 36500 = 100 سنة)
  weights?: number[];        // معاملات FSRS الـ 19
}

// ----------------------------------------------------------------------------
// 1. المعاملات الافتراضية الرسمية لخوارزمية FSRS-6 (19 Weights)
// ----------------------------------------------------------------------------
export const DEFAULT_WEIGHTS: number[] = [
  0.40255, // w0: الاستقرار الأولي لـ Again
  1.18385, // w1: الاستقرار الأولي لـ Hard
  3.173,   // w2: الاستقرار الأولي لـ Good
  15.69105,// w3: الاستقرار الأولي لـ Easy
  7.1949,  // w4: الصعوبة الأساسية
  0.5345,  // w5: معامل حساسية الصعوبة
  1.4604,  // w6: معدل تغير الصعوبة
  0.0046,  // w7: معامل التقارب نحو المتوسط
  1.54575, // w8: معامل استقرار التذكر الأساسي
  0.1192,  // w9: أس الاستقرار
  1.01925, // w10: معامل تأثير الاسترجاعية
  1.9395,  // w11: معامل استقرار النسيان الأساسي
  0.11,    // w12: أس الصعوبة عند النسيان
  0.29605, // w13: أس الاستقرار عند النسيان
  0.22695, // w14: تأثير الاسترجاعية عند النسيان
  0.2315,  // w15: غرامة Hard (Hard Penalty)
  2.9898,  // w16: مكافأة Easy (Easy Bonus)
  0.51655, // w17: معامل ذاكرة المدى القصير
  0.6621   // w18: حساسية التكرار
];

// عامل اضمحلال الذاكرة (Power Law Decay Factor)
const DECAY_FACTOR = 19.0 / 81.0; // ≈ 0.2345679

// ----------------------------------------------------------------------------
// 2. الدوال الرياضية النقية (Pure Mathematical Functions)
// ----------------------------------------------------------------------------

/** حساب الاستقرار الأولي بناءً على التقييم (Initial Stability) */
export function initStability(rating: Rating, w = DEFAULT_WEIGHTS): number {
  return Math.max(0.1, w[rating - 1]);
}

/** حساب الصعوبة الأولية (Initial Difficulty من 1 إلى 10) */
export function initDifficulty(rating: Rating, w = DEFAULT_WEIGHTS): number {
  const d = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return Math.min(10, Math.max(1, d));
}

/** حساب الصعوبة التالية بعد المراجعة */
export function nextDifficulty(d: number, rating: Rating, w = DEFAULT_WEIGHTS): number {
  const deltaD = -w[6] * (rating - 3);
  const nextD = w[7] * initDifficulty(3, w) + (1 - w[7]) * (d + deltaD);
  return Math.min(10, Math.max(1, nextD));
}

/** حساب احتمالية التذكر اللحظية الحالية (Retrievability R) */
export function currentRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  return Math.pow(1 + (DECAY_FACTOR * elapsedDays) / stability, -0.5);
}

/** حساب الاستقرار عند التذكر الناجح (Recall Stability: Hard, Good, Easy) */
export function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w = DEFAULT_WEIGHTS
): number {
  const hardPenalty = rating === 2 ? w[15] : 1.0;
  const easyBonus = rating === 4 ? w[16] : 1.0;

  const newS = s * (1 +
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus
  );

  return Math.max(0.1, newS);
}

/** حساب الاستقرار عند النسيان (Forget / Lapse Stability: Again) */
export function nextForgetStability(
  d: number,
  s: number,
  r: number,
  w = DEFAULT_WEIGHTS
): number {
  const newS = w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));

  return Math.max(0.1, Math.min(s, newS));
}

/** حساب الفاصل الزمني بالأيام للوصول إلى نسبة الاسترجاع المستهدفة */
export function nextInterval(
  stability: number,
  requestRetention = 0.90,
  maxInterval = 36500
): number {
  const interval = (stability / DECAY_FACTOR) * (Math.pow(requestRetention, -2) - 1);
  return Math.min(maxInterval, Math.max(1, Math.round(interval)));
}

/** تنسيق الفاصل الزمني بالعربية */
export function formatIntervalArabic(days: number): string {
  if (days < 1) return "5 دقائق";
  if (days === 1) return "يوم واحد";
  if (days === 2) return "يومان";
  if (days >= 3 && days <= 10) return `${days} أيام`;
  if (days < 30) return `${days} يوماً`;
  const months = Math.round(days / 30);
  if (months === 1) return "شهر واحد";
  if (months === 2) return "شهران";
  if (months < 12) return `${months} أشهر`;
  const years = Math.round(days / 365);
  return years === 1 ? "سنة واحدة" : `${years} سنوات`;
}

// ----------------------------------------------------------------------------
// 3. المحرك الموحد لجدولة ومراجعة البطاقات (FSRS-6 Engine)
// ----------------------------------------------------------------------------
export class FSRSEngine {
  private requestRetention: number;
  private maximumInterval: number;
  private weights: number[];

  constructor(options: FSRSOptions = {}) {
    this.requestRetention = options.requestRetention ?? 0.90;
    this.maximumInterval = options.maximumInterval ?? 36500;
    this.weights = options.weights ?? DEFAULT_WEIGHTS;
  }

  /** حساب الحالة التالية للبطاقة بعد المراجعة */
  public review(
    current: CardMemoryState,
    rating: Rating,
    now = new Date()
  ): {
    nextState: CardMemoryState;
    nextDue: Date;
    intervalDays: number;
    intervalArabic: string;
  } {
    let nextS: number;
    let nextD: number;
    let nextSt: State;
    let lapses = current.lapses;
    let reps = current.reps;

    // حساب الأيام المنقضية منذ آخر مراجعة
    const lastReviewDate = current.lastReview ? new Date(current.lastReview) : now;
    const elapsedDays = Math.max(0, (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    const r = current.state === "new" ? 1.0 : currentRetrievability(elapsedDays, current.stability);

    if (current.state === "new") {
      nextS = initStability(rating, this.weights);
      nextD = initDifficulty(rating, this.weights);
      nextSt = rating === 1 ? "learning" : "review";
      if (rating === 1) lapses++;
      else reps++;
    } else {
      nextD = nextDifficulty(current.difficulty, rating, this.weights);

      if (rating === 1) {
        nextS = nextForgetStability(nextD, current.stability, r, this.weights);
        nextSt = "relearning";
        lapses++;
      } else {
        nextS = nextRecallStability(nextD, current.stability, r, rating, this.weights);
        nextSt = "review";
        reps++;
      }
    }

    // حساب الموعد القادم
    let intervalDays = 0;
    let nextDue: Date;

    if (rating === 1) {
      // إذا نسيت البطاقة: مراجعة سريعة بعد 5 دقائق
      intervalDays = 0;
      nextDue = new Date(now.getTime() + 5 * 60 * 1000);
    } else {
      intervalDays = nextInterval(nextS, this.requestRetention, this.maximumInterval);
      nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }

    return {
      nextState: {
        stability: Number(nextS.toFixed(4)),
        difficulty: Number(nextD.toFixed(4)),
        state: nextSt,
        reps,
        lapses,
        lastReview: now,
      },
      nextDue,
      intervalDays,
      intervalArabic: formatIntervalArabic(intervalDays),
    };
  }

  /** معاينة المواعيد القادمة للخيارات الأربعة (Again, Hard, Good, Easy) */
  public preview(current: CardMemoryState, now = new Date()): Record<Rating, ReviewPreview> {
    const ratings: Rating[] = [1, 2, 3, 4];
    const labels: Record<Rating, string> = {
      1: "إعادة (Again)",
      2: "صعب (Hard)",
      3: "جيد (Good)",
      4: "سهل (Easy)",
    };

    const result = {} as Record<Rating, ReviewPreview>;

    for (const r of ratings) {
      const outcome = this.review(current, r, now);
      result[r] = {
        rating: r,
        ratingLabel: labels[r],
        nextState: outcome.nextState.state,
        nextStability: outcome.nextState.stability,
        nextDifficulty: outcome.nextState.difficulty,
        nextIntervalDays: outcome.intervalDays,
        nextDue: outcome.nextDue,
        intervalArabic: outcome.intervalArabic,
      };
    }

    return result;
  }
}

// ----------------------------------------------------------------------------
// 4. مثال تشغيلي سريع (Runnable Demo)
// ----------------------------------------------------------------------------
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.endsWith("fsrs.ts")) {
  console.log("⚡ FSRS-6 Standalone Engine Demo:\n");
  const fsrs = new FSRSEngine({ requestRetention: 0.90 });

  // بطاقة جديدة
  const newCard: CardMemoryState = {
    stability: 0,
    difficulty: 0,
    state: "new",
    reps: 0,
    lapses: 0,
  };

  console.log("1. معاينة مواعيد بطاقة جديدة:");
  console.table(fsrs.preview(newCard));

  // تقييم البطاقة بـ Good (درجة 3)
  const afterFirstReview = fsrs.review(newCard, 3);
  console.log("\n2. بعد تقييم 'جيد':");
  console.log(afterFirstReview);

  // معاينة المراجعة التالية بعد 3 أيام
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  console.log("\n3. معاينة المراجعة بعد 3 أيام:");
  console.table(fsrs.preview(afterFirstReview.nextState, threeDaysLater));
}
