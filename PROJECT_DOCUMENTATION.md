<div align="center">

# 🏠 يسطا (Yasta)
### منصة الخدمات المنزلية الذكية
**Smart Home Services Platform**

[![Live](https://img.shields.io/badge/🌐_Live-yasta.nbra.in-0ea5e9?style=for-the-badge)](https://yasta.nbra.in)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_API-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Cloudflare](https://img.shields.io/badge/CDN-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

**يسطا** هي أول منصة ذكية في مصر تربط العملاء بالفنيين المحترفين — سباكة، كهرباء، نجارة، تكييف، دهانات، أجهزة منزلية — مع ضمان الأمان والموثوقية من خلال التوثيق بالرقم القومي والتقييمات الحقيقية.

*Yasta is Egypt's first AI-powered platform connecting customers with verified professional technicians across plumbing, electrical, carpentry, HVAC, painting, and home appliances — ensuring safety and trust through National ID verification and authentic reviews.*

</div>

---

## 📑 Table of Contents

| # | Section | Description |
|---|---------|-------------|
| 1 | [Project Overview](#1--project-overview) | General information & objectives |
| 2 | [Technology Stack](#2--technology-stack) | Frontend, backend, AI & infrastructure |
| 3 | [Features (23 Features)](#3--features-23-features) | Complete feature breakdown by phase |
| 4 | [User Roles & Flows](#4--user-roles--flows) | Customer, Technician & Admin journeys |
| 5 | [Database Schema](#5--database-schema-firestore) | Firestore collections & document structure |
| 6 | [Security Architecture](#6--security-architecture) | Authentication, authorization & data protection |
| 7 | [AI Integration Details](#7--ai-integration-details) | Gemini API configuration & capabilities |
| 8 | [Project Structure](#8--project-structure) | File tree & module organization |
| 9 | [Deployment & Infrastructure](#9--deployment--infrastructure) | Hosting, DNS, CI/CD pipeline |
| 10 | [Screenshots & Demo](#10--screenshots--demo) | Visual demonstration reference |
| 11 | [Future Roadmap](#11--future-roadmap) | Planned features & expansion |
| 12 | [Team](#12--team) | Team members & roles |

---

## 1. 📋 Project Overview

| Field | Details |
|-------|---------|
| **Project Name** | يسطا (Yasta) |
| **Live URL** | [https://yasta.nbra.in](https://yasta.nbra.in) |
| **Firebase URL** | [https://nbrain-yasta.web.app](https://nbrain-yasta.web.app) |
| **Type** | Web Application (Progressive Web App) |
| **Category** | Home Services Marketplace / Gig Economy Platform |
| **Target Market** | Egypt 🇪🇬 (Arabic — RTL Interface) |
| **Language** | Arabic (Primary), English (Technical) |
| **Architecture** | Serverless (BaaS — Backend as a Service) |
| **Version** | 1.0.0 |

### 🎯 Problem Statement

In Egypt, finding a reliable home service technician is challenging. Customers face:
- **No trust or verification** — Hiring unknown individuals into homes
- **No price transparency** — Inconsistent and unpredictable pricing
- **No quality guarantee** — No recourse for poor service
- **No digital tracking** — Manual coordination via phone calls

### 💡 Solution

**Yasta** solves these problems through:
- ✅ **National ID Verification** — Every technician is verified via AI-powered OCR
- ✅ **AI-Powered Diagnosis** — Upload a photo, get instant issue diagnosis & cost estimate
- ✅ **Transparent Pricing** — Fixed packages + bidding system for competitive rates
- ✅ **30-Day Warranty** — Automatic warranty on every completed service
- ✅ **Real-Time Tracking** — GPS tracking from acceptance to completion
- ✅ **Secure Payments** — Cash, InstaPay, and Wallet options

---

## 2. 🛠 Technology Stack

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  HTML5   │  │  CSS3 /  │  │   JS     │  │  Tailwind CSS │   │
│  │  Pages   │  │  RTL     │  │  ES6+    │  │  Framework    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘   │
│       └──────────────┼────────────┼─────────────────┘           │
│                      ▼            ▼                              │
│              Firebase SDK (v10.x Modular)                       │
└──────────────────────┬────────────┬─────────────────────────────┘
                       │            │
            ┌──────────▼──────────┐ │
            │   Cloudflare CDN    │ │
            │   DNS + SSL + WAF   │ │
            └──────────┬──────────┘ │
                       │            │
┌──────────────────────▼────────────▼─────────────────────────────┐
│                     FIREBASE (Google Cloud)                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │   Auth     │ │ Firestore  │ │  Storage   │ │   Hosting   │  │
│  │ Email/Pass │ │  NoSQL DB  │ │ File Store │ │  Static     │  │
│  │ Google SSO │ │ Real-time  │ │ Images     │ │  Hosting    │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │
│  ┌────────────┐                                                 │
│  │    FCM     │    Cloud Messaging (Push Notifications)         │
│  └────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Google Gemini AI   │
                    │  ┌───────────────┐  │
                    │  │ 3.5 Flash     │  │  ← AI Diagnosis + OCR
                    │  │ 2.5 Flash     │  │  ← Chatbot Assistant
                    │  └───────────────┘  │
                    └─────────────────────┘
```

### Detailed Stack Breakdown

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Markup** | HTML5 | Semantic page structure |
| **Styling** | CSS3 + Tailwind CSS | Responsive RTL design, dark mode |
| **Logic** | JavaScript (ES6+ Modules) | Client-side application logic |
| **Authentication** | Firebase Auth | Email/Password + Google OAuth 2.0 |
| **Database** | Cloud Firestore | NoSQL real-time document database |
| **File Storage** | Firebase Storage | Image uploads (ID cards, issue photos, chat images, receipts) |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Real-time alerts to technicians & customers |
| **Hosting** | Firebase Hosting | Static site hosting with SSL |
| **AI — Diagnosis** | Google Gemini 3.5 Flash | Image analysis, issue diagnosis, cost estimation |
| **AI — OCR** | Google Gemini 3.5 Flash (Vision) | National ID card data extraction |
| **AI — Chatbot** | Google Gemini 2.5 Flash | Conversational assistant for troubleshooting |
| **DNS / CDN** | Cloudflare | DNS management, SSL, caching, DDoS protection |
| **Charts** | Chart.js | Admin & Technician dashboard analytics |
| **Icons** | Lucide Icons | Consistent iconography |
| **Maps** | Leaflet.js + OpenStreetMap | Live technician tracking |

---

## 3. ✨ Features (23 Features)

### Phase 1 — Quick Wins 🚀

| # | Feature | Description |
|---|---------|-------------|
| 1 | **🤖 AI Diagnosis (Gemini 3.5 Flash)** | Users upload photos of broken items → AI analyzes the image → Diagnoses the issue → Estimates repair cost → Recommends the correct technician specialty. Supports text-only and image+text diagnosis modes. |
| 2 | **🔗 Referral System** | Unique referral codes for each user. Referrer receives **20 EGP** wallet bonus. Referred user gets **15% discount** on first order. Tracked via Firestore with fraud prevention. |
| 3 | **🔒 Firestore Security Rules** | Comprehensive role-based access control. Customers can only read/write their own data. Technicians can only access assigned requests. Admins have full management access. All rules enforce authentication. |
| 4 | **🛡️ 30-Day Warranty** | Every completed service automatically activates a 30-day warranty. Warranty status tracked in Firestore. Customers can file warranty claims within the warranty period. |
| 5 | **💰 Inspection Fee + Minimum Charge** | **30 EGP** mandatory inspection fee on every visit. **50 EGP** minimum service charge ensures fair technician compensation. Transparently displayed before service confirmation. |

### Phase 2 — Core Features ⚙️

| # | Feature | Description |
|---|---------|-------------|
| 6 | **💬 In-App Real-Time Chat** | Full messaging system between customer and technician. Supports text messages and image attachments. Real-time updates via Firestore `onSnapshot`. Chat history persisted per request. |
| 7 | **📦 Fixed-Price Packages** | 8 pre-defined service packages with transparent set prices. Customers can browse and select packages directly. No negotiation required — instant booking. |
| 8 | **⭐ Bidding System** | Open marketplace model. Customer posts a service request → Multiple technicians submit bids → Customer reviews bids with ratings & prices → Selects the best offer. |

### Phase 3 — UI/UX Upgrades 🎨

| # | Feature | Description |
|---|---------|-------------|
| 9 | **👥 3-State Technician Selection** | Animated **Radar Scanner** → Searches for nearby technicians → **Technician List** with profiles, ratings & distance → **Confirmation Screen** with selected technician details. |
| 10 | **📊 Enterprise Admin Dashboard** | Full analytics dashboard with **Chart.js** graphs. Glass-morphism UI design. Real-time stats: total users, active requests, revenue, technician status. Category management & package CRUD. |
| 11 | **🛠️ Technician PRO Dashboard** | Professional sidebar navigation. Weekly earnings chart. Live job statistics (pending, active, completed). Wallet balance & withdrawal requests. Rating & review aggregation. |
| 12 | **🔍 Premium Verification Page** | Admin verification center with tabbed interface (Pending / Verified / Rejected). AI-powered OCR auto-fill from ID images. Search & filter functionality. Bulk verification actions. |
| 13 | **🧭 Smart Bottom Navigation** | Role-aware navigation bar. Dynamically shows relevant tabs based on user role (customer/technician). Active tab highlighting with smooth transitions. Mobile-optimized with haptic-style feedback. |
| 14 | **🏠 Auth-Aware Landing Page** | Dynamic header adapts to authentication state. Logged-out: Shows login/register CTA. Logged-in Customer: Shows "Go to Dashboard". Logged-in Technician: Shows "My Dashboard". Role-based routing. |

### Phase 4 — Revenue & Intelligence 💎

| # | Feature | Description |
|---|---------|-------------|
| 15 | **🔔 Push Notifications (FCM)** | Firebase Cloud Messaging integration. Technicians receive instant alerts for new requests in their area. Customers notified when technician accepts/arrives. Background notification support via Service Worker. |
| 16 | **📸 OCR Auto-Verify (Gemini Vision)** | AI reads uploaded National ID card images. Extracts: Full Name (Arabic), National ID Number, Date of Birth, Address, Gender. Auto-populates verification form. Admin reviews AI-extracted data before approval. |
| 17 | **💳 Multi-Payment Gateway** | **Cash** — Pay on delivery. **InstaPay** — Bank transfer with receipt upload & verification. **Wallet** — In-app wallet with balance from referrals and refunds. |

### Bonus Features 🎁

| # | Feature | Description |
|---|---------|-------------|
| 18 | **🤖 AI Chatbot (Gemini 2.5 Flash)** | Full conversational AI assistant. Users describe their issue in natural language → AI diagnoses the problem → Suggests solutions → Recommends when to call a professional. Session memory for contextual follow-ups. |
| 19 | **📞 Contact Us** | Contact form with validation. Interactive FAQ accordion with common questions. Direct support channel. |
| 20 | **ℹ️ About Us** | Company story, mission, vision. Team showcase. Platform statistics and achievements. |
| 21 | **📜 Terms of Service** | Complete legal terms in Arabic. Service agreement, user obligations, platform liability. |
| 22 | **🔒 Privacy Policy** | Data protection policy. GDPR-style compliance. Information on data collection, storage, and usage. |
| 23 | **💸 Refund Policy** | Warranty conditions and refund eligibility. Claims process. Refund timelines and methods. |

---

## 4. 👥 User Roles & Flows

### System Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| **Customer** (عميل) | Standard | Can request services, chat, rate, pay |
| **Technician** (فني) | Verified | Can receive requests, bid, complete jobs, earn |
| **Admin** (مدير) | Full | Can manage users, verify technicians, view analytics |

---

### 🟢 Customer Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Register   │────▶│    Login     │────▶│   Dashboard      │
│  Email/Google│     │              │     │  (Active Orders)  │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                    │
                          ┌─────────────────────────▼──────────────────┐
                          │        Select Service Category             │
                          │  سباكة | كهرباء | نجارة | تكييف | دهانات  │
                          └─────────────────────────┬──────────────────┘
                                                    │
                     ┌──────────────────────────────▼──────────────────┐
                     │          Describe Issue (Text / Photo)          │
                     │   ┌─────────────┐    ┌──────────────────────┐   │
                     │   │  Text Only  │ OR │  📸 Upload Photo     │   │
                     │   └─────────────┘    └──────────────────────┘   │
                     └──────────────────────────────┬──────────────────┘
                                                    │
                              ┌─────────────────────▼─────────────┐
                              │     🤖 AI Diagnosis (Gemini)      │
                              │  • Issue identified               │
                              │  • Estimated cost: 150-300 EGP    │
                              │  • Recommended: Electrician       │
                              └─────────────────────┬─────────────┘
                                                    │
                                  ┌─────────────────▼───────────────┐
                                  │      Submit Service Request     │
                                  └─────────────────┬───────────────┘
                                                    │
                          ┌─────────────────────────▼──────────────┐
                          │       📡 Radar — Finding Technician    │
                          │    Scanning for nearest available...   │
                          └─────────────────────────┬──────────────┘
                                                    │
                              ┌─────────────────────▼──────────────┐
                              │   Technician List (Accept/Reject)  │
                              │   ⭐ Ahmed — 4.8 — 2.3 km away    │
                              │   ⭐ Mohamed — 4.5 — 3.1 km away  │
                              └─────────────────────┬──────────────┘
                                                    │
                              ┌─────────────────────▼──────────────┐
                              │     📍 Track Technician (GPS)      │
                              │     Live map with ETA              │
                              └─────────────────────┬──────────────┘
                                                    │
                         ┌──────────────────────────▼───────────────┐
                         │        💳 Payment & Rating               │
                         │  Cash | InstaPay | Wallet                │
                         │  ⭐⭐⭐⭐⭐ Rate & Review                │
                         │  🛡️ 30-Day Warranty Activated            │
                         └──────────────────────────────────────────┘
```

---

### 🔵 Technician Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│    Register      │────▶│  Upload National │────▶│  ⏳ Pending Admin   │
│  with Specialty  │     │  ID Card 📸      │     │    Verification     │
└──────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                              │
                                    ┌─────────────────────────▼────────────┐
                                    │  🤖 OCR Auto-Verify (Gemini Vision) │
                                    │  Extracts: Name, ID#, DOB, Address  │
                                    └─────────────────────────┬────────────┘
                                                              │
                                          ┌───────────────────▼──────────┐
                                          │  ✅ Admin Approves Account   │
                                          └───────────────────┬──────────┘
                                                              │
                                    ┌─────────────────────────▼───────────┐
                                    │     🛠️ Technician PRO Dashboard     │
                                    │  • Weekly earnings chart            │
                                    │  • Pending / Active / Completed     │
                                    │  • Wallet balance                   │
                                    └─────────────────────────┬───────────┘
                                                              │
                              ┌───────────────────────────────▼──────────┐
                              │   🔔 Receive Push Notification           │
                              │   "New plumbing request — 1.5 km away"   │
                              └───────────────────────────────┬──────────┘
                                                              │
                                  ┌───────────────────────────▼──────────┐
                                  │   Accept / Reject / Bid on Request   │
                                  └───────────────────────────┬──────────┘
                                                              │
                                  ┌───────────────────────────▼──────────┐
                                  │   📍 Navigate to Customer Location   │
                                  │   💬 Chat with Customer              │
                                  └───────────────────────────┬──────────┘
                                                              │
                                  ┌───────────────────────────▼──────────┐
                                  │   ✅ Complete Service & Get Paid     │
                                  │   💰 Earnings added to Wallet       │
                                  └──────────────────────────────────────┘
```

---

### 🔴 Admin Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   📊 Admin Dashboard                         │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Real-Time  │  │  Verify /    │  │  Manage Categories  │ │
│  │  Analytics  │  │  Reject      │  │  & Packages         │ │
│  │  (Chart.js) │  │  Technicians │  │  (CRUD)             │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Monitor    │  │  Revenue &   │  │  Live Technician    │ │
│  │  All        │  │  Commission  │  │  Map (Leaflet.js)   │ │
│  │  Requests   │  │  Reports     │  │                     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 🗄 Database Schema (Firestore)

### Collections Overview

```
Firestore Root
├── 📁 users/
│   └── 📄 {userId}
├── 📁 requests/
│   └── 📄 {requestId}
│       └── 📁 messages/
│           └── 📄 {messageId}
├── 📁 categories/
│   └── 📄 {categoryId}
├── 📁 packages/
│   └── 📄 {packageId}
├── 📁 notifications/
│   └── 📄 {notificationId}
├── 📁 reviews/
│   └── 📄 {reviewId}
├── 📁 referrals/
│   └── 📄 {referralId}
└── 📁 walletTransactions/
    └── 📄 {transactionId}
```

### Collection Schemas

#### 📁 `users` Collection

```javascript
{
  uid: "string",                    // Firebase Auth UID
  email: "string",                  // User email
  name: "string",                   // Full name (Arabic)
  phone: "string",                  // Phone number
  role: "customer" | "technician" | "admin",
  
  // Technician-specific fields
  specialty: "string",              // e.g., "سباكة", "كهرباء"
  nationalId: "string",            // National ID number
  nationalIdImage: "string",       // Storage URL for ID card photo
  isVerified: boolean,             // Admin verification status
  verificationStatus: "pending" | "verified" | "rejected",
  ocrData: {                       // AI-extracted ID data
    fullName: "string",
    idNumber: "string",
    dateOfBirth: "string",
    address: "string",
    gender: "string"
  },
  
  // Wallet & Referral
  walletBalance: number,           // Current wallet balance (EGP)
  referralCode: "string",          // Unique referral code
  referredBy: "string",            // UID of referrer
  
  // Metadata
  fcmToken: "string",             // FCM push notification token
  rating: number,                  // Average rating (1-5)
  totalRatings: number,            // Total number of ratings
  createdAt: Timestamp,            // Account creation date
  lastLogin: Timestamp             // Last login timestamp
}
```

#### 📁 `requests` Collection

```javascript
{
  requestId: "string",             // Auto-generated ID
  customerId: "string",            // Customer UID
  technicianId: "string",          // Assigned technician UID (nullable)
  
  // Service Details
  category: "string",             // Service category
  description: "string",          // Issue description
  images: ["string"],             // Array of image URLs
  
  // AI Diagnosis
  aiDiagnosis: {
    issue: "string",              // Diagnosed problem
    estimatedCost: {
      min: number,                // Minimum estimated cost
      max: number                 // Maximum estimated cost
    },
    recommendedSpecialty: "string", // Suggested technician type
    severity: "low" | "medium" | "high"
  },
  
  // Location
  location: {
    lat: number,                  // Latitude
    lng: number,                  // Longitude
    address: "string"             // Human-readable address
  },
  
  // Status & Pricing
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled",
  inspectionFee: 30,              // Fixed 30 EGP
  minimumCharge: 50,              // Minimum 50 EGP
  finalPrice: number,             // Final agreed price
  
  // Payment
  paymentMethod: "cash" | "instapay" | "wallet",
  paymentStatus: "pending" | "paid",
  receiptImage: "string",         // InstaPay receipt URL
  
  // Warranty
  warrantyActive: boolean,        // Is warranty active
  warrantyExpiry: Timestamp,      // 30 days after completion
  
  // Bidding
  bids: [{
    technicianId: "string",
    amount: number,
    message: "string",
    timestamp: Timestamp
  }],
  
  // Timestamps
  createdAt: Timestamp,
  acceptedAt: Timestamp,
  completedAt: Timestamp
}
```

#### 📁 `requests/{requestId}/messages` Subcollection

```javascript
{
  messageId: "string",
  senderId: "string",              // UID of sender
  text: "string",                  // Message content
  imageUrl: "string",             // Optional image attachment
  timestamp: Timestamp,            // Server timestamp
  read: boolean                    // Read receipt
}
```

#### 📁 `categories` Collection

```javascript
{
  categoryId: "string",
  name: "string",                  // Arabic name (e.g., "سباكة")
  nameEn: "string",               // English name (e.g., "Plumbing")
  icon: "string",                  // Icon identifier
  description: "string",          // Category description
  isActive: boolean,               // Enable/disable category
  order: number                    // Display order
}
```

#### 📁 `packages` Collection

```javascript
{
  packageId: "string",
  name: "string",                  // Package name (Arabic)
  category: "string",             // Associated category
  description: "string",          // What's included
  price: number,                   // Fixed price (EGP)
  duration: "string",             // Estimated duration
  includes: ["string"],           // List of included services
  isActive: boolean,               // Enable/disable package
  createdAt: Timestamp
}
```

#### 📁 `notifications` Collection

```javascript
{
  notificationId: "string",
  userId: "string",                // Target user UID
  title: "string",                 // Notification title
  body: "string",                  // Notification body
  type: "new_request" | "request_accepted" | "technician_arrived" | "service_completed",
  requestId: "string",            // Related request
  read: boolean,
  createdAt: Timestamp
}
```

#### 📁 `reviews` Collection

```javascript
{
  reviewId: "string",
  requestId: "string",            // Associated request
  customerId: "string",           // Reviewer UID
  technicianId: "string",         // Reviewed technician UID
  rating: number,                  // 1-5 stars
  comment: "string",              // Review text
  createdAt: Timestamp
}
```

---

## 6. 🔐 Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Network Security (Cloudflare)             │
│  • DDoS Protection   • WAF   • SSL/TLS Encryption  │
├─────────────────────────────────────────────────────┤
│  Layer 2: Authentication (Firebase Auth)             │
│  • Email/Password    • Google OAuth 2.0             │
│  • Email Verification • Session Management          │
├─────────────────────────────────────────────────────┤
│  Layer 3: Authorization (Firestore Security Rules)   │
│  • Role-Based Access Control (RBAC)                  │
│  • Document-Level Permissions                        │
│  • Field-Level Validation                            │
├─────────────────────────────────────────────────────┤
│  Layer 4: Identity Verification                      │
│  • National ID Upload + AI OCR Verification         │
│  • Admin Manual Approval                             │
├─────────────────────────────────────────────────────┤
│  Layer 5: Application Security                       │
│  • Input Validation & Sanitization                  │
│  • API Key Rotation (8 Gemini keys)                 │
│  • HTTPS Everywhere                                 │
└─────────────────────────────────────────────────────┘
```

### Firestore Security Rules Summary

```javascript
// Role-based access examples (from firestore.rules)

// Users collection — users can only read/update their own document
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Requests — customers create, technicians read assigned
match /requests/{requestId} {
  allow create: if request.auth != null 
                && request.resource.data.customerId == request.auth.uid;
  allow read: if request.auth != null 
              && (resource.data.customerId == request.auth.uid 
                  || resource.data.technicianId == request.auth.uid);
}

// Admin — full access with role check
match /{document=**} {
  allow read, write: if request.auth != null 
                     && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

### Storage Security Rules

```javascript
// Only authenticated users can upload
// File size limits enforced
// Content type validation for images
// Technicians can only upload to their own ID folder
```

---

## 7. 🤖 AI Integration Details

### Gemini API Configuration

| Parameter | Value |
|-----------|-------|
| **Diagnosis Model** | Gemini 3.5 Flash |
| **Chatbot Model** | Gemini 2.5 Flash |
| **OCR Model** | Gemini 3.5 Flash (Vision) |
| **API Keys** | 8 keys with automatic rotation |
| **Rate Limit Handling** | Retry with exponential backoff |
| **Max Retries** | 3 per request |

### AI Feature 1: Issue Diagnosis (`gemini-diagnosis.js`)

```
Input:  Image (JPEG/PNG) + Optional text description
Output: {
  issue: "Short circuit in the main breaker panel",
  severity: "high",
  estimatedCost: { min: 200, max: 500 },
  recommendedSpecialty: "كهرباء (Electrical)",
  explanation: "The burn marks indicate...",
  urgency: "Immediate attention recommended"
}
```

**Process:**
1. User uploads photo of the broken item
2. Image converted to base64
3. Sent to Gemini 3.5 Flash with structured prompt
4. AI returns JSON diagnosis
5. Results displayed in the UI with cost estimate
6. Correct technician specialty auto-selected

### AI Feature 2: OCR National ID Verification (`gemini-ocr.js`)

```
Input:  National ID card image (front)
Output: {
  fullName: "أحمد محمد علي",
  nationalId: "29901011234567",
  dateOfBirth: "1999-01-01",
  address: "القاهرة، مصر",
  gender: "ذكر"
}
```

**Process:**
1. Technician uploads National ID photo during registration
2. Image sent to Gemini Vision API
3. AI extracts text fields via OCR
4. Extracted data auto-populates verification form
5. Admin reviews AI-extracted data
6. Admin approves or rejects the technician

### AI Feature 3: Chatbot Assistant (`chatbot.js`)

```
Input:  Natural language conversation (Arabic/English)
Output: Contextual troubleshooting advice, 
        recommendations, and platform guidance
```

**Process:**
1. User opens chatbot from any page
2. Describes issue in natural language
3. Gemini 2.5 Flash processes with conversation history
4. Provides diagnosis, DIY tips, or recommends professional help
5. Session memory maintains context across messages

### API Key Rotation Strategy

```javascript
// 8 API keys rotate automatically
const API_KEYS = [key1, key2, key3, key4, key5, key6, key7, key8];
let currentKeyIndex = 0;

function getNextKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return API_KEYS[currentKeyIndex];
}

// On 429 (rate limit) → rotate to next key and retry
// On 3 consecutive failures → show user-friendly error
```

---

## 8. 📂 Project Structure

```
Yasta/
│
├── 📄 index.html                          # Landing page (auth-aware)
├── 📄 login.html                          # Login page (Email + Google)
├── 📄 register.html                       # Registration (Customer/Technician)
├── 📄 verify-identity.html                # National ID upload page
├── 📄 community.html                      # Community page
├── 📄 tech-directory.html                 # Public technician directory
├── 📄 fake-data-generator.html            # Dev tool: seed Firestore
│
├── 📁 css/
│   └── 📄 style.css                       # Global styles (RTL, dark mode)
│
├── 📁 js/
│   ├── 📄 firebase-config.js              # Firebase SDK initialization
│   ├── 📄 shared.js                       # Shared utilities & auth state
│   ├── 📄 index.js                        # Landing page logic
│   ├── 📄 login.js                        # Authentication logic
│   ├── 📄 register.js                     # Registration logic
│   ├── 📄 verify-identity.js              # ID upload logic
│   ├── 📄 chat.js                         # Real-time chat engine
│   ├── 📄 chatbot.js                      # AI Chatbot (Gemini 2.5 Flash)
│   ├── 📄 gemini-diagnosis.js             # AI Diagnosis (Gemini 3.5 Flash)
│   ├── 📄 gemini-ocr.js                   # OCR ID Verification (Gemini Vision)
│   ├── 📄 notifications.js                # FCM push notifications
│   ├── 📄 categories-data.js              # Service categories data
│   ├── 📄 community.js                    # Community page logic
│   └── 📄 tech-directory.js               # Technician directory logic
│
├── 📁 customer/                           # Customer Portal
│   ├── 📄 dashboard.html                  # Customer main dashboard
│   ├── 📄 request-service.html            # Service request form + AI
│   ├── 📄 finding-technician.html         # Radar → List → Confirm
│   ├── 📄 tracking.html                   # Live GPS tracking page
│   ├── 📄 checkout-rating.html            # Payment & rating page
│   ├── 📄 history.html                    # Order history
│   ├── 📄 chat.html                       # Chat with technician
│   ├── 📄 invite.html                     # Referral/invite page
│   └── 📁 js/
│       ├── 📄 customer-dashboard.js       # Dashboard logic
│       ├── 📄 request-service.js          # Service request logic + AI
│       ├── 📄 finding-technician.js       # Technician search + radar
│       ├── 📄 tracking.js                 # GPS tracking logic
│       ├── 📄 checkout-rating.js          # Payment & rating logic
│       └── 📄 history.js                  # Order history logic
│
├── 📁 technician/                         # Technician Portal
│   ├── 📄 dashboard.html                  # Technician PRO dashboard
│   ├── 📄 active-job.html                 # Active job management
│   ├── 📄 chat.html                       # Chat with customer
│   ├── 📄 wallet.html                     # Wallet & earnings
│   ├── 📄 reviews.html                    # Reviews & ratings
│   └── 📁 js/
│       ├── 📄 tech-dashboard.js           # Dashboard + charts logic
│       ├── 📄 active-job.js               # Active job logic
│       ├── 📄 wallet.js                   # Wallet management
│       └── 📄 reviews.js                  # Reviews display logic
│
├── 📁 admin/                              # Admin Portal
│   ├── 📄 dashboard.html                  # Enterprise analytics dashboard
│   ├── 📄 verify-users.html               # Technician verification center
│   ├── 📄 categories.html                 # Category management (CRUD)
│   ├── 📄 packages.html                   # Package management (CRUD)
│   ├── 📄 live-map.html                   # Live technician map
│   └── 📁 js/
│       ├── 📄 admin-dashboard.js          # Dashboard + Chart.js
│       ├── 📄 verify-users.js             # Verification + OCR logic
│       ├── 📄 categories.js               # Category CRUD logic
│       ├── 📄 packages.js                 # Package CRUD logic
│       └── 📄 live-map.js                 # Leaflet.js map logic
│
├── 📄 firebase.json                       # Firebase hosting config
├── 📄 firestore.rules                     # Firestore security rules
├── 📄 storage.rules                       # Storage security rules
├── 📄 .firebaserc                         # Firebase project config
├── 📄 masar.py                            # Project structure generator
├── 📄 CHANGELOG.md                        # Version changelog
└── 📄 PROJECT_DOCUMENTATION.md            # 📌 This file
```

### File Statistics

| Category | Files | Lines of Code (Approx.) |
|----------|-------|------------------------|
| HTML Pages | 19 | ~6,000+ |
| JavaScript Modules | 24 | ~8,000+ |
| CSS Stylesheets | 1 | ~900+ |
| Configuration | 4 | ~200+ |
| **Total** | **48** | **~15,000+** |

---

## 9. 🚀 Deployment & Infrastructure

### Hosting Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Users   │────▶│  Cloudflare  │────▶│  Firebase Hosting    │
│ (Egypt)  │     │  CDN + DNS   │     │  nbrain-yasta.web.app│
│          │     │  SSL + WAF   │     │                      │
└──────────┘     └──────────────┘     └──────────────────────┘
```

### Domain Configuration

| Type | Value |
|------|-------|
| **Firebase Project** | `nbrain-yasta` |
| **Firebase Hosting** | `nbrain-yasta.web.app` |
| **Custom Domain** | `yasta.nbra.in` |
| **DNS Provider** | Cloudflare |
| **SSL Certificate** | Cloudflare Universal SSL (Full Strict) |
| **CDN** | Cloudflare Global CDN |

### Deployment Commands

```bash
# Deploy everything (hosting + rules)
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage
```

### Firebase Configuration (`firebase.json`)

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=604800" }
        ]
      }
    ]
  }
}
```

---

## 10. 📸 Screenshots & Demo

> **📹 Video Demo:** A comprehensive video walkthrough demonstrating all features is available as part of the project submission. The video covers:
>
> - Landing page & authentication flow
> - Customer journey: request → AI diagnosis → technician finding → tracking → payment
> - Technician journey: registration → ID verification → job management → wallet
> - Admin dashboard: analytics, verification, category & package management
> - AI features: chatbot, diagnosis, OCR
> - Push notifications in action
> - Responsive mobile design & dark mode

> **🌐 Live Demo:** Visit [https://yasta.nbra.in](https://yasta.nbra.in) to explore the platform.

---

## 11. 🗺️ Future Roadmap

### Short-Term (v2.0)

| Feature | Description | Priority |
|---------|-------------|----------|
| 📱 **Mobile App** | React Native cross-platform app (iOS & Android) | 🔴 High |
| 🗺️ **Advanced GPS** | Real-time technician tracking with Google Maps API | 🔴 High |
| 📊 **Advanced Analytics** | Predictive demand forecasting with ML | 🟡 Medium |

### Mid-Term (v3.0)

| Feature | Description | Priority |
|---------|-------------|----------|
| 🏢 **B2B Contracts** | Corporate maintenance contracts for offices & buildings | 🔴 High |
| 💳 **BNPL** | Buy Now Pay Later integration for expensive repairs | 🟡 Medium |
| 🎁 **Loyalty Program** | Points system with redeemable rewards | 🟡 Medium |
| 🌍 **Multi-City** | Expand to Alexandria, Giza, and other Egyptian cities | 🟡 Medium |

### Long-Term (v4.0+)

| Feature | Description | Priority |
|---------|-------------|----------|
| 🤖 **Predictive Maintenance** | AI predicts when appliances need service | 🟢 Future |
| 📞 **Video Consultation** | WebRTC video calls for remote diagnosis | 🟢 Future |
| 🌐 **Multi-Language** | English interface for expats in Egypt | 🟢 Future |
| 🏪 **Parts Marketplace** | E-commerce for spare parts and supplies | 🟢 Future |

---

## 12. 👥 Team

<!-- ═══════════════════════════════════════════ -->
<!--       UPDATE THIS SECTION WITH YOUR        -->
<!--            TEAM INFORMATION                -->
<!-- ═══════════════════════════════════════════ -->

| Role | Name | Responsibilities |
|------|------|-----------------|
| **Project Lead** | *[Name]* | Project management, architecture design |
| **Frontend Developer** | *[Name]* | UI/UX implementation, responsive design |
| **Backend Developer** | *[Name]* | Firebase setup, security rules, database |
| **AI Integration** | *[Name]* | Gemini API, diagnosis, OCR, chatbot |
| **QA & Testing** | *[Name]* | Testing, bug fixes, quality assurance |

---

## 📄 License

This project is developed as a university capstone project. All rights reserved.

---

<div align="center">

**يسطا — لأن بيتك يستاهل الأفضل**

*Yasta — Because Your Home Deserves the Best*

---

Built with ❤️ in Egypt 🇪🇬

[![Firebase](https://img.shields.io/badge/Powered_by-Firebase-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/AI_by-Google_Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Cloudflare](https://img.shields.io/badge/Protected_by-Cloudflare-F38020?style=flat-square&logo=cloudflare)](https://cloudflare.com)

</div>
