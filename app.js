
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const db = () => window.fieldMindSupabase;
  const config = window.FIELD_MIND_ASSESSMENT;

  let session = null;
  let currentQuestion = 0;
  let answers = {};
  let isAdmin = false;

  const panels = ["auth-panel", "app-panel", "admin-panel"];

  const criticalIds = [
    "critical_01",
    "critical_02",
    "critical_03",
    "critical_04",
    "critical_05",
    "critical_06",
    "critical_07",
    "critical_08"
  ];

  const criticalTitles = {
    critical_01: "أفكار انتحارية",
    critical_02: "أفكار لإيذاء النفس",
    critical_03: "احتمال إيذاء شخص آخر",
    critical_04: "إدراكات حسية غير معتادة",
    critical_05: "تغير سلوكي حاد أو فقدان السيطرة",
    critical_06: "تراجع شديد ومفاجئ في الأداء اليومي أو الوظيفي",
    critical_07: "نوبة هلع شديدة تؤثر في السلوك الآمن",
    critical_08: "خطر وشيك على النفس أو خطر من شخص آخر"
  };

  function showOnly(ids) {
    panels.forEach((id) => {
      const panel = $(id);
      if (panel) {
        panel.classList.toggle("hidden", !ids.includes(id));
      }
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

    const emailElement = $("current-email");
    if (emailElement) {
      emailElement.textContent =
        session.user.email || "حساب موثق";
    }

    isAdmin = await checkAdmin();

    const adminBanner = $("admin-banner");
    if (adminBanner) {
      adminBanner.classList.toggle("hidden", !isAdmin);
    }

    const adminPanel = $("admin-panel");
    if (adminPanel) {
      adminPanel.classList.toggle("hidden", !isAdmin);
    }

    if (isAdmin) {
      await loadAdminRecords();
    }
  }

  // تحديث تنبيه الأسئلة الحرجة أثناء الإجابة.
  function updateCriticalAlert(item) {
    const alert = $("critical-alert");
    if (!alert) return;

    const picked = document.querySelector(
      'input[name="answer"]:checked'
    );

    const isCritical = criticalIds.includes(item.id);
    const isYes = picked && Number(picked.value) === 1;

    alert.style.display =
      isCritical && isYes ? "block" : "none";
  }

  function renderQuestion() {
    if (!config || !Array.isArray(config.items)) {
      console.error("Assessment configuration is unavailable.");
      message(
        "form-message",
        "تعذر تحميل الأسئلة. يرجى تحديث الصفحة أو مراجعة إعدادات النظام.",
        true
      );
      return;
    }

    const item = config.items[currentQuestion];

    if (!item) {
      message(
        "form-message",
        "تعذر العثور على السؤال المطلوب.",
        true
      );
      return;
    }

    const selected = answers[item.id];

    $("progress-label").textContent =
      `السؤال ${currentQuestion + 1} من ${config.items.length}`;

    $("progress-count").textContent =
      `${Math.round(
        ((currentQuestion + 1) / config.items.length) * 100
      )}%`;

    $("progress-bar").style.width =
      `${((currentQuestion + 1) / config.items.length) * 100}%`;

    const options =
      item.options || config.responseScales[item.responseScale] || [];

    $("questions-container").innerHTML = `
      <div class="question-title">
        ${escapeHtml(item.text)}
      </div>

      <div
        role="radiogroup"
        aria-label="${escapeHtml(item.text)}"
      >
        ${options.map((o) => `
          <label class="choice">
            <input
              type="radio"
              name="answer"
              value="${o.value}"
              ${String(selected) === String(o.value) ? "checked" : ""}
            >
            <span>${escapeHtml(o.label)}</span>
          </label>
        `).join("")}
      </div>

      <div
        id="critical-alert"
        role="alert"
        aria-live="assertive"
        style="
          display:none;
          margin-top:16px;
          padding:14px;
          border:1px solid #b42318;
          border-radius:8px;
          background:#fff1f0;
          color:#8a1c13;
          line-height:1.8;
        "
      >
        <strong>تنبيه مهم — يلزم الانتباه لهذه الإجابة</strong>
        <p>
          تستلزم هذه الإجابة مراجعة بشرية سرية من مختص مؤهل
          وفق الإجراءات المعتمدة.
        </p>
        <p>
          إذا كان هناك خطر فوري على سلامتك أو سلامة شخص آخر،
          فاطلب المساعدة الطارئة المحلية فورًا. لا تعتمد على
          هذا التنبيه وحده.
        </p>
      </div>
    `;

    $("questions-container")
      .querySelectorAll('input[name="answer"]')
      .forEach((input) => {
        input.addEventListener("change", () => {
          updateCriticalAlert(item);
        });
      });

    updateCriticalAlert(item);

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

    if (!db() || !session) {
      return message(
        "form-message",
        "تعذر الاتصال الآمن بقاعدة البيانات. تحقق من إعداد Supabase.",
        true
      );
    }

    $("submit-assessment-button").disabled = true;
    message("form-message", "جارٍ حساب الدرجات وحفظ التقييم...");

    try {
      const scoringEngine = window.FIELD_MIND_SCORING_ENGINE;

      if (
        !scoringEngine ||
        typeof scoringEngine.calculate !== "function"
      ) {
        message(
          "form-message",
          "محرك الحساب غير متاح. يرجى تحديث الصفحة والمحاولة مجددًا.",
          true
        );
        return;
      }

      const calculationResult = scoringEngine.calculate(answers);

      if (
        !calculationResult ||
        calculationResult.status !== "calculation_preview_only"
      ) {
        message(
          "form-message",
          "تعذر إكمال الحساب بسبب وجود إجابات أو إعدادات غير صالحة.",
          true
        );
        return;
      }

      const payload = {
        user_id: session.user.id,
        scale_version: config.version,
        answers: answers,
        result: calculationResult,
        consent_given: true
      };

      const { error } = await db()
        .from("assessments")
        .insert(payload);

      if (error) {
        console.error("Assessment save failed:", error);

        message(
          "form-message",
          "لم نتمكن من حفظ التقييم. تحقق من إعدادات قاعدة البيانات والصلاحيات.",
          true
        );
        return;
      }

      $("assessment-form").classList.add("hidden");
      $("start-view").classList.add("hidden");
      $("result-view").classList.remove("hidden");

      const domainResults = calculationResult.domains || {};

      const scoreLines = Object.values(domainResults)
        .map((domain) => {
          const score =
            typeof domain.score === "number"
              ? `${domain.score.toFixed(2)}%`
              : "غير متاح";

          return `${domain.title}: ${score}`;
        })
        .join("\n");

      $("result-summary").textContent =
        "تم حفظ إجاباتك وحساب الدرجات الأولية بنجاح.\n\n" +
        scoreLines +
        "\n\nهذه درجات معيارية أولية وليست تشخيصًا نفسيًا أو تصنيفًا سريريًا.";

      if (isAdmin) {
        await loadAdminRecords();
      }
    } catch (error) {
      console.error("Assessment submission failed:", error);

      message(
        "form-message",
        "حدث خطأ غير متوقع أثناء حفظ التقييم. يرجى المحاولة مرة أخرى.",
        true
      );
    } finally {
      $("submit-assessment-button").disabled = false;
    }
  }

  // تحميل السجلات وإظهار التنبيهات الحرجة للطبيب المسؤول.
  async function loadAdminRecords() {
    if (!isAdmin || !db()) return;

    message("admin-message", "جارٍ تحميل السجلات...");

    const { data, error } = await db()
      .from("assessments")
      .select("id,user_id,created_at,answers,result")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin records error:", error);

      $("admin-records").innerHTML =
        '<tr><td colspan="4">تعذر تحميل السجلات. تحقق من صلاحيات الإدارة.</td></tr>';

      return message(
        "admin-message",
        "تعذر تحميل السجلات. تحقق من صلاحيات قاعدة البيانات.",
        true
      );
    }

    const records = data || [];

    const rows = records.map((row) => {
      const recordAnswers = row.answers || {};

      const positiveCriticalIds = criticalIds.filter(
        (id) => Number(recordAnswers[id]) === 1
      );

      const hasCriticalAnswers =
        positiveCriticalIds.length > 0;

      const statusHtml = hasCriticalAnswers
        ? `
          <strong style="color:#b42318;">
            ⚠️ يحتاج إلى مراجعة بشرية
          </strong>
          <div style="margin-top:8px;line-height:1.8;">
            ${positiveCriticalIds.map((id) => `
              <div>• ${escapeHtml(criticalTitles[id])}</div>
            `).join("")}
          </div>
        `
        : `
          <span style="color:#287443;">
            لا توجد إجابات إيجابية للأسئلة الحرجة المسجلة
          </span>
        `;

      return `
        <tr>
          <td>
            ${escapeHtml(
              new Date(row.created_at).toLocaleString("ar-EG")
            )}
          </td>
          <td>${escapeHtml(row.user_id)}</td>
          <td>${escapeHtml(row.result?.status || "مسجل")}</td>
          <td>${statusHtml}</td>
        </tr>
      `;
    });

    $("admin-records").innerHTML = rows.length
      ? rows.join("")
      : '<tr><td colspan="4">لا توجد سجلات حتى الآن.</td></tr>';

    const flaggedCount = records.filter((row) =>
      criticalIds.some(
        (id) => Number((row.answers || {})[id]) === 1
      )
    ).length;

    message(
      "admin-message",
      `عدد السجلات المعروضة: ${records.length} — التقييمات التي تحتاج إلى مراجعة: ${flaggedCount}`
    );
  }

  // تسجيل الدخول.
  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!db()) {
      return message(
        "auth-message",
        "أكمل إعداد SUPABASE_URL وSUPABASE_ANON_KEY في ملف supabase.js أولًا.",
        true
      );
    }

    const email = $("email").value.trim();

    $("login-button").disabled = true;

    try {
      const { error } = await db().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.href.split("#")[0]
        }
      });

      message(
        "auth-message",
        error
          ? `تعذر إرسال الرابط: ${error.message}`
          : "إذا كان البريد مسموحًا به، فستصلك رسالة تتضمن رابط الدخول. افتح الرابط على هذا الجهاز.",
        !!error
      );
    } catch (error) {
      console.error("Login error:", error);

      message(
        "auth-message",
        "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        true
      );
    } finally {
      $("login-button").disabled = false;
    }
  });

  // تسجيل الخروج.
  $("logout-button").addEventListener("click", async () => {
    try {
      if (db()) {
        await db().auth.signOut();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    setLoggedOut();
  });

  // الموافقة على بدء التقييم.
  $("consent").addEventListener("change", () => {
    $("begin-button").disabled = !$("consent").checked;
  });

  $("begin-button").addEventListener("click", () => {
    if (!$("consent").checked) return;

    answers = {};
    currentQuestion = 0;

    $("start-view").classList.add("hidden");
    $("result-view").classList.add("hidden");
    $("assessment-form").classList.remove("hidden");

    renderQuestion();
  });

  // السؤال السابق.
  $("previous-button").addEventListener("click", () => {
    saveCurrentAnswer();

    currentQuestion = Math.max(0, currentQuestion - 1);

    renderQuestion();
  });

  // السؤال التالي.
  $("next-button").addEventListener("click", () => {
    if (!saveCurrentAnswer()) {
      return message(
        "form-message",
        "يرجى اختيار إجابة قبل المتابعة.",
        true
      );
    }

    currentQuestion = Math.min(
      config.items.length - 1,
      currentQuestion + 1
    );

    renderQuestion();
  });

  $("assessment-form").addEventListener(
    "submit",
    submitAssessment
  );

  // تقييم جديد.
  $("new-assessment-button").addEventListener("click", () => {
    $("result-view").classList.add("hidden");
    $("assessment-form").classList.add("hidden");
    $("start-view").classList.remove("hidden");

    $("consent").checked = false;
    $("begin-button").disabled = true;
  });

  // تحديث لوحة الإدارة.
  $("refresh-admin-button").addEventListener(
    "click",
    loadAdminRecords
  );

  // تهيئة جلسة Supabase.
  if (!db()) {
    message(
      "auth-message",
      "هذه الواجهة جاهزة، لكن يلزم ربط مشروع Supabase قبل تسجيل الدخول."
    );
  } else {
    db().auth.getSession()
      .then(({ data }) => setLoggedIn(data.session))
      .catch((error) => {
        console.error("Session error:", error);
        setLoggedOut();
      });

    db().auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        setLoggedIn(nextSession);
      }, 0);
    });
  }
})();
