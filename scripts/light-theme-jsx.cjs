/**
 * Light Theme JSX Migration Script
 * Replaces inline teal (#13C8EC) references in JSX files with proper theme colors.
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src')

function findJsxFiles(dir) {
  let results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results = results.concat(findJsxFiles(full))
    else if (entry.name.endsWith('.jsx')) results.push(full)
  }
  return results
}

const RULES = [
  // Teal inline colors → keep as var references or gold/navy
  [/color:\s*['"]#13[Cc]8[Ee][Cc]['"]/g, "color: 'var(--accent)'"],
  [/color:\s*'#13[Cc]8[Ee][Cc]'/g, "color: '#D4A843'"],
  [/color:\s*"#13[Cc]8[Ee][Cc]"/g, 'color: "#D4A843"'],
  [/background:\s*'#13[Cc]8[Ee][Cc]'/g, "background: 'var(--primary)'"],
  
  // Teal rgba → gold or navy subtle
  [/rgba\(19,\s*200,\s*236,\s*0\.1\b\)/g, 'rgba(212, 168, 67, 0.1)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.15\)/g, 'rgba(212, 168, 67, 0.12)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.2\b\)/g, 'rgba(212, 168, 67, 0.15)'],
  [/rgba\(19,\s*200,\s*236,\s*0\.08\)/g, 'rgba(212, 168, 67, 0.08)'],
  
  // Green stays but muted for light
  [/color:\s*'#22[Cc]55[Ee]'/g, "color: '#16A34A'"],
  
  // White text references on dark bg
  [/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'rgba(27, 42, 74, 0.04)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, 'rgba(27, 42, 74, 0.04)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'rgba(27, 42, 74, 0.06)'],
  [/rgba\(255,\s*255,\s*255,\s*0\.1\b\)/g, 'rgba(27, 42, 74, 0.06)'],
]

const jsxFiles = findJsxFiles(SRC)
let totalChanges = 0

jsxFiles.forEach((file) => {
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

console.log(`\nDone: ${totalChanges} JSX files updated out of ${jsxFiles.length} total.`)
