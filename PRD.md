# PRD: Private Library & Progress Tracker (مكتبة خاصة ومتتبع إنجاز)

## 1. Overview
A strictly private, Arabic-first (RTL) web app for ~30 participants. It serves as a
reference library of readable materials (books: PDF files hosted on Google Drive) and
audio materials (YouTube videos). It tracks each participant's progress. Each user sees
only their own progress; Admin manages content and users and sees everyone's counters.

## 2. Tech Stack (use exactly this unless there is a strong reason)
- Next.js (App Router) + TypeScript
- Tailwind CSS with RTL support, Arabic font (Tajawal or IBM Plex Sans Arabic)
- Prisma ORM + SQLite (single file DB; easy to migrate to Postgres later)
- Session-based auth via signed HTTP-only cookie (e.g., iron-session or jose)
- Deployable on a small VPS or Vercel/Railway (include deployment notes in README)
- Mobile-first responsive design (most users will use phones)

## 3. Authentication & Privacy
- App is fully private. The only public route is /login. All other routes and all API
  endpoints require a valid session; otherwise redirect to /login.
- No sign-up, no email, no passwords. Login is via a unique Access Code created by Admin.
- PRIORITY: login must be as smooth and frictionless as possible. No CAPTCHA, no
  lockouts, no extra verification steps, and no visible throttling for normal users.
- Silent, very light brute-force protection ONLY: allow up to 30 failed login attempts
  per minute per IP. Beyond that, temporarily reject further attempts from that IP
  (HTTP 429 with a short Arabic message "حاول بعد دقيقة"). Implement in-memory
  (no Redis). A real user must never notice it. Successful logins do not count.
- Access codes: short and easy to type/share, 6 characters, unambiguous
  alphanumeric (avoid 0/O/1/I/l), auto-generated and guaranteed unique,
  case-insensitive input (normalize to uppercase), stored as unique-indexed plain text
  so Admin can view them again anytime.
- Login page: a single input field + one button. Nothing else. Autofocus on the input.
- Long session: 1 year, so users stay logged in on their device and rarely need to
  re-enter the code. Logout button available.
- Admin can view any user's code, regenerate it (invalidates the old one),
  and deactivate/delete a user.
- First Admin is created via a seed script using env variables
  (ADMIN_NAME, ADMIN_ACCESS_CODE).

## 4. Roles & Permissions

### Participant (User)
- Log in with own access code.
- Browse the library (books and audio) with filter by category, filter by type
  (book/audio), and search by title.
- Open a details view: title, description, category, comments, a button to open the
  material (Drive link for books / YouTube link for audio), and a "Request completion"
  button.
- Can cancel their own completion request while it is still Pending
  (button "إلغاء الطلب" shown only in Pending state). The server must verify the
  record belongs to the session user and its status is PENDING before deleting.
- Add text-only comments (visible to all users, showing commenter name and date).
  Users can delete their own comments.
- "My Progress" page: shows ONLY their own approved completions
  (count of books read / audio listened) and the list of items with completion dates,
  plus the status of their pending requests.
- Cannot see any other user's progress or counters.

### Admin
- Manage users: create (name → auto-generated access code), view codes, regenerate
  code, deactivate/delete.
- Manage content: add/edit/delete books and audio; manage categories.
- Dashboard: list of all users, each with counters
  (e.g., "محمد — 5 كتب مقروءة / 3 مواد مسموعة"); click a user to view their completed items.
- Pending Requests page: approve or reject completion requests
  (approve-all option is optional).
- Manually add a completion for any user/content directly (status = Approved instantly),
  and remove a completion if entered by mistake.
- Can delete any comment (moderation).
- Completion counters are visible to Admin only.

## 5. UI/UX
- Library grid of cards; the cover/thumbnail is the visual focus (large, clear,
  fixed aspect ratio: portrait ~2:3 for books, 16:9 for audio).
- Audio thumbnail is auto-derived from the YouTube video ID:
  https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg
  (support youtube.com/watch?v=, youtu.be/, and youtube.com/shorts URLs).
- Book cover: Admin pastes a cover image URL (no file uploads). Show a placeholder
  if missing or broken.
- Clicking a card opens a Details Modal/Page containing: cover, title, description,
  category, primary action button (Open on Drive / Open on YouTube, opens in a new tab),
  "Request completion" button (states: Not requested / Pending [with Cancel option] /
  Completed / Rejected [can re-request]), and the comments section.
- Arabic RTL layout throughout, clean modern design, light theme (dark mode optional).
- Empty states, loading states, and clear error messages in Arabic.

## 6. Data Model (Prisma)
- User: id, name, accessCode (unique, indexed), role (ADMIN|USER),
  isActive (bool), createdAt
- Category: id, name (unique)
- Content: id, title, description, type (BOOK|AUDIO), mediaUrl,
  coverImageUrl (nullable; for AUDIO derived at render/save time), categoryId (FK),
  createdAt
- Comment: id, contentId (FK), userId (FK), text, createdAt
  (cascade delete with content/user)
- ProgressTracker: id, userId (FK), contentId (FK),
  status (PENDING|APPROVED|REJECTED), requestedAt, completedAt (nullable),
  createdBy (SELF|ADMIN)
  - Unique constraint on (userId, contentId).
  - Rejected requests: user may re-request after rejection (resets to PENDING).
  - Cancel: a user may cancel their own request ONLY while status = PENDING
    (deletes the record). Cancelling APPROVED or REJECTED records is not allowed.

## 7. Business Rules
- A completion counts only when status = APPROVED.
- Admin-added completions are APPROVED immediately.
- All progress queries for a normal user MUST be filtered server-side by the session's
  userId. Never trust a userId sent from the client.
- Every admin route/API must verify role = ADMIN server-side.
- Deactivated users' sessions must stop working immediately (check isActive
  on each request).
- Validate that media URLs are valid http(s) URLs; validate comment length
  (max 1000 chars) and sanitize output to prevent XSS.
- Note for Admin in the UI: Drive files must be shared as "Anyone with the link can
  view" so participants can open them.

## 8. Non-Goals
- No file uploads, no email, no public pages, no user-to-user messaging,
  no replies or likes on comments, no CAPTCHA or extra login verification
  (only the silent light rate limit described in section 3).

## 9. Deliverables
- Full working project, seed script (admin + sample categories and content),
  README with local run instructions and deployment steps,
  and a .env.example.
- Build in this order: (1) DB + auth, (2) admin user/content management,
  (3) library + details + comments, (4) progress requests and admin dashboard,
  (5) polish, RTL, responsiveness.
