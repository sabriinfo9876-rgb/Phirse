# PHIRSE

**Give It Another Life.**

---

## Overview

**PHIRSE** is an original, Pakistan-focused peer-to-peer (C2C) second-hand resale marketplace MVP. It enables individuals across major Pakistani cities—including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, and Hyderabad—to buy and sell well-maintained pre-owned electronics, furniture, cameras, gaming consoles, books, and everyday items locally.

---

## Problem

Buying and selling second-hand goods locally in Pakistan often suffers from noisy classified boards, vague one-line descriptions, missing condition disclosures, and unstructured price haggling. Buyers struggle to evaluate whether an item is genuinely PTA-approved, what accessories are included, or where in their city the item is located, while sellers lack a guided way to create trustworthy listings and manage incoming offers.

---

## Solution

PHIRSE provides a structured, neighborhood-aware resale workflow:

1. **Clear Condition & Spec Transparency**: Every listing presents standardized condition grades (`Like New`, `Excellent`, `Good`, `Fair`, `For Parts`), PKR pricing in tabular numerals, neighborhood-level location context (e.g., `Clifton, Karachi` or `Gulberg, Lahore`), and multi-angle photo inspection.
2. **Structured Offers & Contextual Messaging**: Instead of fragmented chat messages, buyers can submit formal PKR offers (which sellers can accept, decline, or counter) alongside contextual inquiry threads.
3. **Guided 6-Step Selling Wizard**: Sellers receive deterministic listing quality checks and demo dataset price insights before publishing.

---

## Core Features

- **Discovery & Search**: Debounced search across title, brand, model, category, and description with recent and popular search suggestions.
- **Multi-Dimensional Filtering**: Filter by category, subcategory, min/max PKR price, city, neighborhood area, condition, seller type, listing age, and availability status—with a responsive mobile filter drawer.
- **Listing Detail & Full-Screen Lightbox**: Multi-image gallery with keyboard-navigable full-screen lightbox (`ArrowLeft`, `ArrowRight`, `Escape`), specification breakdown, seller profile summary, Web Share / link copy, and related listings (`You may also like`).
- **6-Step Sell Wizard**: Category → Photos (device upload + multi-angle studio generator + reordering) → Details → Price & Location (with deterministic demo price insight) → Preview (with deterministic Listing Quality checklist) → Publish (`PHR-XXXXXX` ID).
- **Seller Dashboard**: Manage Active, Draft, Paused, and Sold listings; edit, pause/resume, duplicate, delete, or mark items sold with confirmation dialogs.
- **Messaging & Offers**: Two-pane conversation view with quick inquiry prompts, read status, and a dedicated Offers center (`Received` and `Sent` tabs) supporting Accept, Decline, and Counter-Offer workflows.
- **Account, Reviews & Demo Moderation**: Profile editing, bounded Recently Viewed history, post-sale seller reviews, persona switching for live two-way testing, and a clearly labeled Demo Moderation Console (`/admin`).

---

## Buyer Journey

1. Land on `/` and search by keyword/city or select one of the 12 categories.
2. Refine results on `/browse` using neighborhood, condition, and PKR price range filters.
3. Open a listing (`/listing/PHR-842731`) to inspect multi-angle photos in the full-screen viewer, read specifications, and check seller response history.
4. Save the item to `/favorites`, click **Contact Seller** to ask a quick question, or click **Make Offer** to propose a price.
5. Track offer responses or accept a seller's counter-offer on `/offers`.

---

## Seller Journey

1. Click **Sell Item** (`/sell`) to launch the 6-step listing wizard.
2. Select a category & subcategory, upload photos (or generate studio angles), and reorder the primary cover image.
3. Enter title, brand, model, condition grade, and detailed description.
4. Set a PKR asking price with reference to the local demo price insight and select city + neighborhood area.
5. Review the deterministic **Listing Quality** checklist on the preview screen and publish to receive a unique `PHR-XXXXXX` ID.
6. Manage incoming offers on `/offers` and mark the listing as sold on `/my-listings` once handed over.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + CSS custom property design tokens (`Syne`, `Plus Jakarta Sans`, `JetBrains Mono`)
- **Icons**: `lucide-react`
- **State & Persistence**: React Context + versioned `localStorage` persistence + HTML5 History API router

---

## Architecture

