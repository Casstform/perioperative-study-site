# Perioperative Study Site

A static, independent CPN(C) practice site at
https://casstform.github.io/perioperative-study-site/.

The original two collections have 430 questions: 330 challenging original multiple-choice questions based on the
user-supplied ORNAC *Guidelines for Perioperative Practice in Canada*, 17th
edition (April 2025), plus all 100 questions from the user-supplied Meazure Learning recording of “CNA Practice Test – Perioperative”. The original bank covers every numbered subsection, with 60 questions in 15 four-part cases. The recording adds 21 case questions across five cases, for 81 questions in 20 cases overall. CNA's 2020 perioperative exam blueprint informs the
six domain weights and case proportion. No ORNAC PDF or extracted text is
published in this repository.

## Maintain the bank

Edit `ornac-questions.txt`, `case-groups.json`, `recorded-practice.json`, and `question-page-map.json`, then run
`python3 build-bank.py`. The pipe-delimited question fields are:

`section|domain|prompt|correct|wrong1|wrong2|wrong3|rationale|why1|why2|why3`

Domains are `E` (ethical/professional), `S` (safety), `I` (infection
prevention), `P` (perioperative phases/anesthesia), `X` (exceptional events),
and `M` (resources). Each item has four distinct choices and a reference to
its ORNAC subsection. The build script checks field counts, unique prompts,
case groups, source sections, and three distinct question-specific distractor explanations. `why1` through `why3` correspond to `wrong1` through `wrong3`; the app preserves that mapping when choices are shuffled. Optional clinical sources for original questions are in `original-clinical-references.json`. The site
shuffles answer choices and keeps attempts, missed status, and saved items in
browser storage under a 17th-edition key.

Each answer links to the owner's Drive copy and lists the relevant one-based
PDF page numbers and printed page labels. `question-page-map.json` stores the
reference for every stable question ID. Its pagination is specific to the
548-page `ORNAC Print to PDF Trial.pdf`; remap the references if the PDF changes.
The PDF remains in Drive with its existing permissions and is not included here.
The original ORNAC questions and explanatory notes are original paraphrases, not copied guideline passages. The recorded collection preserves questions supplied by the user. The complete review recording shows all 100 correct choices; each `examReview` contains its checked answer, timestamp, and cognitive classification. All 100 are scored against the displayed practice-review key. Fourteen `currentGuidance` notes distinguish older feedback from the 2025 guideline or other current primary references. Earlier differing answers (#9, #18, #28, #59, #60, #78, #85) are corrected to that key; the former review-only #8, #16, #75, #81 now have intended answers. A verified key does not make every older clinical explanation current.

`MEAZURE-001` through `MEAZURE-100` are stable recording IDs. Original `ORNAC17-*` IDs and their existing progress key are preserved. Each recorded item has original-number provenance, a video timestamp, four specific choice explanations, and mapped PDF pages. Additional references distinguish clinical drug/emergency details from related ORNAC discussion. Keep the recording, session URLs, user account details, and extracted guideline text out of the public repository.

Choose Recorded practice / All to reproduce the recorded sequence. Mixed exams use blueprint targets and can group complete cases of different lengths. Navigation restores the selected answer and explanation without recording another attempt. Per-question notes and text-size preferences stay in browser storage. Keyboard shortcuts ignore editable fields.
This project is not endorsed by CNA or ORNAC.

The checked key is in `recorded-practice.json`; edit it directly rather than regenerating it from the initial, unkeyed transcription. The build verifies every recorded answer agrees with its checked review entry. Preserve historical progress and stable IDs when updating a key; only subsequent attempts use changed scoring.

All 304 original questions were rewritten for harder application and judgment practice on October 10, 2026, retaining IDs, domains, and case membership. The difficulty field is an editorial target, not a calibrated CNA classification. The 100 recorded question objects and references are unchanged by this revision. Saved marks and notes remain attached to stable IDs. Earlier attempt totals are preserved historical results, not recalculated against the rewritten content.

## Classification and precautions focus

26 additional challenging original questions cover all four wound classes, common precaution examples, and device-specific Spaulding decisions. The bank now contains 330 originals and 100 unchanged recorded items. New questions link to the owner’s ORNAC PDF pages, with a PHAC reference for combined varicella precautions.



## AORN CNOR Canadian review — 22 October 2026

The full bank now contains 611 items. The AORN collection adds 181 items (160 scored against the recorded key, 21 review-only) from the supplied 200-question review. Nineteen US-policy questions are excluded and no included items await recapture. All source numbers and all 200 keys are accounted for; the previous 109-explanation automated count was corrected.

See [the complete audit](aorn-review/README.md), [the browser audit](aorn-review.html), and `aorn-review/manifest.json` for capture gaps, source errors, Canadian conflicts, per-question timestamps, and the limits of the ORNAC comparison. `aorn-practice.json` holds reviewed text and edited explanations. “Verified” keys mean visible in the recording; they do not imply independent clinical validation. All new IDs use `AORN-CNOR-*`. Review-only items are excluded from accuracy and attempt counts.

Choose AORN CNOR / All to review in original number order, with excluded questions omitted. Rebuild with `python3 build-bank.py`. The existing 430 question objects and progress IDs are preserved.
