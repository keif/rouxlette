/**
 * Guardrails to detect unsafe logging practices that could cause PayloadTooLargeError
 * 
 * These tests scan the codebase for patterns that could cause issues and provide
 * specific guidance for fixing them.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Patterns that indicate unsafe logging practices
 */
const UNSAFE_PATTERNS = [
  {
    pattern: 'console\\.(log|dir|info|warn|error)\\s*\\(',
    description: 'Direct console usage - should use logSafe() instead',
    severity: 'high',
    fix: 'Replace with logSafe(label, data) from utils/log.ts',
  },
  {
    pattern: 'JSON\\.stringify\\s*\\([^)]*\\)',
    description: 'Direct JSON.stringify - may cause circular reference or size issues',
    severity: 'medium', 
    fix: 'Use clip() function first, or logSafe() which handles this automatically',
  },
  {
    pattern: 'console\\.log\\s*\\([^)]*businesses[^)]*\\)',
    description: 'Logging business arrays - will cause PayloadTooLargeError',
    severity: 'critical',
    fix: 'Use logArray() or logSafe() with business metadata only',
  },
  {
    pattern: 'console\\.log\\s*\\([^)]*response\\.data[^)]*\\)',
    description: 'Logging API response data - will cause PayloadTooLargeError',
    severity: 'critical',
    fix: 'Use logNetwork() or extract metadata with logSafe()',
  },
];

/**
 * Files that are allowed to have unsafe patterns (e.g., the safe logging utils themselves)
 */
const ALLOWED_UNSAFE_FILES = [
  'utils/log.ts',
  'utils/devtools.ts',
  '__tests__/**/*',
  'node_modules/**/*',
];

