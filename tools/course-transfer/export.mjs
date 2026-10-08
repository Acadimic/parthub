/**
 * Exports one course, with everything it owns, from a database into a folder of JSON files.
 * Read-only: it never writes to the database. See `.claude/plans/COURSE_TRANSFER.md`.
 *
 *   node tools/course-transfer/export.mjs --course <id | name> [--out data/courses/<course slug>]
 *                                         [--env apps/server/.env.development]
 *
 * A name matches case-insensitively, whole or in part; more than one match is an error that lists
 * them, so pass the id.
 *
 * Every document keeps its `_id`; the ownership fields (`org`, `createdBy`, …) and `__v` are
 * dropped, because the target database stamps its own. Uploaded files (S3 attachments) are
 * downloaded into `files/`; link attachments stay links.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// The server workspace owns the driver and the S3 SDK; resolve them from there rather than
// declaring them twice.
const serverRequire = createRequire(join(repo, 'apps/server/package.json'));
const { MongoClient, ObjectId } = createRequire(serverRequire.resolve('mongoose'))('mongodb');
const { S3Client, GetObjectCommand } = serverRequire('@aws-sdk/client-s3');

// ---------------------------------------------------------------------------------------------
// Arguments and environment
// ---------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const courseArg = option('course');
if (!courseArg) throw new Error('usage: export.mjs --course <id | name> [--out <folder>]');
let outArg = '';
let out = '';
const envFile = resolve(repo, option('env', 'apps/server/.env.development'));

const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
for (const key of ['DB_URL', 'AWS_REGION', 'AWS_ACCESS_KEY', 'AWS_SECRET_KEY']) {
  if (!env[key]) throw new Error(`${key} is not set in ${envFile}`);
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
const OWNERSHIP_FIELDS = ['org', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt', '_deleted', '__v'];
const clean = (doc) => {
  const copy = { ...doc };
  for (const field of OWNERSHIP_FIELDS) delete copy[field];
  return JSON.parse(JSON.stringify(copy));
};
const live = { _deleted: { $ne: true } };
const ids = (list) => (list ?? []).map((id) => new ObjectId(String(id)));
const write = (name, value) => writeFileSync(join(out, name), JSON.stringify(value, null, 2) + '\n');

// ---------------------------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------------------------
const client = await MongoClient.connect(env.DB_URL);
const db = client.db();
const col = (name) => db.collection(name);

try {
  const escaped = courseArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches =
    ObjectId.isValid(courseArg) && /^[0-9a-f]{24}$/i.test(courseArg)
      ? await col('courses')
          .find({ _id: new ObjectId(courseArg), ...live })
          .toArray()
      : await col('courses')
          .find({ name: { $regex: escaped, $options: 'i' }, ...live })
          .toArray();
  if (!matches.length) throw new Error(`no course matches "${courseArg}"`);
  if (matches.length > 1) {
    throw new Error(
      `"${courseArg}" matches ${matches.length} courses; pass the id:\n  ${matches.map((c) => `${c._id}  ${c.name}`).join('\n  ')}`,
    );
  }
  const [course] = matches;
  outArg = option('out', `data/courses/${course.slug}`);
  out = resolve(repo, outArg);

  const plans = await col('plans')
    .find({ courses: course._id, ...live })
    .toArray();
  const modules = await col('coursemodules')
    .find({ course: course._id, ...live })
    .sort({ day: 1 })
    .toArray();

  const materialIds = modules.flatMap((m) => m.materials ?? []);
  const testPaperIds = modules.flatMap((m) => m.testPapers ?? []);
  const meetIds = [...new Set([...(course.meets ?? []), ...modules.flatMap((m) => m.meets ?? [])].map(String))];

  const materials = await col('materials')
    .find({ _id: { $in: ids(materialIds) }, ...live })
    .toArray();
  const testPapers = await col('testpapers')
    .find({ _id: { $in: ids(testPaperIds) }, ...live })
    .toArray();
  const meets = await col('meets')
    .find({ _id: { $in: ids(meetIds) }, ...live })
    .sort({ startTime: 1 })
    .toArray();

  // A section's subsections are sections too, to any depth; questions point at the top-level one.
  const sectionById = new Map();
  let frontier = testPapers.flatMap((t) => t.sections ?? []);
  while (frontier.length) {
    const found = await col('testpapersections')
      .find({ _id: { $in: ids(frontier) }, ...live })
      .toArray();
    for (const s of found) sectionById.set(String(s._id), s);
    frontier = found.flatMap((s) => s.subsections ?? []).filter((id) => !sectionById.has(String(id)));
  }
  const topSectionIds = testPapers.flatMap((t) => t.sections ?? []);
  const questions = await col('questions')
    .find({ section: { $in: ids(topSectionIds) }, ...live })
    .sort({ order: 1 })
    .toArray();

  const chapterIds = [
    ...new Set(
      [...materials, ...questions]
        .map((d) => d.chapter)
        .filter(Boolean)
        .map(String),
    ),
  ];
  const chapters = await col('chapters')
    .find({ _id: { $in: ids(chapterIds) }, ...live })
    .toArray();

  // -------------------------------------------------------------------------------------------
  // Check nothing a module points at is missing
  // -------------------------------------------------------------------------------------------
  const missing = [];
  const expect = (label, wanted, got) => {
    const have = new Set(got.map((d) => String(d._id)));
    for (const id of wanted.map(String)) if (!have.has(id)) missing.push(`${label} ${id}`);
  };
  expect('material', materialIds, materials);
  expect('test paper', testPaperIds, testPapers);
  expect('meet', meetIds, meets);
  expect('section', [...sectionById.keys()], [...sectionById.values()]);
  expect('chapter', chapterIds, chapters);
  if (missing.length) throw new Error(`referenced but missing or deleted:\n  ${missing.join('\n  ')}`);

  // -------------------------------------------------------------------------------------------
  // Files: every uploaded attachment on the course and its materials
  // -------------------------------------------------------------------------------------------
  mkdirSync(join(out, 'files'), { recursive: true });
  const s3 = new S3Client({
    region: env.AWS_REGION,
    credentials: { accessKeyId: env.AWS_ACCESS_KEY, secretAccessKey: env.AWS_SECRET_KEY },
  });
  const uploads = [course, ...materials].flatMap((doc) =>
    (doc.attachments ?? [])
      .filter((a) => a.isUploaded && a.url)
      .map((a) => ({ owner: String(doc._id), attachment: a })),
  );
  const files = [];
  for (const { owner, attachment } of uploads) {
    const { hostname, pathname } = new URL(attachment.url);
    const bucket = hostname.split('.s3.')[0];
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: decodeURIComponent(pathname.slice(1)) }),
    );
    const body = Buffer.from(await response.Body.transformToByteArray());
    const path = join('files', attachment.key);
    mkdirSync(dirname(join(out, path)), { recursive: true });
    writeFileSync(join(out, path), body);
    files.push({
      owner,
      key: attachment.key,
      path,
      contentType: attachment.fileType,
      bytes: body.length,
      sourceUrl: attachment.url,
    });
  }

  // Pictures inside authored content: an image node's `src` is the address of an object in the
  // dev bucket, which the target cannot sign. Each one is downloaded once, however often it is
  // placed, and the import uploads it again and rewrites the address.
  const imageSources = new Set();
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== 'object') return;
    if (value.type === 'image' && typeof value.attrs?.src === 'string' && /\.s3\.[^/]*amazonaws\.com\//.test(value.attrs.src)) {
      imageSources.add(value.attrs.src);
    }
    Object.values(value).forEach(walk);
  };
  // Generated or recorded speech: a pronunciation mark or a listening block whose `audio` is an
  // object in the dev bucket. Carried the same way, keeping its path inside the org's folder.
  const audioSources = new Set();
  const walkAudio = (value) => {
    if (Array.isArray(value)) return value.forEach(walkAudio);
    if (!value || typeof value !== 'object') return;
    if (typeof value.attrs?.audio === 'string' && /\.s3\.[^/]*amazonaws\.com\//.test(value.attrs.audio)) {
      audioSources.add(value.attrs.audio);
    }
    // A listening block's per-line files, one address per line.
    if (typeof value.attrs?.lineAudio === 'string') {
      value.attrs.lineAudio.split('\n').filter((a) => /\.s3\.[^/]*amazonaws\.com\//.test(a)).forEach((a) => audioSources.add(a));
    }
    Object.values(value).forEach(walkAudio);
  };
  walk(materials.map((m) => m.content));
  walk(questions.map((q) => [q.body, q.options, q.solution]));
  walkAudio(materials.map((m) => m.content));
  walkAudio(questions.map((q) => [q.body, q.options, q.solution]));
  const contentImages = [];
  for (const src of imageSources) {
    const { hostname, pathname } = new URL(src);
    const response = await s3.send(new GetObjectCommand({ Bucket: hostname.split('.s3.')[0], Key: decodeURIComponent(pathname.slice(1)) }));
    const body = Buffer.from(await response.Body.transformToByteArray());
    const name = pathname.split('/').pop();
    const path = join('files', 'content', name);
    mkdirSync(dirname(join(out, path)), { recursive: true });
    writeFileSync(join(out, path), body);
    contentImages.push({ src, path, name, contentType: response.ContentType ?? 'application/octet-stream', bytes: body.length });
  }

  const contentAudio = [];
  for (const src of audioSources) {
    const { hostname, pathname } = new URL(src);
    const objectKey = decodeURIComponent(pathname.slice(1));
    const response = await s3.send(new GetObjectCommand({ Bucket: hostname.split('.s3.')[0], Key: objectKey }));
    const body = Buffer.from(await response.Body.transformToByteArray());
    // The key below the organization's folder (`audio/sa/<hash>.mp3`), reused in the target org.
    const key = objectKey.replace(/^.*?orgs\/[^/]+\//, '');
    const path = join('files', key);
    mkdirSync(dirname(join(out, path)), { recursive: true });
    writeFileSync(join(out, path), body);
    contentAudio.push({ src, path, key, contentType: response.ContentType ?? 'audio/mpeg', bytes: body.length });
  }

  // -------------------------------------------------------------------------------------------
  // Write
  // -------------------------------------------------------------------------------------------
  const sectionTree = (sectionIds) =>
    (sectionIds ?? []).flatMap((id) => {
      const section = sectionById.get(String(id));
      return [section, ...sectionTree(section.subsections)];
    });
  write('course.json', { course: clean(course), plans: plans.map(clean) });
  write('modules.json', modules.map(clean));
  write('materials.json', materials.map(clean));
  write(
    'test-papers.json',
    testPapers.map((paper) => ({
      paper: clean(paper),
      sections: sectionTree(paper.sections).map(clean),
      questions: questions.filter((q) => (paper.sections ?? []).map(String).includes(String(q.section))).map(clean),
    })),
  );
  write('meets.json', meets.map(clean));
  write('chapters.json', chapters.map(clean));

  const counts = {
    plans: plans.length,
    modules: modules.length,
    materials: materials.length,
    testPapers: testPapers.length,
    sections: sectionById.size,
    questions: questions.length,
    meets: meets.length,
    chapters: chapters.length,
    files: files.length,
    contentImages: contentImages.length,
    contentAudio: contentAudio.length,
  };
  write('manifest.json', {
    course: { _id: String(course._id), name: course.name },
    exportedAt: new Date().toISOString(),
    source: { database: db.databaseName, org: String(course.org) },
    counts,
    files,
    contentImages,
    contentAudio,
  });

  console.log(`exported "${course.name}" → ${outArg}`);
  for (const [name, count] of Object.entries(counts)) console.log(`  ${name.padEnd(10)} ${count}`);
} finally {
  await client.close();
}
