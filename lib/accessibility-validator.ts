/**
 * Accessibility validation utilities
 * Helps ensure WCAG 2.1 AA compliance
 */

// Color contrast ratios for WCAG compliance
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3;
const WCAG_AAA_NORMAL = 7;
const WCAG_AAA_LARGE = 4.5;

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color contrast meets WCAG standards
 */
export function checkContrastCompliance(
  foreground: string, 
  background: string, 
  isLargeText = false
): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  level: 'fail' | 'aa' | 'aaa';
} {
  const ratio = getContrastRatio(foreground, background);
  const aaThreshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  const aaaThreshold = isLargeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL;
  
  const aa = ratio >= aaThreshold;
  const aaa = ratio >= aaaThreshold;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa,
    aaa,
    level: aaa ? 'aaa' : aa ? 'aa' : 'fail'
  };
}

/**
 * Validate ARIA attributes
 */
export function validateAriaAttributes(element: Element): string[] {
  const issues: string[] = [];
  
  // Check for required ARIA labels
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  
  // Interactive elements should have accessible names
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'option'];
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
  
  if (
    (role && interactiveRoles.includes(role)) ||
    interactiveTags.includes(element.tagName.toLowerCase())
  ) {
    if (!ariaLabel && !ariaLabelledBy && !element.textContent?.trim()) {
      issues.push('Interactive element lacks accessible name');
    }
  }
  
  // Check for invalid ARIA attributes
  const validAriaAttributes = [
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
    'aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy',
    'aria-controls', 'aria-owns', 'aria-flowto', 'aria-activedescendant',
    'aria-current', 'aria-details', 'aria-disabled', 'aria-invalid',
    'aria-pressed', 'aria-selected', 'aria-checked', 'aria-level',
    'aria-orientation', 'aria-sort', 'aria-valuemax', 'aria-valuemin',
    'aria-valuenow', 'aria-valuetext', 'aria-autocomplete', 'aria-haspopup',
    'aria-multiline', 'aria-multiselectable', 'aria-readonly', 'aria-required'
  ];
  
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-') && !validAriaAttributes.includes(attr.name)) {
      issues.push(`Invalid ARIA attribute: ${attr.name}`);
    }
  });
  
  return issues;
}

/**
 * Check keyboard navigation
 */
export function validateKeyboardNavigation(): string[] {
  const issues: string[] = [];
  
  // Check for focusable elements without visible focus indicators
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  focusableElements.forEach((element, index) => {
    // Check if element has custom focus styles
    const computedStyle = window.getComputedStyle(element, ':focus');
    const outline = computedStyle.outline;
    const boxShadow = computedStyle.boxShadow;
    
    if (outline === 'none' && boxShadow === 'none') {
      issues.push(`Element ${index + 1} lacks visible focus indicator`);
    }
  });
  
  return issues;
}

/**
 * Check for proper heading hierarchy
 */
export function validateHeadingHierarchy(): string[] {
  const issues: string[] = [];
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    if (index === 0 && level !== 1) {
      issues.push('Page should start with h1');
    }
    
    if (level > previousLevel + 1) {
      issues.push(`Heading level skipped: ${heading.tagName} after h${previousLevel}`);
    }
    
    previousLevel = level;
  });
  
  return issues;
}

/**
 * Check for alt text on images
 */
export function validateImageAltText(): string[] {
  const issues: string[] = [];
  const images = document.querySelectorAll('img');
  
  images.forEach((img, index) => {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    
    if (alt === null && role !== 'presentation') {
      issues.push(`Image ${index + 1} missing alt attribute`);
    }
    
    if (alt === '') {
      // Empty alt is okay for decorative images
    } else if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
      issues.push(`Image ${index + 1} alt text should not contain "image" or "picture"`);
    }
  });
  
  return issues;
}

/**
 * Run comprehensive accessibility audit
 */
export function runAccessibilityAudit(): {
  score: number;
  issues: Array<{
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
} {
  const allIssues: Array<{
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }> = [];
  
  // Check heading hierarchy
  const headingIssues = validateHeadingHierarchy();
  headingIssues.forEach(issue => {
    allIssues.push({
      type: 'heading',
      severity: 'error',
      message: issue
    });
  });
  
  // Check image alt text
  const imageIssues = validateImageAltText();
  imageIssues.forEach(issue => {
    allIssues.push({
      type: 'image',
      severity: 'error',
      message: issue
    });
  });
  
  // Check keyboard navigation
  const keyboardIssues = validateKeyboardNavigation();
  keyboardIssues.forEach(issue => {
    allIssues.push({
      type: 'keyboard',
      severity: 'warning',
      message: issue
    });
  });
  
  // Check ARIA attributes
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    const ariaIssues = validateAriaAttributes(element);
    ariaIssues.forEach(issue => {
      allIssues.push({
        type: 'aria',
        severity: 'warning',
        message: issue
      });
    });
  });
  
  // Calculate score (100 - number of issues, minimum 0)
  const errorCount = allIssues.filter(issue => issue.severity === 'error').length;
  const warningCount = allIssues.filter(issue => issue.severity === 'warning').length;
  
  const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));
  
  return {
    score,
    issues: allIssues
  };
}

/**
 * Log accessibility audit results
 */
export function logAccessibilityAudit() {
  if (process.env.NODE_ENV === 'development') {
    const audit = runAccessibilityAudit();
    
    console.group('♿ Accessibility Audit');
    console.log(`Score: ${audit.score}/100`);
    
    if (audit.issues.length === 0) {
      console.log('✅ No accessibility issues found!');
    } else {
      audit.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${issue.type}] ${issue.message}`);
      });
    }
    
    console.groupEnd();
  }
}
