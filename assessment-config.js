/* FieldMind — استبيان داخلي أولي للمساندة والمتابعة
 * نسخة تجريبية من تصميم صاحب المشروع.
 * ليست أداة تشخيص، وليست مقياسًا معتمدًا أو مرخصًا.
 * لا تستخدم النتائج وحدها لاتخاذ قرارات وظيفية أو طبية.
 */
window.FIELD_MIND_ASSESSMENT = {
  version: "FIELDMIND-INTERNAL-1.1-DRAFT",
  title: "استبيان FieldMind الداخلي للصحة النفسية والرفاه الوظيفي",
  instructions: "فكّر في تجربتك خلال الأسبوعين الماضيين، إلا إذا نص السؤال على فترة أخرى. لا توجد إجابات صحيحة أو خاطئة. أجب بما يعكس تجربتك، ويمكنك طلب المساعدة حتى إن لم تظهر إجاباتك مؤشرات مرتفعة. هذا الاستبيان ليس تشخيصًا نفسيًا.",
  domains: [
    { id: "depression", title: "مؤشرات المزاج المنخفض وفقدان المتعة", kind: "frequency" },
    { id: "anxiety", title: "مؤشرات القلق والانشغال الزائد", kind: "frequency" },
    { id: "panic", title: "مؤشرات نوبات الخوف المفاجئ", kind: "frequency" },
    { id: "ocd", title: "مؤشرات الأفكار الاقتحامية والسلوكيات المتكررة", kind: "frequency" },
    { id: "adjustment", title: "المرونة في التعامل مع الضغوط", kind: "frequency" },
    { id: "bipolar_indicators", title: "مؤشرات تستدعي استيضاحًا متخصصًا بشأن تغيرات المزاج والطاقة", kind: "flag" },
    { id: "sleep", title: "النوم والنعاس والإجهاد", kind: "frequency" },
    { id: "psychosis_indicators", title: "مؤشرات تستدعي استيضاحًا متخصصًا بشأن الخبرات الإدراكية أو المعتقدات", kind: "flag" },
    { id: "burnout", title: "الإنهاك المرتبط بالعمل", kind: "frequency" },
    { id: "workplace_satisfaction", title: "الرضا عن بيئة العمل", kind: "agreement" },
    { id: "job_satisfaction", title: "مؤشر الرضا الوظيفي", kind: "agreement" },
    { id: "functional_impact", title: "التأثير على الحياة اليومية والعمل", kind: "frequency" },
    { id: "critical_indicators", title: "أسئلة السلامة التي تتطلب انتباهًا منفصلًا", kind: "safety" }
  ],
  responseScales: {
    frequency_0_4: [
      { label: "أبدًا", value: 0 },
      { label: "نادرًا", value: 1 },
      { label: "أحيانًا", value: 2 },
      { label: "غالبًا", value: 3 },
      { label: "دائمًا أو تقريبًا دائمًا", value: 4 }
    ],
    agreement_0_4: [
      { label: "لا أوافق إطلاقًا", value: 0 },
      { label: "لا أوافق", value: 1 },
      { label: "محايد / إلى حد ما", value: 2 },
      { label: "أوافق", value: 3 },
      { label: "أوافق بشدة", value: 4 }
    ],
    yes_no: [
      { label: "لا", value: 0 },
      { label: "نعم", value: 1 }
    ],
    yes_no_optional: [
      { label: "لا", value: 0 },
      { label: "نعم", value: 1 },
      { label: "أفضل عدم الإجابة", value: 2 }
    ]
  },
  items: [
    { id: "dep_01", domain: "depression", responseScale: "frequency_0_4", text: "قلّ اهتمامي أو استمتاعي بالأشياء التي أستمتع بها عادةً." },
    { id: "dep_02", domain: "depression", responseScale: "frequency_0_4", text: "شعرت بالحزن أو انخفاض المزاج أو فقدان الأمل." },
    { id: "dep_03", domain: "depression", responseScale: "frequency_0_4", text: "شعرت بانخفاض الطاقة أو الإرهاق دون سبب واضح." },
    { id: "dep_04", domain: "depression", responseScale: "frequency_0_4", text: "انتقدت نفسي بشدة أو شعرت أنني بلا قيمة." },
    { id: "dep_05", domain: "depression", responseScale: "frequency_0_4", text: "واجهت صعوبة في التركيز أو اتخاذ القرارات." },

    { id: "anx_01", domain: "anxiety", responseScale: "frequency_0_4", text: "شعرت بالقلق أو التوتر بشأن أمور متعددة." },
    { id: "anx_02", domain: "anxiety", responseScale: "frequency_0_4", text: "وجدت صعوبة في إيقاف القلق أو التحكم فيه." },
    { id: "anx_03", domain: "anxiety", responseScale: "frequency_0_4", text: "شعرت بالتململ أو صعوبة الاسترخاء." },
    { id: "anx_04", domain: "anxiety", responseScale: "frequency_0_4", text: "أصبحت سريع الانفعال بسبب التوتر." },

    { id: "panic_01", domain: "panic", responseScale: "frequency_0_4", text: "مررت بنوبة خوف أو انزعاج شديد بدأت فجأة." },
    { id: "panic_02", domain: "panic", responseScale: "frequency_0_4", text: "خلال نوبة مفاجئة، شعرت بأعراض جسدية قوية مثل خفقان القلب أو ضيق النفس أو الدوار." },
    { id: "panic_03", domain: "panic", responseScale: "frequency_0_4", text: "قلقت من تكرار نوبة مفاجئة أو تجنبت مكانًا أو نشاطًا خوفًا من حدوثها." },

    { id: "ocd_01", domain: "ocd", responseScale: "frequency_0_4", text: "تكررت لدي أفكار أو صور ذهنية مزعجة يصعب إبعادها رغم عدم رغبتي فيها." },
    { id: "ocd_02", domain: "ocd", responseScale: "frequency_0_4", text: "شعرت بأنني مضطر إلى تكرار فعل أو فحص أو ترتيب شيء لتخفيف القلق." },
    { id: "ocd_03", domain: "ocd", responseScale: "frequency_0_4", text: "استغرقت الأفكار أو الأفعال المتكررة وقتًا أو عطّلت أنشطتي." },

    { id: "adj_01", domain: "adjustment", responseScale: "frequency_0_4", text: "واجهت صعوبة في التكيف مع ضغط أو تغير مهم في حياتي أو عملي خلال الأشهر الثلاثة الماضية." },
    { id: "adj_02", domain: "adjustment", responseScale: "frequency_0_4", text: "كان رد فعلي النفسي تجاه ضغط حديث أكبر مما أستطيع التعامل معه عادةً." },
    { id: "adj_03", domain: "adjustment", responseScale: "frequency_0_4", text: "أثرت الضغوط أو التغيرات الحديثة على نومي أو علاقاتي أو أدائي اليومي." },

    { id: "bip_01", domain: "bipolar_indicators", responseScale: "yes_no_optional", text: "هل مررت بفترة غير معتادة استمر فيها ارتفاع المزاج أو التهيج مع زيادة واضحة في الطاقة أو النشاط مقارنةً بطبيعتك؟" },
    { id: "bip_02", domain: "bipolar_indicators", responseScale: "yes_no_optional", text: "هل مررت بفترة احتجت فيها إلى نوم أقل بكثير من المعتاد دون أن تشعر بالتعب، مع زيادة ملحوظة في النشاط أو سرعة الأفكار؟" },
    { id: "bip_03", domain: "bipolar_indicators", responseScale: "yes_no_optional", text: "هل لاحظ الآخرون تغيرًا غير معتاد في مزاجك أو نشاطك أدى إلى تصرفات اندفاعية أو مشكلات؟" },

    { id: "sleep_01", domain: "sleep", responseScale: "frequency_0_4", text: "واجهت صعوبة في بدء النوم أو الاستمرار فيه." },
    { id: "sleep_02", domain: "sleep", responseScale: "frequency_0_4", text: "استيقظت دون أن أشعر بالراحة الكافية." },
    { id: "sleep_03", domain: "sleep", responseScale: "frequency_0_4", text: "شعرت بالنعاس أو ضعف اليقظة أثناء العمل أو التنقل." },
    { id: "sleep_04", domain: "sleep", responseScale: "frequency_0_4", text: "أثرت الورديات أو مواعيد العمل على انتظام نومي." },

    { id: "psych_01", domain: "psychosis_indicators", responseScale: "yes_no_optional", text: "هل سمعت صوتًا أو رأيت شيئًا بدا حقيقيًا لك بينما لم يلاحظه من حولك، خارج سياق النوم أو الاستيقاظ مباشرةً؟" },
    { id: "psych_02", domain: "psychosis_indicators", responseScale: "yes_no_optional", text: "هل شعرت مؤخرًا بيقين قوي بأن شخصًا يلاحقك أو يقصد إيذاءك رغم أن من تثق بهم لم يروا دليلًا واضحًا على ذلك؟" },
    { id: "psych_03", domain: "psychosis_indicators", responseScale: "yes_no_optional", text: "هل واجهت صعوبة غير معتادة في التمييز بين ما حدث فعلًا وما قد يكون ناتجًا عن أفكارك أو إدراكك؟" },

    { id: "burn_01", domain: "burnout", responseScale: "frequency_0_4", text: "شعرت باستنزاف نفسي بسبب العمل." },
    { id: "burn_02", domain: "burnout", responseScale: "frequency_0_4", text: "شعرت أن متطلبات العمل تتجاوز طاقتي لفترات متكررة." },
    { id: "burn_03", domain: "burnout", responseScale: "frequency_0_4", text: "انخفض حماسي للعمل أو شعرت أنني أؤدي مهامي بصورة آلية." },
    { id: "burn_04", domain: "burnout", responseScale: "frequency_0_4", text: "احتجت إلى وقت طويل للتعافي من الإجهاد المرتبط بالعمل." },

    { id: "sat_01", domain: "job_satisfaction", responseScale: "agreement_0_4", text: "أشعر عمومًا بالرضا عن عملي." },
    { id: "sat_02", domain: "workplace_satisfaction", responseScale: "agreement_0_4", text: "أشعر أن جهدي يُقدَّر بصورة مناسبة." },
    { id: "sat_03", domain: "workplace_satisfaction", responseScale: "agreement_0_4", text: "أحصل على دعم مناسب من المشرفين عند الحاجة." },
    { id: "sat_04", domain: "workplace_satisfaction", responseScale: "agreement_0_4", text: "ظروف العمل والورديات تتيح لي قدرًا مقبولًا من التوازن مع حياتي الشخصية." },
    { id: "sat_05", domain: "workplace_satisfaction", responseScale: "agreement_0_4", text: "أشعر أن بيئة العمل تتعامل مع العاملين باحترام وعدالة." },

    { id: "func_01", domain: "functional_impact", responseScale: "frequency_0_4", text: "أثرت حالتي النفسية أو الضغوط على قدرتي على أداء أنشطتي اليومية." },
    { id: "func_02", domain: "functional_impact", responseScale: "frequency_0_4", text: "أثرت حالتي النفسية أو قلة النوم على تركيزي أو أدائي في العمل." },
    { id: "func_03", domain: "functional_impact", responseScale: "frequency_0_4", text: "أصبحت أجد صعوبة في التعامل مع الآخرين أو مسؤولياتي المعتادة." },

    { id: "safe_01", domain: "critical_indicators", responseScale: "yes_no_optional", safetyType: "self_harm", text: "خلال الأسبوعين الماضيين، راودتني أفكار بإيذاء نفسي أو أنني لا أريد الاستمرار في الحياة." },
    { id: "safe_02", domain: "critical_indicators", responseScale: "yes_no_optional", safetyType: "immediate_danger", text: "أشعر الآن أنني قد أؤذي نفسي أو شخصًا آخر، أو أنني غير قادر على الحفاظ على سلامتي." }
  ],
  scoring: {
    enabled: true,
    status: "internal_pilot_rules",
    note: "قواعد متابعة داخلية أولية وضعية وليست حدودًا سريرية أو تشخيصية. يجب مراجعتها قبل الاستخدام التشغيلي."
  }
};
