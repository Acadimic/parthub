#!/usr/bin/env node
/**
 * The course agent's command line: the AI course generation pipeline, driven from a terminal.
 *
 * Runs the same builders, validators and converters the teaching app runs (`@repo/shared/ai`),
 * against the same API routes, as the signed-in teacher. Nothing here calls a model: the agent
 * that runs this tool answers the prompts itself. State lives in `.course-agent/` at the repo
 * root (git-ignored): the session, and one file per course run with the ids the prompts carried.
 *
 * Usage: node tools/course-agent/cli.mjs <command> [options]; `--help` lists the commands.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STATE_DIR = path.join(ROOT, '.course-agent');
const SESSION_FILE = path.join(STATE_DIR, 'session.json');

// The shared package is consumed as its compiled output, as the apps consume it. This tool sits
// outside the workspaces, so it reaches the output directly rather than through a package name.
const require = createRequire(path.join(ROOT, 'packages/shared/package.json'));
const ai = require('./dist/ai/index.js');
const enums = require('./dist/enums/index.js');
const utils = require('./dist/utils/index.js');

// ------------------------------------------------------------------------------------------------
// Configuration, session, HTTP
// ------------------------------------------------------------------------------------------------

const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
};

const env = { ...readEnvFile(path.join(ROOT, 'apps/teaching/.env')), ...process.env };
const API_URL = (env.ACADIMIC_API_URL || env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000/').replace(/\/?$/, '/');
const FIREBASE_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;

const readJson = (file, fallback = null) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
};
const runFile = (courseId) => path.join(STATE_DIR, 'runs', `${courseId}.json`);

const fail = (message) => {
  console.error(`error: ${message}`);
  process.exit(1);
};

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Echo nothing for a password: readline's own output is overridden while the question is up.
      const write = rl._writeToOutput.bind(rl);
      rl._writeToOutput = (text) => (text.includes(question) ? write(question) : undefined);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });

/** Trades the refresh token for a new id token when the current one is within a minute of expiry. */
const refreshSession = async (session) => {
  if (!session.refreshToken || session.expiresAt - Date.now() > 60_000) return session;
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`,
  });
  if (!response.ok) fail('The session has expired and could not be refreshed. Run `login` again.');
  const data = await response.json();
  const next = { ...session, idToken: data.id_token, refreshToken: data.refresh_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
  writeJson(SESSION_FILE, next);
  return next;
};

const loadSession = async () => {
  const session = readJson(SESSION_FILE);
  if (!session?.idToken) fail('Not signed in. Run `login` first.');
  return refreshSession(session);
};

const headers = (session, withOrg = true) => ({
  'content-type': 'application/json',
  authorization: `Bearer ${session.idToken}`,
  app: enums.Subdomain.TEACH,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  'timezone-offset': String(new Date().getTimezoneOffset()),
  ...(withOrg && session.orgId ? { organization: session.orgId } : {}),
});

const api = async (route, { method = 'GET', body, withOrg = true } = {}) => {
  const session = await loadSession();
  const response = await fetch(`${API_URL}${route}`, {
    method,
    headers: headers(session, withOrg),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const message = json?.error?.message ?? json?.message ?? response.statusText;
    throw new Error(`${method} ${route} → ${response.status}: ${Array.isArray(message) ? message.join('; ') : message}`);
  }
  return json.data ?? json;
};

// ------------------------------------------------------------------------------------------------
// Arguments
// ------------------------------------------------------------------------------------------------

const parseArgs = (argv) => {
  const [command, ...rest] = argv;
  const options = { _: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) {
      options._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = rest[index + 1];
    if (next === undefined || next.startsWith('--')) options[key] = true;
    else {
      options[key] = options[key] === undefined ? next : [].concat(options[key], next);
      index += 1;
    }
  }
  return { command, options };
};

const list = (value) => (value === undefined ? [] : [].concat(value).flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean));

// ------------------------------------------------------------------------------------------------
// Workspace
// ------------------------------------------------------------------------------------------------

const loadWorkspace = async () => {
  const [initial, chapters, testPapers] = await Promise.all([api('common/initial-data'), api('chapter/all'), api('test-paper/all')]);
  return { standards: initial.standards ?? [], subjects: initial.subjects ?? [], mappings: initial.mappings ?? [], chapters: chapters ?? [], testPapers: testPapers ?? [] };
};

const byId = (rows) => new Map(rows.map((row) => [String(row._id), row]));

/** A name or an id → the row, case-insensitively on the name. */
const resolveRows = (rows, wanted, label) =>
  wanted.map((item) => {
    const row = rows.find((candidate) => String(candidate._id) === item || candidate.name?.toLowerCase() === item.toLowerCase());
    if (!row) fail(`Unknown ${label} "${item}". Run \`workspace\` to see the names.`);
    return row;
  });

