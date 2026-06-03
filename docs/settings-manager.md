# Platform Settings Manager

The Settings Manager provides administrative control over system variables, support addresses, social profiles, and core feature toggle switches.

## Administrative Route
Access the Settings Manager at:
`/admin/settings` (requires Admin privileges).

## Organized Configuration Groups
1. **General**: Brand names, metadata taglines, and footer copyrights.
2. **Support**: Corporate phone, helpdesk email, and physical mail addresses.
3. **Social**: URL paths for Facebook, Instagram, LinkedIn, and YouTube.
4. **Platform**: Switches to disable registration, toggle maintenance mode, activate community directory filters, or toggle billing plan upgrades.
5. **Homepage**: Snippet counters for homepage trust stats.

## Compliance
- **Instant Boolean Toggles**: Feature flags toggle immediately for quick system shutdowns if needed.
- **Audit Logs**: All setting changes log to the MongoDB `auditlog` collection for security review.
