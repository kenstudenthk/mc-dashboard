#!/usr/bin/env node

/**
 * Date Adjuster Script for UPDATE Order Flow
 *
 * Purpose: Read SPO List data (exported as CSV) and add 1 day to date columns
 * Output: JSON file formatted for UPDATE order flow
 *
 * Usage:
 *   node date-adjuster.js --input spo-export.csv --output batch-update.json --email user@example.com
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const args = process.argv.slice(2);
const inputFile = args[args.indexOf('--input') + 1] || 'spo-export.csv';
const outputFile = args[args.indexOf('--output') + 1] || 'batch-update.json';
const userEmail = args[args.indexOf('--email') + 1] || 'noreply@example.com';

// Date columns to adjust (add 1 day)
const DATE_COLUMNS = ['SRD', 'OrderReceiveDate', 'CxSCompleteDate'];

// Critical fields needed for UPDATE flow (from your flow schema)
const REQUIRED_FIELDS = ['Id', 'SRD', 'OrderReceiveDate', 'CxSCompleteDate'];

/**
 * Parse YYYY-MM-DD format and add days
 */
function addDays(dateString, days) {
  if (!dateString || dateString.trim() === '') return '';

  try {
    const date = new Date(dateString.trim());
    if (isNaN(date.getTime())) {
      console.warn(`⚠️  Invalid date format: "${dateString}"`);
      return dateString;
    }

    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn(`⚠️  Error processing date "${dateString}": ${error.message}`);
    return dateString;
  }
}

/**
 * Process CSV and generate JSON for UPDATE flow
 */
async function processCSV() {
  console.log(`📂 Reading: ${inputFile}`);

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  let headers = [];
  let dateColumnIndexes = {};
  const updateRequests = [];
  let rowCount = 0;

  for await (const line of rl) {
    if (isHeader) {
      headers = line.split(',').map(h => h.trim());

      // Verify required fields exist
      const missingFields = REQUIRED_FIELDS.filter(f => !headers.includes(f));
      if (missingFields.length > 0) {
        console.error(`❌ Missing required columns: ${missingFields.join(', ')}`);
        console.error(`📋 Available columns: ${headers.join(', ')}`);
        process.exit(1);
      }

      // Find column indexes for date fields
      DATE_COLUMNS.forEach(col => {
        const idx = headers.findIndex(h => h === col);
        if (idx !== -1) {
          dateColumnIndexes[col] = idx;
          console.log(`✓ Found date column: ${col}`);
        }
      });

      isHeader = false;
    } else {
      const values = line.split(',');
      const recordData = {};

      // Map CSV values to object
      headers.forEach((header, idx) => {
        let value = values[idx]?.trim() || '';

        // Adjust dates
        if (dateColumnIndexes[header] === idx) {
          const originalDate = value;
          value = addDays(originalDate, 1);
          console.log(`  [Row ${rowCount + 1}] ${header}: ${originalDate} → ${value}`);
        }

        recordData[header] = value;
      });

      // Create UPDATE flow request for this record
      const updateRequest = {
        action: 'update',
        userEmail: userEmail,
        data: recordData
      };

      updateRequests.push(updateRequest);
      rowCount++;
    }
  }

  // Write JSON output
  const output = {
    timestamp: new Date().toISOString(),
    totalRecords: rowCount,
    userEmail: userEmail,
    requests: updateRequests
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\n✅ Batch update file created: ${outputFile}`);
  console.log(`📊 Total records to update: ${rowCount}`);
  console.log(`\n💡 Next step: Use this JSON in PA flow to loop through requests and call UPDATE order flow`);
}

(async () => {
  try {
    await processCSV();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
