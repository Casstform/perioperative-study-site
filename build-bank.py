#!/usr/bin/env python3
"""Build the public quiz bank from original questions about the user's ORNAC 17th-edition PDF.

The attached copyrighted PDF and its extracted text are not included in this site.
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent
CATEGORIES = {
    'E': 'Ethical & professional', 'S': 'Safety', 'I': 'Infection prevention',
    'P': 'Perioperative phases & anesthesia', 'X': 'Exceptional clinical events',
    'M': 'Managing resources'
}
WEIGHTS = dict(zip(CATEGORIES.values(), [12.5, 25, 22.5, 20, 12.5, 7.5]))
# Each entry is original explanatory prose, not a passage from the guidelines.
CONCEPTS = {
    'foundation': ('Professional foundations', 'Perioperative nursing integrates patient advocacy, clinical judgment, collaboration, and accountability across preoperative, intraoperative, and postoperative care. A nurse practises within their role and demonstrated competence. In guideline language, shall is required, should is recommended, and may describes an option.'),
    'roles': ('Roles and competence', 'Managers coordinate safe systems and resources; educators plan and evaluate learning; advanced and enhanced practice roles have defined preparation and authorization. A course or years of service alone do not prove independent competence.'),
    'routine': ('Routine and additional precautions', 'Routine practices apply to every patient. A point-of-care risk assessment considers likely contact with blood, body fluids, mucosa, nonintact skin, or respiratory hazards. Additional precautions are added for a suspected or known transmission risk.'),
    'traffic': ('Traffic and respiratory controls', 'The surgical environment is managed through patient routing, room controls, limited traffic, and appropriate PPE. Airborne hazards may require a fitted respirator and a planned airway procedure; doors and clean-to-dirty flow help maintain the controlled environment.'),
    'attire': ('Attire and barriers', 'Surgical attire, eye protection, masks or respirators, gowns, gloves, and surgical hand antisepsis each address different exposure pathways. Select the right barrier for the task and keep sterile gown and glove boundaries intact.'),
    'field': ('Aseptic technique', 'A sterile field is established close to use, observed continuously, and protected from contact, moisture, and movement outside its defined boundaries. Check package integrity before opening; treat a suspected breach as a safety concern.'),
    'prep': ('Skin preparation and draping', 'Antiseptic choice and technique account for the patient, site, and product directions. Alcohol-containing products must dry and must not pool near an ignition source. Drapes create a fluid-resistant barrier but do not make an already contaminated area sterile.'),
    'devices': ('Device reprocessing', 'Cleaning precedes disinfection or sterilization. Spaulding classification reflects tissue contact: critical devices enter sterile tissue and need sterilization; semicritical devices contact mucosa or nonintact skin and need at least high-level disinfection when suitable; noncritical devices contact intact skin. Follow the device-specific validated instructions.'),
    'sterile_supply': ('Sterilization and supply integrity', 'Packaging, cycle monitoring, transport, storage, and traceability all affect whether a device is ready for sterile use. Immediate-use steam sterilization is for urgent unplanned needs and still requires validated processing; it is not an inventory workaround.'),
    'cleaning': ('Environmental cleaning', 'Every case receives the scheduled environmental cleaning, with prompt management of visible contamination and additional measures when precautions require them. A clean-to-dirty workflow and approved product contact time help prevent cross-contamination.'),
    'preop': ('Preoperative verification', 'Identify the patient with two approved identifiers, reconcile relevant history and allergies, verify consent and site marking, and use a meaningful team checklist. Resolve discrepancies before proceeding. Consent and advance directives require patient-centred review.'),
    'bundles': ('Perioperative prevention bundles', 'Temperature management, antimicrobial timing, wound class, VTE risk, and operative closure practices affect outcomes at different points. A bundle coordinates distinct measures while allowing patient-specific assessment and transparent documentation.'),
    'position': ('Transfer, positioning, and tissue protection', 'Safe transfer uses adequate personnel and aids. Positioning protects nerves, pressure areas, circulation, lines, and airway while allowing surgical access. Reassess after changes and communicate risks at handoff.'),
    'communication': ('Documentation and handoff', 'Document observed care promptly and accurately. Standardized handoff conveys relevant events, unresolved issues, and required follow-up to the receiving team, with opportunity to clarify.'),
    'counts': ('Retained-item prevention', 'Standardized counts track sponges, sharps, instruments, and other designated items. Personnel changes, emergency cases, intentional packing, and discrepancies require explicit communication and documentation. A correct count does not overrule a credible concern about a missing item.'),
    'specific': ('Specific care management', 'Tourniquet, wound, medication, solution, and specimen handling each require checks tied to the patient and procedure. Label items clearly, reconcile time and pressure when relevant, and verify the intended specimen processing with pathology.'),
    'anesthesia': ('Anesthesia and sedation', 'General, regional, local, moderate sedation, and monitored anesthesia care each have different effects and preparation needs. The team plans monitoring, airway and resuscitation support, patient positioning, and safe transition to the next phase of care.'),
    'technology': ('Technology, energy, and plume', 'MIS and robotic surgery require device checks and practiced emergency access. Surgical energy can cause burns or fire; coordinate oxygen, fuel, and ignition controls. Laser eyewear is hazard-specific, and surgical plume is captured near its source.'),
    'environment': ('OR environmental safety', 'Lighting, noise, ventilation, temperature, humidity, electrical systems, and construction can affect patient and staff safety. Deviations are escalated through the local contingency process rather than ignored during a case.'),
    'team': ('Team and occupational safety', 'Credentialing, continuing education, learner supervision, and visitor controls define safe roles. Occupational risk includes biological, chemical, physical, and psychological hazards; reporting and engineering controls support safer work.'),
    'equipment': ('Equipment life cycle', 'Procurement considers clinical need, reprocessing, training, supplies, and support. Accessible instructions, preventive maintenance, recall tracking, and a malfunction response keep devices usable and traceable.'),
    'incidents': ('Incident management and disclosure', 'Near misses are intercepted before reaching a patient; no-harm incidents reach the patient without discernible harm; harmful incidents cause harm. Immediate patient care, factual documentation, reporting, review, and compassionate disclosure are coordinated through policy.'),
    'blood': ('Blood and donation', 'Transfusion requires consent or documented refusal, accurate patient-product verification, monitoring, and a reaction plan. Death and donation require dignity, notification, legal considerations, and coordination with designated programs.'),
    'evidence': ('Medicolegal evidence', 'Potential evidence is identified, preserved, sealed, documented, and handed over through an approved chain of custody. Clinical care remains the priority while item identity and handling are protected.'),
    'emergency': ('Life-threatening emergencies', 'DIC, malignant hyperthermia, and cardiac arrest require early recognition, prompt communication, ready equipment, and rehearsed team roles. MH risk may be signalled by family history; rising carbon dioxide can precede fever.'),
    'pandemic': ('Pandemic response', 'A command structure coordinates triage, patient pathways, staffing, supply, surgical priority, and education. Suspected cases are routed with precautions while status is unresolved; policies adapt as conditions change.')
}

def concept_for(section):
    if section == 'F': return 'foundation'
    n, sub = map(int, section.split('.'))
    if n == 1: return 'roles' if sub >= 10 else 'foundation'
    if n == 2:
        if sub <= 3: return 'routine'
        if sub <= 6: return 'traffic'
        if sub <= 14: return 'attire'
        if sub <= 17: return 'field'
        if sub <= 19: return 'prep'
        if sub <= 20: return 'devices'
        if sub <= 23: return 'sterile_supply'
        if sub <= 25: return 'devices'
        if sub <= 35: return 'sterile_supply'
        return 'cleaning'
    if n == 3:
        if sub <= 4: return 'preop'
        if sub <= 6 or sub in (9,10,11): return 'bundles'
        if sub <= 8: return 'position'
        if sub <= 13: return 'communication'
        if sub <= 22: return 'counts'
        if sub <= 27: return 'specific'
        if sub <= 37: return 'anesthesia'
        return 'technology'
    if n == 4:
        if sub <= 5: return 'environment'
        if sub <= 15: return 'team'
        return 'equipment'
    if sub <= 2: return 'incidents'
    if sub <= 5: return 'blood'
    if sub == 6: return 'evidence'
    if sub <= 9: return 'emergency'
    return 'pandemic'

def wrong_reason(wrong, correct, rationale):
    first = wrong.split()[0].lower().rstrip(',')
    leads = {
        'assume': 'The assumption is unverified and could miss the relevant risk.',
        'only': 'Focusing on just one detail omits other needed checks or controls.',
        'use': 'The proposed substitute does not establish the required safe process.',
        'wait': 'Waiting delays a step that is needed before the risk develops.',
        'ignore': 'Ignoring the finding leaves the possible problem unassessed.',
        'treat': 'That applies the wrong classification or care process.',
        'leave': 'Leaving the condition unresolved allows the hazard to persist.',
        'skip': 'Skipping the step removes an important check or safeguard.',
        'remove': 'Removing it in this way loses a needed barrier, record, or control.',
        'rely': 'Relying on that alone cannot verify the actual condition.',
        'discard': 'Discarding it in this way loses needed traceability or safe handling.',
        'ask': 'That person or step cannot replace the responsible clinical process.',
        'let': 'Allowing that to continue leaves the safety issue uncorrected.',
        'keep': 'Keeping the current practice preserves the risk rather than addressing it.',
        'place': 'That placement can compromise the barrier, patient, or equipment.',
        'move': 'Moving it this way bypasses separation or verification controls.',
        'continue': 'Continuing before assessment may expose the patient to further harm.',
        'cover': 'Covering a problem does not restore sterility or correct its cause.',
        'open': 'Opening at that point can extend exposure or compromise sterility.',
        'increase': 'Increasing the setting before evaluation can amplify the hazard.',
        'allow': 'Unrestricted access or activity does not maintain the needed controls.',
        'proceed': 'Proceeding before reconciliation leaves a known discrepancy unresolved.',
        'give': 'Giving treatment without the preceding checks can create a new risk.',
        'avoid': 'Avoiding this step omits relevant patient care or communication.',
        'tell': 'This does not ensure that the responsible team addresses the finding.',
        'document': 'Documentation alone cannot replace the required clinical action.',
        'choose': 'That choice does not account for the patient or procedure factors.',
        'apply': 'Applying it without the required checks can compromise safety.',
        'reuse': 'Reuse requires a validated and authorized process, not an informal decision.',
        'omit': 'Omitting it leaves a required concern uncommunicated or unverified.',
        'dismiss': 'Dismissing the concern prevents its assessment and resolution.',
        'share': 'Sharing beyond those who need the information can breach privacy.',
        'replace': 'Substitution must be verified rather than assumed equivalent.',
        'assign': 'Assignment must account for competence and patient needs.',
        'record': 'A record must reflect observed facts rather than a prediction.',
        'stop': 'Stopping without a coordinated plan can leave care incomplete.',
        'change': 'Changing a record or setting without verification hides the actual issue.',
        'send': 'Sending it before verification or safe handling can propagate an error.',
        'erase': 'Erasing the entry destroys an accurate audit trail.',
        'silence': 'Silencing a warning does not correct its underlying cause.',
    }
    lead = leads.get(first)
    if lead is None:
        low = wrong.lower()
        if any(x in low for x in ('only ', 'solely', 'alone ', 'just ')):
            lead = 'That single measure leaves other necessary controls unaddressed.'
        elif any(x in low for x in ('untrained', 'unapproved', 'unlabeled', 'unverified')):
            lead = 'An unverified or unauthorized approach cannot establish safe care.'
        else:
            lead = 'That choice does not address the central safety requirement.'
    return f'{lead} {rationale}'

questions = []
seen_prompts = set()
sections = set()
for line_number, line in enumerate((ROOT / 'ornac-questions.txt').read_text().splitlines(), 1):
    if not line or line.startswith('#'): continue
    bits = line.split('|')
    assert len(bits) == 8, (line_number, len(bits))
    section, domain, prompt, correct, *tail = bits
    wrong = tail[:3]
    rationale = tail[3]
    assert section == 'F' or re.fullmatch(r'[1-5]\.\d{1,2}', section), (line_number, section)
    assert domain in CATEGORIES, (line_number, domain)
    assert len(prompt) >= 25 and prompt.endswith('?'), (line_number, prompt)
    assert len({o.casefold() for o in [correct, *wrong]}) == 4, line_number
    assert all(len(o) > 3 and o.endswith('.') for o in [correct, *wrong]), line_number
    assert rationale.endswith('.') and len(rationale) > 30, line_number
    assert prompt.casefold() not in seen_prompts, (line_number, prompt)
    seen_prompts.add(prompt.casefold())
    if section != 'F': sections.add(section)
    questions.append({
        'id': f'ORNAC17-{len(questions)+1:03d}', 'category': CATEGORIES[domain],
        'source': section, 'prompt': prompt, 'options': [correct, *wrong],
        'answer': 0, 'explanation': rationale, 'concept': concept_for(section),
        'whyOthers': [wrong_reason(o, correct, rationale) for o in wrong]
    })
groups = json.loads((ROOT / 'case-groups.json').read_text())
seen_case_ids = set()
for case_id, group in groups.items():
    assert len(group['questionIds']) == 4 and len(set(group['questionIds'])) == 4, case_id
    for number in group['questionIds']:
        assert 1 <= number <= len(questions) and number not in seen_case_ids, (case_id, number)
        questions[number - 1]['case'] = case_id
        seen_case_ids.add(number)
assert 0.15 <= len(seen_case_ids) / len(questions) <= 0.25
assert len(questions) >= 300, len(questions)
assert len(sections) >= 120, len(sections)
page_map = json.loads((ROOT / 'question-page-map.json').read_text())
document = page_map['document']
assert set(page_map['questions']) == {q['id'] for q in questions}, 'Every question needs a PDF reference'
for question in questions:
    reference = page_map['questions'][question['id']]
    assert reference['sections'] and all(s == 'F' or s in sections for s in reference['sections'])
    assert reference['pages'], question['id']
    page_numbers = [p['pdfPage'] for p in reference['pages']]
    assert page_numbers == sorted(set(page_numbers)), question['id']
    assert all(isinstance(n, int) and 1 <= n <= document['pdfPageCount'] for n in page_numbers)
    assert all(p['printedPage'] for p in reference['pages']), question['id']
    question['reference'] = reference
url = document['url']
sources = {'F': {'name': 'ORNAC Guidelines, 17th ed. (2025), Foreword', 'url': url, 'note': 'Terminology in the owner’s Drive PDF.'}}
sources.update({s: {'name': f'ORNAC Guidelines, 17th ed. (2025), §{s}', 'url': url,
               'note': 'Relevant guideline discussion in the owner’s Drive PDF; individual questions identify PDF and printed pages.'}
           for s in sorted(sections, key=lambda s: tuple(map(int, s.split('.'))))})
concepts = {key: {'title': title, 'text': body} for key, (title, body) in CONCEPTS.items()}
bank = {'version': 'ORNAC-17-2025', 'questions': questions, 'cases': {key: value['context'] for key, value in groups.items()},
        'sources': sources, 'document': document, 'concepts': concepts, 'categories': list(CATEGORIES.values()),
        'blueprintWeights': WEIGHTS}
(ROOT / 'bank.json').write_text(json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + '\n')
print(len(questions), 'questions covering', len(sections), 'subsections;', len(seen_case_ids), 'case questions')
print(Counter(q['category'] for q in questions))
