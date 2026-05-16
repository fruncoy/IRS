# IRS – ID Recovery System

A modern, secure, full-stack web application built with Next.js 15, TypeScript, Tailwind CSS, and Firebase. It helps people recover lost national ID cards safely and quickly by connecting finders with owners.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Firebase](https://firebase.google.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## ✨ Key Features

- **Public ID Search**: Search the database using ID Number and Date of Birth without signing in.
- **Secure Authentication**: Firebase Email/Password and Google Authentication.
- **Privacy-First Design**: Finder contact details are hidden until the owner verifies their identity.
- **Premium Dashboard**: Manage reported IDs, track claims, and update statuses.
- **Mobile Responsive**: Apple-inspired minimalist UI that works beautifully on all devices.

## 🛠️ Firebase Setup Instructions

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project called `IRS`.
3.  Enable **Authentication** and activate **Email/Password** and **Google** providers.
4.  Enable **Cloud Firestore** and create a database in production mode (or test mode for local dev).
5.  In Firestore, create the following collections:
    - `users`: Stores user profiles.
    - `found_ids`: Stores details of found ID cards.
    - `claims`: Stores records of ownership claims.
6.  Go to **Project Settings** > **General** > **Your apps** and add a Web App.
7.  Copy the Firebase configuration object and paste the values into your `.env.local` file.

## 📝 Environment Variables

Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
