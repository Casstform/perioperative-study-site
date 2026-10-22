# AORN CNOR practice recording: draft source audit

**Status: staging only. DO NOT MERGE as an active study bank.** No files loaded by the live site are changed.

The user-provided AORN practice exam recording contains Q1-Q200. Video navigation revisits questions 161-164; this audit records each only once. Each question shows four options and a single correct-answer green check, captured as an ordinal index in `manifest.json`. The selected response is *not* assumed correct.

Automated video sampling identified an explanation tab for 109/200 questions. The remaining explanations could not be confirmed as shown. Answer-frame stem toggles for Q1-164 were collapsed (`Show More`), requiring further completeness checks; Q165-200 showed `Show Less`.

## Clinical / jurisdiction blockers

- **Q14**: the recorded key calls Bankart repair a procedure for rotator-cuff injury. Bankart repairs address an anterior labral lesion; exclude or rewrite. Evidence: https://www.orthoinfo.org/diseases--conditions/shoulder-joint-tear-glenoid-labrum-tear
- **Q55**: the recorded key accepts BI testing at least weekly. The owner's ORNAC Guidelines 17th Edition, section 2.26.4, instead specifies testing daily when each sterilizer is used. Do not score the original as Canadian guidance.
- Initial U.S.-specific candidates for exclusion or Canada-specific adaptation: **Q24, Q25, Q26, Q27, Q31, Q48, Q156, Q173**.
- Examine Q18, Q47 and Q77 for additional issues in source explanation, regulator, and Canadian nursing scope.

## Next steps

1. Visually proofread every stem, all four choices, and the indicated answer against the recorded video; transcribed text is not yet verified.
2. Recapture expanded stems where needed and missing original explanations, or write independent editorial explanations clearly labelled as such.
3. Compare relevant retained questions and explanations against ORNAC 17th edition and trusted clinical references; flag conflicts.
4. Only then add a separate `AORN CNOR (Canadian-reviewed)` collection to the existing site. Do not change the Meazure or ORNAC banks.
