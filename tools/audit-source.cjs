const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { builtinModules } = require('node:module');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'recovered');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) walk(file);
    else if (file.endsWith('.js')) files.push(file);
  }
}
walk(source);
const report = { generatedAt: new Date().toISOString(), files: [], syntaxErrors: [], missingLocalModules: [], packages: [], environment: [], routes: [] };
const packages = new Set(), env = new Set();
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const code = fs.readFileSync(file, 'utf8');
  try { new vm.Script(code, { filename: relative }); }
  catch (e) { report.syntaxErrors.push({ file: relative, error: e.message }); continue; }
  const info = { file: relative, lines: code.split('\n').length, obfuscated: /const a\d*_0x/.test(code), imports: [], environment: [], routes: [] };
  const ast = parser.parse(code, { sourceType: 'script' });
  traverse(ast, {
    MemberExpression(p) {
      const n = p.node;
      if (n.object.type === 'MemberExpression' && n.object.object.name === 'process' && n.object.property.name === 'env') {
        const key = n.property.name || n.property.value;
        if (key) { env.add(key); info.environment.push(key); }
      }
    },
    CallExpression(p) {
      const n = p.node, callee = n.callee, first = n.arguments[0];
      if (callee.name === 'require' && first?.type === 'StringLiteral') {
        const name = first.value;
        info.imports.push(name);
        if (name.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), name);
          if (![resolved, resolved + '.js', path.join(resolved, 'index.js')].some(f => fs.existsSync(f) && fs.statSync(f).isFile())) report.missingLocalModules.push({ file: relative, line: n.loc.start.line, module: name });
        } else if (!builtinModules.includes(name) && !name.startsWith('node:')) packages.add(name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0]);
      }
      if (callee.type === 'MemberExpression' && ['app', 'router'].includes(callee.object.name) && ['get','post','put','delete','patch','use','all'].includes(callee.property.name) && first?.type === 'StringLiteral') {
        const route = { file: relative, line: n.loc.start.line, method: callee.property.name.toUpperCase(), path: first.value };
        info.routes.push(route); report.routes.push(route);
      }
    }
  });
  info.imports = [...new Set(info.imports)]; info.environment = [...new Set(info.environment)];
  report.files.push(info);
}
report.packages = [...packages].sort(); report.environment = [...env].sort();
fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(root, 'analysis', 'source-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, syntaxErrors: report.syntaxErrors, obfuscatedFiles: report.files.filter(f => f.obfuscated).length, missingLocalModules: report.missingLocalModules, packages: report.packages, environment: report.environment, declaredRoutes: report.routes.length }, null, 2));
process.exitCode = report.syntaxErrors.length ? 1 : 0;
