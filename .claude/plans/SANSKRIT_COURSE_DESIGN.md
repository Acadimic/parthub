# Sanskrit Language Course Design

Plan, 2026-10-15. A high-level, easy-to-follow design for a Sanskrit course series, built on the
`universal_language_learning_course_framework.md` and informed by three teaching traditions:
UBC's Sanskrit Learning Tools (university, grammar-first), the Indian school boards (CBSE / NCERT,
ICSE: exam-oriented, Class 6–12) and Samskrita Bharati (spoken-first). The three Sanskrit courses
already published (`SANSKRIT_COURSES.md`) stay as they are until the new ones exist; §9 says how
they relate. Manish's decisions are recorded in §10 (2026-10-15); nothing is built yet.

---

## 1. What the three traditions do, and what we take from each

### 1a. UBC Sanskrit Learning Tools (ubcsanskrit.ca, Sathaye & Bellefleur)

A companion to Goldman's _Devavāṇīpraveśikā_, used in universities worldwide. Eighteen lessons;
each from lesson 4 on has grammar pages, exercises, a glossary, flashcards and a graded reading.

| Lessons | What they teach                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------ |
| 1–3     | Phonology chart → Devanāgarī script (writing tutor, mātrās, conjuncts) → guṇa/vṛddhi and all sandhi    |
| 4       | Present tense (लट्), अस्, a-stem nouns, the eight cases, अस्मद्/युष्मद्                                 |
| 5–6     | ā-stem, i/u-stem nouns; तद्/एतद्; pronominal adjectives; the k-y-t series (कः/यः/सः), relative clauses |
| 7       | ī-stems; the ten verb classes (gaṇa) in one lesson                                                     |
| 8–10    | an-stems, imperfect (लङ्), upasargas; as/is/us-stems, passive; ṛ-stems, past passive participle (क्त)  |
| 11      | ant-stems, क्तवतु, imperative (लोट्), gerund (क्त्वा/ल्यप्)                                              |
| 12–14   | in-stems; samāsa in three parts (karmadhāraya, tatpuruṣa, upapada → bahuvrīhi, dvigu → dvandva, avyayībhāva); infinitive; optative (विधिलिङ्) |
| 15–18   | present participle, future (लृट्), conditional, gerundive, perfect (लिट्)                               |

**Design pattern worth copying**

- **One noun stem + one verb form per lesson.** Every lesson pairs a new declension with a new
  piece of the verb system, so the learner never gets eight tables in a row.
- **Every rule is a chart with a worked example** (condition → rule → example: तत् एव → तदेव). The
  case page is a three-column table: case, what it does, a sentence with the case-word highlighted.
- **Glossary + flashcards + reading per lesson**: vocabulary is tied to the grammar of that lesson,
  and a reading uses only what has been taught.
- **Devanāgarī with IAST always available** (a transliterate toggle on every page).

**What not to copy for a learner-facing course**

- Sandhi complete in lesson 3, before a single sentence. UBC can do this because a lecturer is in
  the room; a self-learner needs sentences first and sandhi one rule at a time (§4).
- All ten verb classes in one lesson, and a reference tone ("guṇate, infix") rather than teaching.
- No listening or speaking at all: the goal is reading classical texts.

### 1b. CBSE / NCERT (Class 6–12) and ICSE

The boards define what an Indian school learner is expected to know at each class, and their
exam papers define the skills: an unseen passage, creative writing, applied grammar, literature.

**Class 6–8 (NCERT _Deepakam_ for Class 6 under NCF 2023; _Ruchira_ 1–3 before it).** The new
Class 6 book is spoken-first: वयं वर्णमालां पठामः → संयुक्तव्यञ्जनानि → एषः कः? एषा का? एतत् किम्? →
अहं च त्वं च → संख्यागणना → अहं प्रातः उत्तिष्ठामि (daily routine) → त्वम् आपणं गच्छ (shopping) → value
stories (अतिथिदेवो भव, वृक्षाः सत्पुरुषाः इव). Grammar through Class 8: वर्णमाला, लिङ्ग / वचन / पुरुष,
a/ā/i/u-stem शब्दरूप, धातुरूप in लट् लृट् लङ् लोट्, संख्या to 100, अव्यय, उपसर्ग, simple sandhi.