const subjectIdsForStandards = (workspace, standardIds) => [
  ...new Set(workspace.mappings.filter((mapping) => standardIds.includes(String(mapping.standard))).map((mapping) => String(mapping.subject))),
];

// ------------------------------------------------------------------------------------------------
// Commands
// ------------------------------------------------------------------------------------------------

const commands = {};

commands.login = async (options) => {
  if (!FIREBASE_KEY) fail('NEXT_PUBLIC_FIREBASE_API_KEY was not found in apps/teaching/.env or the environment.');
  let session;
  if (options.token) {
    // An id token from an already signed-in browser, for a one-off run; it is not refreshable.
    session = { idToken: String(options.token), refreshToken: null, expiresAt: Date.now() + 55 * 60_000 };
  } else {
    const email = options.email ?? (await ask('Email: '));
    const password = env.ACADIMIC_PASSWORD ?? (await ask('Password: ', { hidden: true }));
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await response.json();
    if (!response.ok) fail(`Sign-in failed: ${data?.error?.message ?? response.statusText}`);
    session = { email, idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn) * 1000 };
  }
  writeJson(SESSION_FILE, session);
  const login = await api('user/initial-login-data', { withOrg: false });
  const orgs = login.orgs ?? [];
  const chosen = options.org ? orgs.find((org) => String(org._id) === options.org || org.name?.toLowerCase() === String(options.org).toLowerCase()) : orgs[0];
  if (!chosen) fail(`No organization${options.org ? ` named "${options.org}"` : ''}. Available: ${orgs.map((org) => `${org.name} (${org._id})`).join(', ')}`);
  writeJson(SESSION_FILE, { ...session, orgId: String(chosen._id), orgName: chosen.name, email: session.email ?? login.users?.[0]?.email });
  console.log(`Signed in${session.email ? ` as ${session.email}` : ''}; organization: ${chosen.name} (${chosen._id}).`);
  if (orgs.length > 1) console.log(`Other organizations: ${orgs.filter((org) => org !== chosen).map((org) => `${org.name} (${org._id})`).join(', ')}. Pass --org to switch.`);
};

commands.whoami = async () => {
  const session = await loadSession();
  console.log(JSON.stringify({ email: session.email, organization: session.orgName, orgId: session.orgId, api: API_URL, expiresInMins: Math.round((session.expiresAt - Date.now()) / 60_000) }, null, 2));
};

commands.workspace = async (options) => {
  const workspace = await loadWorkspace();
  const standards = options.standards ? resolveRows(workspace.standards, list(options.standards), 'standard') : workspace.standards;
  const standardIds = standards.map((row) => String(row._id));
  const subjectIds = subjectIdsForStandards(workspace, standardIds);
  const subjects = workspace.subjects.filter((row) => subjectIds.includes(String(row._id)));
  const materials = standardIds.length ? await api('material/standards/all', { method: 'POST', body: { standards: standardIds } }) : [];
  console.log(
    JSON.stringify(
      {
        standards: standards.map((row) => ({ id: row._id, name: row.name, group: row.group, subjects: subjectIdsForStandards(workspace, [String(row._id)]).map((id) => byId(workspace.subjects).get(id)?.name) })),
        subjects: subjects.map((row) => ({ id: row._id, name: row.name })),
        chapters: workspace.chapters.filter((row) => standardIds.includes(String(row.standard))).map((row) => ({ id: row._id, name: row.name, standard: row.standard, subject: row.subject })),
        savedLessons: (materials ?? []).map((row) => ({ id: row._id, name: row.name, level: row.level, durationMins: row.durationMins, subject: row.subject, chapter: row.chapter })),
        savedTests: workspace.testPapers.filter((row) => (row.standards ?? []).some((id) => standardIds.includes(String(id)))).map((row) => ({ id: row._id, name: row.name, questions: row.totalQuestions, durationMins: row.durationMins })),
      },
      null,
      2,
    ),
  );
};

