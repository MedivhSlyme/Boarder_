# Boarder

  Find nearby board game players on a live map. Firebase Auth + Firestore + Storage backend, built with Expo/React Native.

  ## Features

  - **Map** — see active nearby players on a dark Leaflet map; tap any avatar or marker to view their profile
  - **Profile** — bio, availability, profile picture, games list with skill level and favourites
  - **Edit Profile** — update username, bio, availability; upload a profile photo from your device (stored in Firebase Storage)
  - **Friends** — add players from the map or their profile page; view your friend list
  - **Chat** — direct messaging between any two players

  // next features: 
  add friend suggestions using a mini Machine Learning model
  low priority : score between users that got an encounter( win-loss)

  ## Firebase Setup (Required)

  1. Create a project at https://console.firebase.google.com
  2. **Authentication** → Sign-in method → Enable **Email/Password**
  3. **Firestore Database** → Create database → Start in test mode (or add rules below)
  4. **Storage** → Get started → use default bucket
  5. Copy your web config values (Project settings → Your apps → Web app)

  ### Firestore Security Rules

  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      match /messages/{messageId} {
        allow read: if request.auth != null &&
          (resource.data.senderId == request.auth.uid ||
           resource.data.receiverId == request.auth.uid);
        allow create: if request.auth != null &&
          request.resource.data.senderId == request.auth.uid;
      }
    }
  }
  ```

  ### Storage Rules

  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /avatars/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

  ## Installation

  ```bash
  npm install
  ```

  ## Running

  Set Firebase credentials as environment variables, then:

  ```bash
  # Start Expo (scan QR with Expo Go app)
  npm start

  # Web browser only
  npm run web

  # Android emulator
  npm run android

  # iOS simulator (macOS only)
  npm run ios
  ```

  ### Environment Variables

  Create a `.env` file in the project root:

  ```
  FIREBASE_API_KEY=your_api_key
  FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  FIREBASE_PROJECT_ID=your_project_id
  FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  FIREBASE_APP_ID=your_app_id
  ```

  The `start` script maps these to `EXPO_PUBLIC_FIREBASE_*` automatically.
  Alternatively you can set `EXPO_PUBLIC_FIREBASE_*` keys directly.

  ## Data Model

  ```ts
  type Skill = 'Beginner' | 'Amateur' | 'Intermediate' | 'Advanced' | 'Expert';

  interface User {
    username: string;
    email: string;
    games: { name: string; skill: Skill; favorite: boolean }[];
    location: { lat: number; lng: number };
    active: boolean;           // true while logged in
    last_seen_on: string;      // ISO date string
    profile_details: {
      bio: string;
      availability: string;
      profile_pic: string;     // Firebase Storage URL or empty string
    };
    friends: string[];         // array of user UIDs
  }
  ```

  ## Tech Stack

  - Expo SDK 54 / React Native 0.81
  - expo-router (file-based routing)
  - Firebase JS SDK v12 (Auth, Firestore, Storage)
  - Leaflet map via WebView (dark CartoDB tiles)
  - React Native Reanimated 4
  - Inter font family
  