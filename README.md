# COMSATS Lost & Found System

A comprehensive platform for reporting and finding lost items within COMSATS University, featuring a fully native Android experience built with React and Capacitor.

## Features

* 🔐 **University Authentication**: Secure university email-based authentication via Supabase.
* 📱 **Native Android Support**: Optimized for Android 15 (API 35) with custom adaptive icons and splash screens.
* 📸 **Image Upload**: Integrated image capture and cloud storage for lost/found items.
* 🔍 **Smart Search**: Advanced search and matching algorithm to pair lost reports with found items.
* 💬 **Messaging**: In-app messaging system for secure coordination between users.
* 📱 **PWA & Hybrid**: Full support for Progressive Web App and Native Mobile installation.
* 👮 **Admin Dashboard**: Specialized moderation tools for campus security and administrators.

## Tech Stack

* **Frontend**: React 18 with TypeScript
* **Mobile Bridge**: Capacitor 7 (Targeting Android 15)
* **UI Library**: Material-UI
* **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
* **Routing**: React Router v6
* **Forms**: React Hook Form with Zod validation
* **Notifications**: React Hot Toast
* **Build Toolchain**: Java 21 (LTS), Gradle 8.9, AGP 8.6.1

## Getting Started

### Prerequisites

* **Node.js**: v18 or higher (LTS)
* **Java Development Kit (JDK)**: Version 21 (Required for modern Android 15 toolchain)
* **Android Studio**: Ladybug (2024.2.1) or newer
* **Supabase Account**: An active project with Auth and Storage enabled

### Installation

1. **Clone the repository**:

git clone https://github.com/your-username/comsats-lostfound.git
cd comsats-lostfound



2. **Install dependencies**:

npm install



3. **Sync Native Resources**:

npx cap sync android




## Building the Mobile App

To generate a fresh APK with custom branding (icons and splash screens):

1. **Navigate to the android directory**:

cd android



2. **Execute Build**:

./gradlew clean assembleDebug



3. **Locate your APK**:
The generated file will be available at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 Mobile Configuration

The project is pre-configured to handle modern Android 15 requirements:

* **Adaptive Icons**: Located in `res/mipmap-anydpi-v26/`.
* **Splash Screen**: Uses the Android 12+ SplashScreen API.
* **Java Toolchain**: Enforced Java 21 consistency across all subprojects.


