
/*
 * FieldMind — Preliminary Scoring Engine
 * COPHAS-1.0-DRAFT
 *
 * Technical preview only.
 * Preliminary domain normalization using the configured scale minimum and maximum.
 * NOT a validated clinical scoring system.
 * No diagnosis, clinical classification, or fitness-for-work decision.
 */

(function () {
  "use strict";

  const CRITICAL_DOMAIN = "critical_indicators";

  // Positive-resource domains are additionally expressed as risk-oriented scores.
  // Their original domain score remains unchanged and interpretable as positive endorsement.
  const POSITIVE_RESOURCE_DOMAINS = new Set([
    "psychological_safety",
    "positive_mental_health",
    "job_satisfaction"
  ]);

  function getConfiguration() {
    const config = window.FIELD_MIND_ASSESSMENT;

    if (!config || !Array.isArray(config.items)) {
      throw new Error("Assessment configuration is unavailable.");
    }

    if (!Array.isArray(config.domains)) {
      throw new Error("Assessment domains are unavailable.");
    }

    if (!config.responseScales || typeof config.responseScales !== "object") {
      throw new Error("Response scales are unavailable.");
    }

    // Clinical scoring must remain disabled during this preview.
    if (config.scoring?.enabled !== false) {
      throw new Error(
        "Technical preview requires scoring.enabled to be false."
      );
    }

    return config;
  }

  function getScaleBounds(scale) {
    if (!Array.isArray(scale) || scale.length === 0) {
      throw new Error("Invalid response scale.");
    }

    const values = scale.map(option => option.value);

    if (
      !values.every(
        value => typeof value === "number" && Number.isFinite(value)
      )
    ) {
      throw new Error("Response scale contains invalid values.");
    }

    if (new Set(values).size !== values.length) {
      throw new Error("Response scale contains duplicate values.");
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      allowed: values
    };
  }

  function calculate(answers) {
    const config = getConfiguration();

    if (
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      throw new Error("Answers must be an object.");
    }

    const itemIds = new Set();
    const domainIds = new Set();
    const errors = [];

    for (const domain of config.domains) {
      if (!domain.id || domainIds.has(domain.id)) {
        throw new Error("Missing or duplicate domain ID.");
      }

      domainIds.add(domain.id);
    }

    for (const item of config.items) {
      if (!item.id || itemIds.has(item.id)) {
        throw new Error("Missing or duplicate item ID.");
      }

      itemIds.add(item.id);

      if (!domainIds.has(item.domain)) {
        errors.push(
          "Item references an unknown domain: " + item.id
        );
      }
    }

    if (errors.length > 0) {
      return {
        status: "invalid_or_incomplete",
        errors
      };
    }

    const normalizedAnswers = {};
    const scales = {};

    // Validate every configured item before calculating scores.
    for (const item of config.items) {
      const scale = config.responseScales[item.responseScale];

      if (!scale) {
        errors.push("Missing response scale: " + item.id);
        continue;
      }

      let bounds;

      try {
        bounds = getScaleBounds(scale);
      } catch (error) {
        errors.push(item.id + ": " + error.message);
        continue;
      }

      scales[item.id] = bounds;

      if (!Object.prototype.hasOwnProperty.call(answers, item.id)) {
        errors.push("Missing answer: " + item.id);
        continue;
      }

      const value = answers[item.id];

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        !bounds.allowed.includes(value)
      ) {
        errors.push("Invalid answer: " + item.id);
        continue;
      }

      // Keep raw item responses unchanged. Direction adjustments are applied only
      // as a separate descriptive view for positive-resource domains below.
      normalizedAnswers[item.id] = value;
    }

    if (errors.length > 0) {
      return {
        status: "invalid_or_incomplete",
        errors
      };
    }

    const domainResults = {};

    for (const domain of config.domains) {
      if (domain.id === CRITICAL_DOMAIN) {
        continue;
      }

      const items = config.items.filter(
        item => item.domain === domain.id
      );

      if (items.length === 0) {
        domainResults[domain.id] = {
          title: domain.title,
          scoreDirection: domain.scoreDirection || "not_specified",
          scoreMeaning: domain.scoreMeaning || null,
          status: "no_items",
          interpretation: "not_assigned",
          scoringValidated: false
        };

        continue;
      }

      let total = 0;
      let minimumTotal = 0;
      let maximumTotal = 0;

      for (const item of items) {
        const bounds = scales[item.id];

        total += normalizedAnswers[item.id];
        minimumTotal += bounds.min;
        maximumTotal += bounds.max;
      }

      const range = maximumTotal - minimumTotal;

      if (range <= 0) {
        domainResults[domain.id] = {
          title: domain.title,
          scoreDirection: domain.scoreDirection || "not_specified",
          scoreMeaning: domain.scoreMeaning || null,
          status: "invalid_scale",
          interpretation: "not_assigned",
          scoringValidated: false
        };

        continue;
      }

      // Scale-aware normalization maps the configured minimum to 0 and maximum to 100.
      // With the adopted 0–4 scale, this equals observed total / maximum possible total * 100.
      const score = ((total - minimumTotal) / range) * 100;
      const roundedScore = Math.round(score * 100) / 100;
      const riskOrientedScore = POSITIVE_RESOURCE_DOMAINS.has(domain.id)
        ? Math.round((100 - score) * 100) / 100
        : roundedScore;

      domainResults[domain.id] = {
        title: domain.title,
        score: roundedScore,
        scoreMethod: "min_max_0_100",
        riskOrientedScore,
        riskOrientedScoreMeaning: POSITIVE_RESOURCE_DOMAINS.has(domain.id)
          ? "عكس درجة الموارد الإيجابية لأغراض العرض البحثي فقط؛ ليست درجة سريرية معتمدة."
          : "درجة مطبّعة حسب اتجاه الأعراض أو الصعوبات؛ ليست تصنيفًا سريريًا.",
        scoreDirection: domain.scoreDirection || "not_specified",
        scoreMeaning: domain.scoreMeaning || null,
        answeredItems: items.length,
        status: "preliminary_normalized_score",
        interpretation: "not_assigned",
        scoringValidated: false
      };
    }

    // Critical indicators are counted separately.
    // This count is NOT a clinical risk classification.
    const criticalItems = config.items.filter(
      item => item.domain === CRITICAL_DOMAIN
    );

    const positiveCriticalItems = criticalItems
      .filter(item => normalizedAnswers[item.id] === 1)
      .map(item => item.id);

    // Experimental OPRI calculation follows the draft formula in the author's
    // questionnaire. Red Flags % is provisionally defined as positive yes/no
    // critical items / all configured yes/no critical items * 100.
    // This convention and all weights remain unvalidated; no cutoffs are applied.
    const domainScore = id => domainResults[id]?.score;
    const domainRiskScore = id =>
      POSITIVE_RESOURCE_DOMAINS.has(id)
        ? domainResults[id]?.riskOrientedScore
        : domainResults[id]?.score;

    const requiredIndexDomains = [
      "depression", "anxiety", "burnout", "sleep_fatigue",
      "psychosocial_stress", "functional_impact",
      "positive_mental_health", "psychological_safety"
    ];
    const indexInputsAvailable = requiredIndexDomains.every(
      id => Number.isFinite(domainScore(id))
    ) && criticalItems.length > 0;

    let experimentalOPRI = null;
    let redFlagsPercentage = null;

    if (indexInputsAvailable) {
      redFlagsPercentage =
        Math.round((positiveCriticalItems.length / criticalItems.length) * 10000) / 100;
      experimentalOPRI = Math.round((
        domainScore("depression") * 1.2 +
        domainScore("anxiety") * 1.0 +
        domainScore("burnout") * 1.3 +
        domainScore("sleep_fatigue") * 1.1 +
        domainScore("psychosocial_stress") * 1.0 +
        domainScore("functional_impact") * 1.5 +
        redFlagsPercentage * 2.0 -
        domainRiskScore("positive_mental_health") * 0.8 -
        domainRiskScore("psychological_safety") * 0.8
      ) * 100) / 100;
    }

    return {
      status: "calculation_preview_only",
      scoringMethod: {
        domainNormalization: "((observed total - minimum possible total) / (maximum possible total - minimum possible total)) * 100; with the adopted 0–4 scale this equals observed total / maximum possible total * 100",
        interpretation: "Domain percentages are preliminary descriptive scores only. Positive-resource domains also receive a separate inverse risk-oriented score.",
        validated: false
      },
      scaleVersion: config.version,
      domains: domainResults,
      criticalIndicators: {
        status: "requires_review",
        positiveCount: positiveCriticalItems.length,
        totalItems: criticalItems.length,
        positiveItemIds: positiveCriticalItems,
        provisionalPercentage: redFlagsPercentage,
        percentageMethod: "positive yes/no critical items / total yes/no critical items * 100; provisional convention for pilot analysis only",
        clinicalInterpretation: null
      },
      experimentalIndices: {
        status: indexInputsAvailable ? "experimental_not_validated" : "not_calculated_missing_inputs",
        opri: experimentalOPRI,
        opriFormula: "Depression%*1.2 + Anxiety%*1.0 + Burnout%*1.3 + Sleep/Fatigue%*1.1 + PsychosocialStress%*1.0 + FunctionalImpact%*1.5 + RedFlags%*2.0 - PositiveMentalHealth%*0.8 - PsychologicalSafety%*0.8",
        opriMeaning: "مؤشر بحثي تجريبي وفق أوزان المسودة؛ لا توجد حدود تفسيرية معتمدة ولا يجوز استخدامه لتشخيص أو قرار وظيفي.",
        assumptions: [
          "Red Flags % حُسبت مؤقتًا كنسبة الإجابات الإيجابية من أسئلة نعم/لا الحرجة الثمانية.",
          "لم تُضف درجة الرضا الوظيفي إلى OPRI لأن معادلة المسودة لا تذكرها.",
          "لم يُحسب OPF لأن تعريف GOMHI الذي تعتمد عليه معادلته غير محدد بوضوح في المسودة."
        ],
        validated: false,
        classificationEnabled: false
      },
      overallClinicalScore: null,
      classification: null,
      recommendations: null,
      clinicalValidation: "not_established",
      previewOnly: true
    };
  }

  window.FIELD_MIND_SCORING_ENGINE = Object.freeze({
    calculate
  });
})();
