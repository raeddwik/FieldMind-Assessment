
/*
 * FieldMind — Preliminary Scoring Engine
 * COPHAS-1.0-DRAFT
 *
 * Mathematical normalization and validation only.
 * NOT a validated clinical scoring system.
 * No clinical classification or diagnosis.
 */

(function () {
  "use strict";

  const CRITICAL_DOMAIN = "critical_indicators";

  // No reverse-scored items are assumed.
  // Add item IDs here only after verifying the original scoring key.
  const REVERSE_ITEMS = new Set([]);

  function getConfiguration() {
    const config = window.FIELD_MIND_ASSESSMENT;

    if (!config || !Array.isArray(config.items)) {
      throw new Error("Assessment configuration is unavailable.");
    }

    return config;
  }

  function getScaleBounds(scale) {
    if (!Array.isArray(scale) || scale.length === 0) {
      throw new Error("Invalid response scale.");
    }

    const values = scale.map(option => option.value);

    if (!values.every(Number.isFinite)) {
      throw new Error("Response scale contains invalid values.");
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

    for (const item of config.items) {
      if (itemIds.has(item.id)) {
        throw new Error("Duplicate item ID: " + item.id);
      }

      itemIds.add(item.id);
    }

    const errors = [];
    const normalizedAnswers = {};
    const scales = {};

    // Validate every configured item before calculating anything.
    for (const item of config.items) {
      const scale = config.responseScales?.[item.responseScale];

      if (!scale) {
        errors.push("Missing response scale: " + item.id);
        continue;
      }

      const bounds = getScaleBounds(scale);
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
      // Critical indicators are handled separately below.
      if (domain.id === CRITICAL_DOMAIN) continue;

      const items = config.items.filter(
        item => item.domain === domain.id
      );

      if (items.length === 0) {
        domainResults[domain.id] = {
          title: domain.title,
          status: "no_items"
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
          status: "invalid_scale"
        };
        continue;
      }

      const score = ((total - minimumTotal) / range) * 100;

      domainResults[domain.id] = {
        title: domain.title,
        score: Math.round(score * 100) / 100,
        answeredItems: items.length,
        status: "preliminary_normalized_score",
        interpretation: "not_assigned",
        scoringValidated: false
      };
    }

    const criticalItems = config.items.filter(
      item => item.domain === CRITICAL_DOMAIN
    );

    const positiveCriticalItems = criticalItems
      .filter(item => normalizedAnswers[item.id] === 1)
      .map(item => item.id);

    return {
      status: "calculation_preview_only",
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
      clinicalValidation: "not_established"
    };
  }

  window.FIELD_MIND_SCORING_ENGINE = Object.freeze({
    calculate
  });
})();
