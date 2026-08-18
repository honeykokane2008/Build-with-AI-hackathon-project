import fs from "fs";
import path from "path";

const COMPLAINTS_PATH = path.join(process.cwd(), "data", "complaints.json");
const REGIONS_PATH = path.join(process.cwd(), "data", "regions.json");

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Complaints ----
// Swap this module's internals for a MongoDB/Postgres driver later —
// every API route only ever calls these four functions.

export function getAllComplaints() {
  return readJSON(COMPLAINTS_PATH);
}

export function insertComplaint(complaint) {
  const all = getAllComplaints();
  all.unshift(complaint);
  writeJSON(COMPLAINTS_PATH, all);
  return complaint;
}

// ---- Regions (national demographic + infrastructure + investment data) ----

export function getAllRegions() {
  return readJSON(REGIONS_PATH);
}

export function getRegionById(id) {
  return getAllRegions().find((r) => r.id === id) || null;
}
