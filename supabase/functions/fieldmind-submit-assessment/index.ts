import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set(["https://raeddwik.github.io", "http://localhost:8001"]);
const CONFIG = {"version":"FIELDMIND-INTERNAL-1.0-DRAFT","items":[{"id":"dep_01","domain":"depression","scale":"frequency_0_4"},{"id":"dep_02","domain":"depression","scale":"frequency_0_4"},{"id":"dep_03","domain":"depression","scale":"frequency_0_4"},{"id":"dep_04","domain":"depression","scale":"frequency_0_4"},{"id":"dep_05","domain":"depression","scale":"frequency_0_4"},{"id":"anx_01","domain":"anxiety","scale":"frequency_0_4"},{"id":"anx_02","domain":"anxiety","scale":"frequency_0_4"},{"id":"anx_03","domain":"anxiety","scale":"frequency_0_4"},{"id":"anx_04","domain":"anxiety","scale":"frequency_0_4"},{"id":"panic_01","domain":"panic","scale":"frequency_0_4"},{"id":"panic_02","domain":"panic","scale":"frequency_0_4"},{"id":"panic_03","domain":"panic","scale":"frequency_0_4"},{"id":"ocd_01","domain":"ocd","scale":"frequency_0_4"},{"id":"ocd_02","domain":"ocd","scale":"frequency_0_4"},{"id":"ocd_03","domain":"ocd","scale":"frequency_0_4"},{"id":"adj_01","domain":"adjustment","scale":"frequency_0_4"},{"id":"adj_02","domain":"adjustment","scale":"frequency_0_4"},{"id":"adj_03","domain":"adjustment","scale":"frequency_0_4"},{"id":"bip_01","domain":"bipolar_indicators","scale":"yes_no_optional"},{"id":"bip_02","domain":"bipolar_indicators","scale":"yes_no_optional"},{"id":"bip_03","domain":"bipolar_indicators","scale":"yes_no_optional"},{"id":"sleep_01","domain":"sleep","scale":"frequency_0_4"},{"id":"sleep_02","domain":"sleep","scale":"frequency_0_4"},{"id":"sleep_03","domain":"sleep","scale":"frequency_0_4"},{"id":"sleep_04","domain":"sleep","scale":"frequency_0_4"},{"id":"psych_01","domain":"psychosis_indicators","scale":"yes_no_optional"},{"id":"psych_02","domain":"psychosis_indicators","scale":"yes_no_optional"},{"id":"psych_03","domain":"psychosis_indicators","scale":"yes_no_optional"},{"id":"burn_01","domain":"burnout","scale":"frequency_0_4"},{"id":"burn_02","domain":"burnout","scale":"frequency_0_4"},{"id":"burn_03","domain":"burnout","scale":"frequency_0_4"},{"id":"burn_04","domain":"burnout","scale":"frequency_0_4"},{"id":"sat_01","domain":"job_satisfaction","scale":"agreement_0_4"},{"id":"sat_02","domain":"job_satisfaction","scale":"agreement_0_4"},{"id":"sat_03","domain":"job_satisfaction","scale":"agreement_0_4"},{"id":"sat_04","domain":"job_satisfaction","scale":"agreement_0_4"},{"id":"sat_05","domain":"job_satisfaction","scale":"agreement_0_4"},{"id":"func_01","domain":"functional_impact","scale":"frequency_0_4"},{"id":"func_02","domain":"functional_impact","scale":"frequency_0_4"},{"id":"func_03","domain":"functional_impact","scale":"frequency_0_4"},{"id":"safe_01","domain":"critical_indicators","scale":"yes_no_optional"},{"id":"safe_02","domain":"critical_indicators","scale":"yes_no_optional"}],"domains":[{"id":"depression","title":"مؤشرات المزاج المنخفض وفقدان المتعة","kind":"frequency"},{"id":"anxiety","title":"مؤشرات القلق والانشغال الزائد","kind":"frequency"},{"id":"panic","title":"مؤشرات نوبات الخوف المفاجئ","kind":"frequency"},{"id":"ocd","title":"مؤشرات الأفكار الاقتحامية والسلوكيات المتكررة","kind":"frequency"},{"id":"adjustment","title":"صعوبات التكيف مع الضغوط أو التغيرات","kind":"frequency"},{"id":"bipolar_indicators","title":"مؤشرات تستدعي استيضاحًا متخصصًا بشأن تغيرات المزاج والطاقة","kind":"flag"},{"id":"sleep","title":"النوم والنعاس والإجهاد","kind":"frequency"},{"id":"psychosis_indicators","title":"مؤشرات تستدعي استيضاحًا متخصصًا بشأن الخبرات الإدراكية أو المعتقدات","kind":"flag"},{"id":"burnout","title":"الإنهاك المرتبط بالعمل","kind":"frequency"},{"id":"job_satisfaction","title":"الرضا عن العمل وبيئته","kind":"agreement"},{"id":"functional_impact","title":"التأثير على الحياة اليومية والعمل","kind":"frequency"},{"id":"critical_indicators","title":"أسئلة السلامة التي تتطلب انتباهًا منفصلًا","kind":"safety"}]} as const;
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
 if(body.consent_given!==true)return reply(req,{error:"Consent is required"},400);
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
 const declined = criticalItems.filter(item => answers[item.id] === 2);
 const declinedCount = declined.length;
 const declinedItemIds = declined.map(item => item.id);
 const safetyStatus = positiveItemIds.length
   ? "requires_human_review"
   : declinedCount > 0
     ? "answer_declined"
     : "no_automated_classification";
 const result={
   status:"calculation_preview_only",
   scaleVersion:CONFIG.version,
   previewOnly:true,
   domains:{},
   followUp:{
     label:positiveItemIds.length?"توجد إجابة تستلزم مراجعة بشرية":"لم يتم إصدار توصية آلية",
     recommendation:positiveItemIds.length?"يرجى تفعيل مسار دعم بشري مناسب بسرعة، مع مراعاة السلامة والخصوصية.":"تُراجع الإجابات مع مختص مؤهل عند الحاجة. لا تُستخدم هذه النتيجة وحدها لاتخاذ قرار طبي أو وظيفي."
   },
   criticalIndicators:{positiveItemIds,declinedCount,declinedItemIds,status:safetyStatus},
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