/** The setup file, names resolved to ids, plus the context the prompt and validator need. */
const loadSetupAndContext = async (setupFile, courseId) => {
  const raw = readJson(setupFile) ?? fail(`Setup file not found: ${setupFile}`);
  const workspace = await loadWorkspace();
  const standards = resolveRows(workspace.standards, list(raw.standards), 'standard');
  const standardIds = standards.map((row) => String(row._id));
  const allSubjectIds = subjectIdsForStandards(workspace, standardIds);
  const chosenSubjects = raw.subjects?.length ? resolveRows(workspace.subjects, list(raw.subjects), 'subject') : [];
  const subjectIds = chosenSubjects.length ? chosenSubjects.map((row) => String(row._id)) : allSubjectIds;
  const subjects = workspace.subjects.filter((row) => subjectIds.includes(String(row._id)));
  const materials = await api('material/standards/all', { method: 'POST', body: { standards: standardIds } });
  const setup = {
    ...ai.DEFAULT_COURSE_SETUP,
    ...raw,
    standards: standardIds,
    subjects: chosenSubjects.map((row) => String(row._id)),
  };
  const context = {
    courseId,
    standards,
    subjects,
    chapters: workspace.chapters.filter((row) => standardIds.includes(String(row.standard)) && subjectIds.includes(String(row.subject))),
    materials: (materials ?? []).filter((row) => !row.subject || subjectIds.includes(String(row.subject))),
    testPapers: workspace.testPapers.filter((row) => (row.standards ?? []).some((id) => standardIds.includes(String(id)))),
  };
  return { setup, context, workspace };
};

commands['course:prompt'] = async (options) => {
  if (!options.setup) fail('--setup <file.json> is required. Keys: standards, subjects, weeks, daysPerWeek, pace, examStyle, language, includeQuizzes, includeSessions, isPaid, monthlyAmount, yearlyAmount, instructions.');
  const courseId = options.course ?? utils.createObjectId();
  const { setup, context } = await loadSetupAndContext(options.setup, courseId);
  const prompt = ai.buildCourseBlueprintPrompt(setup, context);
  writeJson(runFile(courseId), { courseId, setupFile: path.resolve(options.setup), setup, createdAt: new Date().toISOString(), paperIds: {} });
  if (options.out) fs.writeFileSync(options.out, prompt);
  else console.log(prompt);
  console.error(`courseId: ${courseId}${options.out ? ` · prompt written to ${options.out}` : ''}. Answer the prompt, then run course:import --course ${courseId} --reply <file>.`);
};

const printIssues = (issues) => {
  issues.forEach((issue) => console.error(`  ${issue.level === 'error' ? '✖' : '⚠'} ${issue.path} — ${issue.message}`));
};

commands['course:import'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const run = readJson(runFile(courseId)) ?? fail(`No run for course ${courseId}. Run course:prompt first.`);
  const text = fs.readFileSync(options.reply ?? fail('--reply <file> is required.'), 'utf8');
  const { setup, context } = await loadSetupAndContext(run.setupFile, courseId);
  const parsed = ai.parseAiCourse(text);
  const issues = parsed.file ? [...parsed.issues, ...ai.validateAiCourse(parsed.file, setup, context)] : parsed.issues;
  printIssues(issues);
  if (!parsed.file || ai.hasErrors(issues)) fail('The reply has problems; fix them and run course:import again.');
  const courses = await api('course/all');
  const imported = ai.toImportedCourse(parsed.file, setup, context, (courses ?? []).length);
  let isCourseWritten = false;
  try {
    await api('course/upsert/course/plans', { method: 'POST', body: { course: imported.course, plans: imported.plans } });
    isCourseWritten = true;
    await api('course/upsert/course/modules', { method: 'POST', body: { modules: imported.modules } });
  } catch (error) {
    if (isCourseWritten) {
      await api('course/upsert/course/plans', {
        method: 'POST',
        body: { course: { ...imported.course, _deleted: true }, plans: imported.plans.map((plan) => ({ ...plan, _deleted: true })) },
      }).catch(() => undefined);
    }
    throw error;
  }
  writeJson(runFile(courseId), { ...run, importedAt: new Date().toISOString(), title: imported.course.name });
  console.log(
    JSON.stringify(
      {
        courseId,
        title: imported.course.name,
        days: imported.modules.length,
        lessonsReused: imported.modules.reduce((sum, row) => sum + (row.materials?.length ?? 0), 0),
        lessonsToWrite: imported.pendingLessons,
        quizzesToWrite: imported.pendingTests,
        sessionsToSchedule: imported.modules.reduce((sum, row) => sum + (row.pending ?? []).filter((work) => work.kind === 'session').length, 0),
        url: `/courses/${courseId}`,
      },
      null,
      2,
    ),
  );
};

