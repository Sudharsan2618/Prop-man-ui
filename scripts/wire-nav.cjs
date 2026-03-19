/**
 * Batch-update script: replaces local handleTabChange in all 13 remaining screens
 * with the centralized useNavigation hook.
 */
const fs = require('fs')
const path = require('path')

const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages')

// Files that still have `const handleTabChange` (13 files)
const FILES = [
  'tenant/ServiceMarketplace.jsx',
  'provider/PayoutLedger.jsx',
  'provider/MyServiceJobs.jsx',
  'owner/PortfolioHub.jsx',
  'owner/MaintenanceLog.jsx',
  'inspection/InspectionHub.jsx',
  'common/UserProfile.jsx',
  'common/NotificationPreferences.jsx',
  'common/NotificationCenter.jsx',
  'common/MessagingInbox.jsx',
  'common/DisputeResolution.jsx',
  'admin/AdminUserMgmt.jsx',
  'admin/AdminFinancial.jsx',
]

let updated = 0

FILES.forEach((rel) => {
  const filePath = path.join(PAGES_DIR, rel)
  let code = fs.readFileSync(filePath, 'utf-8')

  // 1. Add useNavigation import if not present
  if (!code.includes('useNavigation')) {
    // Add after the last existing import line that contains 'from'
    const importHook = "import { useNavigation } from '../../hooks/useNavigation'"
    
    // Insert after the useRole import, or after react-router-dom import
    if (code.includes("from '../../context/RoleContext'")) {
      code = code.replace(
        /import\s*\{[^}]*\}\s*from\s*'\.\.\/\.\.\/context\/RoleContext'/,
        (match) => `${match}\n${importHook}`
      )
    } else if (code.includes("from 'react-router-dom'")) {
      code = code.replace(
        /import\s*\{[^}]*\}\s*from\s*'react-router-dom'/,
        (match) => `${match}\n${importHook}`
      )
    }
  }

  // 2. Add `const { handleTabChange: navTabChange } = useNavigation()` after useNavigate/useRole hooks
  if (!code.includes('navTabChange') && !code.includes("useNavigation()")) {
    // Find a good spot — after const navigate = useNavigate() or const { role } = useRole()
    if (code.includes('const navigate = useNavigate()')) {
      code = code.replace(
        'const navigate = useNavigate()',
        "const navigate = useNavigate()\n  const { handleTabChange: _navTabChange } = useNavigation()"
      )
    }
  }

  // 3. Replace the local handleTabChange function body
  // Pattern: const handleTabChange = (tab) => { setActiveTab(tab); const routes = {...}; if (routes[tab]) navigate(routes[tab]) }
  code = code.replace(
    /const handleTabChange = \(tab\) => \{\s*\n\s*setActiveTab\(tab\)\s*\n\s*const routes = \{[^}]+\}\s*\n\s*if \(routes\[tab\]\) navigate\(routes\[tab\]\)\s*\n\s*\}/,
    "const handleTabChange = (tab) => {\n    setActiveTab(tab)\n    _navTabChange(tab)\n  }"
  )

  fs.writeFileSync(filePath, code, 'utf-8')
  updated++
  console.log(`✅ ${rel}`)
})

console.log(`\nDone: ${updated} files updated.`)
