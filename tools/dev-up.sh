#!/bin/bash
# Bring up the full local dev stack (PG + game server + client preview).
# /tmp is wiped whenever the VM cycles, so everything under /tmp is rebuilt here.
set -e
ROOT=~/workspace/eidolith
if ! su nobody -s /bin/bash -c "/tmp/pgbin/bin/pg_ctl -D /tmp/pg-data status" >/dev/null 2>&1; then
  [ -d /tmp/pgbin ] || { cp -r ~/workspace/tools/pg/dist /tmp/pgbin && chmod -R a+rX /tmp/pgbin; }
  [ -f /tmp/pg-data/PG_VERSION ] || su nobody -s /bin/bash -c "/tmp/pgbin/bin/initdb -D /tmp/pg-data -U postgres --auth=trust" >/dev/null
  su nobody -s /bin/bash -c "/tmp/pgbin/bin/pg_ctl -D /tmp/pg-data -l /tmp/pg.log -o '-p 5433 -k /tmp -c listen_addresses=127.0.0.1' start" || true
  sleep 2
fi
cd "$ROOT/apps/game-server"
node -e "
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: 'postgres://postgres@127.0.0.1:5433/postgres' });
  await c.connect();
  const r = await c.query(\"SELECT 1 FROM pg_database WHERE datname='eidolith'\");
  if (!r.rowCount) { await c.query('CREATE DATABASE eidolith'); console.log('eidolith db created'); }
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
"
DATABASE_URL=postgres://postgres@127.0.0.1:5433/eidolith npx tsx src/migrate.ts >/dev/null && echo "migrations ok"
curl -s --max-time 2 http://127.0.0.1:8787/health >/dev/null 2>&1 || {
  cd "$ROOT/apps/game-server" && DATABASE_URL=postgres://postgres@127.0.0.1:5433/eidolith PORT=8787 setsid nohup npx tsx src/index.ts > /tmp/eidolith-server.log 2>&1 < /dev/null & disown
}
curl -s --max-time 2 -o /dev/null http://127.0.0.1:5173/ || {
  cd "$ROOT/apps/game-client" && setsid nohup npx vite preview --port 5173 --host 127.0.0.1 > /tmp/eidolith-client.log 2>&1 < /dev/null & disown
}
sleep 4
echo "server: $(curl -s --max-time 3 http://127.0.0.1:8787/health)"
echo "client: $(curl -s --max-time 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/)"
