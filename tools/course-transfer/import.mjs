/**
 * Imports a course folder written by `export.mjs` into a server, through its API, as a signed-in
 * teacher. See `.claude/plans/COURSE_TRANSFER.md`.
 *
 *   node tools/course-transfer/import.mjs --from data/courses/<slug> [--dry-run] [--publish]
 *     [--session-start 2026-10-01T17:00+05:30] [--session-days 1,2,3,4,5]
 *     [--target data/courses/target.env] [--base …] [--email …] [--firebase-key …] [--org …]
 *
 * The target file (gitignored under data/) holds COURSE_TRANSFER_BASE, _EMAIL, _PASSWORD,
 * _FIREBASE_KEY and optionally _ORG; a flag overrides its line, and the password may come from
 * the COURSE_TRANSFER_PASSWORD environment variable instead.
 *
 * Every document keeps its exported `_id`, so a rerun updates rather than duplicates. The server
 * stamps its own organization and teacher on every write. The course lands unpublished; publish it
 * after review and rerun with `--publish`. The exported meets, if any, are replaced by one weekly
 * meet on `--session-days` (0 = Sunday) from `--session-start`, same duration and Meet link. Its id,
 * its start and the re-uploaded files' addresses are kept in `import-state.json`, so a rerun reuses
 * them rather than creating a second meet or uploading again.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sharedRequire = createRequire(join(repo, 'packages/shared/package.json'));
const enums = sharedRequire('./dist/enums/index.js');
const utils = sharedRequire('./dist/utils/index.js');

// ---------------------------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const required = (name) => option(name) ?? fail(`--${name} is required`);
function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const targetFile = resolve(repo, option('target', 'data/courses/target.env'));
const target = existsSync(targetFile)
  ? Object.fromEntries(
      readFileSync(targetFile, 'utf8')
        .split('\n')
        .filter((l) => /^COURSE_TRANSFER_[A-Z_]+=/.test(l))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
    )
  : {};
const setting = (flagName, key) =>
  option(flagName) ?? process.env[`COURSE_TRANSFER_${key}`] ?? target[`COURSE_TRANSFER_${key}`];
const needed = (flagName, key) =>
  setting(flagName, key) ?? fail(`set --${flagName} or COURSE_TRANSFER_${key} in ${targetFile}`);

const from = resolve(repo, required('from'));
const base = needed('base', 'BASE').replace(/\/+$/, '');
const email = needed('email', 'EMAIL');
const firebaseKey = needed('firebase-key', 'FIREBASE_KEY');
const orgOption = setting('org', 'ORG');
const dryRun = flag('dry-run');
const publish = flag('publish');
// Writes the course record (and its plans) only: how a change such as the display order reaches
// the target without sending every lesson and question again.
const courseOnly = flag('course-only');
const password =
  process.env.COURSE_TRANSFER_PASSWORD ??
  target.COURSE_TRANSFER_PASSWORD ??
  fail(`COURSE_TRANSFER_PASSWORD is not set in ${targetFile}`);

const read = (name) => JSON.parse(readFileSync(join(from, name), 'utf8'));
const manifest = read('manifest.json');
const { course, plans } = read('course.json');
const modules = read('modules.json');
const materials = read('materials.json');
const papers = read('test-papers.json');
const exportedMeets = read('meets.json');
const chapters = read('chapters.json');
const stateFile = join(from, 'import-state.json');
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const saveState = () => !dryRun && writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');

// ---------------------------------------------------------------------------------------------
// Session and HTTP
// ---------------------------------------------------------------------------------------------
const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseKey}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password, returnSecureToken: true }),
});
const session = await signIn.json();
if (!signIn.ok) fail(`sign-in failed: ${session.error?.message ?? signIn.status}`);

const headers = (org) => ({
  'content-type': 'application/json',
  authorization: `Bearer ${session.idToken}`,
  app: enums.Subdomain.TEACH,
  timezone: 'Asia/Kolkata',
  'timezone-offset': '-330',
  ...(org ? { organization: org } : {}),
});
let orgId = '';
const api = async (route, body) => {
  const response = await fetch(`${base}/${route}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: headers(orgId),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = json?.error?.message ?? json?.message ?? response.statusText;
    throw new Error(`${route} → ${response.status}: ${Array.isArray(message) ? message.join('; ') : message}`);
  }
  return json.data ?? json;
};
const write = async (route, body, label) => {
  if (dryRun) return console.log(`  [dry run] ${route} ← ${label}`);
  await api(route, body);
};

const login = await api('user/initial-login-data');
const orgs = login.orgs ?? [];
const org = orgOption ? orgs.find((o) => String(o._id) === orgOption) : orgs.length === 1 ? orgs[0] : undefined;
if (!org) fail(`choose an organization with --org: ${orgs.map((o) => `${o.name} (${o._id})`).join(', ')}`);
orgId = String(org._id);
console.log(`${dryRun ? '[dry run] ' : ''}${base} as ${email} in "${org.name}" ← "${manifest.course.name}"`);

// ---------------------------------------------------------------------------------------------
// 1. Files: upload each one into this organization and rewrite the attachment's address
// ---------------------------------------------------------------------------------------------
state.files ??= {};
for (const file of manifest.files) {
  if (!state.files[file.key]) {
    if (dryRun) {
      console.log(`  [dry run] upload ${file.path} (${file.bytes} bytes)`);
      continue;
    }
    const [signed] = await api('common/presigned-PUT-urls', {
      files: [{ key: file.key, contentType: file.contentType }],
    });
    const put = await fetch(signed.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.contentType },
      body: readFileSync(join(from, file.path)),
    });
    if (!put.ok) throw new Error(`upload of ${file.path} failed: ${put.status}`);
    state.files[file.key] = signed.url.split('?')[0];
    saveState();
  }
}
// Pictures inside lessons and questions: uploaded into this organization's content/ folder, then
// every image node pointing at the dev address is pointed at the uploaded one.
state.contentImages ??= {};
for (const image of manifest.contentImages ?? []) {
  if (state.contentImages[image.src]) continue;
  if (dryRun) {
    console.log(`  [dry run] upload ${image.path} (${image.bytes} bytes)`);
    continue;
  }
  const key = `content/${image.name}`;
  const [signed] = await api('common/presigned-PUT-urls', { files: [{ key, contentType: image.contentType }] });
  const put = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': image.contentType },
    body: readFileSync(join(from, image.path)),
  });
  if (!put.ok) throw new Error(`upload of ${image.path} failed: ${put.status}`);
  state.contentImages[image.src] = signed.url.split('?')[0];
  saveState();
}
// Speech files in lessons and questions: uploaded under the same path in this organization's folder,
// then every mark or listening block pointing at the dev address is pointed at the uploaded one.
state.contentAudio ??= {};
for (const audio of manifest.contentAudio ?? []) {
  if (state.contentAudio[audio.src]) continue;
  if (dryRun) {
    console.log(`  [dry run] upload ${audio.path} (${audio.bytes} bytes)`);
    continue;
  }
  const [signed] = await api('common/presigned-PUT-urls', { files: [{ key: audio.key, contentType: audio.contentType }] });
  const put = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': audio.contentType },
    body: readFileSync(join(from, audio.path)),
  });
  if (!put.ok) throw new Error(`upload of ${audio.path} failed: ${put.status}`);
  state.contentAudio[audio.src] = signed.url.split('?')[0];
  saveState();
}
const withContentImages = (value) => {
  if (Array.isArray(value)) return value.map(withContentImages);
  if (!value || typeof value !== 'object') return value;
  const next = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withContentImages(v)]));
  if (next.type === 'image' && state.contentImages[next.attrs?.src]) next.attrs = { ...next.attrs, src: state.contentImages[next.attrs.src] };
  if (state.contentAudio[next.attrs?.audio]) next.attrs = { ...next.attrs, audio: state.contentAudio[next.attrs.audio] };
  if (typeof next.attrs?.lineAudio === 'string' && next.attrs.lineAudio) {
    const lines = next.attrs.lineAudio.split('\n').map((a) => state.contentAudio[a] ?? a);
    next.attrs = { ...next.attrs, lineAudio: lines.join('\n') };
  }
  return next;
};

const withUploadedUrls = (doc) => ({
  ...doc,
  attachments: (doc.attachments ?? []).map((a) => (state.files[a.key] ? { ...a, url: state.files[a.key] } : a)),
});

// ---------------------------------------------------------------------------------------------
// 2. The one Monday-to-Friday meet that replaces the exported sessions
// ---------------------------------------------------------------------------------------------
const exportedMeetIds = new Set(exportedMeets.map((m) => m._id));
const hasSessions = exportedMeets.length > 0;
if (hasSessions) {
  state.meetId ??= utils.createObjectId();
  state.meetingId ??= utils.createObjectId();
  state.sessionStart ??=
    option('session-start') ?? fail('the course has sessions: pass --session-start, e.g. 2026-10-01T17:00+05:30');
  state.sessionDays ??= option('session-days', '1,2,3,4,5').split(',').map(Number);
  saveState();
}
const start = new Date(state.sessionStart ?? Date.now());
if (Number.isNaN(start.getTime())) fail(`--session-start ${state.sessionStart} is not a date`);
const durationMins = exportedMeets[0]?.durationMins ?? 45;
const meet = {
  _id: state.meetId,
  title: `${course.name} · Live session`,
  description: ['Live sessions through the course:', ...exportedMeets.map((m) => `• ${m.title}`)].join('\n'),
  timezone: 'Asia/Kolkata',
  timezoneOffset: '-330',
  startTime: start.toISOString(),
  endTime: new Date(start.getTime() + durationMins * 60_000).toISOString(),
  durationMins,
  status: enums.MeetStatus.SCHEDULED,
  standards: course.standards,
  batches: [],
  attendees: [],
  meetingLink: exportedMeets.find((m) => m.meetingLink)?.meetingLink ?? '',
  meetingId: state.meetingId,
  weekDays: state.sessionDays ?? [],
  cancelledDates: [],
  frequency: enums.MeetFrequency.WEEKLY,
  color: enums.ColorType.BLUE,
};
const toNewMeet = (ids) => [...new Set((ids ?? []).map((id) => (exportedMeetIds.has(id) ? state.meetId : id)))];
const courseMeets = hasSessions ? [state.meetId] : [];

// ---------------------------------------------------------------------------------------------
// 3. Writes, in dependency order
// ---------------------------------------------------------------------------------------------
for (const chapter of chapters) await write('chapter/upsert', chapter, `chapter ${chapter.name}`);

await write(
  'course/upsert/course/plans',
  {
    course: {
      ...withUploadedUrls(course),
      meets: courseMeets,
      isPublished: publish,
      ...(publish ? { publishedDate: new Date().toISOString() } : {}),
    },
    plans,
  },
  `course and ${plans.length} plan(s), ${publish ? 'published' : 'unpublished'}`,
);

if (courseOnly) {
  if (!dryRun) {
    const saved = await api(`course/${course._id}`);
    if (saved.order !== course.order || saved.isPublished !== publish) {
      fail(`read-back: order ${saved.order}, published ${saved.isPublished}; expected ${course.order}, ${publish}`);
    }
  }
  console.log(`${dryRun ? '[dry run] ' : ''}course ${course._id} · order ${course.order} · ${publish ? 'published' : 'unpublished'}`);
  process.exit(0);
}

// Batches stay under Fastify's 1 MiB default body limit.
const MAX_BATCH_BYTES = 800_000;
let batch = [];
let batchBytes = 0;
const flushMaterials = async () => {
  if (!batch.length) return;
  await write('material/bulk-upsert', { materials: batch }, `${batch.length} materials`);
  batch = [];
  batchBytes = 0;
};
for (const material of materials.map(withUploadedUrls).map(withContentImages)) {
  const bytes = JSON.stringify(material).length;
  if (batchBytes + bytes > MAX_BATCH_BYTES) await flushMaterials();
  batch.push(material);
  batchBytes += bytes;
}
await flushMaterials();

for (const { paper, sections, questions } of papers) {
  // Sections that list subsections go last, so what they point at already exists.
  const ordered = [...sections].sort(
    (a, b) => Number(Boolean(a.subsections?.length)) - Number(Boolean(b.subsections?.length)),
  );
  for (const section of ordered) await write('test-paper/section/upsert', section, `section ${section.name}`);
  await write('test-paper/upsert', paper, `test paper ${paper.name}`);
  if (questions.length) await write('question/bulk-upsert', { questions: withContentImages(questions) }, `${questions.length} questions`);
}

if (hasSessions)
  await write('meet/upsert', meet, `meet "${meet.title}", weekdays ${meet.weekDays.join(',')} from ${meet.startTime}`);

const importedModules = modules.map((m) => ({
  ...m,
  meets: toNewMeet(m.meets),
  pending: (m.pending ?? []).map((p) =>
    p.createdId && exportedMeetIds.has(p.createdId) ? { ...p, createdId: state.meetId } : p,
  ),
}));
await write('course/upsert/course/modules', { modules: importedModules }, `${importedModules.length} modules`);

// ---------------------------------------------------------------------------------------------
// 4. Read-back: every exported id is on the server, in this course
// ---------------------------------------------------------------------------------------------
if (dryRun) {
  console.log('dry run: nothing written');
  process.exit(0);
}
const problems = [];
const check = (label, wanted, got) => {
  const have = new Set(got.map((d) => String(d._id ?? d)));
  const lost = wanted.filter((id) => !have.has(String(id)));
  if (lost.length) problems.push(`${label}: ${lost.length} missing (${lost.slice(0, 3).join(', ')}…)`);
  else console.log(`  ${label.padEnd(12)} ${wanted.length} ok`);
};
const [savedCourse, savedModules, savedPlans, savedMaterials, savedPapers, savedMeets] = await Promise.all([
  api(`course/${course._id}`),
  api(`course/course/modules/${course._id}`),
  api(`course/plans/${course._id}`),
  api('material/all'),
  api('test-paper/all'),
  api('meet/all'),
]);
console.log('read-back:');
check('course', [course._id], [savedCourse]);
check(
  'plans',
  plans.map((p) => p._id),
  savedPlans,
);
check(
  'modules',
  modules.map((m) => m._id),
  savedModules,
);
check(
  'materials',
  materials.map((m) => m._id),
  savedMaterials,
);
check(
  'test papers',
  papers.map((p) => p.paper._id),
  savedPapers,
);
if (hasSessions) check('meet', [state.meetId], savedMeets);
let questionCount = 0;
for (const { paper, questions } of papers) {
  const { questions: saved } = await api(`test-paper/sections-with-questions/${paper._id}`);
  questionCount += saved.length;
  if (saved.length !== questions.length)
    problems.push(`test paper ${paper.name}: ${saved.length} of ${questions.length} questions`);
}
if (questionCount === manifest.counts.questions) console.log(`  ${'questions'.padEnd(12)} ${questionCount} ok`);
const cover = savedCourse.attachments?.[0]?.url ?? '';
if (manifest.files.length && !Object.values(state.files).includes(cover))
  problems.push(`cover is ${cover || 'missing'}`);

if (savedCourse.isPublished !== publish) problems.push(`course isPublished is ${savedCourse.isPublished}`);
if (problems.length) fail(`read-back failed:\n  ${problems.join('\n  ')}`);
console.log(
  `read-back ok · course ${course._id} is ${publish ? 'published' : 'unpublished; rerun with --publish after review'}`,
);
