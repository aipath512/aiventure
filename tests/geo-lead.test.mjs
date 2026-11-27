import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Import the Cloudflare Pages Function as ESM without changing project packaging.
const source = readFileSync(resolve('functions/api/contact.js'), 'utf8');
const { onRequestPost } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

class FakeD1 {
  constructor() {
    this.columns = new Set(['id', 'website', 'email', 'tip', 'obiectiv', 'mesaj', 'ua', 'country', 'ts']);
    this.leads = [];
    this.conversions = new Set();
  }
  prepare(sql) {
    const db = this;
    const statement = {
      args: [],
      bind(...args) { this.args = args; return this; },
      async all() {
        if (!sql.includes('PRAGMA table_info(lead)')) throw Error('Unexpected all()');
        return { results: [...db.columns].map(name => ({ name })) };
      },
      async run() {
        if (sql.includes('ALTER TABLE lead ADD COLUMN')) {
          db.columns.add(sql.match(/ADD COLUMN (\w+)/)[1]);
        } else if (sql.includes('INSERT INTO lead')) {
          assert(db.columns.has('lead_uid'), 'schema migration must precede INSERT');
          db.leads.push(this.args);
        } else if (sql.includes('INSERT OR IGNORE INTO conversie_geo')) {
          db.conversions.add(this.args[0]);
        }
        return { success: true };
      },
    };
    return statement;
  }
}

async function submit(data, env) {
  const request = new Request('https://aiventure.ro/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const response = await onRequestPost({ request, env });
  return { status: response.status, body: await response.json() };
}

const DB = new FakeD1();
const base = {
  website: 'example.invalid', email: 'tester@example.invalid',
  tip: 'cerere-servicii-geo', obiectiv: 'Solicitare ofertă GEO',
  utm_source: 'newsletter', utm_medium: 'email',
  utm_campaign: 'geo-test', landing_page: '/geo/',
};

const invalid = await submit({ ...base, email: 'invalid' }, { DB });
assert.equal(invalid.status, 400);
assert.equal(DB.leads.length, 0);

const honeypot = await submit({ ...base, companie_website: 'robot' }, { DB });
assert.equal(honeypot.body.saved, false);
assert.equal(DB.leads.length, 0);

const valid = await submit(base, { DB });
assert.equal(valid.status, 200);
assert.equal(valid.body.validated, true);
assert.equal(valid.body.saved, true);
assert.equal(typeof valid.body.lead_id, 'string');
assert.equal(DB.leads.length, 1);
assert.equal(DB.leads[0][9], 'newsletter');
assert.equal(DB.leads[0][11], 'geo-test');
assert.equal(DB.leads[0][14], '/geo/');
assert.equal(DB.conversions.size, 1);
assert(DB.conversions.has(valid.body.lead_id));

console.log('PASS: invalid email, honeypot, D1 migration, saved lead, UTM, unique GEO conversion');
