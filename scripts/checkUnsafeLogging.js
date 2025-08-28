#!/usr/bin/env node

/**
 * Script to scan codebase for unsafe logging patterns
 * 
 * Run with: node scripts/checkUnsafeLogging.js
 * Or add to package.json: "lint:unsafe-logging": "node scripts/checkUnsafeLogging.js"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();

const UNSAFE_PATTERNS = [
  {
    pattern: /console\.(log|dir|info|warn|error)\s*\(/g,
    description: 'Direct console usage - should use logSafe() instead',
    severity: 'high',
    fix: 'Replace with logSafe(label, data) from utils/log.ts',
  },
  {
    pattern: /JSON\.stringify\s*\([^)]*\)/g,
    description: 'Direct JSON.stringify - may cause circular reference or size issues',
    severity: 'medium',
    fix: 'Use clip() function first, or logSafe() which handles this automatically',
  },
  {
    pattern: /console\.log\s*\([^)]*businesses[^)]*\)/g,
    description: 'Logging business arrays - will cause PayloadTooLargeError',
    severity: 'critical',
    fix: 'Use logArray() or logSafe() with business metadata only',
  },
  {
    pattern: /console\.log\s*\([^)]*response\.data[^)]*\)/g,
    description: 'Logging API response data - will cause PayloadTooLargeError',
    severity: 'critical',
    fix: 'Use logNetwork() or extract metadata with logSafe()',
  },
  {
    pattern: /console\.log\s*\([^)]*\.businesses[^)]*\)/g,
    description: 'Logging business data - likely to cause PayloadTooLargeError',
    severity: 'critical',
    fix: 'Use business metadata logging instead',
  },
];

const ALLOWED_UNSAFE_FILES = [
  'utils/log.ts',
  'utils/devtools.ts',
  '__tests__',
  'node_modules',
  'scripts/checkUnsafeLogging.js',
];

function isFileAllowed(filePath) {
  return ALLOWED_UNSAFE_FILES.some(allowed => filePath.includes(allowed));
}

function scanFile(filePath) {
  if (isFileAllowed(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues = [];

    UNSAFE_PATTERNS.forEach(({ pattern, description, severity, fix }) => {
      lines.forEach((line, index) => {
        // Reset the global regex
        pattern.lastIndex = 0;
        const matches = pattern.exec(line);
        
        if (matches) {
          issues.push({
            file: path.relative(PROJECT_ROOT, filePath),
            line: index + 1,
            column: matches.index + 1,
            severity,
            description,
            fix,
            code: line.trim(),
            match: matches[0],
          });
        }
      });
    });

    return issues;
  } catch (error) {
    return [];
  }
}

function getAllFiles() {
  try {
    const output = execSync(
      'find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .git',
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    );
    
    return output
      .trim()
      .split('\n')
      .map(file => path.resolve(PROJECT_ROOT, file.replace('./', '')))
      .filter(Boolean);
  } catch (error) {
    console.error('Error scanning files:', error.message);
    return [];
  }
}

function printResults(issues) {
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');

  console.log('\n🔍 UNSAFE LOGGING SCAN RESULTS\n');

  if (critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES (will cause PayloadTooLargeError):');
    console.log('='.repeat(60));
    
    critical.forEach(issue => {
      console.log(`\n❌ ${issue.file}:${issue.line}:${issue.column}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Code: ${issue.code}`);
      console.log(`   Fix: ${issue.fix}`);
    });
    
    console.log(`\nTotal critical issues: ${critical.length}\n`);
  }

  if (high.length > 0) {
    console.log('⚠️  HIGH PRIORITY ISSUES:');
    console.log('='.repeat(30));
    
    high.forEach(issue => {
      console.log(`\n⚠️  ${issue.file}:${issue.line}`);
      console.log(`   ${issue.description}`);
      console.log(`   Fix: ${issue.fix}`);
    });
    
    console.log(`\nTotal high priority issues: ${high.length}\n`);
  }

  if (medium.length > 0) {
    console.log('📝 MEDIUM PRIORITY ISSUES:');
    console.log('='.repeat(25));
    
    medium.slice(0, 10).forEach(issue => {
      console.log(`📝 ${issue.file}:${issue.line} - ${issue.description}`);
    });
    
    if (medium.length > 10) {
      console.log(`   ... and ${medium.length - 10} more medium priority issues`);
    }
    
    console.log(`\nTotal medium priority issues: ${medium.length}\n`);
  }

  if (issues.length === 0) {
    console.log('✅ No unsafe logging patterns detected!\n');
  } else {
    console.log('SUMMARY:');
    console.log(`• Critical: ${critical.length} (must fix immediately)`);
    console.log(`• High: ${high.length} (should fix soon)`);  
    console.log(`• Medium: ${medium.length} (consider fixing)`);
    console.log(`• Total: ${issues.length} issues found\n`);

    if (critical.length > 0) {
      console.log('💡 QUICK FIXES:');
      console.log('• Replace console.log() with logSafe() from utils/log.ts');
      console.log('• Use logArray() for arrays and logNetwork() for API responses');
      console.log('• Import: import { logSafe, logArray, logNetwork } from "./utils/log";\n');
    }
  }

  return issues.length;
}

function main() {
  console.log('🔍 Scanning for unsafe logging patterns...\n');

  const files = getAllFiles();
  console.log(`Scanning ${files.length} files...\n`);

  const allIssues = [];
  
  files.forEach(file => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });

  const totalIssues = printResults(allIssues);

  // Exit with error code if critical issues found
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  if (criticalCount > 0) {
    console.log('❌ Build should FAIL due to critical unsafe logging patterns.');
    process.exit(1);
  } else if (totalIssues > 0) {
    console.log('⚠️  Build passes but consider fixing the issues above.');
    process.exit(0);
  } else {
    console.log('✅ All logging patterns are safe!');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, UNSAFE_PATTERNS, ALLOWED_UNSAFE_FILES };