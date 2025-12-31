#COMSATS Lost & Found System
A comprehensive platform for reporting and finding lost items within COMSATS University, now featuring a fully native Android experience.

##Features
###🔐 University Authentication: Secure login via university email-based authentication.

###📱 Native Android Support: Optimized for Android 15 (API 35) with custom adaptive icons and splash screens.

###📸 Image Upload: Seamless image capture and upload for lost/found items using Supabase Storage.

###🔍 Advanced Search: Smart matching algorithm to filter items by category, location, and date.

###💬 Messaging: In-app communication system for coordinate item returns.

###📱 PWA & Hybrid: Support for both Progressive Web App and Native Android installation via Capacitor.

###👮 Admin Dashboard: Specialized moderation tools for campus security/admins.

##Tech Stack
###Frontend: React 18 with TypeScript

###Mobile Bridge: Capacitor 7 (Targeting Android 15)

###UI Library: Material-UI

###Backend: Supabase (Auth, PostgreSQL, Storage, Edge Functions)

###Java Runtime: Java 21 (LTS)

###Build System: Gradle 8.9 with AGP 8.6.1

###Forms: React Hook Form with Zod validation

###Notifications: React Hot Toast

##Getting Started
Prerequisites
Node.js: v18 or higher

JDK: Java 21 (Required for the Android build toolchain)

Android Studio: Ladybug or newer

Capacitor CLI: npm install -g @capacitor/cli

##Installation
Clone the repository:

git clone https://github.com/your-username/comsats-lostfound.git
cd comsats-lostfound
Install Web Dependencies:

npm install

##Initialize Android Project:

npx cap sync android
Building the App
To generate the latest Android APK with your custom branding:

Navigate to the android folder:


cd android
Run the clean build:

./gradlew clean assembleDebug