const loadCourseContext = async (courseId) => {
  const [course, modules, workspace] = await Promise.all([api(`course/${courseId}`), api(`course/course/modules/${courseId}`), loadWorkspace()]);
  const standardIds = (course.standards ?? []).map(String);
  const subjectIds = course.subjects?.length ? course.subjects.map(String) : subjectIdsForStandards(workspace, standardIds);
  const materials = await api('material/standards/all', { method: 'POST', body: { standards: standardIds } });
  return {
    course,
    modules,
    standards: workspace.standards.filter((row) => standardIds.includes(String(row._id))),
    subjects: workspace.subjects.filter((row) => subjectIds.includes(String(row._id))),
    chapters: workspace.chapters.filter((row) => standardIds.includes(String(row.standard))),
    materials: materials ?? [],
    testPapers: workspace.testPapers,
  };
};

const stablePaperIds = (courseId) => {
  const run = readJson(runFile(courseId)) ?? { courseId, paperIds: {} };
  run.paperIds ??= {};
  return {
    idFor: (pendingKey) => {
      run.paperIds[pendingKey] ??= utils.createObjectId();
      return run.paperIds[pendingKey];
    },
    save: () => writeJson(runFile(courseId), run),
  };
};

const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

commands['course:prompts'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const context = await loadCourseContext(courseId);
  const ids = stablePaperIds(courseId);
  const prompts = ai.buildCoursePrompts(context, ids.idFor);
  ids.save();
  const outDir = options.out ?? path.join(STATE_DIR, 'runs', courseId, 'prompts');
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [
    ...prompts.lessons.map((pack) => ({ kind: 'lessons', key: `lessons-${slug(pack.title)}`, moduleId: pack.moduleId, title: pack.title, lessonCount: pack.lessonCount, file: path.join(outDir, `lessons-${slug(pack.title)}.md`), prompt: pack.prompt })),
    ...prompts.quizzes.map((pack) => ({ kind: 'quiz', key: `quiz-${slug(pack.title)}`, moduleId: pack.moduleId, testPaperId: pack.testPaperId, title: pack.title, questions: pack.spec.questionCount, file: path.join(outDir, `quiz-${slug(pack.title)}.md`), prompt: pack.prompt })),
  ];
  manifest.forEach((item) => fs.writeFileSync(item.file, item.prompt));
  console.log(JSON.stringify(manifest.map(({ prompt: _prompt, ...rest }) => rest), null, 2));
  console.error(`${manifest.length} prompt${manifest.length === 1 ? '' : 's'} written to ${outDir}. Answer each into its own JSON file, then run course:content --course ${courseId} --reply <file...>.`);
};

/** A quiz paper, its section and questions, written in that order and undone if a later step fails. */
const createPaper = async (pack, imported) => {
  const sectionId = utils.createObjectId();
  const paper = {
    _id: pack.testPaperId,
    name: pack.spec.name,
    slug: utils.slugify(pack.spec.name),
    standards: pack.standardIds,
    subjects: pack.subjectIds,
    sections: [sectionId],
    paperType: enums.PaperType.QUIZ,
    paperCategory: enums.PaperCategoryType.CUSTOM,
    totalQuestions: 0,
    durationMins: pack.spec.durationMins,
    year: new Date().getFullYear(),
    maxMarks: 0,
    instruction: utils.createEmptyRichText(),
    isPublished: false,
    webLink: '',
    appLink: '',
  };
  await api('test-paper/upsert', { method: 'POST', body: paper });
  try {
    await api('test-paper/section/upsert', {
      method: 'POST',
      body: { _id: sectionId, name: imported[0]?.section.name ?? pack.spec.name, sectionType: enums.SectionType.SECTION, sectionCategory: enums.SectionCategoryType.CUSTOM, defaultMarkings: ai.DEFAULT_MARKINGS },
    });
    const questions = imported.map((item, index) => ({
      _id: utils.createObjectId(),
      ...item.dto,
      section: sectionId,
      order: index + 1,
      markings: item.dto.markings ?? ai.DEFAULT_MARKINGS[item.dto.questionType],
    }));
    await api('question/bulk-upsert', { method: 'POST', body: { questions } });
  } catch (error) {
    await api('test-paper/upsert', { method: 'POST', body: { ...paper, _deleted: true } }).catch(() => undefined);
    throw error;
  }
};

