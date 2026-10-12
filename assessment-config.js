
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
  },
  {
    id: "anx_10",
    domain: "anxiety",
    responseScale: "frequency_0_3",
    text: "شعرت بالتوتر أو العصبية"
  },
  {
    id: "anx_11",
    domain: "anxiety",
    responseScale: "frequency_0_3",
    text: "لم أستطع السيطرة على القلق"
  },
  {
    id: "anx_12",
    domain: "anxiety",
    responseScale: "frequency_0_3",
    text: "شعرت بقلق مفرط"
  },
  {
    id: "anx_13",
    domain: "anxiety",
    responseScale: "frequency_0_3",
    text: "عانيت من صعوبة الاسترخاء"
  },
  {
    id: "anx_14",
    domain: "anxiety",
    responseScale: "frequency_0_3",
    text: "شعرت بالتململ"
  },
  {
    id: "anx_15",
    domain: "anxiety",
    responseScale: "frequency_0_3",
    text: "أصبحت سريع الانفعال"
  },
  
{
  id: "anx_16",
  domain: "anxiety",
  responseScale: "frequency_0_3",
  text: "شعرت بخوف ليس له سبب أو إحساس باقتراب حدوث كارثة"
},
{
  id: "burnout_01",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر بالاستنزاف النفسي بسبب العمل"
},
{
  id: "burnout_02",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر أن طاقتي مستنزفة"
},
{
  id: "burnout_03",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر بالإجهاد عند التفكير في العمل"
},
{
  id: "burnout_04",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر أن ضغوط العمل تفوق قدرتي"
},
{
  id: "burnout_05",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أصبحت أقل حماسًا للعمل"
},
{
  id: "burnout_06",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر أنني أعمل بشكل آلي"
},
{
  id: "burnout_07",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أصبحت أقل صبرًا مع الزملاء"
},
{
  id: "burnout_08",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر بانخفاض كفاءتي المهنية"
},
{
  id: "burnout_09",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر أن أدائي أقل من المعتاد"
},
{
  id: "burnout_10",
  domain: "burnout",
  responseScale: "frequency_0_4",
  text: "أشعر أنني أقل قدرة على الإنجاز"
},
  
{
  id: "sleep_11",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "أعاني من صعوبة في النوم"
},
{
  id: "sleep_12",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "أستيقظ مرهقًا"
},
{
  id: "sleep_13",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "الورديات تؤثر على جودة نومي"
},
{
  id: "sleep_14",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "أشعر بالنعاس أثناء العمل"
},
{
  id: "sleep_15",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "أعاني من اضطراب مواعيد النوم"
},
{
  id: "sleep_16",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "أشعر بإجهاد مستمر حتى بعد الراحة"
},
{
  id: "sleep_17",
  domain: "sleep_fatigue",
  responseScale: "frequency_0_4",
  text: "قلة النوم أثرت على تركيزي"
},

{
  id: "stress_18",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "البعد عن الأسرة يؤثر على نفسيتي"
},
{
  id: "stress_19",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "أشعر بالعزلة داخل الموقع"
},
{
  id: "stress_20",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "ضغط ساعات العمل يسبب لي ضغطًا نفسيًا"
},
{
  id: "stress_21",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "الظروف المناخية تؤثر على حالتي النفسية"
},
{
  id: "stress_22",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "أخشى التعرض للحوادث أثناء العمل"
},
{
  id: "stress_23",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "أشعر بأن متطلبات العمل مرتفعة جدًا"
},
{
  id: "stress_24",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "العمل الليلي يؤثر على صحتي النفسية"
},
{
  id: "stress_25",
  domain: "psychosocial_stress",
  responseScale: "frequency_0_4",
  text: "أشعر بضعف الدعم الإداري أثناء الضغوط"
},

{
  id: "function_26",
  domain: "functional_impact",
  responseScale: "frequency_0_4",
  text: "حالتي النفسية أثرت على أدائي الوظيفي"
},
{
  id: "function_27",
  domain: "functional_impact",
  responseScale: "frequency_0_4",
  text: "زادت أخطائي أثناء العمل"
},
{
  id: "function_28",
  domain: "functional_impact",
  responseScale: "frequency_0_4",
  text: "أصبحت أقل قدرة على التركيز"
},
{
  id: "function_29",
  domain: "functional_impact",
  responseScale: "frequency_0_4",
  text: "أصبحت أقل قدرة على اتخاذ القرار"
},
{
  id: "function_30",
  domain: "functional_impact",
  responseScale: "frequency_0_4",
  text: "أثرت الضغوط على علاقتي بالزملاء"
},
  
{
  id: "safety_01",
  domain: "psychological_safety",
  responseScale: "frequency_0_4",
  text: "أستطيع التعبير عن المشكلات دون خوف"
},
{
  id: "safety_02",
  domain: "psychological_safety",
  responseScale: "frequency_0_4",
  text: "لا أخشى طلب المساعدة"
},
{
  id: "safety_03",
  domain: "psychological_safety",
  responseScale: "frequency_0_4",
  text: "يتم التعامل باحترام داخل الفريق"
},
{
  id: "safety_04",
  domain: "psychological_safety",
  responseScale: "frequency_0_4",
  text: "أشعر بالأمان عند مناقشة الأخطاء"
},
{
  id: "safety_05",
  domain: "psychological_safety",
  responseScale: "frequency_0_4",
  text: "لا أخشى العقاب غير العادل"
},

{
  id: "positive_06",
  domain: "positive_mental_health",
  responseScale: "frequency_0_4",
  text: "أستطيع التكيف مع الضغوط"
},
{
  id: "positive_07",
  domain: "positive_mental_health",
  responseScale: "frequency_0_4",
  text: "لدي دعم اجتماعي جيد"
},
{
  id: "positive_08",
  domain: "positive_mental_health",
  responseScale: "frequency_0_4",
  text: "أشعر أن عملي له معنى وقيمة"
},
{
  id: "positive_09",
  domain: "positive_mental_health",
  responseScale: "frequency_0_4",
  text: "أستطيع طلب المساعدة عند الحاجة"
},
{
  id: "positive_10",
  domain: "positive_mental_health",
  responseScale: "frequency_0_4",
  text: "أتعافى بسرعة بعد الضغوط"
}  
],


  scoring: {
    enabled: false,
    status: "pending_validation",
    note:
      "لم يتم تفعيل الحساب أو التصنيف قبل استكمال مراجعة المقياس ومعادلاته."
  }
};
