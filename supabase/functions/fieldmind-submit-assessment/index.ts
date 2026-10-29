import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set([
  "https://raeddwik.github.io",
  "http://localhost:8001",
]);
function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const CONFIG = {"version":"FIELDMIND-INTERNAL-1.0-DRAFT","items":[{"id":"dep_01","domain":"depression","scale":"frequency_0_4","safetyType":null},{"id":"dep_02","domain":"depression","scale":"frequency_0_4","safetyType":null},{"id":"dep_03","domain":"depression","scale":"frequency_0_4","safetyType":null},{"id":"dep_04","domain":"depression","scale":"frequency_0_4","safetyType":null},{"id":"dep_05","domain":"depression","scale":"frequency_0_4","safetyType":null},{"id":"anx_01","domain":"anxiety","scale":"frequency_0_4","safetyType":null},{"id":"anx_02","domain":"anxiety","scale":"frequency_0_4","safetyType":null},{"id":"anx_03","domain":"anxiety","scale":"frequency_0_4","safetyType":null},{"id":"anx_04","domain":"anxiety","scale":"frequency_0_4","safetyType":null},{"id":"panic_01","domain":"panic","scale":"frequency_0_4","safetyType":null},{"id":"panic_02","domain":"panic","scale":"frequency_0_4","safetyType":null},{"id":"panic_03","domain":"panic","scale":"frequency_0_4","safetyType":null},{"id":"ocd_01","domain":"ocd","scale":"frequency_0_4","safetyType":null},{"id":"ocd_02","domain":"ocd","scale":"frequency_0_4","safetyType":null},{"id":"ocd_03","domain":"ocd","scale":"frequency_0_4","safetyType":null},{"id":"adj_01","domain":"adjustment","scale":"frequency_0_4","safetyType":null},{"id":"adj_02","domain":"adjustment","scale":"frequency_0_4","safetyType":null},{"id":"adj_03","domain":"adjustment","scale":"frequency_0_4","safetyType":null},{"id":"bip_01","domain":"bipolar_indicators","scale":"yes_no_optional","safetyType":null},{"id":"bip_02","domain":"bipolar_indicators","scale":"yes_no_optional","safetyType":null},{"id":"bip_03","domain":"bipolar_indicators","scale":"yes_no_optional","safetyType":null},{"id":"sleep_01","domain":"sleep","scale":"frequency_0_4","safetyType":null},{"id":"sleep_02","domain":"sleep","scale":"frequency_0_4","safetyType":null},{"id":"sleep_03","domain":"sleep","scale":"frequency_0_4","safetyType":null},{"id":"sleep_04","domain":"sleep","scale":"frequency_0_4","safetyType":null},{"id":"psych_01","domain":"psychosis_indicators","scale":"yes_no_optional","safetyType":null},{"id":"psych_02","domain":"psychosis_indicators","scale":"yes_no_optional","safetyType":null},{"id":"psych_03","domain":"psychosis_indicators","scale":"yes_no_optional","safetyType":null},{"id":"burn_01","domain":"burnout","scale":"frequency_0_4","safetyType":null},{"id":"burn_02","domain":"burnout","scale":"frequency_0_4","safetyType":null},{"id":"burn_03","domain":"burnout","scale":"frequency_0_4","safetyType":null},{"id":"burn_04","domain":"burnout","scale":"frequency_0_4","safetyType":null},{"id":"sat_01","domain":"job_satisfaction","scale":"agreement_0_4","safetyType":null},{"id":"sat_02","domain":"job_satisfaction","scale":"agreement_0_4","safetyType":null},{"id":"sat_03","domain":"job_satisfaction","scale":"agreement_0_4","safetyType":null},{"id":"sat_04","domain":"job_satisfaction","scale":"agreement_0_4","safetyType":null},{"id":"sat_05","domain":"job_satisfaction","scale":"agreement_0_4","safetyType":null},{"id":"func_01","domain":"functional_impact","scale":"frequency_0_4","safetyType":null},{"id":"func_02","domain":"functional_impact","scale":"frequency_0_4","safetyType":null},{"id":"func_03","domain":"functional_impact","scale":"frequency_0_4","safetyType":null},{"id":"safe_01","domain":"critical_indicators","scale":"yes_no_optional","safetyType":"self_harm"},{"id":"safe_02","domain":"critical_indicators","scale":"yes_no_optional","safetyType":"immediate_danger"}],"domains":[{"id":"depression","title":"مؤشرات المزاج المنخفض وفقدان المتعة","kind":"frequency"},{"id":"anxiety","title":"مؤشرات القلق والانشغال الزائد","kind":"frequency"},{"id":"panic","title":"مؤشرات نوبات الخوف المفاجئ","kind":"frequency"},{"id":"ocd","title":"مؤشرات الأفكار الاقتحامية والسلوكيات المتكررة","kind":"frequency"},{"id":"adjustment","title":"صعوبات التكيف مع الضغوط أو التغيرات","kind":"frequency"},{"id":"bipolar_indicators","title":"مؤشرات تستدعي استيضاحًا متخصصًا بشأن تغيرات المزاج والطاقة","kind":"flag"},{"id":"sleep","title":"النوم والنعاس والإجهاد","kind":"frequency"},{"id":"psychosis_indicators","title":"مؤشرات تستدعي استيضاحًا متخصصًا بشأن الخبرات الإدراكية أو المعتقدات","kind":"flag"},{"id":"burnout","title":"الإنهاك المرتبط بالعمل","kind":"frequency"},{"id":"job_satisfaction","title":"الرضا عن العمل وبيئته","kind":"agreement"},{"id":"functional_impact","title":"التأثير على الحياة اليومية والعمل","kind":"frequency"},{"id":"critical_indicators","title":"أسئلة السلامة التي تتطلب انتباهًا منفصلًا","kind":"safety"}]} as const;
function reply(body: unknown, status = 200, req?: Request) {
  const headers = req ? corsHeadersFor(req) : { "Vary": "Origin" };
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}
function calculate(answers: Record<string, number>) {
  const domains: Record<string, any> = {};
  for (const domain of CONFIG.domains) {
    if (domain.id === "critical_indicators") continue;
    const items = CONFIG.items.filter(item => item.domain === domain.id);
    const positives = items.filter(item => answers[item.id] === 1);
    const declined = items.filter(item => answers[item.id] === 2);
    if (domain.kind === "flag") {
      domains[domain.id] = {
        title: domain.title,
        kind: "flag",
        positiveCount: positives.length,
        positiveItemIds: positives.map(item => item.id),
        declinedCount: declined.length,
        declinedItemIds: declined.map(item => item.id),
        status: positives.length
          ? "needs_specialist_review"
          : declined.length
            ? "answer_declined"
            : "no_flagged_response",
        interpretation: "إجابات للاستضياح المتخصص فقط؛ لا تثبت أو تنفي تشخيصًا."
      };
    } else {
      const average = items.reduce((sum, item) => sum + answers[item.id], 0) / Math.max(items.length, 1);
      let descriptiveBand = "تكرار مُبلّغ عنه أقل في هذه الإجابات";
      if (domain.kind === "agreement") descriptiveBand = average < 2 ? "مستوى موافقة أقل؛ قد يفيد استكشاف ظروف العمل" : average >= 3 ? "مستوى موافقة أعلى على عبارات الرضا" : "مستوى موافقة متوسط على عبارات الرضا";
      else if (average >= 2.5) descriptiveBand = "تكرار مُبلّغ عنه أعلى نسبيًا؛ يستحق مراجعة";
      else if (average >= 1.5) descriptiveBand = "تكرار مُبلّغ عنه متوسط؛ قد تستفيد من المتابعة";
      domains[domain.id] = { title: domain.title, kind: domain.kind, average: Math.round(average * 100) / 100,
        responseRange: "0–4", descriptiveBand, status: "descriptive_only",
        interpretation: domain.id === "job_satisfaction" ? "متوسط الموافقة على عبارات الرضا؛ ليس مقياسًا معتمدًا." : "متوسط تكرار الإجابات؛ ليس درجة شدة سريرية ولا تشخيصًا." };
    }
  }
  const safety = CONFIG.items.filter(item => item.domain === "critical_indicators");
  const positive = safety.filter(item => answers[item.id] === 1);
  const declined = safety.filter(item => answers[item.id] === 2);
  const immediateDanger = positive.some(item => item.safetyType === "immediate_danger");
  const selfHarmThoughts = positive.some(item => item.safetyType === "self_harm");
  const specialistFlags = ["bipolar_indicators", "psychosis_indicators"].flatMap(id => domains[id]?.positiveItemIds || []);
  const elevatedDomains = Object.entries(domains).filter(([id,v]) => id !== "job_satisfaction" && typeof v.average === "number" && v.average >= 2.5).map(([id])=>id);
  const moderateDomains = Object.entries(domains).filter(([id,v]) => id !== "job_satisfaction" && typeof v.average === "number" && v.average >= 1.5).map(([id])=>id);
  const functionalAverage = domains.functional_impact?.average ?? 0;
  const satisfactionAverage = domains.job_satisfaction?.average ?? null;
  let level = "routine", label = "متابعة اعتيادية وإتاحة طلب المساعدة";
  let recommendation = "لا تظهر في هذه الإجابات وحدها مؤشرات مرتفعة وفق قواعد النسخة التجريبية. يمكن للعامل طلب الدعم في أي وقت.";
  if (moderateDomains.length || (satisfactionAverage !== null && satisfactionAverage < 2)) {
    level = "offer_support"; label = "عرض الدعم والمتابعة";
    recommendation = "يُفضّل عرض تواصل سري وغير عقابي مع مسؤول صحة مهنية مؤهل أو مختص مناسب، ومناقشة الضغوط أو الدعم المطلوب. هذه النتيجة ليست تشخيصًا.";
  }
  if (elevatedDomains.length || functionalAverage >= 2.5 || specialistFlags.length) {
    level = "specialist_review"; label = "اقتراح مراجعة مختص";
    recommendation = "يُوصى بالتواصل بسرية مع العامل وعرض تقييم لدى مختص نفسي أو طبي مناسب. الإجابات المتعلقة بتغيرات المزاج والطاقة أو الخبرات الإدراكية تستدعي استيضاحًا متخصصًا ولا تثبت اضطرابًا بعينه.";
  }
  if (declined.length && !selfHarmThoughts && !immediateDanger) {
    level = "offer_support"; label = "إتاحة تواصل سري اختياري";
    recommendation = "اختار العامل عدم الإجابة عن سؤال سلامة واحد أو أكثر. لا يُفسَّر ذلك على أنه وجود خطر أو غيابه. يُفضّل إتاحة فرصة سرية واختيارية للتحدث مع شخص مؤهل، دون ضغط أو عقوبة.";
  }
  if (selfHarmThoughts) {
    level = "prompt_human_review"; label = "مراجعة بشرية مباشرة في أقرب وقت";
    recommendation = "تستلزم الإجابة تواصلًا بشريًا مباشرًا وسريًا من شخص مؤهل للتحقق من السلامة الحالية وعرض المساعدة. لا يُستنتج مستوى الخطر من الاستبيان وحده.";
  }
  if (immediateDanger) {
    level = "urgent_safety"; label = "مسار سلامة عاجل";
    recommendation = "يجب تفعيل إجراء السلامة المعتمد فورًا، والتواصل مباشرةً مع العامل لتحديد احتياجاته الحالية بواسطة شخص مؤهل، وطلب المساعدة الطبية الطارئة عند وجود خطر وشيك. لا تترك الشخص دون دعم مناسب.";
  }
  return {
    status: "server_calculated_internal_draft", scaleVersion: CONFIG.version, domains,
    followUp: { level, label, recommendation, elevatedDomains, moderateDomains, specialistFlagItemIds: specialistFlags, selfHarmThoughts, immediateDanger, ruleSet: "internal-pilot-v1", validated: false },
    criticalIndicators: { status: positive.length ? "requires_human_review" : declined.length ? "safety_answer_declined" : "no_positive_response_recorded",
      positiveCount: positive.length, declinedCount: declined.length, totalItems: safety.length,
      positiveItemIds: positive.map(item=>item.id), declinedItemIds: declined.map(item=>item.id), immediateDanger, selfHarmThoughts, clinicalInterpretation: null },
    experimentalIndices: { status: "retired", opri: null, rawOpri: null, opfScore: null, riskLevel: null, recommendedAction: null, validated: false, classificationEnabled: false, note: "تم إيقاف OPRI وOPF؛ لا يستخدم مؤشر إجمالي لاتخاذ قرار المتابعة." },
    overallClinicalScore: null, classification: null, recommendations: recommendation, clinicalValidation: "not_established", previewOnly: true
  };
}
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response("Origin not allowed", { status: 403, headers: { "Vary": "Origin" } });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405, req);
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply({ error: "Authentication required" }, 401, req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return reply({ error: "Server configuration incomplete" }, 500, req);
  const token = authorization.slice(7);
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: "Bearer " + token } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return reply({ error: "Invalid session" }, 401, req);
  let body: { answers?: unknown; scale_version?: unknown; consent_given?: unknown };
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reply({ error: "Invalid JSON body" }, 400, req);
    body = parsed as { answers?: unknown; scale_version?: unknown; consent_given?: unknown };
  } catch { return reply({ error: "Invalid JSON body" }, 400, req); }
  if (body.scale_version !== CONFIG.version) return reply({ error: "Unsupported questionnaire version" }, 400, req);
  if (body.consent_given !== true) return reply({ error: "Consent is required" }, 400, req);
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) return reply({ error: "Invalid answers" }, 400, req);
  const answers = body.answers as Record<string, unknown>;
  const ids = CONFIG.items.map(item => item.id);
  if (Object.keys(answers).length !== ids.length || ids.some(id => !Object.prototype.hasOwnProperty.call(answers,id))) return reply({ error: "Answers are incomplete or contain unexpected fields" }, 400, req);
  for (const item of CONFIG.items) {
    const value = answers[item.id], max = item.scale === "yes_no_optional" ? 2 : 4;
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > max) return reply({ error: "Invalid answer value" }, 400, req);
  }
  const normalized = answers as Record<string, number>;
  const result = calculate(normalized);
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: inserted, error: insertError } = await serviceClient.from("assessments")
    .insert({ user_id: authData.user.id, scale_version: CONFIG.version, answers: normalized, result, consent_given: body.consent_given })
    .select("id,created_at").single();
  if (insertError || !inserted) return reply({ error: "Unable to save assessment" }, 500, req);
  return reply({ ok: true, assessment: inserted, result }, 200, req);
});