commands['course:content'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const files = list(options.reply);
  if (!files.length) fail('--reply <file> [--reply <file>…] is required.');
  const context = await loadCourseContext(courseId);
  const ids = stablePaperIds(courseId);
  const prompts = ai.buildCoursePrompts(context, ids.idFor);
  const orderCursor = new Map();
  const nextOrder = (standard, subject) => {
    const key = `${standard}:${subject}`;
    const current = orderCursor.get(key) ?? context.materials.filter((row) => String(row.standard) === standard && String(row.subject) === subject).reduce((max, row) => Math.max(max, row.order ?? 0), 0);
    orderCursor.set(key, current + 1);
    return current + 1;
  };
  const summary = { lessons: 0, quizzes: 0, failed: [] };
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const result = ai.readContentReply(text, prompts, context);
    console.error(`\n${path.basename(file)} → ${result.kind === 'unknown' ? 'not matched' : `${result.kind}: ${result.pack.title}`}`);
    printIssues(result.issues);
    if (result.kind === 'unknown' || ai.hasErrors(result.issues) || !result.imported.length) {
      summary.failed.push(file);
      continue;
    }
    if (result.kind === 'lessons') {
      const rows = result.imported.map((item) => ({ ...item.dto, order: nextOrder(result.pack.standardId, result.pack.subjectId) }));
      await api('material/bulk-upsert', { method: 'POST', body: { materials: rows } });
      await api('course/link-module', {
        method: 'POST',
        body: {
          courseModule: result.pack.moduleId,
          materials: rows.map((row) => row._id),
          done: result.imported.map((item) => ({ key: result.pack.pendingKeyByRef[item.material.ref], createdId: item.dto._id })).filter((item) => item.key),
        },
      });
      summary.lessons += rows.length;
    } else {
      await createPaper(result.pack, result.imported);
      await api('course/link-module', {
        method: 'POST',
        body: { courseModule: result.pack.moduleId, testPapers: [result.pack.testPaperId], done: [{ key: result.pack.pendingKey, createdId: result.pack.testPaperId }] },
      });
      summary.quizzes += 1;
    }
  }
  await commands['course:stats']({ course: courseId, quiet: true });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed.length) process.exitCode = 1;
};

/** Recomputes and saves the course roll-up from what its modules link. */
commands['course:stats'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const [course, modules, materials, testPapers, meets] = await Promise.all([api(`course/${courseId}`), api(`course/course/modules/${courseId}`), api('material/all'), api('test-paper/all'), api('meet/all')]);
  const materialById = byId(materials ?? []);
  const testPaperById = byId(testPapers ?? []);
  const meetById = byId(meets ?? []);
  const materialIds = modules.flatMap((row) => row.materials ?? []);
  const testPaperIds = modules.flatMap((row) => row.testPapers ?? []);
  const linkedMaterials = materialIds.map((id) => materialById.get(String(id))).filter(Boolean);
  const stats = {
    daysCount: modules.length,
    videosCount: linkedMaterials.filter((row) => row.type === enums.MaterialType.VIDEO).length,
    readingsCount: linkedMaterials.filter((row) => row.type !== enums.MaterialType.VIDEO).length,
    testsCount: testPaperIds.length,
    meetsCount: (course.meets ?? []).length,
    testsDurationMins: testPaperIds.reduce((sum, id) => sum + (testPaperById.get(String(id))?.durationMins ?? 0), 0),
    materialsDurationMins: linkedMaterials.reduce((sum, row) => sum + (row.durationMins ?? 0), 0),
    meetsDurationMins: (course.meets ?? []).reduce((sum, id) => sum + (meetById.get(String(id))?.durationMins ?? 0), 0),
  };
  await api('course/upsert', { method: 'POST', body: { ...course, stats } });
  if (!options.quiet) console.log(JSON.stringify(stats, null, 2));
};

