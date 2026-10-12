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
    panels.forEach(id => $(id).classList.toggle("hidden", !ids.includes(id)));
  }
  function message(id, text, error = false) {
    const el = $(id); if (!el) return;
    el.textContent = text;
    el.style.color = error ? "#a12626" : "";
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function setLoggedOut() {
    session = null; isAdmin = false;
    showOnly(["auth-panel"]);
  }
  async function checkAdmin() {
    if (!db() || !session) return false;
    const { data, error } = await db().from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (error) console.warn("Role lookup failed", error.message);
    return !!data;
  }
  async function setLoggedIn(nextSession) {
    session = nextSession;
    if (!session) return setLoggedOut();
    showOnly(["app-panel"]);
    $("current-email").textContent = session.user.email || "حساب موثق";
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
    const item = config.items[currentQuestion];
    const selected = answers[item.id];
    $("progress-label").textContent = `السؤال ${currentQuestion + 1} من ${config.items.length}`;
    $("progress-count").textContent = `${Math.round(((currentQuestion + 1) / config.items.length) * 100)}%`;
    $("progress-bar").style.width = `${((currentQuestion + 1) / config.items.length) * 100}%`;
    $("questions-container").innerHTML = `
      <div class="question-title">${escapeHtml(item.text)}</div>
      <div role="radiogroup" aria-label="${escapeHtml(item.text)}">
${(item.options || config.responseScales[item.responseScale] || []).map(o => `<label class="choice"><input type="radio" name="answer" value="${o.value}" ${String(selected) === String(o.value) ? "checked" : ""}><span>${escapeHtml(o.label)}</span></label>`).join("")}
      </div>`;
    $("previous-button").disabled = currentQuestion === 0;
    $("next-button").classList.toggle("hidden", currentQuestion === config.items.length - 1);
    $("submit-assessment-button").classList.toggle("hidden", currentQuestion !== config.items.length - 1);
    message("form-message", "");
  }
  function saveCurrentAnswer() {
    const picked = document.querySelector('input[name="answer"]:checked');
    if (!picked) return false;
    answers[config.items[currentQuestion].id] = Number(picked.value);
    return true;
  }
  function validateAllAnswered() {
    return config.items.every(item => Number.isFinite(answers[item.id]));
  }
  async function submitAssessment(event) {
    event.preventDefault();
    if (!saveCurrentAnswer()) return message("form-message", "يرجى اختيار إجابة قبل المتابعة.", true);
    if (!validateAllAnswered()) return message("form-message", "توجد أسئلة لم تتم الإجابة عنها.", true);
    if (!db() || !session) return message("form-message", "تعذر الاتصال الآمن بقاعدة البيانات. تحقق من إعداد Supabase.", true);
    $("submit-assessment-button").disabled = true;
    message("form-message", "جارٍ حفظ التقييم...");
    const payload = {
      user_id: session.user.id,
      scale_version: config.version,
      answers: answers,
      result: { status: "pending_scale_configuration", note: "لم يتم احتساب نتيجة نفسية لأن المقياس التجريبي غير معتمد." },
      consent_given: true
    };
    const { error } = await db().from("assessments").insert(payload);
    $("submit-assessment-button").disabled = false;
    if (error) {
      console.error(error);
      return message("form-message", "لم نتمكن من حفظ التقييم. تأكد من تشغيل schema.sql وإعداد صلاحيات المستخدم.", true);
    }
    $("assessment-form").classList.add("hidden");
    $("start-view").classList.add("hidden");
    $("result-view").classList.remove("hidden");
    $("result-summary").textContent = "تم حفظ إجاباتك بنجاح. لم يتم إصدار تصنيف نفسي في هذه النسخة التجريبية، لأن أسئلة المقياس الخاص ومعادلاته وحدود تصنيفه لم تُضف بعد.";
    if (isAdmin) loadAdminRecords();
  }
  async function loadAdminRecords() {
    if (!isAdmin || !db()) return;
    message("admin-message", "جارٍ تحميل السجلات...");
    const { data, error } = await db().from("assessments").select("id,user_id,created_at,result").order("created_at", { ascending: false }).limit(100);
    if (error) {
      console.error(error);
      $("admin-records").innerHTML = '<tr><td colspan="3">تعذر تحميل السجلات. تحقق من صلاحيات الإدارة.</td></tr>';
      return message("admin-message", "تعذر تحميل السجلات.", true);
    }
    $("admin-records").innerHTML = data.length ? data.map(row => `<tr><td>${escapeHtml(new Date(row.created_at).toLocaleString("ar-EG"))}</td><td>${escapeHtml(row.user_id)}</td><td>${escapeHtml(row.result?.status || "مسجل")}</td></tr>`).join("") : '<tr><td colspan="3">لا توجد سجلات حتى الآن.</td></tr>';
    message("admin-message", `عدد السجلات المعروضة: ${data.length}`);
  }

  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!db()) return message("auth-message", "أكمل إعداد SUPABASE_URL وSUPABASE_ANON_KEY في ملف supabase.js أولًا.", true);
    const email = $("email").value.trim();
    $("login-button").disabled = true;
    const { error } = await db().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split("#")[0] }
    });
    $("login-button").disabled = false;
    message("auth-message", error ? `تعذر إرسال الرابط: ${error.message}` : "إذا كان البريد مسموحًا به، فستصلك رسالة تتضمن رابط الدخول. افتح الرابط على هذا الجهاز.");
  });
  $("logout-button").addEventListener("click", async () => {
    if (db()) await db().auth.signOut();
    setLoggedOut();
  });
  $("consent").addEventListener("change", () => { $("begin-button").disabled = !$("consent").checked; });
  $("begin-button").addEventListener("click", () => {
    if (!$("consent").checked) return;
    answers = {}; currentQuestion = 0;
    $("start-view").classList.add("hidden");
    $("result-view").classList.add("hidden");
    $("assessment-form").classList.remove("hidden");
    renderQuestion();
  });
  $("previous-button").addEventListener("click", () => {
    saveCurrentAnswer(); currentQuestion = Math.max(0, currentQuestion - 1); renderQuestion();
  });
  $("next-button").addEventListener("click", () => {
    if (!saveCurrentAnswer()) return message("form-message", "يرجى اختيار إجابة قبل المتابعة.", true);
    currentQuestion = Math.min(config.items.length - 1, currentQuestion + 1); renderQuestion();
  });
  $("assessment-form").addEventListener("submit", submitAssessment);
  $("new-assessment-button").addEventListener("click", () => {
    $("result-view").classList.add("hidden"); $("assessment-form").classList.add("hidden");
    $("start-view").classList.remove("hidden"); $("consent").checked = false; $("begin-button").disabled = true;
  });
  $("refresh-admin-button").addEventListener("click", loadAdminRecords);

  if (!db()) {
    message("auth-message", "هذه الواجهة جاهزة، لكن يلزم ربط مشروع Supabase قبل تسجيل الدخول.");
  } else {
    db().auth.getSession().then(({ data }) => setLoggedIn(data.session));
    db().auth.onAuthStateChange((_event, nextSession) => {
      // Defer network calls to avoid blocking the auth event callback.
      setTimeout(() => setLoggedIn(nextSession), 0);
    });
  }
})();
