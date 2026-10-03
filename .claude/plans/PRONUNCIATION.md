# Pronunciation in authored content

Plan, 2026-10-03. Builds on Manish's draft (`language-learning-pronunciation-plan.md`) and maps it
onto what this repo already has: the ProseMirror content model (`IRichText`), the Tiptap editor in
`@repo/ui/editor`, the React reading view in `@repo/ui/content`, the AI paste-in pipeline and the
course agent, and org-scoped S3 storage. The editor reference is `packages/ui/src/editor/README.md`.

The draft's core principle stands unchanged: **the author marks what is pronounceable and in which
language; the reader decides how to show and play it; the playback layer decides where the sound
comes from.** What changes is _where_ each piece lives and a handful of simplifications the codebase
makes possible, listed in §2.

---

## 1. What we are building, in one picture

```
 AUTHOR (teaching app)                     STORED (IRichText.doc)                   READER (all apps)
 ─────────────────────                     ──────────────────────                   ─────────────────
 select "Hola" → Pronunciation  ──►  text "Hola" + mark pronunciation    ──►  Hola 🔊  (popover: IPA,
   lang es-ES, IPA, translit           {lang, ipa, translit, audio}             translit, Normal / Slow)
 wrap passage → Listening block ──►  node listening {lang, mode, audio}  ──►  [▶ Play passage] + line
                                       └ paragraphs (dialogue lines)            highlight while playing
 AI reply / course agent        ──►  Markdown  [Hola]{lang=es-ES ipa=…}
                                       ::: listening lang=es-ES … :::

 PLAYBACK  (@repo/ui/content/speech)        AUDIO  (course agent, only where policy says)
 ─────────────────────────────────          ──────────────────────────────────────────────
 one shared player, one sound at a time     course:audio → Kokoro / Indic Parler-TTS (local)
   1. audio attr?  → <audio>, rate 1 / 0.7     → S3 orgs/<org>/audio/<lang>/<sha256>.mp3
   2. else voice?  → speechSynthesis           → stored address written into `audio`
   3. else         → show IPA / translit only
```

---

## 2. Where this plan departs from the draft, and why

