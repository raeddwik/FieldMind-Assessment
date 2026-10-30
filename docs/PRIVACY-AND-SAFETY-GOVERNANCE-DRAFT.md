# FieldMind — Privacy, Consent and Safety Governance Draft

**Status:** Draft for organizational, legal, clinical and occupational-health review.  
**Not an approved privacy notice or operational emergency procedure.**  
**Do not collect identifiable worker responses until every approval and operational field below is completed.**

## 1. Purpose and limits

FieldMind currently provides a custom, 42-item internal questionnaire for preliminary wellbeing reflection and follow-up discussion. It is not a validated clinical instrument, does not diagnose or rule out a mental disorder, does not estimate clinical severity, and does not determine fitness for work.

The current questionnaire and follow-up rules are draft rules. They must not be used alone or automatically for recruitment, continued employment, promotion, discipline, work assignment, medical clearance, or fitness-for-work decisions.

## 2. Required organizational decisions — complete before pilot

| Required item | Organization must specify |
|---|---|
| Data controller / responsible legal entity | [LEGAL ENTITY NAME] |
| Documented purpose and lawful basis | [APPROVED PURPOSE AND LEGAL BASIS] |
| Whether participation is voluntary and how refusal affects the worker | [APPROVED NON-RETALIATION STATEMENT] |
| Categories of data collected | Account identifier, questionnaire answers, derived descriptive summaries, timestamps, and any approved operational metadata |
| Authorized roles and named teams | [ROLE-BASED ACCESS LIST] |
| Who may see item-level answers | [NAMED PROFESSIONAL ROLE / TEAM] |
| Whether line management can see identifiable records | Default: no direct access to item-level answers |
| Retention period | [APPROVED PERIOD] |
| Deletion / correction request channel | [CONTACT / PROCESS] |
| Data protection contact | [DPO / PRIVACY CONTACT] |
| Hosting region and any cross-border transfers | [APPROVED HOSTING / TRANSFER REVIEW] |
| Incident reporting contact and response time | [CONTACT / SLA] |

Do not replace the placeholders with invented values. Obtain written approval from the organization's privacy/legal function and the accountable data controller.

## 3. Minimum data-protection controls

- Collect only the minimum data needed for the stated purpose.
- Keep participation voluntary, informed and non-punitive; do not condition employment benefits on participation.
- Explain that the questionnaire is not a diagnosis and that the worker may request help regardless of the result.
- Do not expose answers or identifiable summaries to line managers or HR by default.
- Restrict record access by role and least privilege; use separate test and production projects.
- Review authentication, MFA where available, session management, audit logs, backup protection and incident response.
- Define retention, deletion, correction, export and access-request procedures before real-data collection.
- Do not use real worker data in test environments, screenshots, support tickets or development logs.
- Review applicable Egyptian data-protection requirements and any cross-border processing with qualified counsel / the organization's privacy officer.

## 4. Safety-response procedure — must be staffed before use

The questionnaire includes:
- safe_01: recent thoughts of self-harm or not wanting to continue living.
- safe_02: current concern that the person may harm themselves or another person, or cannot maintain safety.

A positive answer is a prompt for a human check-in, not a diagnosis or a complete risk assessment. A negative answer or skipped answer does not prove that risk is absent.

Before pilot use, the organization must document:
1. The named, trained professional/team responsible for receiving alerts.
2. A monitored channel and operating hours; identify out-of-hours coverage.
3. A maximum response time for safe_01 and an immediate response route for safe_02.
4. A private, non-judgmental method to contact the worker and verify current safety.
5. The organization's escalation route to qualified clinical services and local emergency services when imminent danger is suspected.
6. How to document actions, protect confidentiality, and share only the minimum necessary information.
7. A backup contact if the primary responder is unavailable.

**Critical:** Do not launch the questionnaire with real users unless alerts are actively monitored and the response pathway is staffed. A notice displayed on the screen is not an adequate response system.

## 5. Professional review and validation

Before an operational pilot:
- A qualified mental-health professional should review the wording, content coverage, potential distress, and referral language.
- An occupational-health physician should review the intended workplace use and separation from fitness-for-work decisions.
- A psychometric specialist should review the scoring rules and advise whether and how validity/reliability work can be conducted.
- The organization should document that the tool is owner-designed and not a validated or licensed clinical scale.
- Any future validation study should have an appropriate protocol, governance review and participant protections.

## 6. Release gates

- [ ] Legal entity, purpose and lawful basis approved in writing.
- [ ] Privacy notice completed and approved.
- [ ] Retention, deletion, correction and access-request processes operational.
- [ ] Named data controller / privacy contact published.
- [ ] Role access list approved; negative cross-user access test passed.
- [ ] Admin and super-admin access tested with separate accounts.
- [ ] Safety responder, backup and response-time commitments approved.
- [ ] End-to-end safety escalation simulation completed.
- [ ] Clinical / occupational-health content review signed off.
- [ ] Voluntary, non-retaliatory participation policy approved.
- [ ] Production project, deployment target, backups and incident response reviewed.
- [ ] Final release approval recorded by accountable organizational owners.

## 7. Test-only rule

Until all gates are closed, use synthetic accounts and synthetic answers only. Do not enter identifiable employee data or real psychological disclosures.
