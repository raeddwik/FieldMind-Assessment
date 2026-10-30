
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
    "safe_01",
    "safe_02"
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
    const inviteBox = $("admin-invite-box");
    if (inviteBox) inviteBox.style.display = visible ? "" : "none";

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

  const emailEl = $("current-email");
  if (emailEl) {
    emailEl.textContent = session.user.email || "حساب موثق";
  }

  isAdmin = await checkAdmin();
  isSuperAdmin = isAdmin ? await checkSuperAdmin() : false;

  const adminBanner = $("admin-banner");
  if (adminBanner) {
    adminBanner.classList.toggle("hidden", !isAdmin);
    adminBanner.textContent = isSuperAdmin
      ? "تم التعرف على حساب المدير الأعلى (Super Admin). لوحتا النتائج وإدارة الحسابات متاحتان لهذا الحساب."
      : isAdmin
        ? "تم التعرف على حساب المدير (Admin). لا تتاح له لوحة النتائج الشاملة أو إدارة الحسابات."
        : "";
  }

  const adminPanel = $("admin-panel");

  if (isAdmin) {
    if (adminPanel) {
      adminPanel.classList.remove("hidden");
    }

    toggleUserManagement(isSuperAdmin);

    const dashboard = $("results-dashboard");
    if (dashboard) {
      dashboard.classList.toggle("hidden", !isSuperAdmin);
    }

    await loadAdminRecords();

    if (isSuperAdmin) {
      await loadAdminUsers();
      // Load the protected results dashboard automatically for the super-admin.
      $("refresh-results-button")?.click();
    }
  } else {
    if (adminPanel) {
      adminPanel.classList.add("hidden");
    }

    const dashboard = $("results-dashboard");
    if (dashboard) {
      dashboard.classList.add("hidden");
    }

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

    const isCriticalYes = criticalIds.has(item.id) &&
      picked && Number(picked.value) === 1;

    // A "yes" to either safety question opens a supportive notice; this is not a diagnosis.
    const isSelfHarmFrequencyItem = item.id === "safe_01";
    const selfHarmFrequencyPositive = isSelfHarmFrequencyItem &&
      picked && Number(picked.value) === 1;

    alert.style.display =
      isCriticalYes || selfHarmFrequencyPositive ? "block" : "none";
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
        <strong>يمكنك طلب المساعدة بسرية</strong>
        <p>
          إذا كانت إجابتك تعكس ما تمر به، يمكنك التحدث مع شخص مؤهل أو طلب دعم مناسب.
          هذا السؤال لا يصدر تشخيصًا، ولا ينبغي أن يكون سببًا للعقوبة أو الوصم.
        </p>
        <p>
          إذا كان هناك خطر فوري على سلامتك أو سلامة شخص آخر، فاطلب المساعدة الطبية العاجلة
          أو تواصل مع خدمات الطوارئ المحلية فورًا.
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

    // لا يكفي إخفاء شاشة الموافقة بعد البدء؛ نتحقق من الموافقة الصريحة مجددًا قبل الإرسال.
    if (!$("consent")?.checked) {
      return message(
        "form-message",
        "يرجى تأكيد الموافقة على معالجة الإجابات قبل إرسال التقييم.",
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
      const { data: submission, error: submitError } = await db().functions.invoke(
        "fieldmind-submit-assessment",
        {
          body: {
            scale_version: config.version,
            answers: answers,
            consent_given: $("consent").checked
          }
        }
      );

      if (submitError || !submission?.ok || !submission?.result) {
        console.error("Assessment submission failed:", submitError || submission?.error);
        return message(
          "form-message",
          "لم نتمكن من التحقق من التقييم وحفظه على الخادم. لم يتم تأكيد الحفظ؛ يرجى المحاولة لاحقًا.",
          true
        );
      }

      const calculationResult = submission.result;

      $("assessment-form").classList.add("hidden");
      $("start-view").classList.add("hidden");
      $("result-view").classList.remove("hidden");

      const domainResults = calculationResult.domains || {};
      const displayOrder = [
        ["depression", "محور الحالة المزاجية"], ["anxiety", "محور القلق"],
        ["panic", "محور نوبات الخوف"], ["ocd", "محور الأفكار المزعجة"],
        ["adjustment", "محور المرونة"], ["sleep", "محور النوم"],
        ["burnout", "محور الإجهاد الوظيفي"],
        ["workplace_satisfaction", "محور الرضا عن بيئة العمل"],
        ["functional_impact", "محور الحياة اليومية"],
        ["job_satisfaction", "مؤشر الرضا الوظيفي"]
      ];
      const domainHtml = displayOrder.map(([id, label]) => {
        const domain = domainResults[id];
        if (!domain || typeof domain.average !== "number") return "";
        return `<li><strong>${label}:</strong> ${domain.average.toFixed(1)} / 4 — التفسير: ${escapeHtml(domain.descriptiveBand || "غير متاح")}</li>`;
      }).join("");
      const specialistItems = ["bipolar_indicators", "psychosis_indicators"].flatMap(id => {
        const domain = domainResults[id];
        if (!domain || Number(domain.positiveCount || 0) === 0) return [];
        const itemIds = Array.isArray(domain.positiveItemIds) ? domain.positiveItemIds : [];
        return config.items.filter(item => itemIds.includes(item.id)).map(item => item.text);
      });

      const followUp = calculationResult.followUp || {};
      const followUpText = `
        <section class="index-summary" style="margin:18px 0;padding:16px;border:1px solid #d7dee8;border-radius:10px">
          <h3>خلاصة المتابعة المقترحة</h3>
          <p><strong>${escapeHtml(followUp.label || "تحتاج النتيجة إلى مراجعة")}</strong></p>
          <p>${escapeHtml(followUp.recommendation || "تُراجع الإجابات مع شخص مؤهل.")}</p>
          <p class="small">هذه أولوية متابعة داخلية تجريبية وليست درجة خطورة سريرية أو تشخيصًا. لا تستخدم وحدها لاتخاذ قرار وظيفي أو تحديد اللياقة للعمل.</p>
        </section>`;

      const critical = calculationResult.criticalIndicators || {};
      const criticalItems = Array.isArray(config.items)
        ? config.items.filter(item => item.domain === "critical_indicators")
        : [];
      const positiveIds = Array.isArray(critical.positiveItemIds) ? critical.positiveItemIds : [];
      const criticalLabels = criticalItems.filter(item => positiveIds.includes(item.id)).map(item => item.text);
      const declinedSafety = Number(critical.declinedCount || 0) > 0;
      const criticalDetails = criticalLabels.length
        ? '<div class="notice"><strong>توجد إجابة تستلزم مراجعة بشرية داعمة.</strong><p>' +
          escapeHtml(criticalLabels.join("؛ ")) +
          '</p><p>تواصل مع العامل مباشرةً وبسرية للتحقق من السلامة الحالية. إذا كان هناك خطر فوري، فعّل إجراء السلامة المعتمد واطلب المساعدة الطبية العاجلة عند الحاجة.</p></div>'
        : declinedSafety
          ? '<p class="small">اختار المستخدم عدم الإجابة عن سؤال سلامة واحد أو أكثر؛ لا يمكن استنتاج وجود الخطر أو غيابه من ذلك. أتح فرصة سرية واختيارية للتواصل مع شخص مؤهل.</p>'
          : '<p class="small">لم تُسجّل إجابة إيجابية في أسئلة السلامة. وهذا لا يثبت غياب الخطر ولا يمنع طلب المساعدة عند الحاجة.</p>';

      const overallCategory = calculationResult.overallFollowUpCategory ||
        (["urgent_safety", "immediate_safety_contact"].includes(followUp.level) ? "عرض عاجل على متخصص" :
         ["prompt_human_review", "specialist_review"].includes(followUp.level) ? "العرض على أخصائي طب نفسي" :
         followUp.level === "offer_support" ? "تثقيف نفسي ومتابعة" : "لا يوجد ما يستدعي التدخل");
      const specialistReviewHtml = specialistItems.length
        ? '<section class="notice"><strong>إجابات تستدعي مراجعة من متخصص:</strong><ul>' +
          specialistItems.map(item => "<li>" + escapeHtml(item) + "</li>").join("") +
          '</ul></section>'
        : "";

      $("result-summary").innerHTML =
        '<p><strong>تم حفظ إجاباتك بنجاح.</strong></p>' +
        followUpText +
        '<h3>التقييم العام</h3><p><strong>' + escapeHtml(overallCategory) + '</strong></p>' +
        '<h3>خلاصة المحاور</h3><ul class="domain-summary-list">' + domainHtml + '</ul>' +
        specialistReviewHtml + criticalDetails +
        '<p class="small">استبيان FieldMind الداخلي من تصميم صاحب المشروع، وقواعده تجريبية وغير معتمدة. لا يثبت وجود اضطراب نفسي أو ينفيه، ولا يصدر قرارًا بشأن اللياقة للعمل. يمكن طلب المساعدة في أي وقت، بصرف النظر عن النتيجة.</p>';
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

  // لا نقرأ سجلات التقييمات مباشرة من المتصفح حتى لو كان المستخدم مديرًا.
  // عرض النتائج الحساسة يتم فقط عبر Edge Function التي تتحقق من super_admin على الخادم.
  async function loadAdminRecords() {
    if (!isAdmin) return;

    const records = $("admin-records");
    if (records) {
      records.innerHTML =
        '<tr><td colspan="3">عرض السجلات متاح فقط من لوحة النتائج المحمية للحساب المخوّل.</td></tr>';
    }

    message(
      "admin-message",
      isSuperAdmin
        ? "استخدم لوحة النتائج المحمية لعرض السجلات."
        : "لا تتوفر لهذا الدور صلاحية عرض سجلات التقييمات."
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

allDashboardRows = rows;
visibleDashboardRows = [...rows];
dashboardPage = 0;

const totalEl = $("results-total");
if (totalEl) {
  totalEl.textContent = String(rows.length);
}

const usersEl = $("results-users-total");
if (usersEl) {
  usersEl.textContent = String(
    new Set(rows.map(row => row.user_id).filter(Boolean)).size
  );
}

const versionsEl = $("results-versions-total");
if (versionsEl) {
  versionsEl.textContent = String(
    new Set(rows.map(row => row.scale_version).filter(Boolean)).size
  );
}

const tbody = $("results-rows");
if (tbody) {
  tbody.innerHTML = rows.map(row => {
    const domains = row.domains ?? row.result?.domains;
    const domainsText = domains && typeof domains === "object"
      ? Object.entries(domains)
          .map(([key, value]) => {
            if (!value || typeof value !== "object") return key + ": " + value;
              const average = typeof value.average === "number"
                ? value.average.toFixed(1) + " / 4"
                : "—";
              const description = value.descriptiveBand
                ? " — " + value.descriptiveBand
                : value.kind === "flag"
                  ? (Number(value.positiveCount) > 0
                    ? " — توجد إجابة تستحق استيضاحًا متخصصًا"
                    : Number(value.declinedCount) > 0
                      ? " — اختار المستخدم عدم الإجابة عن سؤال أو أكثر"
                      : " — لم تُسجّل إجابة إيجابية")
                  : "";
              return (value.title || key) + ": " + average + description;
          })
          .join("، ")
      : "لا توجد درجات مسجلة";

    return `
      <tr>
        <td>${escapeHtml(row.created_at
          ? new Date(row.created_at).toLocaleString("ar-EG")
          : "—")}</td>
        <td>${escapeHtml(row.user_email || "—")}</td>
        <td>${escapeHtml(row.scale_version || "—")}</td>
        <td>${escapeHtml(
          (row.status || row.result?.status) === "calculation_preview_only"
            ? ""
            : (row.status || row.result?.status || "—")
        )}</td>
        <td>${escapeHtml(domainsText)}</td>
      </tr>
    `;
  }).join("");
}

if (message) {
  message.textContent = `تم تحميل ${rows.length} سجلًا بنجاح.`;
}  } catch (error) {
    console.error("FieldMind dashboard error:", error);

    if (message) {
      message.textContent =
        "تعذر تحميل النتائج. تحقق من صلاحيات الحساب واتصال الخادم.";
    }
  }
});
  
function renderFilteredDashboard(resetPage = true) {
  const from = $("results-from")?.value || "";
  const to = $("results-to")?.value || "";
  const version = $("results-version")?.value || "";
  const status = $("results-status")?.value || "";

  visibleDashboardRows = allDashboardRows.filter(row => {
    const date = row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })
      : "";

    if (from && (!date || date < from)) return false;
    if (to && (!date || date > to)) return false;
    if (version && row.scale_version !== version) return false;
    if (status && (row.status ?? row.result?.status) !== status) return false;

    return true;
  });

if (resetPage) dashboardPage = 0;
  
  const totalEl = $("results-total");
  if (totalEl) {
    totalEl.textContent = String(visibleDashboardRows.length);
  }

  const usersEl = $("results-users-total");
  if (usersEl) {
    usersEl.textContent = String(
      new Set(
        visibleDashboardRows
          .map(row => row.user_id)
          .filter(Boolean)
      ).size
    );
  }

  const versionsEl = $("results-versions-total");
  if (versionsEl) {
    versionsEl.textContent = String(
      new Set(
        visibleDashboardRows
          .map(row => row.scale_version)
          .filter(Boolean)
      ).size
    );
  }

  const tbody = $("results-rows");
  if (!tbody) return;

  const start = dashboardPage * dashboardPageSize;
  const pageRows = visibleDashboardRows.slice(
    start,
    start + dashboardPageSize
  );

  if (!pageRows.length) {
    tbody.innerHTML =
      '<tr><td colspan="5">لا توجد نتائج مطابقة للفلاتر.</td></tr>';
  } else {
    tbody.innerHTML = pageRows.map(row => {
      const domains = row.domains ?? row.result?.domains;

      const domainsText = domains && typeof domains === "object"
        ? Object.entries(domains)
            .map(([key, value]) => {
              if (!value || typeof value !== "object") return key + ": " + value;
              const average = typeof value.average === "number"
                ? value.average.toFixed(1) + " / 4"
                : "—";
              const description = value.descriptiveBand
                ? " — " + value.descriptiveBand
                : value.kind === "flag"
                  ? (Number(value.positiveCount) > 0
                    ? " — توجد إجابة تستحق استيضاحًا متخصصًا"
                    : Number(value.declinedCount) > 0
                      ? " — اختار المستخدم عدم الإجابة عن سؤال أو أكثر"
                      : " — لم تُسجّل إجابة إيجابية")
                  : "";
              return (value.title || key) + ": " + average + description;
            })
            .join("، ")
        : "لا توجد درجات مسجلة";

      return `
        <tr>
          <td>${escapeHtml(row.created_at
            ? new Date(row.created_at).toLocaleString("ar-EG")
            : "—")}</td>
          <td>${escapeHtml(row.user_id || "—")}</td>
          <td>${escapeHtml(row.scale_version || "—")}</td>
          <td>${escapeHtml(
          (row.status || row.result?.status) === "calculation_preview_only"
            ? ""
            : (row.status || row.result?.status || "—")
        )}</td>
          <td>${escapeHtml(domainsText)}</td>
        </tr>
      `;
    }).join("");
  }

  const totalPages = Math.max(
    1,
    Math.ceil(visibleDashboardRows.length / dashboardPageSize)
  );

  const pageLabel = $("results-page-label");
  if (pageLabel) {
    pageLabel.textContent =
      `الصفحة ${dashboardPage + 1} من ${totalPages}`;
  }

  const prevButton = $("results-prev");
  const nextButton = $("results-next");

  if (prevButton) prevButton.disabled = dashboardPage <= 0;
  if (nextButton) nextButton.disabled = dashboardPage >= totalPages - 1;
}

