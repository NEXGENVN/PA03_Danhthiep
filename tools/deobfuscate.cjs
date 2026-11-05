// Analysis utility: parses source as data; never executes recovered JavaScript.
// Supports javascript-obfuscator base64 string tables and arithmetic rotations.
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const root = path.resolve(__dirname, '..');
const custom = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
const standard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
function decode(s) {
  return Buffer.from([...s].map(c => standard[custom.indexOf(c)] || c).join(''), 'base64').toString('utf8');
}
function ev(n, lookup) {
  if (t.isNumericLiteral(n) || t.isStringLiteral(n) || t.isBooleanLiteral(n)) return n.value;
  if (t.isArrayExpression(n) && n.elements.length === 0) return [];
  if (t.isUnaryExpression(n)) { const a = ev(n.argument, lookup); if(n.operator==='-')return -a; if(n.operator==='+')return +a; if(n.operator==='!')return !a; if(n.operator==='~')return ~a; }
  if (t.isBinaryExpression(n)) { const a=ev(n.left,lookup),b=ev(n.right,lookup); switch(n.operator){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':return a/b;case '%':return a%b;case '===':return a===b;case '>>':return a>>b;case '&':return a&b;}}
  if (t.isCallExpression(n)&&t.isIdentifier(n.callee)&&n.arguments.length===1) {
    if(n.callee.name==='parseInt')return parseInt(ev(n.arguments[0],lookup));
    if(lookup)return lookup(n.callee.name,ev(n.arguments[0],lookup));
  }
  throw new Error('Not a whitelisted constant: '+n?.type);
}
function processFile(file) {
  const source=fs.readFileSync(file,'utf8'), ast=parser.parse(source,{sourceType:'unambiguous'});
  let arrayFn, array, decoderFn, offset, rotation;
  for(const n of ast.program.body) if(t.isFunctionDeclaration(n)) {
    for(const b of n.body.body) if(t.isVariableDeclaration(b)) for(const d of b.declarations) if(t.isArrayExpression(d.init)&&d.init.elements.length>10&&d.init.elements.every(t.isStringLiteral)) {arrayFn=n;array=d.init.elements.map(x=>x.value);}
  }
  let replaced=0, rotated=0;
  if(arrayFn) {
    for(const n of ast.program.body) if(t.isFunctionDeclaration(n)&&n!==arrayFn) {
      const p=n.params[0]; if(!t.isIdentifier(p))continue;
      traverse(t.file(t.program([t.cloneNode(n,true)])),{AssignmentExpression(q){if(t.isIdentifier(q.node.left,{name:p.name})&&t.isBinaryExpression(q.node.right,{operator:'-'})&&t.isIdentifier(q.node.right.left,{name:p.name})&&t.isNumericLiteral(q.node.right.right)){decoderFn=n;offset=q.node.right.right.value;}}});
    }
    if(!decoderFn)throw new Error('No decoder found '+file);
    const names=new Set([decoderFn.id.name]);
    for(let pass=0;pass<10;pass++)traverse(ast,{VariableDeclarator(p){if(t.isIdentifier(p.node.id)&&t.isIdentifier(p.node.init)&&names.has(p.node.init.name))names.add(p.node.id.name);}});
    for(const n of ast.program.body)if(t.isExpressionStatement(n)&&t.isCallExpression(n.expression)&&t.isFunctionExpression(n.expression.callee)&&n.expression.arguments.some(a=>t.isIdentifier(a,{name:arrayFn.id.name})))rotation=n;
    if(!rotation)throw new Error('No rotation found '+file);
    let calc;
    traverse(t.file(t.program([t.cloneNode(rotation,true)])),{VariableDeclarator(p){if(t.isBinaryExpression(p.node.init)){let hasParse=false; traverse(t.file(t.program([t.expressionStatement(t.cloneNode(p.node.init,true))])),{CallExpression(q){if(t.isIdentifier(q.node.callee,{name:'parseInt'}))hasParse=true;}});if(hasParse)calc=p.node.init;}}});
    const goal=ev(rotation.expression.arguments[1]);
    const lookup=(name,index)=>{if(!names.has(name))throw new Error('Unknown decoder '+name);const s=array[index-offset];if(s===undefined)throw new Error('Out of range '+index);return decode(s);};
    let aligned=false;
    for(let i=0;i<array.length;i++){let value;try{value=ev(calc,lookup);}catch{}if(value===goal){rotated=i;aligned=true;break;}array.push(array.shift());}
    if(!aligned)throw new Error('No arithmetic alignment '+file);
    traverse(ast,{CallExpression(p){if(t.isIdentifier(p.node.callee)&&names.has(p.node.callee.name)&&p.node.arguments.length===1){try{const v=lookup(p.node.callee.name,ev(p.node.arguments[0]));p.replaceWith(t.stringLiteral(v));replaced++;}catch{}}}});
    ast.program.body=ast.program.body.filter(n=>n!==arrayFn&&n!==decoderFn&&n!==rotation);
    traverse(ast,{VariableDeclarator(p){if(t.isIdentifier(p.node.id)&&names.has(p.node.id.name)&&t.isIdentifier(p.node.init)&&names.has(p.node.init.name))p.remove();}});
  }
  // Collapse concatenated literals; property names are easier to read afterwards.
  for(let pass=0;pass<6;pass++)traverse(ast,{BinaryExpression:{exit(p){try{const v=ev(p.node);if(['string','number','boolean'].includes(typeof v)&&Number.isFinite(typeof v==='number'?v:0)){p.replaceWith(t.valueToNode(v));p.skip();}}catch{}}},UnaryExpression:{exit(p){try{const v=ev(p.node);if(['boolean','number'].includes(typeof v)){p.replaceWith(t.valueToNode(v));p.skip();}}catch{}}},MemberExpression(p){if(p.node.computed&&t.isStringLiteral(p.node.property)&&t.isValidIdentifier(p.node.property.value)){p.node.property=t.identifier(p.node.property.value);p.node.computed=false;}}});
  const rel=path.relative(path.join(root,'recovered'),file), out=path.join(root,'analysis/readable',rel);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,'// Derived analysis copy. Original: recovered/'+rel.replaceAll('\\','/')+'\n'+generate(ast,{comments:true,jsescOption:{minimal:true}}).code+'\n');
  const requires=[],env=[],sql=[],urls=[],exports=[];
  traverse(ast,{CallExpression(p){const n=p.node;if(t.isIdentifier(n.callee,{name:'require'})&&t.isStringLiteral(n.arguments[0]))requires.push(n.arguments[0].value);},StringLiteral(p){const s=p.node.value;if(/\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE)\b/i.test(s))sql.push(s);if(/https?:\/\//.test(s))urls.push(s);},MemberExpression(p){const n=p.node;if(t.isMemberExpression(n.object)&&t.isIdentifier(n.object.object,{name:'process'})&&t.isIdentifier(n.object.property,{name:'env'}))env.push(t.isIdentifier(n.property)?n.property.name:n.property.value);if(t.isIdentifier(n.object,{name:'exports'}))exports.push(t.isIdentifier(n.property)?n.property.name:n.property.value);}});
  return {file:rel.replaceAll('\\','/'),out:path.relative(root,out).replaceAll('\\','/'),replaced,rotated,requires:[...new Set(requires)],env:[...new Set(env)],sql:[...new Set(sql)],urls:[...new Set(urls)],exports:[...new Set(exports)]};
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):d.name.endsWith('.js')?[path.join(dir,d.name)]:[]);}
const files=process.argv.slice(2).length?process.argv.slice(2).map(p=>path.resolve(p)):['ZL_SERVER','FILES_SERVER'].flatMap(p=>walk(path.join(root,'recovered',p)));
const results=files.map(processFile);fs.mkdirSync(path.join(root,'analysis'),{recursive:true});fs.writeFileSync(path.join(root,'analysis/zalo-static-index.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({file,replaced,rotated,requires,env})=>({file,replaced,rotated,requires,env})),null,2));

