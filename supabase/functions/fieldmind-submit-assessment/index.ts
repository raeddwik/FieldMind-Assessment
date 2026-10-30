import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set(["https://raeddwik.github.io", "http://localhost:8001", "http://localhost:8010", "http://127.0.0.1:8010"]);
const CONFIG = {"version":"FIELDMIND-INTERNAL-1.1-DRAFT","items":[{"id":"dep_01","domain":"depression","scale":"frequency_0_4"},{"id":"dep_02","domain":"depression","scale":"frequency_0_4"},{"id":"dep_03","domain":"depression","scale":"frequency_0_4"},{"id":"dep_04","domain":"depression","scale":"frequency_0_4"},{"id":"dep_05","domain":"depression","scale":"frequency_0_4"},{"id":"anx_01","domain":"anxiety","scale":"frequency_0_4"},{"id":"anx_02","domain":"anxiety","scale":"frequency_0_4"},{"id":"anx_03","domain":"anxiety","scale":"frequency_0_4"},{"id":"anx_04","domain":"anxiety","scale":"frequency_0_4"},{"id":"panic_01","domain":"panic","scale":"frequency_0_4"},{"id":"panic_02","domain":"panic","scale":"frequency_0_4"},{"id":"panic_03","domain":"panic","scale":"frequency_0_4"},{"id":"ocd_01","domain":"ocd","scale":"frequency_0_4"},{"id":"ocd_02","domain":"ocd","scale":"frequency_0_4"},{"id":"ocd_03","domain":"ocd","scale":"frequency_0_4"},{"id":"adj_01","domain":"adjustment","scale":"frequency_0_4"},{"id":"adj_02","domain":"adjustment","scale":"frequency_0_4"},{"id":"adj_03","domain":"adjustment","scale":"frequency_0_4"},{"id":"bip_01","domain":"bipolar_indicators","scale":"yes_no_optional"},{"id":"bip_02","domain":"bipolar_indicators","scale":"yes_no_optional"},{"id":"bip_03","domain":"bipolar_indicators","scale":"yes_no_optional"},{"id":"sleep_01","domain":"sleep","scale":"frequency_0_4"},{"id":"sleep_02","domain":"sleep","scale":"frequency_0_4"},{"id":"sleep_03","domain":"sleep","scale":"frequency_0_4"},{"id":"sleep_04","domain":"sleep","scale":"frequency_0_4"},{"id":"psych_01","domain":"psychosis_indicators","scale":"yes_no_optional"},{"id":"psych_02","domain":"psychosis_indicators","scale":"yes_no_optional"},{"id":"psych_03","domain":"psychosis_indicators","scale":"yes_no_optional"},{"id":"burn_01","domain":"burnout","scale":"frequency_0_4"},{"id":"burn_02","domain":"burnout","scale":"frequency_0_4"},{"id":"burn_03","domain":"burnout","scale":"frequency_0_4"},{"id":"burn_04","domain":"burnout","scale":"frequency_0_4"},{"id":"sat_01","domain":"job_satisfaction","scale":"agreement_0_4"},{"id":"sat_02","domain":"workplace_satisfaction","scale":"agreement_0_4"},{"id":"sat_03","domain":"workplace_satisfaction","scale":"agreement_0_4"},{"id":"sat_04","domain":"workplace_satisfaction","scale":"agreement_0_4"},{"id":"sat_05","domain":"workplace_satisfaction","scale":"agreement_0_4"},{"id":"func_01","domain":"functional_impact","scale":"frequency_0_4"},{"id":"func_02","domain":"functional_impact","scale":"frequency_0_4"},{"id":"func_03","domain":"functional_impact","scale":"frequency_0_4"},{"id":"safe_01","domain":"critical_indicators","scale":"yes_no_optional"},{"id":"safe_02","domain":"critical_indicators","scale":"yes_no_optional"}],"domains":[{"id":"depression","title":"مؤشرات المزاج المنخفض وفقدان المتعة","kind":"frequency"},{"id":"anxiety","title":"مؤشرات القلق والانشغال الزائد","kind":"frequency"},{"id":"panic","title":"مؤشرات نوبات الخوف المفاجئ","kind":"frequency"},{"id":"ocd","title":"مؤشرات الأفكار الاقتحامية والسلوكيات المتكررة","kind":"frequency"},{"id":"adjustment","title":"المرونة في التعامل مع الضغوط","kind":"frequency"},{"id":"bipolar_indicators","title":"مؤشرات تستدعي استيضاحًا متخصصًا بشأن تغيرات المزاج والطاقة","kind":"flag"},{"id":"sleep","title":"النوم والنعاس والإجهاد","kind":"frequency"},{"id":"psychosis_indicators","title":"مؤشرات تستدعي استيضاحًا متخصصًا بشأن الخبرات الإدراكية أو المعتقدات","kind":"flag"},{"id":"burnout","title":"الإنهاك المرتبط بالعمل","kind":"frequency"},{"id":"workplace_satisfaction","title":"الرضا عن بيئة العمل","kind":"agreement"},{"id":"job_satisfaction","title":"مؤشر الرضا الوظيفي","kind":"agreement"},{"id":"functional_impact","title":"التأثير على الحياة اليومية والعمل","kind":"frequency"},{"id":"critical_indicators","title":"أسئلة السلامة التي تتطلب انتباهًا منفصلًا","kind":"safety"}]} as const;
function cors(req:Request):Record<string,string>{
 const origin=req.headers.get("Origin");
 return {...(origin&&ALLOWED_ORIGINS.has(origin)?{"Access-Control-Allow-Origin":origin}:{}),"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
}
function reply(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(req),"Content-Type":"application/json; charset=utf-8"}});}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!ALLOWED_ORIGINS.has(origin))return reply(req,{error:"Origin not allowed"},403);
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
 if(req.method!=="POST")return reply(req,{error:"Method not allowed"},405);
 const authorization=req.headers.get("Authorization");
 if(!authorization?.startsWith("Bearer "))return reply(req,{error:"Authentication required"},401);
 const supabaseUrl=Deno.env.get("SUPABASE_URL"),anonKey=Deno.env.get("SUPABASE_ANON_KEY"),serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!supabaseUrl||!anonKey||!serviceRoleKey)return reply(req,{error:"Server configuration incomplete"},500);
 const token=authorization.slice(7);
 const authClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await authClient.auth.getUser(token);
 if(authError||!authData.user)return reply(req,{error:"Invalid session"},401);
 let body:any;try{body=await req.json();}catch{return reply(req,{error:"Invalid JSON body"},400);}
 if(!body||typeof body!=="object"||Array.isArray(body))return reply(req,{error:"Invalid JSON body"},400);
 if(body.scale_version!==CONFIG.version)return reply(req,{error:"Unsupported questionnaire version"},400);
 if (body.consent_given !== true)return reply(req,{error:"Consent is required"},400);
 const answers=body.answers;
 if(!answers||typeof answers!=="object"||Array.isArray(answers))return reply(req,{error:"Invalid answers"},400);
 const ids=CONFIG.items.map((item:any)=>item.id);
 if(Object.keys(answers).length!==ids.length||ids.some(id=>!Object.prototype.hasOwnProperty.call(answers,id)))return reply(req,{error:"Answers are incomplete or contain unexpected fields"},400);
 for(const item of CONFIG.items as readonly any[]){
   const value=answers[item.id];
   const max=item.scale==="yes_no_optional"?2:4;
   if(!Number.isInteger(value)||value<0||value>max)return reply(req,{error:"Invalid answer value"},400);
 }
 const items = CONFIG.items as readonly any[];
 const criticalItems = items.filter(item => item.domain === "critical_indicators");
 const positiveItemIds = criticalItems.filter(item => answers[item.id] === 1).map(item => item.id);
 const recentThoughtItemIds = positiveItemIds.filter(id => id === "safe_01");
 const immediateDangerItemIds = positiveItemIds.filter(id => id === "safe_02");
 const declined = criticalItems.filter(item => answers[item.id] === 2);
 const declinedCount = declined.length;
 const declinedItemIds = declined.map(item => item.id);
 const safetyStatus = immediateDangerItemIds.length > 0
   ? "immediate_safety_contact_required"
   : recentThoughtItemIds.length > 0
     ? "prompt_confidential_human_review"
     : declinedCount > 0
       ? "answer_declined"
       : "no_automated_classification";

 // Return descriptive domain summaries from the server so the saved result and
 // the user's result screen use the same trusted server response.
 const domains: Record<string, any> = {};
 for (const domain of CONFIG.domains as readonly any[]) {
   if (domain.id === "critical_indicators") continue;
   const domainItems = items.filter(item => item.domain === domain.id);
   const positive = domainItems.filter(item => answers[item.id] === 1);
   if (domain.kind === "flag") {
     const declinedDomainItems = domainItems.filter(item => answers[item.id] === 2);
     domains[domain.id] = {
       title: domain.title,
       kind: "flag",
       positiveCount: positive.length,
       positiveItemIds: positive.map(item => item.id),
       declinedCount: declinedDomainItems.length,
       declinedItemIds: declinedDomainItems.map(item => item.id),
       status: positive.length ? "needs_specialist_review" : "no_flagged_response",
       interpretation: "إجابات للاستضاح المتخصص فقط؛ لا تثبت أو تنفي تشخيصًا."
     };
     continue;
   }
   const values = domainItems.map(item => answers[item.id]);
   const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
   const positiveDirection = domain.kind === "agreement";
   const descriptiveBand = positiveDirection
     ? average >= 3 ? "ممتاز" : average >= 2 ? "جيد" : average >= 1 ? "مقبول" : "منخفض"
     : average < 1 ? "ممتاز" : average < 2 ? "جيد" : average < 3 ? "مقبول" : "منخفض";
   domains[domain.id] = {
     title: domain.title,
     kind: domain.kind,
     average: Math.round(average * 100) / 100,
     responseRange: "0–4",
     descriptiveBand,
     interpretationDirection: positiveDirection ? "higher_is_better" : "lower_is_better",
     status: "descriptive_only",
     interpretation: domain.id === "job_satisfaction"
       ? "متوسط الموافقة على عبارات الرضا؛ ليس مقياسًا معتمدًا."
       : "متوسط تكرار الإجابات؛ ليس درجة شدة سريرية ولا تشخيصًا."
   };
 }
 const averages = Object.entries(domains)
   .filter(([id, value]) => !["job_satisfaction","workplace_satisfaction"].includes(id) && typeof (value as any).average === "number")
   .map(([id, value]) => ({ id, average: (value as any).average as number }));
 const elevatedDomains = averages.filter(value => value.average >= 2.5);
 const moderateDomains = averages.filter(value => value.average >= 1.5);
 const functionalAverage = typeof domains.functional_impact?.average === "number"
   ? domains.functional_impact.average : 0;
 const satisfactionAverage = [domains.job_satisfaction?.average, domains.workplace_satisfaction?.average]
   .filter((value): value is number => typeof value === "number")
   .reduce((lowest, value) => Math.min(lowest, value), 4);
 let followUp = {
   level: "routine",
   label: "متابعة اعتيادية وإتاحة طلب المساعدة",
   recommendation: "هذه خلاصة وصفية تجريبية فقط. يمكن للعامل طلب الدعم في أي وقت، ولا تُستخدم النتيجة وحدها لاتخاذ قرار وظيفي."
 };
 if (moderateDomains.length || (satisfactionAverage !== null && satisfactionAverage < 2)) {
   followUp = {
     level: "offer_support",
     label: "عرض الدعم والمتابعة",
     recommendation: "يمكن عرض تواصل سري وغير عقابي مع مسؤول صحة مهنية مؤهل أو مختص مناسب لمناقشة الضغوط والدعم المطلوب. هذه النتيجة ليست تشخيصًا."
   };
 }
 if (elevatedDomains.length || functionalAverage >= 2.5 ||
     (domains.bipolar_indicators?.positiveCount || 0) > 0 ||
     (domains.psychosis_indicators?.positiveCount || 0) > 0) {
   followUp = {
     level: "specialist_review",
     label: "اقتراح مراجعة مختص",
     recommendation: "يُقترح التواصل بسرية مع العامل وعرض تقييم لدى مختص مناسب. المؤشرات لا تثبت اضطرابًا بعينه ولا تمثل درجة شدة سريرية."
   };
 }
 if (declinedCount > 0 && positiveItemIds.length === 0) {
   followUp = {
     level: "offer_support",
     label: "إتاحة تواصل سري اختياري",
     recommendation: "اختار العامل عدم الإجابة عن سؤال سلامة واحد أو أكثر. لا يُفسر ذلك على أنه وجود خطر أو غيابه؛ تُتاح فرصة سرية واختيارية للتحدث مع شخص مؤهل دون ضغط أو عقوبة."
   };
 }
 if (recentThoughtItemIds.length > 0) {
   followUp = {
     level: "prompt_human_review",
     label: "مراجعة بشرية سرية في أقرب وقت",
     recommendation: "تستلزم الإجابة تواصلًا بشريًا مباشرًا وسريًا من شخص مؤهل للاستماع والتحقق من الاحتياج الحالي للمساندة. لا يُستنتج مستوى الخطر من الاستبيان وحده."
   };
 }
 if (immediateDangerItemIds.length > 0) {
   followUp = {
     level: "immediate_safety_contact",
     label: "تحقق فوري من السلامة",
     recommendation: "تشير الإجابة إلى أن العامل قد لا يكون قادرًا حاليًا على الحفاظ على سلامته أو سلامة الآخرين. يجب تفعيل إجراء الاستجابة العاجلة المعتمد بالمؤسسة والتواصل فورًا وبشكل مباشر مع شخص مؤهل؛ وعند وجود خطر وشيك تُطلب خدمات الطوارئ المحلية. لا يُستخدم الاستبيان وحده لتقدير مستوى الخطر."
   };
 }
 const result={
   status:"calculation_preview_only",
   scaleVersion:CONFIG.version,
   previewOnly:true,
   domains,
   followUp,
   criticalIndicators:{positiveItemIds,recentThoughtItemIds,immediateDangerItemIds,declinedCount,declinedItemIds,status:safetyStatus},
   overallFollowUpCategory: immediateDangerItemIds.length ? "عرض عاجل على متخصص" : recentThoughtItemIds.length || (domains.bipolar_indicators?.positiveCount || 0) > 0 || (domains.psychosis_indicators?.positiveCount || 0) > 0 || elevatedDomains.length || functionalAverage >= 2.5 ? "العرض على أخصائي طب نفسي" : moderateDomains.length || (satisfactionAverage !== null && satisfactionAverage < 2) || declinedCount > 0 ? "تثقيف نفسي ومتابعة" : "لا يوجد ما يستدعي التدخل",
   overallClinicalScore:null,
   classification:null,
   clinicalValidation:"not_established",
   note:"هذه نسخة استرشادية تجريبية فقط؛ لا تمثل تشخيصًا نفسيًا أو قرار لياقة للعمل، ولا تستخدم وحدها لاتخاذ قرار وظيفي."
 };
 const serviceClient=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:inserted,error:insertError}=await serviceClient.from("assessments").insert({user_id:authData.user.id,scale_version:CONFIG.version,answers,result,consent_given:true}).select("id,created_at").single();
 if(insertError||!inserted){console.error("Assessment insert failed",insertError?.message);return reply(req,{error:"Unable to save assessment"},500);}
 return reply(req,{ok:true,assessment:inserted,result});
});