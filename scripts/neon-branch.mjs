// Neon branch management via the Neon API. Needs NEON_API_KEY (in .env.local) and
// the production DATABASE_URL (from .env.production.local) — the project + parent
// branch are discovered from that connection's endpoint, so nothing is hardcoded.
//
//   npm run db:branches     list this project's branches
//   npm run db:dev:create   create a "dev" branch + pooled endpoint, and point
//                           .env.development.local at it
//   npm run db:dev:reset    reset the "dev" branch back to match main (its parent)

import { writeFileSync } from "node:fs";

const API = "https://console.neon.tech/api/v2";
const key = process.env.NEON_API_KEY;
const prodUrl = process.env.DATABASE_URL;
const cmd = process.argv[2];

if (!key) {
  console.error("🚨 NEON_API_KEY is not set. Add it to .env.local:  NEON_API_KEY=...");
  process.exit(1);
}
if (!prodUrl || !prodUrl.includes("neon.tech")) {
  console.error("🚨 Production DATABASE_URL not found (needs .env.production.local).");
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      accept: "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) throw new Error(`${res.status} ${path} — ${JSON.stringify(body)}`);
  return body;
}

/** Endpoint id from a Neon host: ep-xxxx-pooler.c-3.region... -> ep-xxxx */
function endpointId(url) {
  const host = url.replace(/^[^@]*@/, "").replace(/[/?].*$/, "").split(":")[0];
  return host.split(".")[0].replace(/-pooler$/, "");
}

async function discover() {
  const epId = endpointId(prodUrl);
  const { projects } = await api("/projects");
  for (const p of projects) {
    const { endpoints } = await api(`/projects/${p.id}/endpoints`);
    const ep = endpoints.find((e) => e.id === epId);
    if (ep) return { projectId: p.id, parentBranchId: ep.branch_id };
  }
  throw new Error(`No project found containing endpoint ${epId}. Is the API key for the right account?`);
}

const listBranches = async (projectId) =>
  (await api(`/projects/${projectId}/branches`)).branches;

async function pooledUri(projectId, branchId) {
  const roles = (await api(`/projects/${projectId}/branches/${branchId}/roles`)).roles;
  const dbs = (await api(`/projects/${projectId}/branches/${branchId}/databases`)).databases;
  const role = roles[0]?.name ?? "neondb_owner";
  const db = dbs[0]?.name ?? "neondb";
  const { uri } = await api(
    `/projects/${projectId}/connection_uri?branch_id=${branchId}` +
      `&role_name=${encodeURIComponent(role)}&database_name=${encodeURIComponent(db)}&pooled=true`,
  );
  // node-postgres handles TLS via the ssl option; drop these to avoid warnings.
  return uri.replace(/([?&])(channel_binding|sslmode)=[^&]*/g, "$1").replace(/[?&]+$/, "");
}

async function main() {
  const { projectId, parentBranchId } = await discover();

  if (cmd === "list") {
    console.log(`project ${projectId}`);
    for (const b of await listBranches(projectId)) {
      const tags = [b.default && "default", b.id === parentBranchId && "prod"].filter(Boolean);
      console.log(`  ${b.name.padEnd(16)} ${b.id}${tags.length ? "  [" + tags.join(", ") + "]" : ""}`);
    }
    return;
  }

  if (cmd === "create-dev") {
    if ((await listBranches(projectId)).some((b) => b.name === "dev")) {
      console.error("🚨 A 'dev' branch already exists. Use `npm run db:dev:reset` to refresh it.");
      process.exit(1);
    }
    const res = await api(`/projects/${projectId}/branches`, {
      method: "POST",
      body: JSON.stringify({
        branch: { name: "dev", parent_id: parentBranchId },
        endpoints: [{ type: "read_write" }],
      }),
    });
    const devId = res.branch.id;
    const uri = await pooledUri(projectId, devId);
    writeFileSync(
      ".env.development.local",
      "# DEVELOPMENT — used by `next dev` (NODE_ENV=development).\n" +
        "# Neon dev branch (refresh from main with `npm run db:dev:reset`).\n" +
        "DATABASE_URL='" + uri + "'\n",
    );
    console.log(`✅ dev branch ${devId} created; .env.development.local now points at it.`);
    console.log("   Next: `npm run migrate:dev -- --status`, then restart `next dev`.");
    return;
  }

  if (cmd === "reset-dev") {
    const dev = (await listBranches(projectId)).find((b) => b.name === "dev");
    if (!dev) {
      console.error("🚨 No 'dev' branch. Create it with `npm run db:dev:create`.");
      process.exit(1);
    }
    await api(`/projects/${projectId}/branches/${dev.id}/restore`, {
      method: "POST",
      body: JSON.stringify({ source_branch_id: parentBranchId }),
    });
    console.log("✅ dev branch reset to match main (production).");
    return;
  }

  console.error("Usage: neon-branch.mjs <list|create-dev|reset-dev>");
  process.exit(1);
}

main().catch((e) => {
  console.error("🚨 " + e.message);
  process.exit(1);
});