PHIRSE uses a modular frontend architecture with a single source of truth in `MarketplaceContext`. All routes (`/`, `/browse`, `/categories/:slug`, `/listing/:id`, `/sell`, `/sell/edit/:id`, `/favorites`, `/messages`, `/messages/:id`, `/offers`, `/my-listings`, `/account`, `/settings`, `/seller/:id`, `/admin`) are synchronized with the browser's History API (`pushState` / `popstate`) so deep links, back/forward navigation, and query parameters work naturally.

---

## Project Structure

```text
src/
├── assets/images/          # High-resolution generated product & hero photography
├── components/
│   ├── layout/             # Header, MobileNav, Footer, NotificationDrawer, ConfirmDialog, ToastContainer
│   └── listing/            # ListingCard, ImageViewerModal, ContactSellerModal, MakeOfferModal, ReportListingModal
├── data/
│   ├── categories.ts       # 12 marketplace categories & subcategories
│   ├── locations.ts        # 8 Pakistani cities & neighborhood areas
│   └── seedData.ts         # Realistic Pakistani listings, users, offers, messages, reviews
├── pages/
│   ├── HomePage.tsx
│   ├── BrowsePage.tsx
│   ├── ListingDetailPage.tsx
│   ├── SellWizardPage.tsx
│   ├── SellerDashboardPage.tsx
│   ├── FavoritesPage.tsx
│   ├── MessagesPage.tsx
│   ├── OffersPage.tsx
│   ├── AccountPage.tsx
│   ├── AdminModerationPage.tsx
│   └── NotFoundPage.tsx
├── store/
│   └── MarketplaceContext.tsx
├── types/
│   └── marketplace.ts
└── utils/
    ├── formatters.ts       # PKR currency formatter, deterministic quality & price insights
    └── studioVisuals.ts    # Multi-angle SVG studio gallery generator & resilient fallbacks
```

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server on port 3000
npm run dev

# 3. Type-check and build for production
npm run lint
npm run build
```

---

## Environment Variables

See `.env.example`:

- `APP_URL`: Optional base URL for self-referential links.
- No external API keys or database secrets are required to run the PHIRSE frontend MVP.

---

## Demo Instructions

1. **Explore & Filter**: From the homepage, click **Browse Listings** or search `iPhone 13 PTA`. Filter by `Karachi` → `Clifton` or sort by price.
2. **Inspect & Make an Offer**: Open **Apple iPhone 13 128GB Midnight** (`PHR-842731`), open the full-screen image viewer, then click **Make Offer** or **Contact Seller**.
3. **Respond to Offers**: Visit **Offers** (`/offers`) to accept, decline, or counter incoming offers on your listings, or switch active demo personas under **Account → Settings** to experience both sides of a transaction.
4. **Publish a Listing**: Click **Sell Item** (`/sell`), complete the 6-step wizard (use **Generate 3 Studio Angles** or upload device photos), verify the **Listing Quality** checklist, publish, and test **Mark Sold** in **My Listings**.

---

## Screenshots

Screenshot-ready views available in the live application:

1. **Homepage** (`/`) — Hero with search & city selector, category discovery, and curated collection tabs.
2. **Browse Page** (`/browse`) — Sidebar filters, active filter tags, and responsive 3-column product grid.
3. **Listing Detail** (`/listing/PHR-842731`) — Multi-angle gallery, specifications, seller card, and related items.
4. **Sell Wizard** (`/sell`) — 6-step guided listing creation with quality assistance and demo price insight.
5. **Seller Dashboard** (`/my-listings`) — Active, Drafts, and Sold management with demo metrics.
6. **Messages & Offers** (`/messages`, `/offers`) — Contextual buyer-seller chat and structured offer negotiation.
7. **Mobile Viewports** (`375px` / `390px`) — Compact top header, bottom 5-tab navigation, and mobile filter sheet.

---

## Testing

- **Type Checking**: `npm run lint` (`tsc --noEmit`)
- **Production Build**: `npm run build` (`vite build`)
- **Interactive Flows Verified**: Search & debounce, multi-filter combinations, mobile filter drawer, image lightbox keyboard navigation, favorite persistence, offer creation & counter-offers, 6-step listing publish & edit, mark sold confirmation, report submission & moderation resolution.

---

## Future Improvements

- Backend persistence with PostgreSQL / Cloud SQL and server-side RBAC authentication.
- Real-time WebSocket message delivery and push notifications.
- Image compression and cloud object storage upload pipeline.
- Verified phone number (OTP) badge integration for Pakistani mobile carriers.
