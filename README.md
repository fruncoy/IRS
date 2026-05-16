# IRS KENYA
Simple. Mindful. Smart.

## Core
- **Next.js 15** | **Tailwind CSS** | **Firebase**
- **Public Search**: Instant ID discovery by number.
- **ID Watchlist**: Automated match notifications via Brevo.
- **Secure Reports**: Finder verification with OCR support.

## Security (Firestore)
Security rules are managed in [firestore.rules](file:///c:/BBIT%204.2/IRS/firestore.rules).
- Users: Private owner access.
- IDs: Public search, secure reporting.
- Watchlist: Private owner access, system matching.

## Config
- Environment variables managed in `.env.local`
- Deployment automated via Vercel and GitHub.
