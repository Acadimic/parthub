# Sanskrit Beginner, Intermediate and Advanced

Plan, 2026-10-05. Three Sanskrit courses built from Manish's curriculum plan
(`~/Downloads/sanskrit_language_course_3_level_plan.md`) with the course agent. Working files live in
`.course-agent/work/sanskrit/` (git-ignored); this file records the decisions and the task list.

## Decisions (Manish, 2026-10-05)

- **Three courses**, one per level, under the existing Sanskrit standard (`6ab7daa389187d0e50b6ee26`)
  and the shared Beginner / Intermediate / Advanced subjects, like the Spanish series.
- **8 weeks × 5 days each**: one week per module of the plan. Days 1–4 are lesson days, each closed by
  a lesson test (8 questions); day 5 is a review and speaking day closed by the module test (20
  questions); the last day also carries the level test (30 questions), which at Advanced doubles as the
  final assessment. About 40 lessons and 41 tests per level. No live sessions.
- **Audio later**: content is written with full pronunciation marks and listening blocks now and
  plays through the device voice (a Hindi voice reads Devanagari). Generated Sanskrit audio
  (`course:audio`, Indic Parler-TTS, `.claude/plans/PRONUNCIATION.md` phase 2) is a separate follow-up
  that fills the `audio` attrs without touching the content.
- **Dev only**, built end to end and published in dev; production after Manish has reviewed.

## How the plan maps onto the platform

| Plan                                              | Platform                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Level → module → lesson                           | Course → week (theme) → day → lesson                                                          |
| Lesson template (§8)                              | Fixed lesson sections: Listen first, See, Read, The ideas, Practice, Speak, … Review later    |
| Devanagari + IAST + IPA                           | `lang=sa` marks; IAST and IPA filled in by rule from the Devanagari (`sanskrit/translit.mjs`) |
| Transliteration strategy (§9)                     | Per-level script policy in `sanskrit/levels.mjs`; IAST always on tap                          |
| Audio, listening tests                            | Listening blocks, hidden-transcript questions; device voice until `course:audio`              |
| Images, diagrams                                  | SVG figures, rendered and looked at before import                                             |
| Videos                                            | At most two checked YouTube references per lesson                                             |
| Lesson / module / level tests, feedback (§18–§24) | Test papers per day; every solution explains and names the lesson to review                   |
| Spaced repetition (§10)                           | "Review later" section in every lesson, review day each week                                  |

## Not possible on the platform today

Speech recording with scoring (Listen → Record → Compare → Retry is self-comparison), adaptive tests,
configurable mastery thresholds, a skills dashboard, a tagged question bank with fresh equivalents on
retake, and certificates. Each needs product work and is out of scope here.

## Tasks

1. Workspace, transliteration, checks, writer brief. _Done 2026-10-05._
2. Blueprints for the three levels (`<level>/weeks.mjs` → `reply.json`). _Done 2026-10-06: 49 / 55 / 54 lessons, 41 tests each._
3. Per level: `course:prompt` → `course:import` → `course:prompts` → `days.json`. _Done 2026-10-06._
4. Per level: writers per week (content + tests), checked, figures looked at, imported. _Done 2026-10-06; answer keys audited (Intermediate had 99 wrong keys in dev from a helper misuse, all corrected)._
5. Per level: covers, `course:review` clean, publish in dev. _Done 2026-10-06: all three published in dev._
6. Generated Sanskrit audio (Indic Parler-TTS, `sanskrit/audio.mjs`) in dev and production. _Done 2026-10-08: every mark and listening block in all three courses._
