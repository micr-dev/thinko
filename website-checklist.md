- [x] Replace favicon assets with the provided `thinko` branding package
- [x] Replace remaining `WinXP` branding in page title, manifest, and meta tags with `thinko`

## Basics
- [x] Favicon (`favicon.ico`, `apple-touch-icon`, `mask-icon`)
- [x] Web app manifest (`manifest.json`)
- [x] Theme color meta tag
- [x] robots.txt
- [x] sitemap.xml
- [x] .well-known/security.txt

## Performance
- [ ] Loading skeletons or spinners
- [ ] Lazy loading for images/iframes
- [ ] Code splitting
- [x] Minified CSS/JS
- [ ] Gzip/Brotli compression
- [ ] CDN for static assets
- [x] Cache headers (`Cache-Control`, `ETag`)
- [ ] Preload critical resources
- [ ] DNS prefetch/preconnect
- [ ] Image optimization (`WebP`, `srcset`)
- [ ] Font loading strategy
- [ ] Critical CSS inlined

## SEO
- [x] Unique title tags per page
- [x] Meta description
- [x] Canonical URLs
- [x] Open Graph tags
- [x] Twitter Card tags
- [ ] Structured data (JSON-LD)
- [ ] Semantic HTML (`header`, `nav`, `main`, `footer`)
- [ ] Alt text for images

## Accessibility
- [ ] ARIA labels and roles (only where needed)
- [ ] Keyboard navigation support
- [ ] Visible focus indicators
- [ ] Color contrast (WCAG AA+)
- [ ] Screen reader testing
- [ ] Skip links
- [ ] Associated form labels
- [ ] ARIA-live for dynamic errors

## Security
- [ ] HTTPS enforced
- [x] HSTS header
- [ ] Content Security Policy
- [x] X-Frame-Options / `frame-ancestors`
- [x] X-Content-Type-Options
- [x] Referrer-Policy
- [x] Permissions-Policy
- [x] Secure cookies (`HttpOnly`, `SameSite`)
- [ ] CSRF tokens
- [x] Rate limiting
- [x] Input validation/sanitization
- [x] Moderation flow for user-submitted drawings

## UI/UX
- [ ] Responsive design
- [ ] Touch targets >= 44x44 px
- [ ] Loading states
- [ ] Custom 404/500 pages
- [ ] Consistent navigation

## Legal & Privacy
- [x] Privacy policy
- [x] Terms of service
- [ ] GDPR/CCPA compliance
- [x] Data deletion process
- [x] Contact information
- [x] Copyright notice

## Development & Deployment
- [x] Environment variables documented
- [x] CI/CD pipeline
- [ ] Automated tests (unit, e2e)
- [x] Linting (ESLint, Prettier)
- [x] Build pipeline
- [x] Source maps (development)
- [ ] Uptime monitoring
- [ ] Backup strategy
- [ ] Rollback plan