**Class 9–10 (_Shemushi_ 1–2, _Vyākaraṇavīthi_; CBSE code 122).** Paper: A unseen comprehension
10 · B creative writing 15 (letter, picture/paragraph with hints, dialogue or story completion) ·
C applied grammar 25 · D literature 30, plus 20 internal. The Class 9 grammar list is the most
precise statement of "intermediate Sanskrit" there is:

| Area              | Items                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Vowel sandhi      | दीर्घ, गुण, वृद्धि, यण्, अयादि, पूर्वरूप                                                                                              |
| Consonant sandhi  | जश्त्व, अनुस्वार, तुगागम                                                                                                           |
| Visarga sandhi    | उत्व, सत्व, शत्व, रत्व                                                                                                               |
| Kāraka / upapada  | द्वितीया–सप्तमी with the governing words (सह, नमः, विना, बहिः, अन्तरा, सर्वतः…)                                                   |
| Noun stems        | m: बालक, कवि, साधु, पितृ, राजन्, भवत्, विद्वस्, गुणिन् · f: लता, मति, नदी, मातृ, धेनु · n: फल, वारि, जगत्, मनस्, चक्षुस् · तद्, इदम्, किम्, अस्मद्, युष्मद् |
| Verbs             | parasmaipada in 5 lakāras (पठ्, गम्, वद्, भू, क्रीड्, नी, दृश्, शक्, ज्ञा, अस्, कृ, दा, क्री, श्रु, पा) · ātmanepada in 4 (सेव्, लभ्, रुच्, मुद्, वृध्) · ubhayapada लट् (कृ, पच्, नी, कृष्, वह्, भज्) |
| Pratyaya          | क्त्वा, तुमुन्, ल्यप्, क्त, क्तवतु, शतृ, शानच्                                                                                         |
| Samāsa            | tatpuruṣa (vibhakti, नञ्, upapada) and karmadhāraya                                                                             |
| Also              | संख्या 1–100, अव्यय by type (place, time, question, other), time-telling, error correction, vācya (Class 10)                        |

**Class 11–12 (_Bhāswatī_ 1–2, _Vyākaraṇa Saurabham_, _Racanānuvāda Kaumudī_).** Same four-section
paper (10 · 15 · 20 · 35). Grammar: all sandhi, pratyaya (kṛt and taddhita, strī-pratyaya), full
śabda/dhātu-rūpa, kāraka, vācya change across लट्/लृट्/लङ्, every samāsa, error correction; plus
literary history (Veda → kāvya → drama) and composition.

**ICSE** (Classical Language paper): Section A language 40 (composition, letter, comprehension,
grammar) + Section B literature 40 + internal 20. Same skill set, stated as "speaking, listening,
reading and writing Sanskrit".

**Design pattern worth copying**

- **The order of first exposure**: pointing and naming (एषः कः?) → I and you → numbers → my day →
  shopping → stories. That is the Phase 3 "first sentences" list of the framework, done in Sanskrit.
- **The Class 9 grammar list as a checkpoint**: a learner who finishes our intermediate level
  should be able to sit a Class 10 paper's Section C.
- **Four-section assessment** (unseen passage, writing, applied grammar, literature): it is the
  Sanskrit shape of "reading, writing, grammar, culture" and we reuse it for module and level tests.

**What not to copy**: textbook chapters as the unit (ours is a communicative function), grammar
drilled from tables without hearing it, and no audio.

### 1c. Samskrita Bharati (spoken Sanskrit)

Four correspondence levels, six months each: **Praveśa** (script, daily conversation, basic
forms), **Paricaya** (tenses and moods, vowel sandhi, first literature), **Śikṣā** (participles,
every case ending, consonant sandhi, writing), **Kovida** (samāsa, metre, poets, philosophy). The
ten-day śibira starts with एषः/एषा/एतत् · कः/का/किम् · अस्ति/नास्ति · अपि/वा questions · अत्र/तत्र/कुत्र,
then लट् in all persons, then one case at a time, then भूत/भविष्यत्, then क्त्वा/तुमुन्/ल्यप्.

