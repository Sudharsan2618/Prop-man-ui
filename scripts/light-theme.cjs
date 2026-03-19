/**
 * Light Theme Migration Script
 * Batch-updates all CSS files to replace dark-theme hardcoded colors
 * with light-theme equivalents.
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src')

// Find all CSS files recursively
function findCssFiles(dir) {
  let results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results = results.concat(findCssFiles(full))
    else if (entry.name.endsWith('.css') && !entry.name.includes('tokens') && !entry.name.includes('globals'))
      results.push(full)
  }
  return results
}

// Replacement rules: [pattern, replacement]
const RULES = [
  // Dark backgrounds → light
  [/background:\s*#0a1628/g, 'background: #F5F7FA'],
  [/background:\s*#122035/g, 'background: #FFFFFF'],
  [/background:\s*#0e1c2f/g, 'background: #EEF1F5'],
  [/background:\s*var\(--bg-dark\)/g, 'background: var(--bg-dark)'], // keep as-is, token changed

  // Dark rgba backgrounds → light equivalents
  [/rgba\(18,\s*32,\s*53,\s*0\.7\)/g, 'rgba(255, 255, 255, 0.95)'],
  [/rgba\(18,\s*32,\s*53,\s*[\d.]+\)/g, 'rgba(255, 255, 255, 0.9)'],
  [/rgba\(10,\s*22,\s*40,\s*[\d.]+\)/g, 'rgba(245, 247, 250, 0.95)'],
  [/rgba\(14,\s*28,\s*47,\s*[\d.]+\)/g, 'rgba(238, 241, 245, 0.95)'],

  // Dark surface colors
  [/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'rgba(27, 42, 74, 0.04)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, 'rgba(27, 42, 74, 0.04)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'rgba(27, 42, 74, 0.06)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.1\b\)/g, 'rgba(27, 42, 74, 0.06)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.12\)/g, 'rgba(27, 42, 74, 0.08)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.15\)/g, 'rgba(27, 42, 74, 0.08)'],

  // Teal primary → navy primary
  [/#13[Cc]8[Ee][Cc]/g, '#1B2A4A'],
  [/rgba\(19,\s*200,\s*236,\s*0\.1\b\)/g, 'rgba(27, 42, 74, 0.06)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.15\)/g, 'rgba(27, 42, 74, 0.08)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.2\b\)/g, 'rgba(27, 42, 74, 0.1)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.3\)/g, 'rgba(27, 42, 74, 0.15)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.08\)/g, 'rgba(27, 42, 74, 0.04)'],

  // Dark shadow adjustments
  [/rgba\(0,\s*0,\s*0,\s*0\.3\)/g, 'rgba(0, 0, 0, 0.06)'],
  [/rgba\(0,\s*0,\s*0,\s*0\.4\)/g, 'rgba(0, 0, 0, 0.08)'],
  [/rgba\(0,\s*0,\s*0,\s*0\.5\)/g, 'rgba(0, 0, 0, 0.1)'],

  // Status colors (brighter versions → muted for light bg)
  [/#f87171/g, '#DC2626'],
  [/#fbbf24/g, '#D97706'],
  [/#4ade80/g, '#16A34A'],
  [/#60a5fa/g, '#2563EB'],

  // Green variants
  [/#22[Cc]55[Ee]/g, '#16A34A'],

  // Bottom nav / header specific dark backgrounds
  [/background:\s*linear-gradient\([^)]*#0a1628[^)]*\)/g, 'background: #FFFFFF'],
]

const cssFiles = findCssFiles(SRC)
let totalChanges = 0

cssFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf-8')
  const original = content
  
  RULES.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement)
  })

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8')
    const rel = path.relative(SRC, file)
    console.log(`✅ ${rel}`)
    totalChanges++
  }
})

console.log(`\nDone: ${totalChanges} files updated out of ${cssFiles.length} CSS files.`)
