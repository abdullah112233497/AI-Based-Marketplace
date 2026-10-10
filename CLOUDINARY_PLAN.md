# Cloudinary Media Integration & Database Image Population Plan

## 1. Executive Summary & Objective

Currently, several products in the Neon PostgreSQL database have broken placeholder URLs (e.g. `https://images.unsplash.com/photo-test.jpg` from backend test suites) or non-rendering external links.

The goal of this initiative is:
1. Connect the **Cloudinary** media storage service using the user's provided credentials.
2. Provide a reliable media upload mechanism in the backend for agents and admins.
3. Populate all **115 products** in the live **Neon PostgreSQL** database with distinct, professional, high-resolution tech hardware images hosted on Cloudinary.

> [!IMPORTANT]
> **Status**: Credentials have been safely configured in `.env` files. In accordance with user instructions, **no implementation has been performed yet**; this plan is presented for review first.

---

## 2. Configured Credentials

The following credentials have been placed into [`apps/backend/.env`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/backend/.env) and [`apps/web/.env.local`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/web/.env.local):

| Setting | Value | Scope |
| :--- | :--- | :--- |
| **Cloud Name** | `dkqtrrouz` | Backend & Frontend |
| **API Key** | `148815615272179` | Backend Only |
| **API Secret** | `-6gI_k8qrfMLa9GdEFBorhwiy1Q` | Backend Only (Confidential) |
| **CLOUDINARY_URL** | `cloudinary://148815615272179:-6gI_k8qrfMLa9GdEFBorhwiy1Q@dkqtrrouz` | Backend Standard SDK URL |

---

## 3. Architecture & Data Flow

```mermaid
graph TD
    A[Admin / Vendor Agent Portal] -->|Upload File or URL| B[FastAPI Backend /api/v1/media/upload]
    B -->|Upload Stream| C[Cloudinary CDN dkqtrrouz]
    C -->|Return HTTPS CDN URL| B
    B -->|Store URL in images JSONB| D[(Neon PostgreSQL products Table)]
    D -->|GET /api/v1/products| E[Next.js Web Client]
    E -->|Optimized Images| C
```

---

## 4. Phased Implementation Plan

### Phase 1: Backend Cloudinary SDK & Service Foundation
1. **Dependency Installation**:
   - Add `cloudinary>=1.40.0` to [`apps/backend/requirements.txt`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/backend/requirements.txt).
2. **Settings Model Update**:
   - Update [`apps/backend/app/core/config.py`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/backend/app/core/config.py) to declare `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_URL`.
3. **Cloudinary Service Module** (`apps/backend/app/services/cloudinary_service.py`):
   - Initialize Cloudinary client with auto-format (`f_auto`) and quality optimization (`q_auto`).
   - Implement `upload_image_file(file, folder="tech-marketplace/products")`.
   - Implement `upload_image_url(url, folder="tech-marketplace/products", public_id=None)` to upload remote assets directly to Cloudinary without local disk storage.
   - Implement `delete_image(public_id)`.

---

### Phase 2: Media API Endpoints
1. **Media Upload Router** (`apps/backend/app/api/v1/endpoints/media.py`):
   - `POST /api/v1/media/upload`: Supports `multipart/form-data` for image uploads by authenticated agents and admins.
   - Validates file size (max 5MB) and MIME types (`image/jpeg`, `image/png`, `image/webp`).
   - Returns upload payload:
     ```json
     {
       "success": true,
       "data": {
         "url": "https://res.cloudinary.com/dkqtrrouz/image/upload/v1/tech-marketplace/products/...",
         "publicId": "tech-marketplace/products/...",
         "format": "webp",
         "width": 1200,
         "height": 1200
       }
     }
     ```
2. **Mount in API Router**:
   - Add media router to [`apps/backend/app/api/v1/router.py`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/backend/app/api/v1/router.py).

---

### Phase 3: Database Image Population & Migration (115 Products)
To fix existing broken images across the marketplace, an automated database update script will be executed:

1. **Curated High-Quality Tech Hardware Catalog**:
   - **Mobiles & Tablets**: Real product imagery for Samsung S24 Ultra, iPhone 16 Pro Max, Pixel 9 Pro XL, iPad Pro, Xiaomi 14 Ultra, OnePlus, etc.
   - **Laptops & Computers**: MacBook Pro M3, Dell XPS 15, Asus ROG Zephyrus, RTX 4090 GPUs, Core i9/Ryzen 9 processors, gaming motherboards, DDR5 RAM kits, NVMe SSDs, PC cases.
   - **Audio & Wearables**: Sony WH-1000XM5, AirPods Pro/Max, Bose QuietComfort, Apple Watch Ultra, Galaxy Watch 6.
2. **Migration Script** (`apps/backend/scripts/populate_cloudinary_images.py`):
   - Uploads curated assets into Cloudinary subfolders:
     - `tech-marketplace/products/mobiles/`
     - `tech-marketplace/products/laptops/`
     - `tech-marketplace/products/audio/`
     - `tech-marketplace/products/components/`
   - Iterates through all **115 products** in the Neon PostgreSQL database:
     - Inspects `title`, `category.slug`, and `brand`.
     - Assigns 2-4 distinct, matching Cloudinary image angles per product.
     - Commits the updated `images: JSONB` array to Neon DB.
3. **Verification**:
   - Query DB to verify zero empty or broken placeholder URLs remain.

---

### Phase 4: Frontend UI Integration & Fallback Handling
1. **Next.js Image Optimization**:
   - [`apps/web/next.config.mjs`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/web/next.config.mjs) already has `images.remotePatterns` configured for `**`.
   - Explicit domain rule for `res.cloudinary.com` with caching TTL.
2. **Image Fallback Component** (`apps/web/src/components/ui/SafeImage.tsx`):
   - Handles network timeouts or load errors gracefully with a styled hardware placeholder instead of a broken image icon.
3. **Agent Dashboard Integration**:
   - Connect image upload file input in [`apps/web/src/app/agent/page.tsx`](file:///d:/AI-Based%20Marketplace/AI-Based-Marketplace/apps/web/src/app/agent/page.tsx) to `/api/v1/media/upload` so vendors can upload images directly from their device.

---

## 5. Risk Assessment & Safety Controls

| Potential Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Accidental Overwrite of Valid Existing Images** | Medium | The migration script will only target products whose current images contain `photo-test.jpg`, are empty `[]`, or return 404. Valid existing images will be preserved. |
| **Cloudinary Rate / Storage Limits** | Low | Cloudinary free tier allows 25GB storage / 25,000 transformations per month. 115 products will consume under 50MB (< 0.2% of free limit). |
| **Neon DB Connection Interruption** | Low | Script uses standard async sessions with automatic rollbacks and batch commits of 20 products per transaction. |

---

## 6. Next Steps Upon User Approval
Once approved:
1. Install `cloudinary` Python package.
2. Implement `cloudinary_service.py` and `/api/v1/media/upload`.
3. Run the automated image population script to upload distinct tech images to Cloudinary and update the 115 products in Neon DB.
4. Verify results live on `http://localhost:3000`.