commands['course:status'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const [course, modules] = await Promise.all([api(`course/${courseId}`), api(`course/course/modules/${courseId}`)]);
  const open = (row) => (row.pending ?? []).filter((work) => work.status === 'pending' || work.status === 'prompted');
  console.log(
    JSON.stringify(
      {
        courseId,
        title: course.name,
        isPublished: course.isPublished,
        days: modules.length,
        lessonsToWrite: modules.reduce((sum, row) => sum + open(row).filter((work) => work.kind === 'lesson').length, 0),
        quizzesToWrite: modules.reduce((sum, row) => sum + open(row).filter((work) => work.kind === 'test').length, 0),
        sessionsToSchedule: modules.reduce((sum, row) => sum + open(row).filter((work) => work.kind === 'session').length, 0),
        modules: modules
          .sort((a, b) => a.day - b.day)
          .map((row) => ({ day: row.day, name: row.name, lessons: row.materials?.length ?? 0, tests: row.testPapers?.length ?? 0, sessions: row.meets?.length ?? 0, toGenerate: open(row).map((work) => `${work.kind}: ${work.spec?.name ?? work.spec?.title}`) })),
      },
      null,
      2,
    ),
  );
};

const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);

commands['course:sessions'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const start = options.start ?? fail('--start YYYY-MM-DD is required.');
  const time = options.time ?? '17:00';
  const teachingDays = list(options.days ?? '1,2,3,4,5').map(Number);
  const [course, modules] = await Promise.all([api(`course/${courseId}`), api(`course/course/modules/${courseId}`)]);
  const [year, month, day] = start.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  let cursor = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  const schedule = [];
  for (const courseModule of [...modules].sort((a, b) => a.day - b.day)) {
    while (!teachingDays.includes(cursor.getDay())) cursor = addDays(cursor, 1);
    const date = cursor;
    cursor = addDays(cursor, 1);
    const pending = (courseModule.pending ?? []).find((work) => work.kind === 'session' && (work.status === 'pending' || work.status === 'prompted'));
    schedule.push({ day: courseModule.day, name: courseModule.name, date: date.toISOString(), session: pending ? { key: pending.key, spec: pending.spec } : null, moduleId: courseModule._id });
  }
  const created = [];
  for (const row of schedule.filter((item) => item.session)) {
    const startTime = new Date(row.date);
    const meet = {
      _id: utils.createObjectId(),
      title: row.session.spec.title,
      description: (row.session.spec.agenda ?? []).map((line) => `• ${line}`).join('\n'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: String(new Date().getTimezoneOffset()),
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + row.session.spec.durationMins * 60_000).toISOString(),
      durationMins: row.session.spec.durationMins,
      status: enums.MeetStatus.SCHEDULED,
      standards: course.standards ?? [],
      batches: [],
      attendees: [],
      meetingLink: '',
      meetingId: utils.createObjectId(),
      weekDays: [],
      cancelledDates: [],
      frequency: enums.MeetFrequency.ONE_TIME,
      color: enums.ColorType.BLUE,
    };
    await api('meet/upsert', { method: 'POST', body: meet });
    await api('course/link-module', { method: 'POST', body: { courseModule: row.moduleId, meets: [meet._id], done: [{ key: row.session.key, createdId: meet._id }] } });
    created.push(meet._id);
    row.meetId = meet._id;
  }
  if (created.length) {
    const latest = await api(`course/${courseId}`);
    await api('course/upsert', { method: 'POST', body: { ...latest, meets: [...new Set([...(latest.meets ?? []), ...created])] } });
    await commands['course:stats']({ course: courseId, quiet: true });
  }
  console.log(JSON.stringify({ created: created.length, schedule: schedule.map((row) => ({ day: row.day, name: row.name, date: row.date.slice(0, 16), session: row.session?.spec.title ?? null })) }, null, 2));
};

