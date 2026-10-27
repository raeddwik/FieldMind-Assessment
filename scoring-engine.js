
/*
 * FieldMind — Preliminary Scoring Engine
 * COPHAS-1.0-DRAFT
 *
 * Technical preview only.
 * Domain-level min-max normalization with explicit score direction.
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

      normalizedAnswers[item.id] = REVERSE_ITEMS.has(item.id)
        ? bounds.min + bounds.max - value
        : value;
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

      // Min-max normalization maps the lowest selectable response to 0 and the highest to 100.
      // This avoids treating the minimum response value (1) as 25% of the domain maximum.
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

    return {
      status: "calculation_preview_only",
      scoringMethod: {
        domainNormalization: "((observed total - minimum possible total) / (maximum possible total - minimum possible total)) * 100",
        interpretation: "Domain percentages are preliminary descriptive scores only. Positive-resource domains also receive a separate inverse risk-oriented score; no overall composite is calculated.",
        validated: false
      },
      scaleVersion: config.version,
      domains: domainResults,
      criticalIndicators: {
        status: "requires_review",
        positiveCount: positiveCriticalItems.length,
        positiveItemIds: positiveCriticalItems,
        clinicalInterpretation: null
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
