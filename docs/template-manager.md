# Template Manager Documentation

The Notification & Template Manager lets administrators edit transactional communications (Welcome emails, password resets, verification responses, payment success/failure receipts) with dynamic variable injection.

## Administrative Route
Access the Template Manager at:
`/admin/cms/templates` (requires Admin privileges).

## Core Capabilities
- **Multi-channel Config**: Support templates for `EMAIL`, `SMS` (Text message), and `PUSH` notifications.
- **Preset Library**: Select from predefined system hooks (Welcome, Verify Email, Password Reset, Interest Received/Accepted, Verification Approved/Rejected, Payment Receipt).
- **Handlebars Engine**: Custom messages parsing variables enclosed in `{{variableName}}`.
- **Live Render Engine**: Real-time evaluation of template contents. The interface scans for all `{{}}` structures and displays corresponding input fields. As the admin writes sample values, the live preview renders the substituted result instantly.
