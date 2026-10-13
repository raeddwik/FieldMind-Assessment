(() => {
  const $ = (id) => document.getElementById(id);
  const db = () => window.fieldMindSupabase;
  const config = window.FIELD_MIND_ASSESSMENT;

  let session = null;
  let currentQuestion = 0;
  let answers = {};
  let isAdmin = false;

  const panels = ["auth-panel", "app-panel", "admin-panel"];

  function showOnly(ids) {
    panels.forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle("hidden", !ids.includes(id));
    });
  }

  function message(id, text, error = false) {
    const el = $(id);
    if (!el) return;

    el.textContent = text;
    el.style.color = error ? "#a12626" : "";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function setLoggedOut() {
    session = null;
    isAdmin = false;
    showOnly(["auth-panel"]);
  }

  async function checkAdmin() {
    if (!db() || !session) return false;

    const { data, error } = await db()
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.warn("Role lookup failed:", error.message);
    }

    return !!data;
  }

  async function setLoggedIn(nextSession) {
    session = nextSession;

    if (!session) {
      setLoggedOut();
      return;
    }

    showOnly(["app-panel"]);

    $("current-email").textContent =
      session.user.email || "حساب موثق";

    isAdmin = await checkAdmin();

    $("admin-banner").classList.toggle("hidden", !isAdmin);

    if (isAdmin) {
      $("admin-panel").classList.remove("hidden");
      loadAdminRecords();
    } else {
      $("admin-panel").classList.add("hidden");
    }
  }

  function renderQuestion() {
    if (!config || !Array.isArray(config.items) || !config.items.length) {
      message(
        "form-message",
        "تعذر تحميل أسئلة التقييم. تحقق من ملف إعدادات المقياس.",
        true
      );
      return;
    }

    const item = config.items[currentQuestion];
    const selected = answers[item.id];

    $("progress-label").textContent =
      `السؤال ${currentQuestion + 1} من ${config.items.length}`;

    $("progress-count").textContent =
      `${Math.round(((currentQuestion + 1) / config.items.length) * 100)}%`;

    $("progress-bar").style.width =
      `${((currentQuestion + 1) / config.items.length) * 100}%`;

    const options =
      item.options || config.responseScales[item.responseScale] || [];

    $("questions-container").innerHTML = `
      <div class="question-title">${escapeHtml(item.text)}</div>
      <div role="radiogroup" aria-label="${escapeHtml(item.text)}">
        ${options.map((o) => `
          <label class="choice">
            <input
              type="radio"
              name="answer"
              value="${escapeHtml(o.value)}"
              ${String(selected) === String(o.value) ? "checked" : ""}
            >
            <span>${escapeHtml(o.label)}</span>
          </label>
        `).join("")}
      </div>
    `;

    $("previous-button").disabled = currentQuestion === 0;

    $("next-button").classList.toggle(
      "hidden",
      currentQuestion === config.items.length - 1
    );

    $("submit-assessment-button").classList.toggle(
      "hidden",
      currentQuestion !== config.items.length - 1
    );

    message("form-message", "");
  }

  function saveCurrentAnswer() {
    const picked = document.querySelector(
      'input[name="answer"]:checked'
    );

    if (!picked) return false;

    answers[config.items[currentQuestion].id] =
      Number(picked.value);

    return true;
  }

  function validateAllAnswered() {
    return config.items.every((item) =>
      Number.isFinite(answers[item.id])
    );
  }

  async function submitAssessment(event) {
    event.preventDefault();

    if (!saveCurrentAnswer()) {
      return message(
        "form-message",
        "يرجى اختيار إجابة قبل المتابعة.",
        true
      );
    }

    if (!validateAllAnswered()) {
      return message(
        "form-message",
        "توجد أسئلة لم تتم الإجابة عنها.",
        true
      );
    }

    // Validate answers using the preview engine only.
    // No clinical scores or classifications are issued.
    try {
      const engine = window.FIELD_MIND_SCORING_ENGINE;

      if (!engine || typeof engine.calculate !== "function") {
        return message(
          "form-message",
          "محرك التحقق غير محمّل. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
          true
        );
      }

      const preview = engine.calculate(answers);

      if (preview.status !== "calculation_preview_only") {
        return message(
          "form-message",
          "تعذر التحقق من الإجابات. راجع اكتمال الإجابات وصحة إعداد المقياس.",
          true
        );
      }
    } catch (error) {
      console.error("Assessment validation failed:", error);

      return message(
        "form-message",
        "حدث خطأ أثناء التحقق من الإجابات. لم يتم إرسال التقييم.",
        true
      );
    }

    if (!db() || !session) {
      return message(
        "form-message",
        "تعذر الاتصال بقاعدة البيانات. تحقق من إعداد Supabase.",
        true
      );
    }

    $("submit-assessment-button").disabled = true;
    message("form-message", "جارٍ حفظ التقييم...");

    // Save answers and a non-clinical status only.
    const payload = {
      user_id: session.user.id,
      scale_version: config.version,
      answers: answers,
      result: {
        status: "pending_scale_configuration",
        calculationMode: "calculation_preview_only",
        clinicalScoringEnabled: false,
        clinicalClassification: null,
        scaleVersion: config.version,
