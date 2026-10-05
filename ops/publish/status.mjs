#!/usr/bin/env node
// Writes the publish status file the API reads for GET /admin/publish.
//
//   status.mjs <status.json> begin <request.json>   a build starts
//   status.mjs <status.json> ok <commit>            it went live
//   status.mjs <status.json> fail <message> <log>   it stopped; keeps the log's end
//   status.mjs <status.json> stale                  systemd stopped the unit: a
//                                                   "building" left behind is a failure
//
// The file is replaced atomically, so the API never reads half of it.
import { readFileSync, renameSync, writeFileSync } from "node:fs";

const [file, cmd, a, b] = process.argv.slice(2);
const read = (f) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return {};
  }
};
const now = () => new Date().toISOString();
const st = read(file);

if (cmd === "begin") {
  const req = read(a);
  Object.assign(st, {
    state: "building",
    requested_by: req.by ?? null,
    requested_at: req.at ?? null,
    started_at: now(),
    finished_at: null,
    error: null,
    log: [],
  });
} else if (cmd === "ok") {
  Object.assign(st, {
    state: "ok",
    finished_at: now(),
    // the build read the API from its start on: anything saved after that waits for the next one
    published_at: st.started_at,
    published_done_at: now(),
    commit: a || null,
  });
} else if (cmd === "fail" || (cmd === "stale" && st.state === "building")) {
  let log = [];
  try {
    log = readFileSync(cmd === "fail" ? b : `${file.replace(/[^/]+$/, "")}last.log`, "utf8").trimEnd().split("\n").slice(-60);
  } catch {}
  Object.assign(st, {
    state: "failed",
    finished_at: now(),
    error: cmd === "fail" ? a : "збирання перервано: вийшов час або сервіс зупинено",
    log,
  });
} else if (cmd === "stale") {
  process.exit(0);
} else {
  console.error("usage: status.mjs <status.json> begin|ok|fail|stale ...");
  process.exit(2);
}

writeFileSync(`${file}.tmp`, JSON.stringify(st, null, 2) + "\n");
renameSync(`${file}.tmp`, file);