commands['course:review'] = async (options) => {
  const courseId = options.course ?? fail('--course <id> is required.');
  const [course, modules, materials, testPapers, meets] = await Promise.all([api(`course/${courseId}`), api(`course/course/modules/${courseId}`), api('material/all'), api('test-paper/all'), api('meet/all')]);
  const input = { course, modules, materialById: byId(materials ?? []), testPaperById: byId(testPapers ?? []), meetById: byId(meets ?? []) };
  if (options['check-links']) {
    const urls = ai.collectCourseLinks(input);
    const checks = new Map();
    for (let index = 0; index < urls.length; index += 60) {
      const batch = await api('common/verify-links', { method: 'POST', body: { urls: urls.slice(index, index + 60) } });
      (batch ?? []).forEach((check) => checks.set(check.url, check));
    }
    input.linkChecks = checks;
    console.error(`${urls.length} reference${urls.length === 1 ? '' : 's'} checked, ${[...checks.values()].filter((check) => !check.ok).length} unreachable.`);
  }
  const review = ai.reviewCourse(input);
  if (options.out) {
    fs.writeFileSync(options.out, ai.buildCourseReviewPrompt(input));
    console.error(`Review prompt written to ${options.out}. Answer it and pass the reply with --reply.`);
  }
  let findings;
  if (options.reply) {
    const parsed = ai.parseCourseReview(fs.readFileSync(options.reply, 'utf8'), courseId);
    printIssues(parsed.issues);
    findings = parsed.review?.findings;
  }
  console.log(JSON.stringify({ canPublish: review.canPublish, pendingCount: review.pendingCount, medianMins: review.medianMins, issues: review.issues, coverage: review.coverage, pace: review.pace, findings }, null, 2));
};

const setPublished = async (courseId, isPublished) => {
  const course = await api(`course/${courseId}`);
  if (isPublished) {
    const modules = await api(`course/course/modules/${courseId}`);
    const [materials, testPapers, meets] = await Promise.all([api('material/all'), api('test-paper/all'), api('meet/all')]);
    const review = ai.reviewCourse({ course, modules, materialById: byId(materials ?? []), testPaperById: byId(testPapers ?? []), meetById: byId(meets ?? []) });
    if (!review.canPublish) {
      printIssues(review.issues.filter((issue) => issue.level === 'error'));
      fail('The review has errors; fix them before publishing.');
    }
  }
  await api('course/upsert', { method: 'POST', body: { ...course, isPublished, publishedDate: isPublished ? new Date().toISOString() : course.publishedDate } });
  console.log(`"${course.name}" is ${isPublished ? 'published' : 'back in draft'}.`);
};
commands['course:publish'] = (options) => setPublished(options.course ?? fail('--course <id> is required.'), true);
commands['course:unpublish'] = (options) => setPublished(options.course ?? fail('--course <id> is required.'), false);

commands.help = () => {
  console.log(`course-agent — the AI course pipeline from the terminal

  login [--email <e>] [--org <name|id>] [--token <idToken>]   sign in (Firebase email/password) and pick the organization
  whoami                                                       the session: who, which organization, which API
  workspace [--standards <names|ids>]                          standards, subjects, chapters, saved lessons and tests
  course:prompt --setup <setup.json> [--out <file>]            mint a course id and write the blueprint prompt
  course:import --course <id> --reply <reply.json>             validate the blueprint reply and create the course, plans and modules
  course:prompts --course <id> [--out <dir>]                   one lesson prompt per day and one per quiz, with a manifest
  course:content --course <id> --reply <file> [--reply …]      import lesson and quiz replies and link them into their days
  course:sessions --course <id> --start YYYY-MM-DD [--time HH:mm] [--days 1,2,3,4,5]
  course:status --course <id>                                  what is still to write or schedule
  course:review --course <id> [--check-links] [--out <prompt.md>] [--reply <review.json>]
  course:publish --course <id> | course:unpublish --course <id>
  course:stats --course <id>                                   recompute the header roll-up

Setup file keys: standards, subjects, weeks, daysPerWeek, pace (light|standard|intensive), examStyle, language,
includeQuizzes, includeSessions, isPaid, monthlyAmount, yearlyAmount, instructions.
State: .course-agent/ at the repo root (git-ignored). API: ${API_URL}`);
};

// ------------------------------------------------------------------------------------------------

const { command, options } = parseArgs(process.argv.slice(2));
const handler = commands[command] ?? (command === undefined || options.help ? commands.help : null);
if (!handler) fail(`Unknown command "${command}". Run with --help.`);
handler(options).catch((error) => fail(error instanceof Error ? error.message : String(error)));
