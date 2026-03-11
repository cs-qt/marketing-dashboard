/**
 * Migration script: Import Google Sheets CSV data → MongoDB
 *
 * Usage:
 *   npm run migrate
 *   # or with env overrides:
 *   CSV_GOOGLE_ADS=<url> CSV_SEO=<url> CSV_SOCIAL=<url> npm run migrate
 *
 * Configure CSV URLs in .env or pass as environment variables.
 * This is a one-time migration; subsequent data entry is via the dashboard API.
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import https from 'https';
import http from 'http';
import { GoogleAdsData, SeoData, SocialMediaData } from '../models/index.js';

const MONGODB_URI = process.env.MONGODB_URI!;

/* ── CSV Fetcher ── */

function fetchCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchCSV(res.headers.location!).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/* ── CSV Parser ── */

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] || ''));
    return row;
  });
}

function num(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

/* ── Google Ads Mapper ── */

async function migrateGoogleAds(url: string): Promise<number> {
  console.log('  Fetching Google Ads CSV...');
  const csv = await fetchCSV(url);
  const rows = parseCSV(csv);
  let count = 0;

  // Expect rows with Month, Impressions, Clicks, CTR, CPC, Conversions, ROAS, Spend, CPM columns
  for (const row of rows) {
    const monthRaw = row['Month'] || row['month'];
    if (!monthRaw) continue;

    // Parse "Mar 2025" → "2025-03"
    const parts = monthRaw.trim().split(' ');
    if (parts.length !== 2) continue;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mi = monthNames.indexOf(parts[0]);
    if (mi === -1) continue;
    const monthKey = `${parts[1]}-${String(mi + 1).padStart(2, '0')}`;

    await GoogleAdsData.findOneAndUpdate(
      { monthKey },
      {
        monthKey,
        monthLabel: monthRaw.trim(),
        kpis: {
          impressions: num(row['Impressions']),
          clicks: num(row['Clicks']),
          ctr: num(row['CTR']),
          cpc: num(row['CPC']),
          conversions: num(row['Conversions']),
          roas: num(row['ROAS']),
        },
        spend: {
          totalSpent: num(row['Spend'] || row['Total Spent']),
          cpm: num(row['CPM']),
        },
      },
      { upsert: true }
    );
    count++;
  }
  return count;
}

/* ── SEO Mapper ── */

async function migrateSeo(url: string): Promise<number> {
  console.log('  Fetching SEO CSV...');
  const csv = await fetchCSV(url);
  const rows = parseCSV(csv);
  let count = 0;

  for (const row of rows) {
    const monthRaw = row['Month'] || row['month'];
    if (!monthRaw) continue;

    const parts = monthRaw.trim().split(' ');
    if (parts.length !== 2) continue;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mi = monthNames.indexOf(parts[0]);
    if (mi === -1) continue;
    const monthKey = `${parts[1]}-${String(mi + 1).padStart(2, '0')}`;

    await SeoData.findOneAndUpdate(
      { monthKey },
      {
        monthKey,
        monthLabel: monthRaw.trim(),
        geoKpis: {
          aiVisibilityScore: num(row['AI Visibility Score']),
          attributionRate: num(row['Attribution Rate']),
          aiShareOfVoice: num(row['AI Share of Voice']),
          attributionCtr: num(row['Attribution CTR']),
          aiTrafficSessions: num(row['AI Traffic Sessions']),
          aiConversionRate: num(row['AI Conversion Rate']),
        },
      },
      { upsert: true }
    );
    count++;
  }
  return count;
}

/* ── Social Media Mapper ── */

async function migrateSocial(url: string): Promise<number> {
  console.log('  Fetching Social Media CSV...');
  const csv = await fetchCSV(url);
  const rows = parseCSV(csv);
  let count = 0;

  for (const row of rows) {
    const monthRaw = row['Month'] || row['month'];
    if (!monthRaw) continue;

    const parts = monthRaw.trim().split(' ');
    if (parts.length !== 2) continue;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mi = monthNames.indexOf(parts[0]);
    if (mi === -1) continue;
    const monthKey = `${parts[1]}-${String(mi + 1).padStart(2, '0')}`;

    await SocialMediaData.findOneAndUpdate(
      { monthKey },
      {
        monthKey,
        monthLabel: monthRaw.trim(),
        followers: {
          total: num(row['Total Followers']),
          change: num(row['Followers Change']),
          maxDailyChange: num(row['Max Daily Change']),
          avgDailyChange: num(row['Avg Daily Change']),
        },
      },
      { upsert: true }
    );
    count++;
  }
  return count;
}

/* ── Main ── */

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('  ExpertMRI Analytics Migration');
  console.log('  Google Sheets CSV → MongoDB');
  console.log('═══════════════════════════════════════════\n');

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  const csvGoogleAds = process.env.CSV_GOOGLE_ADS;
  const csvSeo = process.env.CSV_SEO;
  const csvSocial = process.env.CSV_SOCIAL;

  let totalImported = 0;

  if (csvGoogleAds) {
    const count = await migrateGoogleAds(csvGoogleAds);
    console.log(`  ✓ Google Ads: ${count} months imported`);
    totalImported += count;
  } else {
    console.log('  ⊘ CSV_GOOGLE_ADS not set — skipping');
  }

  if (csvSeo) {
    const count = await migrateSeo(csvSeo);
    console.log(`  ✓ SEO: ${count} months imported`);
    totalImported += count;
  } else {
    console.log('  ⊘ CSV_SEO not set — skipping');
  }

  if (csvSocial) {
    const count = await migrateSocial(csvSocial);
    console.log(`  ✓ Social Media: ${count} months imported`);
    totalImported += count;
  } else {
    console.log('  ⊘ CSV_SOCIAL not set — skipping');
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  Migration complete: ${totalImported} total records`);
  console.log(`═══════════════════════════════════════════`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
