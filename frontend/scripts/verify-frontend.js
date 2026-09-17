import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

console.log('=== Mosque Radar Frontend Contract & Architecture Tests ===\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

try {
  // 1. App.jsx Route & Page Verification
  const appJsxPath = path.join(srcDir, 'App.jsx');
  assert(fs.existsSync(appJsxPath), 'App.jsx router shell exists');

  const appContent = fs.readFileSync(appJsxPath, 'utf8');

  const expectedPages = [
    'HomePage',
    'ExplorePage',
    'SubmitMosquePage',
    'MosqueDetailPage',
    'LoginPage',
    'RegisterPage',
    'ProfilePage',
    'ModerationPage'
  ];

  for (const page of expectedPages) {
    const pagePath = path.join(srcDir, 'pages', `${page}.jsx`);
    const pageExists = fs.existsSync(pagePath);
    const importedInApp = appContent.includes(page);
    assert(
      pageExists && importedInApp,
      `Page component ${page}.jsx exists and is registered in App.jsx`
    );
  }

  // 2. Centralized API Service Contract Verification
  const apiPath = path.join(srcDir, 'services', 'api.js');
  assert(fs.existsSync(apiPath), 'Centralized API service (api.js) exists');

  const apiContent = fs.readFileSync(apiPath, 'utf8');
  const expectedApiMethods = [
    'getMosques',
    'getNearbyMosques',
    'getMosqueById',
    'createMosque',
    'uploadImage',
    'getModerationQueue',
    'verifyMosque',
    'updateMosque',
    'checkDuplicates',
    'login',
    'register',
    'getMe',
    'getMySubmissions'
  ];

  for (const method of expectedApiMethods) {
    const methodDefined = apiContent.includes(`${method}:`);
    assert(
      methodDefined,
      `API service provides contract method: api.${method}()`
    );
  }

  // 3. Design System & CSS Variables Verification
  const cssPath = path.join(srcDir, 'index.css');
  assert(fs.existsSync(cssPath), 'Core design system (index.css) exists');

  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const expectedTokens = [
    '--primary-500',
    '--primary-600',
    '--bg-app',
    '--bg-surface',
    '--bg-card',
    '--bg-glass',
    '--border-subtle',
    '--border-focus',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--radius-sm',
    '--radius-md',
    '--radius-lg'
  ];

  for (const token of expectedTokens) {
    const tokenExists = cssContent.includes(token);
    assert(tokenExists, `CSS Design token ${token} is defined`);
  }

  // 4. HTML Entry Point SEO & Meta Tags Verification
  const htmlPath = path.join(__dirname, '..', 'index.html');
  assert(fs.existsSync(htmlPath), 'index.html entry point exists');

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  assert(htmlContent.includes('<title>'), 'HTML contains <title> tag for SEO');
  assert(
    htmlContent.includes('viewport'),
    'HTML contains mobile-responsive viewport meta tag'
  );
  assert(
    htmlContent.includes('id="root"'),
    'HTML contains root React DOM mounting container'
  );

  console.log(`\n==============================================`);
  console.log(`Frontend Test Summary: ${passed}/${total} passed`);
  console.log(`==============================================\n`);

  process.exit(passed === total ? 0 : 1);
} catch (err) {
  console.error('Frontend test error:', err);
  process.exit(1);
}