$("apply-results-filters")?.addEventListener(
  "click",
  renderFilteredDashboard
);
  // التنقل بين صفحات النتائج.
$("results-prev")?.addEventListener("click", () => {
  if (dashboardPage > 0) {
    dashboardPage--;
    renderFilteredDashboard(false);
  }
});

$("results-next")?.addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(visibleDashboardRows.length / dashboardPageSize)
  );

  if (dashboardPage < totalPages - 1) {
    dashboardPage++;
    renderFilteredDashboard(false);
  }
});
  // تصدير النتائج الظاهرة بعد تطبيق الفلاتر إلى CSV.
$("export-results-button")?.addEventListener("click", () => {
  if (!isSuperAdmin) {
    message("results-message", "ليست لديك صلاحية تصدير النتائج.", true);
    return;
  }

  if (!visibleDashboardRows.length) {
    message("results-message", "لا توجد نتائج لتصديرها.", true);
    return;
  }

  const headers = [
    "وقت الاختبار (التاريخ فقط)",
    "اسم المستخدم (البريد الإلكتروني)",
    "نسخة المقياس",
    "التقييم العام",
    "المحور ودرجته"
  ];

  const csvCell = (value) => {
    let text = String(value ?? "");

    // منع تفسير القيم النصية غير الموثوقة كصيغ داخل Excel.
    if (/^[\s]*[=+\-@]/.test(text)) {
      text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
  };

  const rows = visibleDashboardRows.map((row) => {
    const result = row.result || {};
    const domains = result.domains || row.domains || {};
    const displayOrder = [
      ["depression", "الحالة المزاجية"], ["anxiety", "القلق"], ["panic", "نوبات الخوف"],
      ["ocd", "الأفكار المزعجة"], ["adjustment", "المرونة"], ["sleep", "النوم"],
      ["burnout", "الإجهاد الوظيفي"], ["workplace_satisfaction", "الرضا عن بيئة العمل"],
      ["functional_impact", "الحياة اليومية"], ["job_satisfaction", "مؤشر الرضا الوظيفي"]
    ];
    const domainSummary = displayOrder.filter(([id]) => typeof domains[id]?.average === "number")
      .map(([id, label]) => label + ": " + Number(domains[id].average).toFixed(1) + "/4").join("؛ ");
    const dateOnly = row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "";
    const overall = result.overallFollowUpCategory ||
      (["urgent_safety", "immediate_safety_contact"].includes(result.followUp?.level)
        ? "عرض عاجل على متخصص"
        : ["prompt_human_review", "specialist_review"].includes(result.followUp?.level)
          ? "العرض على أخصائي طب نفسي"
          : result.followUp?.level === "offer_support" ? "تثقيف نفسي ومتابعة" : "لا يوجد ما يستدعي التدخل");
    return [dateOnly, row.user_email || "", row.scale_version || result.scaleVersion || "", overall, domainSummary];
  });

  const csv = "\uFEFF" + [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(","))
  ].join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "FieldMind-results.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  message(
    "results-message",
    `تم تجهيز ملف CSV يحتوي على ${rows.length} سجلًا.`
  );
});
  // التنقل بين صفحات النتائج.
