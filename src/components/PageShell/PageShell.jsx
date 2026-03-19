import './PageShell.css'

/**
 * PageShell — Layout wrapper that combines header + scrollable content + bottom nav.
 *
 * @param {'app'|'sub'} [props.headerType] — Which header to use externally
 * @param {React.ReactNode} [props.header]   — Pass AppHeader or SubPageHeader
 * @param {React.ReactNode} [props.bottomNav] — Pass BottomNav
 * @param {React.ReactNode} [props.stickyFooter] — Optional sticky CTA bar above bottom nav
 * @param {string}  [props.className]
 * @param {React.ReactNode} props.children — Main content
 */
export default function PageShell({
  header,
  bottomNav,
  stickyFooter,
  className = '',
  children,
  ...rest
}) {
  return (
    <div className={`page-shell page-transition ${className}`} {...rest}>
      {header}
      <main className="page-shell__content">
        {children}
      </main>
      {stickyFooter && (
        <div className="page-shell__sticky-footer">
          {stickyFooter}
        </div>
      )}
      {bottomNav}
    </div>
  )
}
