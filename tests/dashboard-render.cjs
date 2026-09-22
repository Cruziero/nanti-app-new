// Render the real dashboard components with explicit fixture data and no external requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
let view;
let fixture = { items: [], people: [], projects: [], settings: { name: 'Test User', tone: 'professional' }, hydrated: true, personOf: () => undefined, projectOf: () => undefined };
const cache = new Map();
const link = ({ to, children, search, hash, ...props }) => React.createElement('a', { ...props, href: to }, children);
const mocks = {
  '@tanstack/react-router': { Link: link, createFileRoute: () => () => ({ useSearch: () => ({ view }) }), useRouterState: ({ select }) => select({ location: { pathname: '/app/today', search: { view } } }) },
  '@/lib/nanti-store': { useNanti: () => fixture },
  '@/hooks/use-supabase-auth': { useSupabaseAuth: () => ({ user: { email: 'fixture@example.invalid' }, signOut: async () => {} }) },
  '@/components/nanti/item-detail': { useItemDetail: () => () => {} },
  '@/lib/nanti-ai.functions': { askAssistant: () => { throw Error('Unexpected AI request'); } },
  '@/components/ui/dialog': { Dialog: () => null, DialogContent: () => null, DialogHeader: () => null, DialogTitle: () => null, DialogDescription: () => null },
};
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = id => {
    if (mocks[id]) return mocks[id];
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(filename), id);
      const target = ['', '.ts', '.tsx'].map(ext => base + ext).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
      return load(target);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
// draftToItem isn't exercised by a server render; avoid importing the extraction backend.
mocks['@/lib/nanti-import'] = { draftToItem: () => { throw Error('Unexpected extraction'); } };
const { Today } = load(path.join(root, 'src/routes/app.today.tsx'));
const { AppShell } = load(path.join(root, 'src/components/nanti/app-shell.tsx'));
const { todayISO, addDays } = load(path.join(root, 'src/lib/nanti-utils.ts'));
const render = () => renderToStaticMarkup(React.createElement(AppShell, null, React.createElement(Today)));
let html = render();
assert.match(html, /Nothing due today/);
assert.match(html, /No outstanding replies/);
assert.match(html, /Message NANTI/);
assert.match(html, /Paste conversation/);
assert.match(html, /Coming soon/);
assert.doesNotMatch(html, /Send the exhibition proposal/);
fixture.items = [
  { id: 'a', title: 'Overdue fixture', status: 'open', kind: 'task', due: addDays(todayISO(), -1) },
  { id: 'b', title: 'Today fixture', status: 'open', kind: 'task', due: todayISO() },
  { id: 'c', title: 'Future fixture', status: 'open', kind: 'task', due: addDays(todayISO(), 1) },
  { id: 'd', title: 'Waiting fixture', status: 'open', kind: 'waiting', since: todayISO() },
  { id: 'e', title: 'Inbox fixture', status: 'inbox', kind: 'task' },
  { id: 'f', title: 'Completed fixture', status: 'done', kind: 'task', due: todayISO() },
];
html = render();
assert.match(html, /Overdue fixture/);
assert.match(html, /Today fixture/);
assert.match(html, /Waiting fixture/);
assert.match(html, /Inbox fixture/);
assert.doesNotMatch(html, /Future fixture/);
assert.doesNotMatch(html, /Completed fixture/);
view = 'all'; html = render();
assert.match(html, /All tasks/); assert.match(html, /Future fixture/);
assert.match(html, /aria-current="page"[^>]*>[\s\S]*?Tasks/);
console.log('PASS: empty states, task filtering, inbox/waiting, AI composer, integration labels and all-task navigation.');
