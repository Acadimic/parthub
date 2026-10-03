// Read-only report of every collection: document count, data and index size, each declared index
// and, where the database user is allowed `$indexStats`, how often each index has been used since the
// server last restarted. Writes nothing.
//
//   cd apps/server && npx env-cmd -f .env.development node ../../.claude/skills/index-with-mongodb/scripts/index-report.mjs [collection...]
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const serverPackage = fileURLToPath(new URL('../../../../apps/server/package.json', import.meta.url));
const { MongoClient } = createRequire(serverPackage)('mongoose').mongo;

if (!process.env.DB_URL) {
  console.error('DB_URL is not set. Run through env-cmd from apps/server (see the header of this file).');
  process.exit(1);
}

const only = new Set(process.argv.slice(2));
const kb = (bytes) => `${Math.round((bytes ?? 0) / 1024)} KB`;

const client = await MongoClient.connect(process.env.DB_URL);
try {
  const db = client.db();
  console.log(`database: ${db.databaseName}`);
  const names = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !only.size || only.has(n))
    .sort();

  for (const name of names) {
    const collection = db.collection(name);
    const [count, stats, indexes] = await Promise.all([
      collection.estimatedDocumentCount(),
      db.command({ collStats: name }).catch(() => ({})),
      collection.indexes(),
    ]);
    // `$indexStats` needs a role Atlas does not grant every user; `?` means "not allowed", not "unused".
    const usage = await collection
      .aggregate([{ $indexStats: {} }])
      .toArray()
      .then((rows) => Object.fromEntries(rows.map((r) => [r.name, Number(r.accesses.ops)])))
      .catch(() => ({}));

    const average = count ? kb(stats.size / count) : '0 KB';
    console.log(
      `\n${name}: ${count} docs, data ${kb(stats.size)} (avg ${average}), indexes ${kb(stats.totalIndexSize)}`,
    );
    for (const index of indexes) {
      const flags = [
        index.unique && 'unique',
        index.sparse && 'sparse',
        index.partialFilterExpression && `partial ${JSON.stringify(index.partialFilterExpression)}`,
        index.expireAfterSeconds !== undefined && `ttl ${index.expireAfterSeconds}s`,
        index.hidden && 'hidden',
      ].filter(Boolean);
      console.log(`  ${JSON.stringify(index.key)} ${flags.join(', ')}  ops=${usage[index.name] ?? '?'}`);
    }
  }
} finally {
  await client.close();
}
