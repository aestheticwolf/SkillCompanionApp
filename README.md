# SkillPath / Skill Companion App

SkillPath is a cross-platform learning companion built with Expo, React Native, Expo Router, TypeScript, Firebase Auth, and Firestore. The app helps learners create skill goals, break them into tasks, track completion, review analytics, manage reminders, and keep a learning streak.

The project runs on web, Android, and iOS from one codebase.

## Features

- Email/password authentication with Firebase Auth.
- User profile setup with display name and role.
- Goal creation with icons, progress rings, task lists, editing, and deletion.
- Task creation with completion state, due dates, inline editing, and deletion.
- Dashboard with overall progress, goal cards, pending tasks, sync/network status, reminders, streaks, and recommendations.
- Analytics page with task distribution, goal breakdown, progress bars, skill score, and insight text.
- Goals page with filters for all, in-progress, pending, and completed goals.
- Notifications center with task, streak, goal, and system categories.
- Profile page with account editing, password update flow, stats, and streak view.
- Settings page with dark mode, notification preferences, dashboard preferences, and account shortcuts.
- Responsive layouts for desktop web, tablet, and mobile.
- Native daily reminders through `expo-notifications`.
- Web notification support through the browser Notification API.
- Theme persistence through AsyncStorage/local storage.
- Toast feedback for success, error, delete, and coming-soon states.

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- Expo Router
- Firebase Auth
- Cloud Firestore
- AsyncStorage
- NetInfo
- Expo Notifications
- React Native Toast Message
- React Native SVG

## Requirements

- Node.js LTS and npm
- A Firebase project with Authentication and Firestore enabled
- Android Studio for Android emulator or local Android builds
- Xcode for iOS simulator or local iOS builds on macOS
- EAS CLI only if you plan to use cloud builds

## Environment Variables

Create a `.env` file in the project root. This file is ignored by git.

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

These are public Expo client variables, so do not place server secrets in them.

Firebase setup checklist:

- Enable Email/Password sign-in in Firebase Authentication.
- Create a Cloud Firestore database.
- Add Firestore rules that allow authenticated users to read/write their own `users/{uid}` document and `users/{uid}/goals/{goalId}` subcollection.
- Restart Expo after editing `.env`.

Example Firestore rules for per-user data access:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;

      match /goals/{goalId} {
        allow read, write: if request.auth != null
          && request.auth.uid == userId;
      }
    }
  }
}
```

## Install

```bash
npm install
```

## Run Locally

Start the Expo dev server:

```bash
npx expo start
```

You can also use the package script:

```bash
npm start
```

From the Expo terminal, press:

- `w` to open web
- `a` to open Android
- `i` to open iOS

Direct scripts are also available:

```bash
npm run web
npm run android
npm run ios
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo Dev Tools. |
| `npx expo start` | Start Expo directly. |
| `npm run web` | Start the web app. |
| `npm run android` | Build/run the Android app locally. |
| `npm run ios` | Build/run the iOS app locally. |
| `npm run lint` | Run Expo ESLint checks. |
| `npm run reset-project` | Move starter code to `app-example` and reset the app folder. Use with care. |

## App Routes

Main routes live in `app/` and are handled by Expo Router:

| Route | Purpose |
| --- | --- |
| `/` | Auth gate. Redirects signed-in users to `/dashboard`; web users see the landing page. |
| `/landing` | Public marketing/landing page for SkillPath. |
| `/login` | Firebase sign-in screen. |
| `/signup` | Account creation with optional role selection. |
| `/dashboard` | Primary learning dashboard. |
| `/goals` | Goal management and goal filtering. |
| `/analytics` | Learning analytics and progress insights. |
| `/notifications` | Notification center. |
| `/profile` | Profile, account details, password update, and stats. |
| `/settings` | Theme, notification, dashboard, and account preferences. |
| `/progress` | Simple progress summary screen. |

The `app/(tabs)` folder still contains Expo starter tab screens and is not the primary product navigation.

## Project Structure

```text
app/
  _layout.tsx          Global providers, stack navigation, toast, notification handler
  index.tsx            Auth-aware entry route
  landing.tsx          Web landing page
  login.tsx            Sign-in screen
  signup.tsx           Registration screen
  dashboard.tsx        Main dashboard experience
  goals.tsx            Goal list and detail workflows
  analytics.tsx        Analytics dashboard
  notifications.tsx    Notification center
  profile.tsx          Profile/account management
  settings.tsx         App settings

src/
  context/
    AuthContext.tsx    Firebase auth state and user document subscription
    TaskContext.tsx    Goal/task state and Firestore sync helpers
  services/
    firebase.ts        Firebase app, auth, and Firestore initialization
    firestoreTasks.ts  Goal CRUD and task persistence
    notifications.ts   Native and web notification helpers
    network.ts         Online/offline listener
    streak.ts          Streak update helper
    uiPreferences.ts   Theme persistence
    toast.ts           Toast helper API
    toastConfig.tsx    Custom toast UI
  components/          Shared UI components
  constants/           Theme constants

assets/                Icons, splash image, favicon, and app images
android/               Generated native Android project
```

## Data Model

The app stores authenticated user data under the `users` collection.

```text
users/{uid}
  displayName: string
  role: string
  streak: number
  lastCompletedDate: string
  activityLog: object
  settings: object

users/{uid}/goals/{goalId}
  name: string
  icon: string
  createdAt: number
  tasks: Task[]
```

Task shape used by `TaskContext`:

```ts
type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: number | null;
  createdAt?: number;
};
```

## Development Notes

- `app/_layout.tsx` wraps the app with `AuthProvider` and `TaskProvider`.
- The project uses the `@/*` TypeScript path alias for imports from the repo root.
- Goal/task writes are optimistic in local React state, then synced to Firestore.
- Theme preference is saved with AsyncStorage keys `DARK_MODE` and `theme`.
- Native reminders do not run on web; web uses browser notifications instead.
- Firestore goal data is loaded from `users/{uid}/goals`, ordered by `createdAt`.
- The web UI injects screen-specific CSS for animations and responsive styling.

## Build

Local native development builds:

```bash
npm run android
npm run ios
```

EAS profiles are configured in `eas.json`:

```bash
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

Use `--platform ios` for iOS builds when your Apple tooling and credentials are ready.

For a static web export:

```bash
npx expo export --platform web
```

## Troubleshooting

If Firebase auth or Firestore does not work:

- Confirm every `EXPO_PUBLIC_FIREBASE_*` value is present in `.env`.
- Restart Expo with `npx expo start --clear`.
- Confirm Email/Password auth is enabled in Firebase.
- Check Firestore security rules and indexes.
- Check browser devtools or the native Metro logs for Firebase errors.

If adding a goal appears to hang:

- Confirm the signed-in user has write access to `users/{uid}/goals`.
- Check network connectivity.
- Verify the Firebase project ID in `.env` matches the project where rules were configured.

If notifications do not appear:

- Native notifications require device/emulator permission.
- Browser notifications require permission from the browser.
- Web notification helpers intentionally do nothing when there are no pending tasks or streak updates.

If Android or iOS builds fail:

- Run `npm install` again.
- Clear Metro with `npx expo start --clear`.
- Confirm Android Studio or Xcode is installed and configured.
- Use EAS builds if local native toolchains are not available.

## Quality Checks

Run linting before shipping changes:

```bash
npm run lint
```

No automated unit or integration test suite is currently configured.

## Current App Identity

- App name: `SkillCompanionApp`
- Product brand in UI: `SkillPath`
- Expo scheme: `skillcompanionapp`
- Android package: `com.richard.skillcompanion`
- Version: `1.0.0`