$("results-prev")?.addEventListener("click", () => {
  if (dashboardPage > 0) {
    dashboardPage--;
    renderFilteredDashboard(false);
  }
});

$("results-next")?.addEventListener("click", () => {
  const totalPages = Math.ceil(
    visibleDashboardRows.length / dashboardPageSize
  );

  if (dashboardPage < totalPages - 1) {
    dashboardPage++;
    renderFilteredDashboard(false);
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
      if (data?.error) throw new Error(data.error);

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


  // دعوة مستخدم جديد بصلاحية worker فقط من خلال دالة الخادم.
  async function inviteWorker(event) {
    event.preventDefault();
    if (!isSuperAdmin || !db()) {
      message("users-message", "ليس لديك صلاحية تنفيذ هذا الإجراء.", true);
      return;
    }

    const emailInput = $("new-user-email");
    const button = $("invite-user-button");
    const email = emailInput.value.trim().toLowerCase();
    if (!email || !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    button.disabled = true;
    message("users-message", "جارٍ إنشاء الحساب وإرسال دعوة الدخول...");

    try {
      const { data, error } = await db().functions.invoke(
        "fieldmind-admin-users",
        { body: { action: "invite_worker", email } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      emailInput.value = "";
      await loadAdminUsers();
      message("users-message", "تم إنشاء حساب المستخدم العادي وإرسال دعوة الدخول إلى " + email + ".");
    } catch (error) {
      console.error("Invite user error:", error);
      const detail = typeof error?.message === "string" ? error.message : "";
      message(
        "users-message",
        detail.includes("already") || detail.includes("registered")
          ? "تعذر إنشاء الحساب: يبدو أن هذا البريد مسجل بالفعل. حدّث قائمة الحسابات للتحقق منه."
          : "تعذر إنشاء الحساب أو إرسال الدعوة. تحقق من البريد الإلكتروني وإعدادات البريد ثم أعد المحاولة.",
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
          shouldCreateUser: false,
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

  // إرسال دعوة لمستخدم عادي جديد.
  $("invite-user-form").addEventListener("submit", inviteWorker);

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
