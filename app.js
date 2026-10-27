
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const db = () => window.fieldMindSupabase;
  const config = window.FIELD_MIND_ASSESSMENT;

  let session = null;
  let currentQuestion = 0;
  let answers = {};
  let isAdmin = false;
  let isSuperAdmin = false;
  // بيانات لوحة تحليل نتائج التقييمات.
  let allDashboardRows = [];
  let visibleDashboardRows = [];
  let dashboardPage = 0;
  const dashboardPageSize = 25;
  const panels = ["auth-panel", "app-panel", "admin-panel"];

  const criticalIds = new Set([
    "critical_01",
    "critical_02",
    "critical_03",
    "critical_04",
    "critical_05",
    "critical_06",
    "critical_07",
    "critical_08"
  ]);

  const roleLabels = {
    super_admin: "مدير أعلى",
    admin: "مدير",
    occupational_health: "الصحة المهنية",
    worker: "مستخدم عادي"
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
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
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
    isSuperAdmin = false;

    toggleUserManagement(false);
    showOnly(["auth-panel"]);
  }

  async function checkAdmin() {
    if (!db() || !session) return false;

    const { data, error } = await db()
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1);

    if (error) {
      console.warn("Role lookup failed:", error.message);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  }

  async function checkSuperAdmin() {
    if (!db() || !session) return false;

    const { data, error } = await db()
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "super_admin")
      .limit(1);

    if (error) {
      console.warn("Super Admin lookup failed:", error.message);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  }

  function toggleUserManagement(visible) {
    const button = $("refresh-users-button");
    const messageEl = $("users-message");
    const tbody = $("admin-users");

    if (button) {
      const heading = button.closest(".section-heading");

      if (heading) {
        heading.style.display = visible ? "" : "none";

        const description = heading.nextElementSibling;
        if (
          description &&
          description.classList.contains("small")
        ) {
          description.style.display = visible ? "" : "none";
        }
      }

      button.disabled = !visible;
    }

    if (messageEl) {
      messageEl.style.display = visible ? "" : "none";
    }

    if (tbody) {
      const tableWrap = tbody.closest(".table-wrap");
      if (tableWrap) {
        tableWrap.style.display = visible ? "" : "none";
      }
    }

    const usersHeading = document.querySelector(
      "#admin-panel .section-heading button#refresh-users-button"
    );

    if (usersHeading) {
      const sectionHeading = usersHeading.closest(".section-heading");
      const hr = sectionHeading?.previousElementSibling;

      if (hr && hr.tagName === "HR") {
        hr.style.display = visible ? "" : "none";
      }
    }
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
    isSuperAdmin = isAdmin ? await checkSuperAdmin() : false;

    $("admin-banner").classList.toggle("hidden", !isAdmin);

if (isAdmin) {
  $("admin-panel").classList.remove("hidden");

  toggleUserManagement(isSuperAdmin);

  const dashboard = $("results-dashboard");
  if (dashboard) {
    dashboard.classList.toggle("hidden", !isSuperAdmin);
  }

  await loadAdminRecords();

  if (isSuperAdmin) {
    await loadAdminUsers();
  }

      if (isSuperAdmin) {
        await loadAdminUsers();
      }
    } else {
      $("admin-panel").classList.add("hidden");
      toggleUserManagement(false);
    }
  }

  // تحديث التنبيه الخاص بالأسئلة الحرجة.
  function updateCriticalAlert(item) {
    const alert = $("critical-alert");
    if (!alert) return;

    const picked = document.querySelector(
      'input[name="answer"]:checked'
    );

    const isCritical = criticalIds.has(item.id);
    const isYes = picked && Number(picked.value) === 1;

    alert.style.display =
      isCritical && isYes ? "block" : "none";
  }

  function renderQuestion() {
    if (!config || !Array.isArray(config.items) ||
        !config.items.length) {
      message(
        "form-message",
        "تعذر تحميل إعدادات الأسئلة.",
        true
      );
      return;
    }

    const item = config.items[currentQuestion];
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

      <div
        id="critical-alert"
        role="alert"
        aria-live="assertive"
        style="
          display: none;
          margin-top: 16px;
          padding: 14px;
          border: 1px solid #b42318;
          border-radius: 8px;
          background: #fff1f0;
          color: #8a1c13;
          line-height: 1.8;
        "
      >
        <strong>تنبيه مهم — يلزم الانتباه لهذه الإجابة</strong>
        <p>
          تستلزم هذه الإجابة مراجعة بشرية سرية من مختص مؤهل،
          وفق إجراءات المؤسسة المعتمدة.
        </p>
        <p>
          إذا كان هناك خطر فوري على سلامتك أو سلامة شخص آخر،
          فاطلب المساعدة الطارئة المحلية فورًا، ولا تعتمد على
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
    message("form-message", "جارٍ حفظ التقييم...");

    try {
      const scoringEngine = window.FIELD_MIND_SCORING_ENGINE;

      if (
        !scoringEngine ||
        typeof scoringEngine.calculate !== "function"
      ) {
        return message(
          "form-message",
          "محرك الحساب غير متاح. يرجى تحديث الصفحة والمحاولة مجددًا.",
          true
        );
      }

      let calculationResult;

      try {
        calculationResult = scoringEngine.calculate(answers);
      } catch (error) {
        console.error("Scoring error:", error);

        return message(
          "form-message",
          "تعذر حساب الدرجات. يرجى مراجعة إعدادات المقياس.",
          true
        );
      }

      if (
        calculationResult.status !== "calculation_preview_only"
      ) {
        return message(
          "form-message",
          "تعذر إكمال الحساب بسبب وجود إجابات أو إعدادات غير صالحة.",
          true
        );
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

        return message(
          "form-message",
          "لم نتمكن من حفظ التقييم. تحقق من إعداد قاعدة البيانات والصلاحيات.",
          true
        );
      }

      $("assessment-form").classList.add("hidden");
      $("start-view").classList.add("hidden");
      $("result-view").classList.remove("hidden");

      const domainResults = calculationResult.domains || {};

      const scoreLines = Object.entries(domainResults)
        .map(([id, domain]) => {
          const score =
            typeof domain.score === "number"
              ? domain.score.toFixed(2) + "%"
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
      console.error("Assessment submission error:", error);

      message(
        "form-message",
        "حدث خطأ غير متوقع أثناء حفظ التقييم.",
        true
      );
    } finally {
      $("submit-assessment-button").disabled = false;
    }
  }

  async function loadAdminRecords() {
    if (!isAdmin || !db()) return;

    message("admin-message", "جارٍ تحميل السجلات...");

    const { data, error } = await db()
      .from("assessments")
      .select("id,user_id,created_at,result")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin records error:", error);

      $("admin-records").innerHTML =
        '<tr><td colspan="3">تعذر تحميل السجلات. تحقق من صلاحيات الإدارة.</td></tr>';

      return message(
        "admin-message",
        "تعذر تحميل السجلات.",
        true
      );
    }

    $("admin-records").innerHTML = data.length
      ? data.map((row) => `
          <tr>
            <td>${escapeHtml(
              new Date(row.created_at).toLocaleString("ar-EG")
            )}</td>
            <td>${escapeHtml(row.user_id)}</td>
            <td>${escapeHtml(row.result?.status || "مسجل")}</td>
          </tr>
        `).join("")
      : '<tr><td colspan="3">لا توجد سجلات حتى الآن.</td></tr>';

    message(
      "admin-message",
      `عدد السجلات المعروضة: ${data.length}`
    );
  }
  
  // تحميل جميع نتائج التقييمات عبر دالة الخادم المحمية.
  async function fetchAllDashboardRows() {
    if (!isSuperAdmin || !db()) {
      throw new Error("Super Admin permission required");
    }

    const collected = [];
    let offset = 0;
    const limit = 500;
    let expectedTotal = null;

    while (true) {
      const { data, error } = await db().functions.invoke(
        "fieldmind-superadmin-results",
        {
          body: { offset, limit }
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!Array.isArray(data?.rows)) {
        throw new Error("استجابة غير متوقعة من الخادم.");
      }

      if (expectedTotal === null) {
        expectedTotal = Number(data.total) || 0;
      }

      collected.push(...data.rows);
      offset += data.rows.length;

      if (!data.rows.length || offset >= expectedTotal) {
        break;
      }
    }

    return collected;
  }
  // ربط زر تحديث لوحة النتائج.
$("refresh-results-button")?.addEventListener("click", async () => {
  const message = $("results-message");

  try {
    if (message) {
      message.textContent = "جارٍ تحميل النتائج...";
    }

    const rows = await fetchAllDashboardRows();

    if (message) {
      message.textContent =
        `تم تحميل ${rows.length} سجلًا بنجاح.`;
    }

    console.log("FieldMind dashboard rows:", rows);
  } catch (error) {
    console.error("FieldMind dashboard error:", error);

    if (message) {
      message.textContent =
        "تعذر تحميل النتائج. تحقق من صلاحيات الحساب واتصال الخادم.";
    }
  }
});
  // تحميل قائمة الحسابات من دالة Supabase الآمنة.
  async function loadAdminUsers() {
    if (!isSuperAdmin || !db()) return;

    const tbody = $("admin-users");
    if (!tbody) return;

    message("users-message", "جارٍ تحميل المستخدمين...");
    $("refresh-users-button").disabled = true;

    try {
      const { data, error } = await db().functions.invoke(
        "fieldmind-admin-users",
        { body: { action: "list" } }
      );

      if (error) throw error;

      const users = data?.users;

      if (!Array.isArray(users)) {
        throw new Error("استجابة غير متوقعة من الخادم.");
      }

      if (!users.length) {
        tbody.innerHTML =
          '<tr><td colspan="4">لا توجد حسابات للعرض.</td></tr>';

        message("users-message", "لا توجد حسابات.");
        return;
      }

      tbody.innerHTML = users.map((user) => {
        const roles = Array.isArray(user.roles) ? user.roles : [];
        const currentRole = roles.length === 1 ? roles[0] : null;
        const protectedAccount = roles.includes("super_admin");
        const needsReview = roles.length > 1;

        let currentLabel = currentRole
          ? (roleLabels[currentRole] || currentRole)
          : "غير محدد";

        if (needsReview) {
          currentLabel = "تحتاج مراجعة يدوية";
        }

        let roleCell = "—";
        let actionCell = "";

        if (protectedAccount) {
          actionCell = "<span>حساب محمي</span>";
        } else if (needsReview) {
          actionCell = "<span>راجع الأدوار في قاعدة البيانات</span>";
        } else {
          const selectedRole = currentRole || "worker";

          roleCell = `
            <select data-role-select aria-label="الدور الجديد">
              <option value="worker" ${selectedRole === "worker" ? "selected" : ""}>مستخدم عادي</option>
              <option value="occupational_health" ${selectedRole === "occupational_health" ? "selected" : ""}>الصحة المهنية</option>
              <option value="admin" ${selectedRole === "admin" ? "selected" : ""}>مدير</option>
            </select>
          `;

          actionCell = `
            <button
              type="button"
              data-save-role
              data-user-id="${escapeHtml(user.id)}"
            >حفظ الدور</button>
          `;
        }

        return `
          <tr>
            <td>${escapeHtml(user.email || "بريد غير متاح")}</td>
            <td>${escapeHtml(currentLabel)}</td>
            <td>${roleCell}</td>
            <td>${actionCell}</td>
          </tr>
        `;
      }).join("");

      message("users-message", `تم تحميل ${users.length} حسابًا.`);
    } catch (error) {
      console.error("Admin users error:", error);

      tbody.innerHTML =
        '<tr><td colspan="4">تعذر تحميل المستخدمين.</td></tr>';

      message(
        "users-message",
        "تعذر تحميل الحسابات. تحقق من صلاحية Super Admin وإعداد الدالة.",
        true
      );
    } finally {
      $("refresh-users-button").disabled = false;
    }
  }

  // حفظ دور مستخدم عادي من خلال دالة الخادم.
  async function saveUserRole(userId, role, button) {
    if (!isSuperAdmin || !db()) {
      message(
        "users-message",
        "ليس لديك صلاحية تنفيذ هذا الإجراء.",
        true
      );
      return;
    }

    if (!["admin", "occupational_health", "worker"].includes(role)) {
      message("users-message", "الدور المحدد غير صالح.", true);
      return;
    }

    button.disabled = true;
    message("users-message", "جارٍ حفظ الدور الجديد...");

    try {
      const { data, error } = await db().functions.invoke(
        "fieldmind-admin-users",
        {
          body: {
            action: "set_role",
            user_id: userId,
            role: role
          }
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      message("users-message", "تم تحديث الدور بنجاح.");
      await loadAdminUsers();
    } catch (error) {
      console.error("Role update error:", error);

      message(
        "users-message",
        "تعذر تحديث الدور. تحقق من الصلاحيات ثم أعد المحاولة.",
        true
      );
    } finally {
      button.disabled = false;
    }
  }

  // تسجيل الدخول برابط البريد الإلكتروني.
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!db()) {
      return message(
        "auth-message",
        "أكمل إعداد Supabase في ملف supabase.js أولًا.",
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
        "حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        true
      );
    } finally {
      $("login-button").disabled = false;
    }
  });

  // تسجيل الخروج.
  $("logout-button").addEventListener("click", async () => {
    if (db()) {
      await db().auth.signOut();
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

  // الانتقال إلى السؤال السابق.
  $("previous-button").addEventListener("click", () => {
    saveCurrentAnswer();

    currentQuestion = Math.max(0, currentQuestion - 1);

    renderQuestion();
  });

  // الانتقال إلى السؤال التالي.
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

  // بدء تقييم جديد.
  $("new-assessment-button").addEventListener("click", () => {
    $("result-view").classList.add("hidden");
    $("assessment-form").classList.add("hidden");

    $("start-view").classList.remove("hidden");

    $("consent").checked = false;
    $("begin-button").disabled = true;
  });

  // تحديث سجلات لوحة الإدارة.
  $("refresh-admin-button").addEventListener(
    "click",
    loadAdminRecords
  );

  // تحديث قائمة المستخدمين.
  $("refresh-users-button").addEventListener(
    "click",
    loadAdminUsers
  );

  // حفظ الدور المحدد لكل مستخدم.
  $("admin-users").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-save-role]");
    if (!button) return;

    const row = button.closest("tr");
    const select = row?.querySelector("[data-role-select]");

    if (!select) return;

    saveUserRole(button.dataset.userId, select.value, button);
  });

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
