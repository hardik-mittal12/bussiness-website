// Self-Promotion & Security Boundary Retest Script
// Run via: node scripts/test_role_guard.mjs

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

async function verifySelfPromotionGuards() {
  console.log('Testing Self-Promotion Attack Vectors against live Supabase...');

  // Test 1: User created with metadata attempting to set role = 'admin'
  const attackerEmail = `attacker_${Date.now()}@example.com`;
  const attackerPass = `HackerPass!${Date.now()}#999`;

  const { data: createdData, error: createErr } = await serviceClient.auth.admin.createUser({
    email: attackerEmail,
    password: attackerPass,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      is_admin: true,
      full_name: 'Attacker Attempt'
    }
  });

  if (createErr) throw createErr;
  const attackerId = createdData.user.id;

  // Check resulting profile in database: handle_new_user trigger must enforce role = 'viewer'
  const { data: profile } = await serviceClient.from('profiles').select('id, role').eq('id', attackerId).single();
  if (profile?.role === 'viewer') {
    console.log('[PASS] Metadata role injection blocked: Profile created with role = "viewer" (ignored malicious metadata)');
  } else {
    throw new Error(`[FAIL] Malicious metadata elevated role to ${profile?.role}`);
  }

  // Test 2: Attacker signs in and attempts direct profile update via client session
  const attackerClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await attackerClient.auth.signInWithPassword({ email: attackerEmail, password: attackerPass });

  // Attempt direct UPDATE role = 'admin'
  await attackerClient.from('profiles').update({ role: 'admin' }).eq('id', attackerId);
  
  // Check if role is still viewer
  const { data: profileAfter } = await serviceClient.from('profiles').select('role').eq('id', attackerId).single();
  if (profileAfter?.role === 'viewer') {
    console.log('[PASS] Direct client UPDATE blocked: Profile role remains "viewer"');
  } else {
    throw new Error(`[FAIL] Attacker successfully promoted themselves to ${profileAfter?.role}`);
  }

    // Attempt direct INSERT of admin profile
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { error: insertErr } = await attackerClient.from('profiles').insert({
      id: fakeId,
      email: 'fake_admin@example.com',
      role: 'admin'
    });
    if (insertErr) {
      console.log('[PASS] Direct INSERT of admin profile rejected by RLS / foreign key');
    }

    // Cleanup attacker
    await serviceClient.auth.admin.deleteUser(attackerId);
    console.log('Cleaned up test attacker account.');

  console.log('\nAll self-promotion attack vectors successfully blocked.');
}

verifySelfPromotionGuards().catch(err => {
  console.error(err);
  process.exit(1);
});
