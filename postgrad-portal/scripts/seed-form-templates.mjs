/**
 * Seed Form Templates Script
 * Writes all 20 prebuilt FHD form templates to the Firestore formTemplates collection.
 * Existing templates with the same slug are NOT overwritten.
 *
 * Usage:  node scripts/seed-form-templates.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

// Firebase config (same as src/firebase/config.js)
const firebaseConfig = {
  apiKey: 'AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY',
  authDomain: 'postgrad-portal.firebaseapp.com',
  projectId: 'postgrad-portal',
  storageBucket: 'postgrad-portal.firebasestorage.app',
  messagingSenderId: '1074199423382',
  appId: '1:1074199423382:web:1a93b580f2c268dfd955b7',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Import all prebuilt templates ──
// We duplicate the definitions here for Node.js script compatibility
// In the app, they live in src/firebase/prebuiltTemplates.js

// Rather than duplicating 1200+ lines, we dynamically import them.
// Node.js can import .js files if we handle the import path.

const COLLECTION = 'formTemplates';

async function seedFormTemplates() {
  console.log('🌱 Seeding form templates to Firestore...\n');

  // Dynamically import the prebuilt templates
  let ALL_PREBUILT_TEMPLATES;
  try {
    const mod = await import('../src/firebase/prebuiltTemplates.js');
    ALL_PREBUILT_TEMPLATES = mod.ALL_PREBUILT_TEMPLATES;
  } catch (err) {
    console.error('❌ Failed to import prebuilt templates:', err.message);
    console.log('\n💡 Make sure you run this from the postgrad-portal/ directory.');
    process.exit(1);
  }

  if (!ALL_PREBUILT_TEMPLATES || ALL_PREBUILT_TEMPLATES.length === 0) {
    console.error('❌ No prebuilt templates found.');
    process.exit(1);
  }

  console.log(`📋 Found ${ALL_PREBUILT_TEMPLATES.length} prebuilt templates\n`);

  let created = 0;
  let skipped = 0;

  for (const template of ALL_PREBUILT_TEMPLATES) {
    const ref = doc(db, COLLECTION, template.slug);
    const existing = await getDoc(ref);

    if (existing.exists()) {
      console.log(`  ⏭️  ${template.slug} – already exists, skipping`);
      skipped++;
      continue;
    }

    const data = {
      ...template,
      status: 'published',
      isPrebuilt: true,
      version: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: 'system',
    };

    await setDoc(ref, data);
    console.log(`  ✅ ${template.slug} – created`);
    created++;
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  console.log('Total templates in collection: ' + (created + skipped));
  process.exit(0);
}

seedFormTemplates().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
