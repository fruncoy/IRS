# IRS – ID Recovery System

A secure bridge between finders and owners of lost ID cards. Built with Next.js 15, Tailwind CSS, and Firebase.

## 🚀 Overview
IRS is a digital recovery platform designed to reconnect people with their lost national ID cards. It provides a searchable database where finders can report found documents and owners can safely claim them after verification.

## 🛠️ Core Features
- **Public Search**: Search for lost IDs using only an ID number (no login required).
- **ID Watchlist**: Set alerts to get notified automatically via email when your ID is found.
- **Secure Reporting**: Finders can report found IDs with OCR (Image Scan) support.
- **Automated Notifications**: Real-time email alerts powered by Brevo for matches, claims, and welcomes.

## 🔒 Security Rules (STABLE)
The following Firestore rules are required for the system to function correctly. **Do not modify these unless a specific new feature requires it.**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Users: Private access only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // 2. Found IDs: Public Search, Secure Reporting
    match /found_ids/{id} {
      allow read: if true; 
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }
    // 3. Watchlist: Private owner access only
    match /id_watch_list/{watchId} {
      allow get: if request.auth != null; 
      allow list, create, update, delete: if request.auth != null && (
        (resource == null && request.resource.data.userId == request.auth.uid) || 
        (resource != null && resource.data.userId == request.auth.uid)
      );
    }
  }
}
```

## 🔮 Future Roadmap
- **OCR Integration**: Automatic data extraction from uploaded ID photos.
- **Enhanced Privacy**: Encrypted messaging between finders and owners.
- **Mobile App**: Native Android/iOS version for faster reporting.