| Draft                                                               | Here                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled: boolean` on the metadata                                  | **Dropped.** The mark's presence _is_ enablement; removing it disables. A stored `enabled: false` is a state with no meaning.                                                                                                                                                                                                                   |
| `scope: word \| phrase \| sentence \| paragraph \| dialogue` stored | **Two shapes instead of five values.** Word, phrase and sentence are all an inline _mark_ — the reader tells them apart by length (one word → popover with IPA; longer → inline play button). Paragraph and dialogue are a _block_ node wrapping paragraphs, with `mode: passage \| dialogue`. Nothing stores a scope the text already implies. |
| `slowPlayback` flag, separate `slowAudioUrl` files                  | **Always offered, never stored.** Browser speech slows with `rate`; a file slows with `playbackRate = 0.7` (`preservesPitch` is on by default). One file per item, not two.                                                                                                                                                                     |
| Google / Azure / ElevenLabs providers in the client                 | **No paid provider at all, and the client has exactly two sources: a stored file, or the device's voice.** Files are made by free open-source models (Kokoro, Indic Parler-TTS) run offline by the course agent (§7).                                                                                                                           |
| `voice` and `wordTimings` in the metadata                           | **Not in node attrs.** `RichTextAttrValue` is primitives only (`rich-text.interface.ts`), deliberately. The voice is part of the audio file's cache key; timings, when they come (phase 3), are a JSON file beside the audio.                                                                                                                   |
| `POST /api/pronunciation/analyze` calls a model for IPA             | **No.** The apps never call a model (`CLAUDE.md`, teaching → AI generation). IPA and transliteration arrive the way all content does: the paste-in prompt, or the course agent. A server endpoint is for _audio_ only.                                                                                                                          |
| Next.js `app/api/...` routes, `src/services/...` per app            | Pages Router apps with a NestJS server. Shared UI goes in `packages/ui`, pure data in `packages/shared`, routes in a new server module. Nothing is duplicated per app.                                                                                                                                                                          |
| Audio generated by a background job after save                      | **Device voice first; generated audio only where a per-language policy asks for it** (§7.0). Then made in bulk by the course agent (`course:audio`) — no queue, no server module, re-runs free. Teachers in the app record or upload instead.                                                                                                   |
| Defaults table (vocabulary → word, dialogue → sentence…)            | There is no "vocabulary" content type to hang defaults on. The defaults become **instructions in the AI prompt** for language courses, which is where nearly all of this content is written, plus a **course-level default language** so the author never picks Spanish twice.                                                                  |

---

## 3. Data model

### 3.1 Language registry — `packages/shared/src/utils/languages.ts`

Pure data, one entry per language, read by the editor's picker, the reader's voice lookup, the AI
prompt and the validator. Nothing else names a language code.

```ts
export interface ILanguage {
  code: string; // BCP-47: 'es-ES', 'hi-IN', 'sa', 'ja-JP'
  name: string; // 'Spanish'
  nativeName: string; // 'Español'
  script: 'latin' | 'devanagari' | 'japanese' | …; // drives whether transliteration is offered
  /** Device voices to try, in order. Sanskrit falls back to a Hindi voice, which reads Devanagari. */
  speechLocales: string[]; // ['es-ES', 'es-MX', 'es'] · sa → ['sa-IN', 'hi-IN']
}
export const LANGUAGES: ILanguage[] = [...];
export const findLanguage = (code: string): ILanguage | undefined => ...;
```

`supportsTTS` from the draft is not a static fact — it depends on the device — so it is answered at
runtime by the player (§5.2). `supportsIPA` is true for every language and is dropped.

> Naming clash: `packages/shared/src/ai/test-paper-generator.ts` already exports `LANGUAGES`
> (instruction languages: English, Hindi, Hinglish). Call the new one `SPEECH_LANGUAGES`, or rename
> the old one to `INSTRUCTION_LANGUAGES` in the same change.

### 3.2 Course default language — on the standard

The `languages` standard group already means "one standard per language, levels are subjects"
(`standard.enum.ts`). Add one optional field, `locale: string`, to `Standard` (schema, DTO, support
app's edit drawer). Spanish → `es-ES`, Sanskrit → `sa`. The teaching app passes the course's
standard locale to the editor as `defaultLanguage`; non-language courses pass nothing, and the
picker starts empty.

This is the only server change phase 1 needs, and it is optional — without it the author picks the
language once and the editor remembers the last choice (localStorage, like recent symbols).

### 3.3 Inline: the `pronunciation` mark

```json
{
  "type": "text",
  "text": "Hola",
  "marks": [{ "type": "pronunciation", "attrs": { "lang": "es-ES", "ipa": "ˈola", "translit": "", "audio": "" } }]
}
```

| Attr       | Type   | Notes                                                                                                                                                                                             |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`     | string | required, a `code` from the registry                                                                                                                                                              |
| `ipa`      | string | without slashes; the reader adds them                                                                                                                                                             |
| `translit` | string | romanisation for non-Latin scripts                                                                                                                                                                |
| `audio`    | string | `''` (the default: the device speaks), or a stored bucket address — exactly like `image.src` — signed by the reader. Filled only where the audio policy (§7.0) says so, or by a teacher recording |

Mark rules: `inclusive: false` (typing after "Hola" does not extend it), `excludes` itself (no
nesting), spans other marks (`**Buenos** días` stays one pronounceable run). Text inside it may
carry bold, italic, etc.

### 3.4 Block: the `listening` node

```json
{ "type": "listening", "attrs": { "lang": "es-ES", "mode": "dialogue", "audio": "" },
  "content": [ { "type": "paragraph", "content": [
                  { "type": "text", "text": "Ana:", "marks": [{ "type": "bold" }] },
                  { "type": "text", "text": " Hola, ¿cómo estás?" } ] },
               { "type": "paragraph", "content": [ … "Luis:" … ] } ] }
```

- `content: 'paragraph+'` — a passage or a dialogue is paragraphs, so everything inside is ordinary,
  editable, exportable text.
