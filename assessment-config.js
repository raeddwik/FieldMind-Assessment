/*
 * TEMPORARY DEMO CONFIGURATION — NOT A CLINICAL SCALE.
 * Replace these demo items, answer options, domain definitions, scoring rules,
 * and cutoffs only after the scale owner supplies the approved specification.
 * Do not deploy real screening with these example questions.
 */
window.FIELD_MIND_ASSESSMENT = {
  version: "DEMO-0.1",
  title: "استبيان تجريبي للتأكد من عمل الواجهة",
  items: [
    { id: "demo_01", domain: "demo", text: "مثال تجريبي فقط: هل استطعت التركيز في مهامك المعتادة؟", reverse: false },
    { id: "demo_02", domain: "demo", text: "مثال تجريبي فقط: هل شعرت أن متطلبات يوم العمل كانت قابلة للإدارة؟", reverse: false },
    { id: "demo_03", domain: "demo", text: "مثال تجريبي فقط: هل استطعت الحصول على الراحة التي احتجتها؟", reverse: false }
  ],
  options: [
    { label: "أبدًا", value: 0 },
    { label: "نادرًا", value: 1 },
    { label: "أحيانًا", value: 2 },
    { label: "غالبًا", value: 3 },
    { label: "دائمًا", value: 4 }
  ]
};