**Design pattern worth copying**: say it before you parse it; simple Sanskrit (no sandhi across
words, short sentences) is correct Sanskrit; cases are introduced by _need_ (I want to say "with",
so तृतीया), not by table position; riddles, stories and subhāṣitas from day one.

### 1d. The synthesis

| Tradition          | Gives us                                                        |
| ------------------ | --------------------------------------------------------------- |
| Samskrita Bharati  | the **spine**: order of first exposure, spoken-first, one need at a time |
| UBC                | the **visible grammar**: one stem + one verb form per lesson, charts with worked examples, a reading per lesson |
| CBSE / NCERT       | the **checkpoints**: the Class 6–12 grammar inventory and the four-section test |
| Framework          | the **lesson cycle, assessment layers, mastery rules**          |

---

## 2. Audience and promise

- **Who**: English-medium learners from about age 11 up. No Hindi needed; Devanāgarī is taught.
  Hindi speakers move faster through Level 1 but skip nothing. The courses are audience-neutral:
  the board stages in this plan are internal checkpoints, not something a title or description says.
- **Promise**: _understand, speak, read and write simple Sanskrit, then read real texts_. By the end
  of Level 2 a learner holds a conversation about daily life; by Level 3 they read a Pañcatantra
  story and pass a Class 10 grammar section; by Level 4 they read Gītā verses and kāvya with a
  dictionary and write a paragraph.
- **Style** (same as the Spanish series): short English sentences, one idea at a time, a dialogue
  first, every Sanskrit word in Devanāgarī + IAST + audio, practice with answers.

---

## 3. The series: four levels

The subjects stay Beginner, Intermediate, Advanced and a new **Expert** (shared across languages,
as the Spanish series does); the Samskrita Bharati names below are only a guide to the level, and
CEFR is rough (Sanskrit outcomes are reading-heavy at the top). **Short on purpose**: 30 weeks in
all, where the published series is 24 and the first draft of this plan was 38.

| Course           | ≈ SB ladder | ≈ CEFR | ≈ Board      | ≈ UBC lessons | Weeks | Promise                                                                 |
| ---------------- | ----------- | ------ | ------------ | ------------- | ----- | ----------------------------------------------------------------------- |
| **Beginner**     | Praveśa     | A1     | Class 6      | 1–2, 4        | 6     | Sounds, script, first 250 words, present-tense sentences, greetings, my day |
| **Intermediate** | Paricaya    | A2     | Class 7–8    | 4–8, 11       | 8     | Three tenses, commands, all eight cases of the common stems, numbers to 100, conversations, first stories |
| **Advanced**     | Śikṣā       | B1     | Class 9–10   | 3, 9–13       | 8     | Sandhi, kāraka rules, hard stems, participles, first samāsa, vācya; reading, writing and grammar at a Class 10 level |
| **Expert**       | Kovida      | B2     | Class 11–12  | 12–18         | 8     | Every samāsa, full verb system, kṛt/taddhita, metre, literature; Gītā, kāvya, drama; essay and translation |

Elsewhere in this plan "Level 1–4" means Beginner, Intermediate, Advanced, Expert in that order.

A fifth level (Pāraṅgata: unprepared classical reading with commentary, Aṣṭādhyāyī basics, Vedic
introduction, verse composition) is noted for later and not designed here.

**Rhythm** (as in the existing series): 5 days a week; days 1–4 teach, day 5 reviews and speaks;
a lesson test every day, a module test every week, a level test at the end. Lessons stay about
40 minutes; a week never carries more than one new paradigm (§4 rule 4). No live sessions.

## 4. The Sanskrit grammar sequence (framework step 2: the language-specific syllabus)

The framework's nine phases run in order inside each level, but Sanskrit needs its own ordering
of grammar. The rules below hold across all four levels.

