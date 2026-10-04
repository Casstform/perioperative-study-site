# Perioperative Study Site

A static, independent CPN(C) practice site at
https://casstform.github.io/perioperative-study-site/.

The current bank has 304 original multiple-choice questions based on the
user-supplied ORNAC *Guidelines for Perioperative Practice in Canada*, 17th
edition (April 2025). It covers every numbered subsection, with 60 questions
in 15 four-part cases. CNA's 2020 perioperative exam blueprint informs the
six domain weights and case proportion. No ORNAC PDF or extracted text is
published in this repository.

## Maintain the bank

Edit `ornac-questions.txt`, `case-groups.json`, and `question-page-map.json`, then run
`python3 build-bank.py`. The pipe-delimited question fields are:

`section|domain|prompt|correct|wrong1|wrong2|wrong3|rationale`

Domains are `E` (ethical/professional), `S` (safety), `I` (infection
prevention), `P` (perioperative phases/anesthesia), `X` (exceptional events),
and `M` (resources). Each item has four distinct choices and a reference to
its ORNAC subsection. The build script checks field counts, unique prompts,
case groups, source sections, and the generated explanation fields. The site
shuffles answer choices and keeps attempts, missed status, and saved items in
browser storage under a 17th-edition key.

Each answer links to the owner's Drive copy and lists the relevant one-based
PDF page numbers and printed page labels. `question-page-map.json` stores the
reference for every stable question ID. Its pagination is specific to the
548-page `ORNAC Print to PDF Trial.pdf`; remap the references if the PDF changes.
The PDF remains in Drive with its existing permissions and is not included here.
Questions and learning notes are
original paraphrases, not copied guideline passages or official exam items.
This project is not endorsed by CNA or ORNAC.
