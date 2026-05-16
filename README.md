# IRS KENYA
Simple. Mindful. Smart.

## Core
- **Next.js 15** | **Tailwind CSS** | **Firebase**
- **Public Search**: Instant ID discovery by number.
- **ID Watchlist**: Automated match notifications via Brevo.
- **Secure Reports**: Finder verification with OCR support.

## Security (Firestore)
- Users: `match /users/{id} { allow read, write: if auth.uid == id }`
- IDs: `match /found_ids/{id} { allow read; allow write: if auth }`
- Watchlist: `match /id_watch_list/{id} { allow read, write: if auth.uid == userId }`

## Config
- Environment variables managed in `.env.local`
- Deployment automated via Vercel and GitHub.