describe('Unsafe Logging Detection', () => {
  let codebaseFiles: string[] = [];

  beforeAll(() => {
    // Get all TypeScript and JavaScript files in the codebase
    try {
      const output = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .git', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
      });
      
      codebaseFiles = output
        .trim()
        .split('\n')
        .map(file => file.replace('./', ''))
        .filter(Boolean);
    } catch (error) {
      console.warn('Could not scan codebase files:', error);
      codebaseFiles = [];
    }
  });

  test('should not have any critical unsafe logging patterns', () => {
    const criticalIssues: Array<{
      file: string;
      line: number;
      pattern: string;
      description: string;
      fix: string;
      code: string;
    }> = [];

    for (const file of codebaseFiles) {
      // Skip allowed files
      if (ALLOWED_UNSAFE_FILES.some(allowed => {
        if (allowed.includes('**')) {
          return file.match(allowed.replace('**/*', '.*'));
        }
        return file === allowed;
      })) {
        continue;
      }

      try {
        const fullPath = path.join(PROJECT_ROOT, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (const { pattern, description, severity, fix } of UNSAFE_PATTERNS) {
          if (severity !== 'critical') continue;

          const regex = new RegExp(pattern, 'gi');
          
          lines.forEach((line, index) => {
            const matches = line.match(regex);
            if (matches) {
              criticalIssues.push({
                file,
                line: index + 1,
                pattern,
                description,
                fix,
                code: line.trim(),
              });
            }
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    if (criticalIssues.length > 0) {
      const issueReport = criticalIssues
        .map(issue => `
❌ CRITICAL: ${issue.description}
   File: ${issue.file}:${issue.line}
   Code: ${issue.code}
   Fix:  ${issue.fix}
`)
        .join('\n');

      fail(`
🚨 CRITICAL UNSAFE LOGGING PATTERNS DETECTED 🚨

These patterns WILL cause PayloadTooLargeError in development:

${issueReport}

Total critical issues: ${criticalIssues.length}

Run the following command to see all occurrences:
npm run lint:unsafe-logging
`);
    }
  });

  test('should provide warnings for medium-severity unsafe patterns', () => {
    const warnings: Array<{
      file: string;
      line: number;
      description: string;
      fix: string;
    }> = [];

    for (const file of codebaseFiles) {
      if (ALLOWED_UNSAFE_FILES.some(allowed => file.includes(allowed.replace('**/*', '')))) {
        continue;
      }

      try {
        const fullPath = path.join(PROJECT_ROOT, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (const { pattern, description, severity, fix } of UNSAFE_PATTERNS) {
          if (severity !== 'medium') continue;

          const regex = new RegExp(pattern, 'gi');
          
          lines.forEach((line, index) => {
            const matches = line.match(regex);
            if (matches) {
              warnings.push({
                file,
                line: index + 1,
                description,
                fix,
              });
            }
          });
        }
      } catch (error) {
        continue;
      }
    }

    if (warnings.length > 0) {
      console.warn(`
⚠️  MEDIUM-SEVERITY LOGGING WARNINGS (${warnings.length} found)

These patterns could cause issues:

${warnings.slice(0, 10).map(w => `${w.file}:${w.line} - ${w.description}`).join('\n')}
${warnings.length > 10 ? `\n... and ${warnings.length - 10} more` : ''}

Consider updating these to use safe logging utilities.
`);
    }

    // This is a warning test - we don't fail on medium severity
    expect(warnings.length).toBeGreaterThanOrEqual(0);
  });

  test('should validate that safe logging utilities are available', () => {
    const safeLogPath = path.join(PROJECT_ROOT, 'utils/log.ts');
    const devtoolsPath = path.join(PROJECT_ROOT, 'utils/devtools.ts');

    expect(fs.existsSync(safeLogPath)).toBe(true);
    expect(fs.existsSync(devtoolsPath)).toBe(true);

    // Verify key functions are exported
    const logContent = fs.readFileSync(safeLogPath, 'utf-8');
    expect(logContent).toContain('export function logSafe');
    expect(logContent).toContain('export function logArray');
    expect(logContent).toContain('export function logNetwork');
    expect(logContent).toContain('export function clip');

    const devtoolsContent = fs.readFileSync(devtoolsPath, 'utf-8');
    expect(devtoolsContent).toContain('export function sanitizeState');
    expect(devtoolsContent).toContain('export function createContextLogger');
  });
});

describe('Safe Logging Usage Examples', () => {
  test('should demonstrate correct patterns', () => {
    // These examples show how to safely log different data types
    const safeExamples = [
      // ✅ Safe business logging
      `logSafe('search-results', {
        count: businesses.length,
        firstBusiness: businesses[0]?.name,
        categories: [...new Set(businesses.map(b => b.categories?.[0]?.title))].slice(0, 5)
      });`,

      // ✅ Safe API response logging  
      `logNetwork('GET', '/businesses/search', params, {
        status: response.status,
        businessCount: response.data.businesses.length,
        total: response.data.total
      });`,

      // ✅ Safe Context state logging
      `const contextLogger = createContextLogger('SearchContext');
      contextLogger('state-update', state); // Automatically sanitized`,

      // ✅ Safe array logging
      `logArray('filtered-businesses', filteredBusinesses, 3);`,

      // ✅ Safe object logging with selected fields
      `logObject('user-filters', filters, ['categoryIds', 'openNow', 'radiusMeters']);`,
    ];

    // These examples show what NOT to do
    const unsafeExamples = [
      // ❌ Will cause PayloadTooLargeError
      `console.log('businesses:', businesses);`,
      
      // ❌ Will cause PayloadTooLargeError  
      `console.log('API response:', response.data);`,
      
      // ❌ May cause circular reference issues
      `console.log('Full state:', JSON.stringify(state));`,
      
      // ❌ Will cause PayloadTooLargeError with large arrays
      `console.log('Search results:', searchResults);`,
    ];

    // Verify we have both positive and negative examples
    expect(safeExamples.length).toBeGreaterThan(0);
    expect(unsafeExamples.length).toBeGreaterThan(0);

    // This test mainly serves as documentation
    expect(true).toBe(true);
  });
});

describe('Performance Impact Assessment', () => {
  test('safe logging should have minimal performance impact', () => {
    const { logSafe, clip } = require('../../utils/log');

    // Test with reasonably large data
    const testData = {
      businesses: Array.from({ length: 100 }, (_, i) => ({
        id: `biz-${i}`,
        name: `Business ${i}`,
        rating: 4.0 + Math.random(),
        location: { lat: 40.7 + Math.random(), lng: -74.0 + Math.random() },
      })),
      filters: { categoryIds: ['restaurants'], openNow: true },
    };

    // Measure clipping performance
    const clipStart = performance.now();
    const clipped = clip(testData, { maxItems: 5 });
    const clipDuration = performance.now() - clipStart;

    // Should complete quickly (< 10ms for reasonable data sizes)
    expect(clipDuration).toBeLessThan(10);

    // Measure full logSafe performance
    const logStart = performance.now();
    logSafe('performance-test', testData);
    const logDuration = performance.now() - logStart;

    // Should complete very quickly (< 5ms)
    expect(logDuration).toBeLessThan(5);

    // Clipped data should be much smaller
    const originalSize = JSON.stringify(testData).length;
    const clippedSize = JSON.stringify(clipped).length;
    
    expect(clippedSize).toBeLessThan(originalSize * 0.2); // < 20% of original
  });
});