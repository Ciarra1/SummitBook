const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function walk(dir, files=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.jsx') || full.endsWith('.mjs') || full.endsWith('.cjs'))) files.push(full);
  }
  return files;
}

function listDirNames(parent) {
  try { return fs.readdirSync(parent); } catch(e) { return null; }
}

function pathExistsCaseSensitive(p) {
  // p absolute
  const parts = path.resolve(p).split(path.sep).filter(Boolean);
  // find root drive
  let cur = path.isAbsolute(p) ? path.sep : '';
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i];
    const parent = cur || path.sep;
    const entries = listDirNames(parent);
    if (!entries) return { ok: false, foundSegment: null };
    const match = entries.find(ent => ent === name);
    if (!match) {
      // try case-insensitive match
      const ins = entries.find(ent => ent.toLowerCase() === name.toLowerCase());
      return { ok: false, foundSegment: ins || null, expected: name, parent };
    }
    cur = path.join(parent, name);
  }
  return { ok: true };
}

function resolveImport(importPath, importerFile) {
  // handle alias @/ -> src/
  if (importPath.startsWith('@/')) {
    const rel = importPath.replace(/^@\//, '');
    // try with no ext then exts
    return path.join(SRC, rel);
  }
  if (importPath.startsWith('/')) {
    // absolute from project root
    return path.join(ROOT, importPath);
  }
  // relative
  return path.join(path.dirname(importerFile), importPath);
}

const files = walk(SRC);
const importRegex = /(?:import\s+(?:[^'"\\]+)\s+from\s+|import\(|require\(|require\s*\()\s*['"]([^'"]+)['"]/g;
const simpleImportRegex = /(?:import\s+[^'"\\]+\s+from\s+|import\(|require\(|require\s*\()\s*['"]([^'"\)]+)['"]/g;

const mismatches = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = simpleImportRegex.exec(content)) !== null) {
    const importPath = m[1];
    if (importPath.startsWith('.') || importPath.startsWith('/') || importPath.startsWith('@/')) {
      let target = resolveImport(importPath, f);
      // if target is a directory, look for index files
      const candidates = [];
      for (const ext of exts) {
        candidates.push(target + ext);
      }
      candidates.push(path.join(target, 'index.js'));
      candidates.push(path.join(target, 'index.ts'));
      candidates.push(path.join(target, 'index.tsx'));
      candidates.push(path.join(target, 'index.jsx'));

      // find first candidate that exists
      let found = null;
      for (const c of candidates) {
        if (fs.existsSync(c)) { found = c; break; }
      }
      // Also if exact path with no ext exists as file
      if (!found && fs.existsSync(target)) found = target;

      if (found) {
        const res = pathExistsCaseSensitive(found);
        if (!res.ok) {
          mismatches.push({ importer: path.relative(ROOT, f), importPath, resolved: path.relative(ROOT, found), issue: res });
        }
      } else {
        // Not found - skip
      }
    }
  }
}

if (mismatches.length === 0) {
  console.log('No case-sensitivity mismatches found for local imports.');
  process.exit(0);
}

console.log('Found case-sensitivity issues:');
for (const mm of mismatches) {
  console.log('-'.repeat(60));
  console.log('Importer:', mm.importer);
  console.log('Import string:', mm.importPath);
  console.log('Resolved path:', mm.resolved);
  console.log('Issue:', mm.issue);
}
process.exit(0);
