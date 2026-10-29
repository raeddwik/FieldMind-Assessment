/* FieldMind — Internal follow-up rules, draft only.
 * No diagnosis, clinical severity grading, or fitness-for-work determination.
 */
(function () {
  "use strict";

  function calculate(answers) {
    const config = window.FIELD_MIND_ASSESSMENT;
    if (!config || !Array.isArray(config.items) || !Array.isArray(config.domains)) {
      throw new Error("Assessment configuration is unavailable.");
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      throw new Error("Answers must be an object.");
    }

    const allowed = {};
    for (const item of config.items) {
      const scale = config.responseScales[item.responseScale];
      if (!item.id || !scale || Object.prototype.hasOwnProperty.call(allowed, item.id)) {
        throw new Error("Invalid item configuration: " + item.id);
      }
      allowed[item.id] = new Set(scale.map(option => option.value));
      if (!Object.prototype.hasOwnProperty.call(answers, item.id) ||
          !allowed[item.id].has(answers[item.id])) {
        return { status: "invalid_or_incomplete", errors: ["إجابة ناقصة أو غير صالحة: " + item.id] };
      }
    }

    const domains = {};
    for (const domain of config.domains) {
      if (domain.id === "critical_indicators") continue;
      const items = config.items.filter(item => item.domain === domain.id);
      const positiveItems = items.filter(item => answers[item.id] === 1);
      if (domain.kind === "flag") {
        domains[domain.id] = {
          title: domain.title,
          kind: "flag",
          positiveCount: positiveItems.length,
          positiveItemIds: positiveItems.map(item => item.id),
          status: positiveItems.length ? "needs_specialist_review" : "no_flagged_response",
          interpretation: "إجابات للاستضاح المتخصص فقط؛ لا تثبت أو تنفي تشخيصًا."
        };
        continue;
      }
      const values = items.map(item => answers[item.id]);
      const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
      let descriptiveBand = "تكرار مُبلّغ عنه أقل في هذه الإجابات";
      if (domain.kind === "agreement") {
        descriptiveBand = average < 2
          ? "مستوى موافقة أقل؛ قد يفيد استكشاف ظروف العمل"
          : average >= 3
            ? "مستوى موافقة أعلى على عبارات الرضا"
            : "مستوى موافقة متوسط على عبارات الرضا";
      } else {
        if (average >= 2.5) descriptiveBand = "تكرار مُبلّغ عنه أعلى نسبيًا؛ يستحق مراجعة";
        else if (average >= 1.5) descriptiveBand = "تكرار مُبلّغ عنه متوسط؛ قد تستفيد من المتابعة";
      }
      domains[domain.id] = {
        title: domain.title,
        kind: domain.kind,
        average: Math.round(average * 100) / 100,
        responseRange: "0–4",
        descriptiveBand,
        status: "descriptive_only",
        interpretation: domain.id === "job_satisfaction"
          ? "متوسط الموافقة على عبارات الرضا؛ ليس مقياسًا معتمدًا."
          : "متوسط تكرار الإجابات؛ ليس درجة شدة سريرية ولا تشخيصًا."
      };
    }

    const criticalItems = config.items.filter(item => item.domain === "critical_indicators");
    const positiveSafetyItems = criticalItems.filter(item => answers[item.id] === 1);
    const declinedSafetyItems = criticalItems.filter(item => answers[item.id] === 2);
    const immediateDanger = positiveSafetyItems.some(item => item.safetyType === "immediate_danger");
    const selfHarmThoughts = positiveSafetyItems.some(item => item.safetyType === "self_harm");
    const specialistFlags = ["bipolar_indicators", "psychosis_indicators"]
      .flatMap(id => domains[id]?.positiveItemIds || []);
    const elevatedDomains = Object.entries(domains)
      .filter(([id, result]) => id !== "job_satisfaction" &&
        typeof result.average === "number" && result.average >= 2.5)
      .map(([id]) => id);
    const moderateDomains = Object.entries(domains)
      .filter(([id, result]) => id !== "job_satisfaction" &&
        typeof result.average === "number" && result.average >= 1.5)
      .map(([id]) => id);
    const functionalAverage = domains.functional_impact?.average ?? 0;
    const satisfactionAverage = domains.job_satisfaction?.average ?? null;

    let followUpLevel = "routine";
    let followUpLabel = "متابعة اعتيادية وإتاحة طلب المساعدة";
    let recommendation = "لا تظهر في هذه الإجابات وحدها مؤشرات مرتفعة وفق قواعد النسخة التجريبية. يمكن للعامل طلب الدعم في أي وقت.";
    if (moderateDomains.length || (satisfactionAverage !== null && satisfactionAverage < 2)) {
      followUpLevel = "offer_support";
      followUpLabel = "عرض الدعم والمتابعة";
      recommendation = "يُفضّل عرض تواصل سري وغير عقابي مع مسؤول صحة مهنية مؤهل أو مختص مناسب، ومناقشة الضغوط أو الدعم المطلوب. هذه النتيجة ليست تشخيصًا.";
    }
    if (elevatedDomains.length || functionalAverage >= 2.5 || specialistFlags.length) {
      followUpLevel = "specialist_review";
      followUpLabel = "اقتراح مراجعة مختص";
      recommendation = "يُوصى بالتواصل بسرية مع العامل وعرض تقييم لدى مختص نفسي أو طبي مناسب. الإجابات المتعلقة بتغيرات المزاج والطاقة أو الخبرات الإدراكية تستدعي استيضاحًا متخصصًا ولا تثبت اضطرابًا بعينه.";
    }
    if (declinedSafetyItems.length && !selfHarmThoughts && !immediateDanger) {
      followUpLevel = "offer_support";
      followUpLabel = "إتاحة تواصل سري اختياري";
      recommendation = "اختار العامل عدم الإجابة عن سؤال سلامة واحد أو أكثر. لا يُفسَّر ذلك على أنه وجود خطر أو غيابه. يُفضّل إتاحة فرصة سرية واختيارية للتحدث مع شخص مؤهل، دون ضغط أو عقوبة.";
    }
    if (selfHarmThoughts) {
      followUpLevel = "prompt_human_review";
      followUpLabel = "مراجعة بشرية مباشرة في أقرب وقت";
      recommendation = "تستلزم الإجابة تواصلًا بشريًا مباشرًا وسريًا من شخص مؤهل للتحقق من السلامة الحالية وعرض المساعدة. لا يُستنتج مستوى الخطر من الاستبيان وحده.";
    }
    if (immediateDanger) {
      followUpLevel = "urgent_safety";
      followUpLabel = "مسار سلامة عاجل";
      recommendation = "يجب تفعيل إجراء السلامة المعتمد فورًا، والتواصل مباشرةً مع العامل لتحديد احتياجاته الحالية بواسطة شخص مؤهل، وطلب المساعدة الطبية الطارئة عند وجود خطر وشيك. لا تترك الشخص دون دعم مناسب.";
    }

    const positiveSafetyItemIds = positiveSafetyItems.map(item => item.id);
    return {
      status: "calculation_preview_only",
      scaleVersion: config.version,
      domains,
      followUp: {
        level: followUpLevel,
        label: followUpLabel,
        recommendation,
        elevatedDomains,
        moderateDomains,
        specialistFlagItemIds: specialistFlags,
        selfHarmThoughts,
        immediateDanger,
        ruleSet: "internal-pilot-v1",
        validated: false
      },
      criticalIndicators: {
        status: positiveSafetyItems.length ? "requires_human_review" : "no_positive_response_recorded",
        positiveCount: positiveSafetyItems.length,
        totalItems: criticalItems.length,
        positiveItemIds: positiveSafetyItemIds,
        immediateDanger,
        selfHarmThoughts,
        clinicalInterpretation: null
      },
      experimentalIndices: {
        status: "retired",
        opri: null,
        rawOpri: null,
        opfScore: null,
        riskLevel: null,
        recommendedAction: null,
        validated: false,
        classificationEnabled: false,
        note: "تم إيقاف OPRI وOPF؛ لا يستخدم مؤشر إجمالي لاتخاذ قرار المتابعة."
      },
      overallClinicalScore: null,
      classification: null,
      recommendations: recommendation,
      clinicalValidation: "not_established",
      previewOnly: true
    };
  }

  window.FIELD_MIND_SCORING_ENGINE = Object.freeze({ calculate });
})();
