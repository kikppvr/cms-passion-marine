import fetch from 'node:http';

const BASE_URL = 'http://localhost:1337';
const EMAIL = 'admin@passionmarine.co.th';
const PASSWORD = 'PassionMarine@Dev2024';

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json.errors || json)}`);
  return json;
}

let token;

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  token = json.data.access_token;
  console.log('✓ Logged in');
}

async function createCollection(payload) {
  try {
    await request('POST', '/collections', payload);
    console.log(`✓ Collection: ${payload.collection}`);
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('UNIQUE')) {
      console.log(`~ Skipped (exists): ${payload.collection}`);
    } else {
      throw e;
    }
  }
}

async function createField(collection, payload) {
  try {
    await request('POST', `/fields/${collection}`, payload);
    console.log(`  + Field: ${collection}.${payload.field}`);
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('UNIQUE')) {
      console.log(`  ~ Skipped (exists): ${collection}.${payload.field}`);
    } else {
      throw e;
    }
  }
}

async function createRelation(payload) {
  try {
    await request('POST', '/relations', payload);
    console.log(`  ↔ Relation: ${payload.collection}.${payload.field}`);
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('UNIQUE')) {
      console.log(`  ~ Skipped relation (exists): ${payload.collection}.${payload.field}`);
    } else {
      throw e;
    }
  }
}

async function setup() {
  await login();

  // ─── Articles ───────────────────────────────────────────────
  await createCollection({
    collection: 'articles',
    meta: { icon: 'article', display_template: '{{title}}', sort_field: 'sort' },
    schema: { name: 'articles' },
    fields: [
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, display: 'labels', width: 'half', required: true }, schema: { default_value: 'draft', is_nullable: false } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} },
      { field: 'title', type: 'string', meta: { interface: 'input', required: true, width: 'full' }, schema: { is_nullable: false } },
      { field: 'slug', type: 'string', meta: { interface: 'input', options: { slug: true }, width: 'full' }, schema: { is_unique: true } },
      { field: 'thumbnail', type: 'uuid', meta: { interface: 'file-image', width: 'full' }, schema: {} },
      { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' }, schema: {} },
    ],
  });

  await createRelation({ collection: 'articles', field: 'thumbnail', related_collection: 'directus_files', meta: { junction_field: null }, schema: { on_delete: 'SET NULL' } });

  // ─── Portfolio ───────────────────────────────────────────────
  await createCollection({
    collection: 'portfolios',
    meta: { icon: 'collections', display_template: '{{title}}', sort_field: 'sort' },
    schema: { name: 'portfolios' },
    fields: [
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, display: 'labels', width: 'half', required: true }, schema: { default_value: 'draft', is_nullable: false } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} },
      { field: 'title', type: 'string', meta: { interface: 'input', required: true, width: 'full' }, schema: { is_nullable: false } },
      { field: 'slug', type: 'string', meta: { interface: 'input', options: { slug: true }, width: 'full' }, schema: { is_unique: true } },
      { field: 'model', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} },
      { field: 'category', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} },
      { field: 'cover_image', type: 'uuid', meta: { interface: 'file-image', width: 'full' }, schema: {} },
      { field: 'main_image', type: 'uuid', meta: { interface: 'file-image', width: 'full' }, schema: {} },
      { field: 'description', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' }, schema: {} },
      { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' }, schema: {} },
    ],
  });

  await createRelation({ collection: 'portfolios', field: 'cover_image', related_collection: 'directus_files', meta: { junction_field: null }, schema: { on_delete: 'SET NULL' } });
  await createRelation({ collection: 'portfolios', field: 'main_image', related_collection: 'directus_files', meta: { junction_field: null }, schema: { on_delete: 'SET NULL' } });

  // Portfolio Gallery (M2M)
  await createCollection({
    collection: 'portfolios_files',
    meta: { hidden: true, icon: 'import_export' },
    schema: { name: 'portfolios_files' },
    fields: [
      { field: 'portfolios_id', type: 'integer', meta: { hidden: true }, schema: {} },
      { field: 'directus_files_id', type: 'uuid', meta: { hidden: true }, schema: {} },
    ],
  });
  await createField('portfolios', { field: 'gallery', type: 'alias', meta: { interface: 'files', special: ['files'], width: 'full' } });
  await createRelation({ collection: 'portfolios_files', field: 'portfolios_id', related_collection: 'portfolios', meta: { junction_field: 'directus_files_id', many_collection: 'portfolios_files', many_field: 'portfolios_id', one_collection: 'portfolios', one_field: 'gallery' }, schema: { on_delete: 'CASCADE' } });
  await createRelation({ collection: 'portfolios_files', field: 'directus_files_id', related_collection: 'directus_files', meta: { junction_field: 'portfolios_id' }, schema: { on_delete: 'CASCADE' } });

  // Portfolio Brand Logos (M2M)
  await createCollection({
    collection: 'portfolios_brand_logos',
    meta: { hidden: true, icon: 'import_export' },
    schema: { name: 'portfolios_brand_logos' },
    fields: [
      { field: 'portfolios_id', type: 'integer', meta: { hidden: true }, schema: {} },
      { field: 'directus_files_id', type: 'uuid', meta: { hidden: true }, schema: {} },
    ],
  });
  await createField('portfolios', { field: 'brand_logos', type: 'alias', meta: { interface: 'files', special: ['files'], width: 'full' } });
  await createRelation({ collection: 'portfolios_brand_logos', field: 'portfolios_id', related_collection: 'portfolios', meta: { junction_field: 'directus_files_id', many_collection: 'portfolios_brand_logos', many_field: 'portfolios_id', one_collection: 'portfolios', one_field: 'brand_logos' }, schema: { on_delete: 'CASCADE' } });
  await createRelation({ collection: 'portfolios_brand_logos', field: 'directus_files_id', related_collection: 'directus_files', meta: { junction_field: 'portfolios_id' }, schema: { on_delete: 'CASCADE' } });

  // Portfolio Services Provided (O2M)
  await createCollection({
    collection: 'portfolio_services_provided',
    meta: { hidden: false, icon: 'build', display_template: '{{title}}' },
    schema: { name: 'portfolio_services_provided' },
    fields: [
      { field: 'portfolio_id', type: 'integer', meta: { hidden: true, interface: 'numeric' }, schema: {} },
      { field: 'title', type: 'string', meta: { interface: 'input', required: true, width: 'full' }, schema: {} },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', width: 'full' }, schema: {} },
    ],
  });
  await createField('portfolios', { field: 'services_provided', type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], options: { template: '{{title}}' }, width: 'full' } });
  await createRelation({ collection: 'portfolio_services_provided', field: 'portfolio_id', related_collection: 'portfolios', meta: { many_collection: 'portfolio_services_provided', many_field: 'portfolio_id', one_collection: 'portfolios', one_field: 'services_provided' }, schema: { on_delete: 'CASCADE' } });
  await createRelation({ collection: 'portfolio_services_provided', field: 'image', related_collection: 'directus_files', meta: { junction_field: null }, schema: { on_delete: 'SET NULL' } });

  // ─── Services ────────────────────────────────────────────────
  await createCollection({
    collection: 'services',
    meta: { icon: 'build', display_template: '{{title}}', sort_field: 'sort' },
    schema: { name: 'services' },
    fields: [
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, display: 'labels', width: 'half', required: true }, schema: { default_value: 'draft', is_nullable: false } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} },
      { field: 'title', type: 'string', meta: { interface: 'input', required: true, width: 'full' }, schema: { is_nullable: false } },
      { field: 'type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Engineering', value: 'engineering' }, { text: 'Aesthetic', value: 'aesthetic' }, { text: 'General', value: 'general' }] }, width: 'half' }, schema: {} },
      { field: 'description', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' }, schema: {} },
    ],
  });

  console.log('\n✅ Schema setup complete!');
}

// Use native fetch (Node 22+)
const originalFetch = globalThis.fetch;
async function fetchWrapper(url, options) {
  return originalFetch(url, options);
}
globalThis.fetch = fetchWrapper;

// Override the request function to use native fetch
const req = async (method, path, body) => {
  const res = await globalThis.fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json.errors || json)}`);
  return json;
};

// Patch request function
globalThis._req = req;

setup().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