- `mode: 'passage'`: one Play control for the block; plays paragraph by paragraph (also dodges
  Chrome's ~15 s utterance cut-off) and highlights the one being read.
- `mode: 'dialogue'`: each paragraph is a line. A leading bold run ending in `:` is the speaker — not
  spoken, and the reader alternates two voices between speakers when the device has them. Each line
  gets its own small play button as well as Play all.
- Inline `pronunciation` marks may sit inside a `listening` block (a key word in a passage).

This is the first wrapper block in the schema; README §3 lists callouts and toggles as deliberately
unbuilt. `listening` is a deliberate, narrow addition — it holds paragraphs only, not arbitrary blocks.

### 3.5 Plain-text projection

`docToPlainText` is unchanged by the mark (text is text). The `listening` block projects as its
paragraphs. IPA and transliteration stay out of `text`, so search and previews are not polluted.

### 3.6 Markdown — the interchange format

AI replies, imports and exports are Markdown, so both shapes need a Markdown form or they are lost
on that path (README §11: all four paths, or none). Use Pandoc's syntax, which models already know:

```markdown
[Hola]{lang=es-ES ipa="ˈola"} means hello. [नमस्ते]{lang=sa translit="namaste" ipa="nɐmɐsteː"}

::: listening lang=es-ES mode=dialogue
**Ana:** Hola, ¿cómo estás?

**Luis:** Estoy bien, gracias.
:::
```

- Bracketed span: `[text]{key=value …}`; values quoted when they contain spaces. Does not collide
  with links, which need `(`.
- Fenced div: `::: listening …` to `:::`, contents are ordinary Markdown paragraphs.
- `docToMarkdown` writes exactly this (attrs in a fixed order, empty ones omitted, so the
  round-trip is byte-stable); `richTextFromMarkdown` reads it. An unknown `lang` is kept and warned
  about, not dropped. Malformed attrs leave the text as text.
- `audio` is not written to Markdown, the same way image width is not — it is produced after import.

---

## 4. Editor (teaching app, `@repo/ui/editor`)

New files, following the image node's layout:

```
packages/ui/src/editor/extensions/
  pronunciation.ts            Mark: attrs, inclusive:false, commands setPronunciation/unsetPronunciation
  listening.ts                Node: group block, content 'paragraph+', commands wrapInListening/lift
  ListeningNodeView.tsx       frame with lang chip, mode switch, play preview
packages/ui/src/editor/pronunciation/
  PronunciationPopover.tsx    form for the selected mark: language, IPA, transliteration, ▶ preview, remove
```

- **Toolbar**: one `SpeakerHigh` button with a small menu — _Pronounce selection_ (mark) and
  _Listening passage_ / _Dialogue_ (wrap the selected paragraphs). Shortcut `Ctrl/⌘+Shift+P` for the mark.
- **Popover**: opens when the caret is inside a marked run, like the table toolbar does inside a
  table. Fields use core wrappers (`Select`, `Input`) — run `/use-ui-component` first. Language is
  pre-filled from `defaultLanguage` (§3.2). The ▶ button previews through the same player the reader uses.
- **Visual cue in the editor**: a dotted underline and a faint speaker glyph after the run, so the
  author sees what is marked without opening anything.
- **Props**: `RichTextEditor` gains `defaultLanguage?: string`. Hosts: `UpsertMaterialModal`,
  `AddQuestion` / `AddOption` / `AddSolution`. They already know the course's standard.
- **Paste**: a pasted fragment from another document keeps its marks (ProseMirror does this for free).

---

## 5. Reader and playback (`@repo/ui/content`)

### 5.1 Rendering, in `RichTextView`

- **Group before marking.** Today `applyMarks` wraps each text node separately, so a mark across
  `**Buenos** días` (two text nodes) would render two speaker icons. Add a pre-pass over a block's
  inline children that merges adjacent nodes carrying an identical `pronunciation` mark into one
  group, renders their own marks inside, and wraps the group once in `<PronouncedText>`. This is
  the one non-obvious change to the renderer.
- `<PronouncedText>`: the text, a dotted underline, and a speaker button. Short runs (one word, or
  any run with IPA/translit) open a popover: text, translit, `/ipa/`, **▶ Normal**, **🐢 Slow**.
  Longer runs play on click; Slow is a second small button.
- `listening` → `<ListeningBlock>`: Play all / Pause / Slow, the paragraphs, a highlight on the one
  being read; dialogue lines get their own buttons.
- Older builds that meet the new node render its paragraphs as text (unknown-node fallback), and
  ignore the unknown mark. Nothing is lost.

### 5.2 The player — `packages/ui/src/content/speech/`

```
speech/
  player.ts        module singleton: play(request), stop(), subscribe(listener); one sound at a time
  device-voice.ts  speechSynthesis: voice lookup by speechLocales, voiceschanged, chunking, cancel
  audio-file.ts    HTMLAudioElement: src resolved through RichTextMediaContext, playbackRate
  use-speech.ts    hook: { state: idle|loading|playing, isActive(id), canSpeak(lang), play, stop }
```

```ts
interface ISpeechRequest {
  id: string;
  text: string;
  lang: string;
  audio: string;
  rate: 1 | 0.7;
}
```

Source order per request: **stored audio → device voice → none** (the button disables with a
tooltip "No voice for Sanskrit on this device", and the popover still shows translit and IPA). A
file that fails to load falls back to the device voice.

Module-level singleton is right here (there is exactly one speaker), matching how stores are module
singletons. It is the only place in the codebase that touches `speechSynthesis` or `new Audio`.

Device-voice gotchas the player owns, so nothing else has to know them:

- `getVoices()` is empty until `voiceschanged` fires (Chrome); wait for it once, with a timeout.
- Chrome stops long utterances after ~15 s — split by sentence and queue.
- `cancel()` before every new `speak()`; Safari otherwise queues.
- iOS speaks only from a user gesture — fine, every play is a click; never autoplay.
- Rates below ~0.6 sound broken on several voices; 0.7 is the floor for "Slow".

### 5.3 Media context

`IRichTextMedia.resolveImageUrl` already signs a stored address. Audio uses the same signing; rename
it to `resolveMediaUrl` in phase 1, since the `audio` attr and the file path of the player ship then
(three call sites, one per app's `rich-text-media.hook.ts`), rather than adding a second function
that does the same thing.

### 5.4 Accessibility

Every speaker control is a real button with `aria-label="Play pronunciation: Hola"`; the popover is
keyboard-openable; the playing state is announced (`aria-pressed`, `aria-live="polite"` on the
listening block). Pronunciation is never the only carrier of meaning — the text is always there.

---

## 6. AI pipeline and the course agent

Nearly all language content is written through the paste-in prompts and `tools/course-agent`, so the
feature is only as good as what they emit.

1. **Prompt** (`packages/shared/src/ai/common.ts`): a `PRONUNCIATION_RULES` block, added only when
   the course's standard is in the `languages` group, so a physics prompt is unchanged. It states the
   span and fenced-div syntax, and turns the draft's defaults table into instructions: mark every new
   vocabulary item and set phrase with IPA (and translit for non-Latin scripts); mark example
   sentences; wrap dialogues and reading passages in `listening`; never mark explanations, headings
   or translations.
2. **Validator** (`checkPronunciation`, beside `checkMarkdownMath`): unknown `lang`, empty span,
   unbalanced `:::`, a listening block with no paragraphs, IPA containing slashes (stripped, warned).
3. **Course agent**: same rules in `WRITER_BRIEF`, and a `course:pronounce` retrofit step that takes
   an existing lesson, has the model return it with spans added, and updates it in place — the way
   `update.mjs` added figures to the aptitude courses. First target: the Spanish Beginner course
   (84 lessons), which the examiner review already flagged as needing audio.
4. **The AI never decides about audio.** The prompt asks for marks with language, IPA and
   transliteration only; it says nothing about S3, files or audio. Whether an item gets a file is
   decided after import by `course:audio` from the audio policy (§7.0), which a person sets.
5. **Audio in bulk** (phase 2): `course:audio` (§7.2) synthesises the items the policy selects with
   the free engines and uploads them; everything else is left to the device voice.

---

## 7. Generated audio — free, open-source engines (phase 2)

Decided 2026-10-03: **no paid TTS API.** Audio is produced by open-source models on our own
machine, uploaded once to S3, and played from there. Students never run a model; they download a
small MP3.

### 7.0 When audio is generated: device first, by policy

Decided 2026-10-03: the `audio` field exists from phase 1 so the model never changes, but **the
device voice is the default** and a file is generated only where a fixed rule asks for one. The rule
is set by a person, per language, in the course agent — not judged by the AI per item, because the
agent cannot hear a student's phone and a per-item guess would be inconsistent.

```js
// tools/course-agent/tts/policy.mjs
export const AUDIO_POLICY = {
  default: 'device',
  languages: {
    'es-ES': 'device', // good built-in voices on most phones
    'en-US': 'device',
    'hi-IN': 'device',
    sa: 'generated', // phones have no Sanskrit voice
  },
  /** Listening passages and dialogues, where a natural, consistent voice matters more than for a word. */
  listening: 'device', // flip to 'generated' per language if phone testing says so
};
```

- `course:audio <course>` generates files only for items whose language (or block kind) resolves
  to `generated`, and skips the rest. `--force` generates for the whole course regardless, for a
  course where phone testing showed a poor voice.
- A language moves from `device` to `generated` on evidence: the phone check in phase 1 (§9), or
  learner reports. Moving it back simply stops generating; existing files keep playing.
- The reader's order does not change — stored audio, then device voice, then IPA/translit only.
  A file exists only where the device was judged not good enough, so playing it first is right.
- A teacher's recording (§7.3) always wins and is never touched by `course:audio`.

### 7.1 The engines, one per language family

| Engine                                                               | License                                          | Languages we need from it                                                             | Why                                                                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Kokoro-82M** (primary)                                             | Apache 2.0, model and voices                     | Spanish, English (US/UK), French, Hindi, Italian, Japanese, Portuguese (BR), Mandarin | Best quality of the free models at 82M parameters; runs on a laptop CPU faster than real time. Clean commercial licence.       |
| **Indic Parler-TTS** (AI4Bharat)                                     | Apache 2.0                                       | **Sanskrit**, and the other Indian languages Kokoro lacks (Tamil, Bengali, Marathi…)  | The only free model found with real Sanskrit support. ~0.9B parameters: slow on CPU, fine on the Mac's GPU (MPS) in a batch.   |
| **Piper** (only if a language neither covers is needed, e.g. German) | Engine GPL-3; **each voice has its own licence** | German and ~40 others                                                                 | Fast and small. Run as a separate process, so GPL does not touch our code — but check each voice's MODEL_CARD before using it. |
| **eSpeak NG** (not for audio)                                        | GPL-3, separate process                          | IPA for 100+ languages                                                                | Already a Kokoro dependency. `espeak-ng -q --ipa -v es "hola"` checks the IPA a model wrote (§7.4).                            |

Add an engine when the first course in its language starts — Kokoro alone covers the Spanish series.
The engine and voice per language live in the generator's own config, not in the shared language
registry: which model speaks Spanish is a tooling choice, not a property of Spanish.

Not used, and why: Meta MMS-TTS covers 1,100 languages but is CC-BY-NC (no commercial use); Coqui
XTTS has a non-commercial licence and no maintainer; in-browser Kokoro (`kokoro-js`) would make
every student download ~90 MB.

### 7.2 Where it runs: offline, in the course agent

```
tools/course-agent/tts/
  speak.py          reads JSON lines {key, text, lang, voice} → writes <key>.mp3 (Kokoro / Parler / Piper)
  requirements.txt  kokoro, parler-tts, soundfile; ffmpeg for WAV → MP3
cli.mjs  course:audio <course>   walk every lesson, collect marked runs and listening paragraphs,
                                 synthesise what is missing, upload, write `audio` back, update the lesson
```

Language content is already written by the course agent on Manish's machine, so audio is generated
there too, as one more step after `course:content`:

1. Collect every `pronunciation` run and every `listening` paragraph that the policy (§7.0)
   resolves to `generated` and that has no audio, or stale audio (§7.5).
2. Key each one `sha256(lang | engine | voice | text)`. A local cache (`.course-agent/audio/`) skips
   anything already made, so re-running is free and only new or edited text is synthesised.
3. Synthesise in one Python process (models load once), WAV → MP3 mono 64 kbps with ffmpeg.
   A word is ~5 KB, a sentence ~30 KB.
4. Upload through the existing presigned-PUT route to `orgs/<org>/audio/<lang>/<hash>.mp3`. The
   route already accepts any media type; no server change. Then write the address into the
   node's `audio` attr and update the lesson, the way `update.mjs` placed the aptitude figures.

**No server module, no Cloud Run change, no API key, no bill.** Reading needs nothing new either:
`presigned-GET-urls` already signs any key for published content. `tools/course-transfer` carries the
audio keys to production as it does content images.

The cost of this choice: a teacher editing in the teaching app has no **Generate** button. They
get the device voice (phase 1) and **Record / Upload** (§7.3), and the next `course:audio` run
fills in generated audio. If an in-app Generate button is wanted later, the same `speak.py` goes
into a small Python container on Cloud Run behind a `POST pronunciation/audio` route — a second
service to deploy and pay for, so it waits until it is asked for. Kokoro on Cloud Run CPU is
practical; Indic Parler-TTS without a GPU is not (tens of seconds per sentence).

### 7.3 Teacher-recorded audio

For a native voice, and for any language with no engine: **Record** and **Upload** in the
pronunciation popover. `MediaRecorder` → the existing presigned-PUT upload into
`orgs/<org>/audio/recorded/<id>.<ext>`, address into `audio`. Chrome records WebM/Opus and Safari
MP4/AAC; check that Safari plays a Chrome recording before shipping, and transcode on upload only
if it does not. A recording is never overwritten by `course:audio`.

### 7.4 IPA and transliteration, checked for free

Models write IPA confidently and wrongly. `course:audio` also runs eSpeak NG on each marked run and
reports where the model's IPA differs from eSpeak's, for a human to look at — it does not overwrite.
For Sanskrit, IAST → IPA is rule-based, so a small pure function (`iastToIpa`, in
`packages/shared/src/utils/`) can derive IPA from the transliteration instead of trusting either.

### 7.5 Stale audio

The filename is the hash of the text it speaks. The editor recomputes it (SubtleCrypto) for the
run under the caret and shows "audio out of date" when it no longer matches; `course:audio` does the
same in bulk and regenerates. Recordings carry no hash and are never flagged.

---

## 8. Phases

Each phase ships on its own and leaves nothing half-wired.

### Phase 1 — Mark, read, speak with the device (MVP)

**Status 2026-10-03: built, not committed.** Done: the registry, mark and block, Markdown both ways,
editor UI, reader UI and player, `resolveMediaUrl`, Editor Lab preset, `Standard.locale` (support
drawer) feeding the editor default and the prompts, `pronunciationRules` + `checkPronunciation`.
Left: set `locale` on the Spanish standard, retrofit the Spanish course, the device phone check.

`packages/shared`: language registry; Markdown read for span and fenced div; `docToPlainText` for
`listening`; prompt rules + validator. `packages/ui`: the mark, the node, popover and toolbar; the
renderer pre-pass, `PronouncedText`, `ListeningBlock`; the player with both paths — device voice,
and stored file when `audio` is set (testable with a teacher upload or a hand-placed file);
`resolveMediaUrl`; the `audio` attr on mark and block; `docToMarkdown`. Teaching: `defaultLanguage` into the editor hosts; Editor Lab presets for Spanish
vocabulary, a Sanskrit word list and a dialogue. Optional: `Standard.locale` + the support drawer field.

Done when: an author marks words and a dialogue in a material; a student hears them in Normal and
Slow on Chrome, Safari and an Android phone; the same lesson round-trips through Markdown unchanged;
an AI reply with spans imports cleanly; the Spanish course's first week is retrofitted.

### Phase 2 — Generated audio, where the device falls short

Starts when the first language is set to `generated` — the Sanskrit course, or Spanish if the
phase 1 phone check disappoints. Spanish ships on device voices with no audio files until then.

Teacher recording and upload (§7.3); the audio policy (§7.0); `course:audio` with the engine that
language needs — Indic Parler-TTS for Sanskrit, Kokoro for the Latin-script languages (§7.1); IPA
check with eSpeak NG (§7.4); stale-audio check (§7.5); audio keys through `tools/course-transfer`.

Done when: every item the policy selects plays a generated MP3 on all test devices, items set to
`device` have no file, a re-run of `course:audio` synthesises nothing, and editing one word
regenerates only that word.

### Phase 3 — Follow along

Word highlighting. Device voices: `onboundary` where the browser fires it (Chrome desktop does,
many mobile voices do not — degrade to paragraph highlighting). Generated audio: the open models
return no timings, so `course:audio` aligns each file to its text with a free forced aligner
(e.g. Whisper with word timestamps, MIT) and writes `<hash>.json` beside the mp3.

### Phase 4 — Speaking practice

- A new `QuestionType.SPEAKING` in `packages/shared/src/enums` (canonical there): the body holds the
  target text, the student records, the answer is a recording.
- **Assessment is a separate service from TTS** (draft §24, kept). Free route: Whisper (MIT) to
  check the words were said, plus a phoneme recogniser (wav2vec2 trained on eSpeak phonemes)
  compared against eSpeak's expected phonemes for a per-sound score. This needs a running service
  (it scores live student recordings, so it cannot be offline) and is research, not a known
  quantity — prototype before committing. Azure Pronunciation Assessment is the paid fallback if
  the free route is not good enough. Browser `SpeechRecognition` may power a "did it hear the
  word?" check, labelled as recognition, never as a score.
- `pronunciation-attempt` collection (user, course, content, lang, expected text, scores, optional
  recording address, createdAt). Recordings under `orgs/<org>/recordings/<user>/`, short retention
  by S3 lifecycle rule, microphone asked for only on the first record press.
- Listening questions need no new type: a `listening` block in a question body with ordinary options.

### Phase 5 — Personalisation (not planned in detail)

Weak-word detection from attempts, spaced repetition, targeted drills. Depends on phase 4 data
existing for a while first.

---

## 9. Verification

There is no unit-test runner in the repo, so each phase is checked the way content features have been:

- **Round-trip scratch checks** (README §11): `doc → Markdown → doc` identical for every preset,
  including spans with quoted values, Devanagari, a span over mixed marks, and nested fenced divs
  refused.
- **Editor Lab** (`/editor`): presets render in editor and reader side by side; Markdown/JSON tabs
  show the stored shape.
- **Browser e2e** with the Playwright setup in memory: mark → save → open as a student → click →
  assert the player's state changes (speech itself is not asserted; the player is).
- **Devices — the phone check that drives the audio policy**: Chrome desktop, Safari macOS/iOS,
  Chrome on a mid-range and a cheap Android, Edge on Windows. For each course language, note
  whether a voice exists and whether it is good enough to teach from. A language that fails on
  common devices moves to `generated` in §7.0.
- `/verify-changes` before reporting each phase done.

---

## 10. Decisions to confirm before phase 1

1. **Markdown syntax**: Pandoc spans and fenced divs (recommended) vs a link-scheme hack such as
   `[Hola](say:es-ES)`, which reuses the link parser but cannot carry IPA and translit cleanly.
2. **Course default language**: `Standard.locale` (recommended; one field, set once per language in
   support) vs no course default and remembered last choice only.
3. ~~TTS provider and budget~~ — decided 2026-10-03: free open-source engines, offline (§7).
   ~~Device or generated~~ — decided 2026-10-03: `audio` field from phase 1, device voice by
   default, generated audio per language by policy (§7.0).
4. **In-app Generate button**: not built (recommended; record/upload plus `course:audio` cover it)
   vs a Python TTS container on Cloud Run.
