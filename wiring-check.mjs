// Détecte les câblages FE→BE morts : endpoints appelés par le frontend qui
// n'existent PAS dans le backend (comme /stripe/worker/history qu'on a corrigé).
import fs from 'fs';

const swagger = await fetch('http://localhost:3000/api/docs-json').then(r => r.json());
const beRoutes = Object.keys(swagger.paths).map(p => p.replace(/\{[^}]+\}/g, '*'));

const FILES = [
  'src/lib/api-client.ts',
  'src/lib/stripe-api.ts',
];
const txt = FILES.map(f => { try { return fs.readFileSync('C:/Users/ouell/workonapp/' + f, 'utf8'); } catch { return ''; } }).join('\n');

// Tous les littéraux passés à apiFetch( ... )
const calls = [...txt.matchAll(/apiFetch\s*(?:<[^>]*>)?\s*\(\s*([`'"])([^`'"]+)\1/g)].map(m => m[2]);
const norm = p => ('/api/v1' + p.split('?')[0]).replace(/\$\{[^}]+\}/g, '*').replace(/\/+/g, '/').replace(/\/$/, '');
const feCalls = [...new Set(calls.map(norm))].filter(p => p !== '/api/v1');

function matches(fe) {
  const fseg = fe.split('/');
  return beRoutes.some(be => {
    const bseg = be.split('/');
    if (bseg.length !== fseg.length) return false;
    return bseg.every((s, i) => s === fseg[i] || s === '*' || fseg[i] === '*');
  });
}

const dead = feCalls.filter(p => !matches(p));
console.log(`Routes BE: ${beRoutes.length}  |  Endpoints FE appelés: ${feCalls.length}  |  MORTS: ${dead.length}\n`);
if (dead.length) {
  console.log('❌ CÂBLAGES FE→BE MORTS (le FE appelle, le BE n\'a pas) :');
  dead.forEach(p => console.log('   ' + p));
} else {
  console.log('✅ Aucun câblage mort détecté (api-client + stripe-api).');
}