1. **Sounds before letters, letters before words, words before rules.** Phase 1 is two weeks in
   Level 1 and never returns as a block; later levels review one sound contrast per week.
2. **Sentences in week 3 of Level 1**, with pointing words (एषः/एषा/एतत्), अस्ति/नास्ति and questions
   with अपि/वा, before any table is shown. The table comes after the learner has used the forms.
3. **Cases by need, one or two at a time**, each with its question word: द्वितीया with किम्/कम्,
   तृतीया with केन/कया ("with what"), चतुर्थी with कस्मै, पञ्चमी with कुतः/कस्मात्, षष्ठी with कस्य,
   सप्तमी with कुत्र/कस्मिन्. Full paradigms appear only after all seven are in use (end of Level 2).
4. **One stem + one verb form per week** (UBC's pairing), never two new paradigms in one lesson.
5. **Three tenses before moods**: लट् → लङ् → लृट् (Level 2) → लोट् → विधिलिङ् (Level 2/3); लिट्,
   लुङ् and लृङ् are recognised, not produced (Level 4).
6. **Sandhi is read before it is written.** Levels 1–2 show every word separately (संस्कृतम् as
   Samskrita Bharati speaks it). Level 2 teaches _recognising_ दीर्घ and गुण so stories can be
   read; Level 3 teaches all three families with the split shown (`तत् + एव → तदेव`); Level 4
   expects it in writing.
7. **Non-finite forms early, because speech needs them**: क्त्वा ("having done"), तुमुन् ("to do")
   and क्त ("done") arrive in Level 2; शतृ/शानच्, ल्यप्, क्तवतु in Level 3; gerundive and perfect
   participle in Level 4.
8. **Samāsa as reading skill first**: Level 3 splits the four common types; Level 4 forms all
   six and names them (the CBSE naming, with UBC's upapada and dvigu included).
9. **Dual is normal**, taught with pairs (नेत्रे, हस्तौ, रामलक्ष्मणौ), not as a curiosity.
10. **Gender is a property of the word**, shown with a colour on every vocabulary card
    (m / f / n) and never left to be guessed.

---

## 5. Level outlines (modules = weeks; one theme per week)

Each week names the communicative function, the grammar, the stem/verb pair, the vocabulary set
and the reading. The day-by-day blueprint comes later, per level, in `.course-agent/work/sanskrit/`.

### Beginner — Praveśa (6 weeks)

| Wk | Theme                       | Function                               | Grammar                                                       | Stem / verb                       | Reading                       |
| -- | --------------------------- | -------------------------------------- | ------------------------------------------------------------- | --------------------------------- | ----------------------------- |
| 1  | Sounds                      | greet, thank, take leave; hear and say every sound | नमस्ते, धन्यवादः, क्षम्यताम्; vowels, consonants by place, aspiration, anusvāra, visarga | —              | words English borrowed; minimal pairs |
| 2  | Script                      | read and write Devanāgarī              | letters, mātrās, virāma, common conjuncts, numerals            | —                                 | signs, names, short words     |
| 3  | Pointing and naming         | एषः कः? एषा का? एतत् किम्?             | gender from the word; अस्ति/नास्ति; questions with अपि/वा; अत्र/तत्र/कुत्र | a-stem m/n, ā-stem f nominative sg | labelled pictures             |
| 4  | I and you                   | introduce yourself; ask a name; count  | अहम्/त्वम्/भवान्/भवती; लट् all three persons (sg); संख्या 1–10 | पठ्, गम्, वद्, खाद्, लिख्          | self-introductions            |
| 5  | My day                      | describe a routine (अहं प्रातः उत्तिष्ठामि); tell the time | एकवचन/द्विवचन/बहुवचन; लट् dual and plural; द्वितीया as object (किं पठसि?); सप्तमी for place (गृहे) | nominative in three numbers; a-stem acc. and loc. sg | a diary page, a timetable |
| 6  | Family and home + review    | talk about family; ask about someone's | मम/तव; adjectives agree; न for negation; पुनः, च, अपि         | review                            | a picture story               |

Level test: four sections (hear, read, grammar in use, speak and write), 30 questions, plus a
recorded self-introduction judged by the learner against a model.

### Intermediate — Paricaya (8 weeks)

| Wk | Theme                     | Function                                  | Grammar                                                           | Stem / verb                                   | Reading                        |
| -- | ------------------------- | ----------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 1  | Yesterday and tomorrow    | say what happened and what will           | लङ्, लृट् (parasmaipada)                                           | भू, गम्, पठ्, कृ (recognised)                  | a weekend diary                |
| 2  | Please and let's          | request, command, suggest                 | लोट्; polite भवान् + लट्                                            | दा, नी, आ-गम्                                  | classroom instructions         |
| 3  | With whom, for whom       | say "with", "for", "from"                 | तृतीया, चतुर्थी, पञ्चमी with their question words; सह, नमः, विना    | a/ā-stem full singular                        | a shopping dialogue (त्वम् आपणं गच्छ) |
| 4  | Whose and where           | possession and location                   | षष्ठी, सप्तमी, सम्बोधन; the eight-case wheel for a/ā stems          | a/ā-stem dual and plural                      | a letter home                  |
| 5  | More kinds of words, more numbers | describe people and things; count to 100, dates, prices | i/u-stems (कवि, मति, साधु, धेनु), ī-stems (नदी); agreement across cases; संख्या 1–100 (1–4 declined) | कवि, मति, साधु, नदी | a market scene and a bill     |
| 6  | He, she, this, that, who  | point, refer back, ask                    | तद्/एतद्/किम्/यद् in all cases; यः… सः correlatives                  | pronouns                                      | riddles (प्रहेलिका)            |
| 7  | Having done, to do, done  | sequence actions; purpose; results        | क्त्वा, तुमुन्, क्त as adjective; उपसर्ग (आ, प्र, सम्, उप)         | ātmanepada लट् (सेव्, लभ्)                       | a recipe; instructions         |
| 8  | Stories and conversations + review | retell a story; travel, health, school | recognising दीर्घ and गुण sandhi; अव्यय by type; word order and एव/तु | review                                      | two fables; three subhāṣitas   |

Level test: four sections as above; Section C covers the Class 8 inventory.

### Advanced — Śikṣā (8 weeks)

| Wk | Theme                     | Function                               | Grammar                                                                     | Stem / verb                                 | Reading                             |
| -- | ------------------------- | -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------- |
| 1  | Words that join (1)       | read joined text                       | vowel sandhi: दीर्घ, गुण, वृद्धि, यण्, अयादि, पूर्वरूप — split shown every time | review                                      | a prose passage                     |
| 2  | Words that join (2)       | read verse                             | visarga sandhi (उत्व, सत्व, शत्व, रत्व); consonant sandhi (जश्त्व, अनुस्वार, तुगागम) | पितृ, मातृ                              | four subhāṣitas with sandhi         |
| 3  | Who does what to whom     | kāraka precisely                       | kāraka vs vibhakti; upapada rules (सह, नमः, स्वस्ति, विना, बहिः, अन्तरा, परितः…) | राजन्, भवत्                                | a courtroom story                   |
| 4  | Harder words              | read any noun                          | विद्वस्, गुणिन्, जगत्, मनस्, चक्षुस्, वारि; इदम्                               | these stems                                 | a description of a city             |
| 5  | Doing and done            | describe ongoing and completed action  | शतृ, शानच्, क्तवतु, ल्यप्; absolute constructions                           | ātmanepada in 4 lakāras                     | a Hitopadeśa tale                   |
| 6  | Should, and who did it    | advise, wish; active ↔ passive         | विधिलिङ्; कर्तरि / कर्मणि / भावे in लट्; passive with क्त                      | ubhayapada लट्; कृ, दा, श्रु, पा in passive  | letters of advice; a story told twice |
| 7  | Compact words (1)         | split compounds while reading          | tatpuruṣa (vibhakti, नञ्, upapada), karmadhāraya — विग्रह every time         | review                                      | a newspaper-style passage           |
| 8  | Writing Sanskrit + review | letter, picture description, dialogue; read and answer | time-telling, error correction (संशोधनम्); the Class 9–10 list end to end | review                              | a Pañcatantra chapter               |

Level test: a full board-shape paper (unseen passage · writing · grammar · literature) plus
listening and speaking tasks. A learner who passes should manage a Class 10 Section C.

### Expert — Kovida (8 weeks)

| Wk | Theme                        | Function                                     | Grammar                                                                   | Reading                                              |
| -- | ---------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1  | Compact words (2)            | form and name every compound                 | dvandva, dvigu, bahuvrīhi, avyayībhāva; समासान्त; nested compounds          | Gītā verses (chapter 2)                              |
| 2  | Voice across time            | passive in every tense; causative            | vācya change in लट्/लृट्/लङ्; णिच् (causative); सन् (desiderative) recognised | a classical prose piece                              |
| 3  | Word-making                  | derive nouns, adjectives and abstracts       | kṛt: ण्वुल्, तृच्, अनीयर्, तव्यत्, क्तिन्, ल्युट् · taddhita: त्व, तल्, मतुप्, इन् · strī: टाप्, ङीप् | Nītiśataka verses                           |
| 4  | The far past                 | read epic narrative                          | लिट् (perfect), लुङ् (aorist), लृङ् recognised; perfect participle          | Mahābhārata episode (Nala)                           |
| 5  | Verse                        | hear and scan metre                          | laghu/guru; anuṣṭubh, upajāti, vasantatilakā, śārdūlavikrīḍita; yati        | Raghuvaṃśa 1.1–10; Meghadūta opening                 |
| 6  | Ornament and history         | notice how poets say things; place a text in time | alaṅkāra: upamā, rūpaka, utprekṣā, anuprāsa; Veda → epic → kāvya → drama → śāstra | Śākuntalam act 1 excerpt; one page per period |
| 7  | Composition                  | essay, précis, translation both ways         | anvaya method; paraphrase of verse into prose; register                     | model essays                                         |
| 8  | Review + reading project     | read an unseen classical passage with a dictionary | the Class 11–12 inventory                                            | learner's choice: a Pañcatantra tantra or a Gītā chapter |

Level test: board-shape paper plus a recorded recitation of eight verses.

## 6. The lesson, in Sanskrit terms

The framework's eight-step lesson (§5) is already the platform's fixed section list. For Sanskrit:

| Section       | What goes in it                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Listen first  | a 6–10 line dialogue in simple Sanskrit, every line replayable (per-line audio exists), transcript hidden first |
| See           | one picture or diagram: labelled scene (Level 1–2), case wheel, lakāra timeline, sandhi split, compound tree   |
| Read          | the same dialogue in Devanāgarī + IAST + English, new words marked (m/f/n colour, root for verbs)              |
| The ideas     | one rule, one table at most, worked example first ("तत् + एव → तदेव"), then the rule in one sentence            |
| Practice      | 8–12 items with answers: substitute, transform (statement → question → negative), fill the case, split sandhi  |
| Speak         | repeat the dialogue; answer three questions aloud; Level 3+ retell the passage                                 |
| Apply         | a short reading or a writing task that uses only what is taught (UBC's rule)                                   |
| Review later  | five items from earlier weeks (the spaced-repetition slot); one sound contrast per week in every level        |

**Script policy per level** (framework §3 Phase 1 note): Level 1 Devanāgarī + IAST on every word;
Level 2 IAST on new words only; Level 3–4 Devanāgarī, IAST on tap. IPA stays in the marks for audio.

**Vocabulary card** (framework §3 Phase 2): Devanāgarī · IAST · audio · meaning · gender or root ·
one example · picture where concrete · a recall question. Target: 250 words at Beginner, 700 at
Intermediate, 1,300 at Advanced, 2,000 at Expert, counted as stems.

---

## 7. Assessment

The framework's layers (§6) map onto the platform's three tests, and the board's four sections
give every module and level test the same shape from Level 2 on:

| Section            | Level 1                   | Level 2–4                                                    |
| ------------------ | ------------------------- | ------------------------------------------------------------ |
| A Listen and read  | sound-to-letter, word-to-picture, hear and choose | an unseen passage (prose at L2, prose + verse at L3–4) with questions |
| B Write            | copy, label, complete     | letter · picture description · dialogue/story completion · (L4) essay and translation |
| C Grammar in use   | match, order, substitute  | the board's applied-grammar items at that level, always inside a sentence |
| D Literature / culture | a story read in class | questions on the week's reading; (L3–4) literary history            |
| + Speak            | self-introduction         | retell, recite, role-play (recorded, self-compared against a model)  |

Mastery policy and feedback as in the framework §6: every solution explains the rule and names the
lesson to review; below 60 % the day is repeated with fresh items; the review day re-tests the
week's weakest section.

---

## 8. Sanskrit-specific traps the writers must handle

- **Audio drives everything**: every Sanskrit string has a mark; the Indic Parler voice is in place
  (`PRONUNCIATION.md`), so dialogues and per-line replay are free.
- **Sandhi-free text until Level 3** (except fixed phrases like नमस्ते, सुस्वागतम्). A story that
  needs sandhi shows the split beneath the line.
- **Number words and the dual** are drilled as pairs and with pictures (two birds, two hands).
- **Gender colour is constant across all levels and all figures.**
- **Simple Sanskrit is right Sanskrit**: the Samskrita Bharati register (short sentences, no
  samāsa, भवान्/भवती for "you") is the model for dialogues; classical register appears only in the
  readings, with its source named.
- **Quotations are verified** (Advanced `VERIFY.md` practice): every verse carries its text and
  reference, and nothing is invented.
- **Valid alternatives are accepted** (Manish's content-quality rule): a question that can take
  सः/एषः or two correct word orders says so in the solution.

---

## 9. Relationship to the three published courses

| Published course (2026-10) | This design                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Beginner (8 wk)            | ≈ new Beginner, two weeks shorter: cases arrive by need in week 5 (द्वितीया, सप्तमी), daily routine as a theme |
| Intermediate (8 wk)        | ≈ new Intermediate plus the first two weeks of the new Advanced (its sandhi week moves up) |
| Advanced (8 wk)            | ≈ the rest of the new Advanced plus the new Expert                                   |

**Decision (Manish, 2026-10-15): four new courses.** The published three stay untouched and
published while the new ones are written in dev; once the new series is in production, the old
three are deleted (a separate step, after his yes). _Done 2026-10-21 (soft delete, dev and production)._ Content from the old courses is reused where
it fits the new blueprint, by copying and editing the local files, never by sharing ids.

## 10. Decisions (Manish, 2026-10-15)

1. **Four new courses**, the old three deleted later.
2. **Audience-neutral**: no board or class names in titles, descriptions or outcomes.
3. **Subjects stay Beginner, Intermediate, Advanced, plus a new Expert** subject (shared across
   languages; it has to be created in the support catalogue and mapped to the Sanskrit standard).
4. **Not lengthy**: 6 / 8 / 8 / 8 weeks, 30 in all; a ~40-minute lesson, one new paradigm a week.
5. **English only**.
6. A fifth level is not planned now.

## 11. Tasks

**Status 2026-10-21: done.** All four new courses are published in production, each with concepts and
Key points in every lesson (`apps/teaching/src/utils/ai/LESSON_DESIGN.md`), a dictionary-checked
"Vocabulary by topic" module as its last module, full generated audio, grammar-first module names with
subtitles and contents rows, and a cover; the three 2026-10-06 courses are soft-deleted in dev and
production (backups in the workspace, `backup-old-series-*.json`).

| Course | Course id | Weeks | Notes |
| --- | --- | --- | --- |
| Beginner: Sounds, Script and First Sentences | `6acfda1a6b436b8190828d61` | 6 + vocab | audit 2026-10-17 (46 findings) fixed |
| Intermediate: Tenses, Cases and First Stories | `6ad46fca43a141e21b996567` | 8 + vocab | |
| Advanced: Sandhi, Compounds and Real Texts | `6ad4d8c61a4ec2e3d2bb2945` | 8 + vocab | week 7 day 4 recognises dvandva and bahuvrīhi (Manish) |
| Expert: The Gītā, Kāvya and Writing Your Own | `6ad50f4ad56d786ad728fd3e` | 8 + vocab | new **Expert** subject `6ad4ffac9cbca7eeccf360a7`, mapped to Sanskrit (order 3), in dev and production |

How each was made (`.course-agent/work/sanskrit/<level>/`): a blueprint (`weeks.mjs`) approved by
Manish → course created in dev → one writer per week (`WEEK_WRITER.md`) → check, coverage and key check →
the writers' corrections folded back into the blueprint → import → vocabulary module (`vocab/`) → module
names (`module-names.json`) → cover → audio (`.course-agent/audio/<level>-all.sh`, then `verify-short`)
→ published in dev → production. At Advanced and Expert every quotation was checked in a named source
(GRETIL, sanskritdocuments.org, Sanskrit Wikisource) and every metre scanned.

The original task list:

1. **Expert subject** in the support catalogue, mapped to the Sanskrit standard (dev, then prod).
2. **Blueprints** per course in `.course-agent/work/sanskrit/<course>/weeks.mjs`; course titles
   "Sanskrit Beginner: …" etc. with the SB name nowhere in the title. _Beginner done 2026-10-15:
   6 weeks, 30 lessons, 31 tests; course `6acfda1a6b436b8190828d61` created in dev (draft). The
   2026-10-06 series' folders are now `old-*` in the workspace and keep their ids in `levels.mjs`._
3. **Writer brief** update: script policy per level, sandhi-free rule, gender colour, four-section
   tests, 40-minute cap. _Done 2026-10-15 (`WRITER_BRIEF.md`, "Rules of the new series")._
4. **Beginner** written first as the exemplar. _Done 2026-10-15 in dev (draft): all 30 days written by one
   writer per week, checked, keys audited (0 suspects), figures looked at, imported. Manish's review of
   week 1 found wrong letter sounds and a broken table: the table was a daṇḍa inside a span turning
   into `|` (translit now writes a comma); the sounds are Indic Parler-TTS garbling bare letters, now
   caught by `verify-short.mjs` (a phoneme recogniser hears each short clip and the clip is regenerated
   until it is heard right)._
5. **Intermediate, Advanced, Expert**, one writer per week, reusing old content where it fits;
   audio and figures through the existing pipeline (`run-audio.sh`, figures looked at before import).
6. **Level tests** in board shape; the Advanced test checked against a Class 10 Section C sample.
7. **Dev review and publish**; production transfer after Manish's yes; then delete the old three
   after his yes.

## Sources

- UBC Sanskrit Learning Tools: https://ubcsanskrit.ca (table of contents, lessons 1–18) and the
  grammar handouts at https://blogs.ubc.ca/ubcsanskrit/grammar/
- CBSE Class 9 Sanskrit 2026-27 syllabus summary (grammar inventory):
  https://www.educart.co/cbse/cbse-syllabus-class-9-sanskrit
- CBSE Class 10 and Class 11–12 Sanskrit Core structure:
  https://school.careers360.com/boards/cbse/cbse-syllabus-class-10-sanskrit,
  https://schools.aglasem.com/cbse-syllabus-class-11-sanskrit/,
  https://schools.aglasem.com/cbse-syllabus-class-12-sanskrit-core/
- NCERT Class 6 _Deepakam_ chapter list: https://schools.aglasem.com/ncert-books-class-6-sanskrit/
- ICSE Class 10 Sanskrit: https://www.vedantu.com/icse/icse-syllabus-class-10-sanskrit
- Samskrita Bharati correspondence levels: https://kerala.samskritabharati.in/correspondence;
  Praveśa lesson order: https://sanskrit.today/course/samskritabharati-pravesha-online-course/
