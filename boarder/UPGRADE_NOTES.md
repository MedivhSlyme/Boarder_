# Boarder App — Upgrade Notes

## What Changed

### 1. Fixed Map Markers (Web + Mobile)
**File:** `components/LeafletMap.tsx`

- Fixed cross-platform communication: web iframe now uses `window.parent.postMessage` instead of `window.ReactNativeWebView.postMessage` (which doesn't exist on web)
- Parent-to-iframe updates now use `iframe.contentWindow.postMessage` on web (instead of `injectJavaScript` which only works for native WebView)
- Added proper `onLoad` handler to send initial data once the iframe is ready
- Improved marker HTML: avatar images load correctly with `onerror` fallback to initials
- Added tooltip on hover for player names
- Added smooth CSS transitions on markers
- Board game spot markers are now displayed with category-specific emoji icons
- Spot markers open a popup with details

### 2. Admin Role System
**Files:** `context/AuthContext.tsx`, `context/FriendsContext.tsx`, `app/(tabs)/admin.tsx`, `app/(tabs)/_layout.tsx`

- Admin status is read from the `isAdmin: boolean` field on the Firestore user document
- `isAdmin` is exposed via `useAuth()` hook
- Admin tab appears in navigation only when `isAdmin === true`
- Admin panel has two sections:
  - **Users**: Browse/search all users, view their profiles, delete accounts (with confirmation)
  - **Spots**: View/add/delete board game spots on the map
- Deleting a user removes: Firestore user doc, friend requests, blocked user records, messages, notifications

### 3. Friend Request System
**Files:** `context/FriendsContext.tsx`, `app/(tabs)/friends.tsx`, `app/user/[id].tsx`

- Replaced direct `addFriend` with a request-based system using a new `friendRequests` collection
- Friendship states: `none → sent (pending) → accepted / denied`
- Friends tab now has two sub-tabs: **Friends** and **Requests**
- Requests tab shows incoming requests (accept/deny buttons) and sent requests
- Notification badge on Friends tab shows pending request count
- User profile page shows contextual buttons:
  - Not connected → "ADD FRIEND" button
  - Request sent → "REQUEST SENT" (disabled)
  - Request received → "ACCEPT" and "DECLINE" buttons
  - Friends → "FRIENDS ✓" (tap to unfriend)

### 4. Unfriend + Block System
**Files:** `context/FriendsContext.tsx`, `app/user/[id].tsx`, `app/chat/[id].tsx`

- Unfriend: removes the accepted friend request document; confirmation dialog shown
- Block: creates a `blockedUsers` document, removes friendship and pending requests, hides user from map
- Unblock: deletes the blockedUsers document
- Blocked users cannot be messaged or send/receive friend requests
- Chat screen shows a locked banner for non-friends or blocked users

### 5. New Firestore Collections

| Collection | Purpose | Access |
|---|---|---|
| `friendRequests` | Friend request lifecycle | Involved users read/write |
| `blockedUsers` | Block relationships | Blocker reads/writes |
| `notifications` | Friend request notifications | Recipient reads |
| `boardGameSpots` | Public board game venues | All users read; admin write |

**File:** `firestore.rules` — Full security rules for all collections.

### 6. UI/UX Improvements
- `ConfirmDialog` component: reusable confirmation modal for destructive actions
- `Toast` component: animated in-app notifications (success/error/info)
- Loading states on all async actions
- Blocked user banner in chat and profile screens
- Friends-only chat enforcement with clear messaging
- Admin badge labels on admin user rows
- Online/offline status dots
- Empty states throughout

## New Files
- `components/ConfirmDialog.tsx`
- `components/Toast.tsx`
- `app/(tabs)/admin.tsx`
- `firestore.rules`

## Modified Files
- `models/types.ts` — Added FriendRequest, BlockedUser, BoardGameSpot, BoardGameSpotCategory types
- `context/AuthContext.tsx` — Added `isAdmin` field
- `context/FriendsContext.tsx` — Complete rewrite: request-based friend system, block system, board game spots
- `components/LeafletMap.tsx` — Fixed web communication, added spots support
- `app/(tabs)/_layout.tsx` — Admin tab (hidden for non-admins), request badge
- `app/(tabs)/index.tsx` — Board game spots passed to map, spot detail modal
- `app/(tabs)/friends.tsx` — Two-tab layout: Friends / Requests
- `app/(tabs)/admin.tsx` — New: admin panel (user management + spots)
- `app/user/[id].tsx` — Friend request flow, block/unblock, unfriend
- `app/chat/[id].tsx` — Friends-only enforcement

## Environment Variables
No new environment variables. Existing `.env` Firebase config is unchanged:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Firebase Setup Required

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Create Firestore Indexes
The `friendRequests` collection needs composite indexes. Firebase will prompt you with direct links when you first run a query. Add these indexes:
- `friendRequests`: `fromId ASC, status ASC`
- `friendRequests`: `toId ASC, status ASC`

### 3. Grant Admin Access
To make a user an admin, manually set `isAdmin: true` on their Firestore user document in the Firebase Console:
1. Open Firebase Console → Firestore → `users` collection
2. Find the user document
3. Add field: `isAdmin` (boolean) = `true`

There is intentionally NO admin signup flow. Admin status is granted manually by a database administrator.

## Migration Notes for Existing Users

Existing `friends: string[]` arrays on user documents are no longer used as the source of truth. To migrate existing friendships to the new request-based system:

1. For each user with a `friends` array, create accepted `friendRequest` documents in Firestore
2. Or simply let users re-connect — the old friends array does no harm and can be cleaned up over time

## Running the Project
```bash
npm install
npx expo start
# or for web:
npx expo start --web
```
