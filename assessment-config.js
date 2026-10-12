
/*
 * FieldMind — COPHAS assessment configuration
 * Configuration structure test only.
 * NOT READY FOR CLINICAL USE.
 * No clinical scoring or classification is enabled.
 */

window.FIELD_MIND_ASSESSMENT = {
  version: "COPHAS-1.0-DRAFT",
  title: "نظام التقييم المتكامل للصحة النفسية المهنية",
  instructions:
    "يرجى قراءة كل عبارة واختيار الإجابة التي تعبّر عن تجربتك.",

  domains: [
    {
      id: "depression",
      title: "أعراض الاكتئاب",
      scoringStatus: "pending_validation"
    },
    {
      id: "anxiety",
      title: "أعراض القلق",
      scoringStatus: "pending_validation"
    },
    {
      id: "burnout",
      title: "الاحتراق النفسي",
      scoringStatus: "pending_validation"
    },
    {
      id: "sleep_fatigue",
      title: "النوم والإجهاد",
      scoringStatus: "pending_validation"
    },
    {
      id: "psychosocial_stress",
      title: "الضغوط النفسية والاجتماعية في العمل",
      scoringStatus: "pending_validation"
    },
    {
      id: "functional_impact",
      title: "التأثير الوظيفي",
      scoringStatus: "pending_validation"
    },
    {
      id: "psychological_safety",
      title: "السلامة النفسية في بيئة العمل",
      scoringStatus: "pending_validation"
    },
    {
      id: "positive_mental_health",
      title: "الصحة النفسية الإيجابية والمرونة",
      scoringStatus: "pending_validation"
    },
    {
      id: "job_satisfaction",
      title: "الرضا الوظيفي",
      scoringStatus: "pending_validation"
    },
    {
      id: "critical_indicators",
      title: "مؤشرات الخطورة النفسية",
      scoringStatus: "pending_review"
    }
  ],

  responseScales: {
    frequency_0_3: [
      { label: "أبدًا", value: 0 },
      { label: "عدة أيام", value: 1 },
      { label: "أكثر من نصف الأيام", value: 2 },
      { label: "تقريبًا يوميًا", value: 3 }
    ],

    frequency_0_4: [
      { label: "أبدًا", value: 0 },
      { label: "نادرًا", value: 1 },
      { label: "أحيانًا", value: 2 },
      { label: "غالبًا", value: 3 },
      { label: "دائمًا", value: 4 }
    ],

    satisfaction_1_5: [
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 }
    ],

    yes_no: [
      { label: "لا", value: 0 },
      { label: "نعم", value: 1 }
    ]
  },


items: [
  {
    id: "dep_01",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "فقدت الاهتمام أو المتعة في الأنشطة اليومية"
  },
  {
    id: "dep_02",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "شعرت بالحزن أو الاكتئاب"
  },
  {
    id: "dep_03",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "عانيت من اضطراب النوم"
  },
  {
    id: "dep_04",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "شعرت بالتعب أو انخفاض الطاقة"
  },
  {
    id: "dep_05",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "تغيرت شهيتي للطعام"
  },
  {
    id: "dep_06",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "شعرت بالفشل أو انعدام القيمة"
  },
  {
    id: "dep_07",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "عانيت من ضعف التركيز"
  },
  {
    id: "dep_08",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "شعرت بالبطء أو التململ"
  },
  {
    id: "dep_09",
    domain: "depression",
    responseScale: "frequency_0_3",
    text: "راودتني أفكار بإيذاء نفسي أو التخلص من حياتي"
  }
],

  scoring: {
    enabled: false,
    status: "pending_validation",
    note:
      "لم يتم تفعيل الحساب أو التصنيف قبل استكمال مراجعة المقياس ومعادلاته."
  }
};
