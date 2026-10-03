// Explains one find without running a write: which index the planner chose, and how many keys and
// documents it touched to return what it returned. Filter and sort are Extended JSON, so an ObjectId
// is {"$oid":"..."} and a date is {"$date":"..."}.
//
//   cd apps/server && npx env-cmd -f .env.development node ../../.claude/skills/index-with-mongodb/scripts/explain.mjs \
//     materials '{"org":{"$oid":"..."},"_deleted":{"$ne":true}}' '{"order":1}'
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const serverPackage = fileURLToPath(new URL('../../../../apps/server/package.json', import.meta.url));
const { mongo } = createRequire(serverPackage)('mongoose');
const { MongoClient, BSON } = mongo;

const [name, filterJson = '{}', sortJson = '{}'] = process.argv.slice(2);
if (!name || !process.env.DB_URL) {
  console.error('Usage: explain.mjs <collection> [filter EJSON] [sort EJSON], with DB_URL set (see header).');
  process.exit(1);
}

/** The stages of the winning plan, outermost first: `FETCH < IXSCAN { org: 1, _deleted: 1 }`. */
const describe = (stage) => {
  const parts = [];
  for (let s = stage; s; s = s.inputStage ?? s.inputStages?.[0]) {
    parts.push(s.indexName ? `${s.stage} ${JSON.stringify(s.keyPattern)}` : s.stage);
  }
  return parts.join(' < ');
};

const client = await MongoClient.connect(process.env.DB_URL);
try {
  const cursor = client
    .db()
    .collection(name)
    .find(BSON.EJSON.parse(filterJson, { relaxed: false }))
    .sort(BSON.EJSON.parse(sortJson));
  const { queryPlanner, executionStats: stats } = await cursor.explain('executionStats');

  console.log(`plan:      ${describe(queryPlanner.winningPlan.queryPlan ?? queryPlanner.winningPlan)}`);
  console.log(`returned:  ${stats.nReturned}`);
  console.log(`keys:      ${stats.totalKeysExamined}`);
  console.log(`documents: ${stats.totalDocsExamined}`);
  console.log(`time:      ${stats.executionTimeMillis} ms`);
  const rejected = queryPlanner.rejectedPlans?.length ?? 0;
  if (rejected) console.log(`rejected:  ${rejected} other plan(s)`);
} finally {
  await client.close();
}
