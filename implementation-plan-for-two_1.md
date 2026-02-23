# Legislative Tracker - Implementation Plan for Two Builders

## 🎯 Overview

**Project:** Legislative Tracker - A Letterboxd-style app for NYC Council legislation
**GitHub Repo:** `legislative-tracker`
**Team:** 2 non-technical friends using Claude Code in VS Code
**Timeline:** 6-8 weeks to MVP
**Budget:** < $100/month (mostly free tiers)

---

## 👥 Team Structure

### Recommended Role Division

| Role | Person A | Person B |
|------|----------|----------|
| **Focus Area** | Frontend + UX | Backend + Data |
| **Primary Work** | Pages, components, styling | Database, API, sync jobs |
| **Secondary** | User testing, content | Moderation, admin tools |

**Why this split works:**
- Clear ownership prevents merge conflicts
- Different skill development
- Can work in parallel
- Natural handoff points

---

## 🛠️ Initial Setup (Do Together - Day 1)

### Step 1: Create Shared GitHub Repository

**Person A does this:**

1. Go to [github.com](https://github.com) → Sign up/Sign in
2. Click "New Repository"
3. Settings:
   - Name: `legislative-tracker`
   - Private (for now)
   - Add README: Yes
   - Add .gitignore: Node
4. Go to Settings → Collaborators → Add Person B's GitHub username

**Person B does this:**

1. Accept the collaboration invite (check email)
2. You now both have push access

### Step 2: Create Supabase Project

**Person A does this:**

1. Go to [supabase.com](https://supabase.com) → Sign up with GitHub
2. Click "New Project"
   - Organization: Create new (e.g., "Legislative Tracker")
   - Project name: `legislative-tracker`
   - Database password: Generate and **save somewhere safe**
   - Region: US East (closest to NYC)
3. Wait 2 minutes for setup
4. Go to Settings → Project Settings
5. Invite Person B as "Developer" role

**Both people now have access to:**
- Same database
- Same auth system
- Same API keys

### Step 3: Set Up Vercel

**Person A does this:**

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Don't import any project yet (we'll do this after first code push)

### Step 4: Get API Keys

**Person B does this:**

1. **NYC Council Legistar API:**
   - Go to https://council.nyc.gov/legislation/api/
   - Fill out form with project email
   - Wait for API token (usually same day)

2. **OpenAI API Key (for moderation):**
   - Go to https://platform.openai.com
   - Sign up → API Keys → Create new key
   - Note: Moderation API is FREE

3. **Anthropic API Key (for AI summaries):**
   - Go to https://console.anthropic.com
   - Sign up → API Keys → Create key
   - Add $20 credit to start

**Share all keys securely** (use a password manager or encrypted note, NOT Slack/text)

### Step 5: Create Shared Secrets Document

Create a secure shared doc (1Password, Bitwarden, or encrypted Google Doc) with:

```
LEGISLATIVE TRACKER - ENVIRONMENT VARIABLES
============================================

# Supabase (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# NYC Council API
LEGISTAR_API_TOKEN=abc123...

# OpenAI (for moderation - FREE)
OPENAI_API_KEY=sk-...

# Anthropic (for AI summaries)
ANTHROPIC_API_KEY=sk-ant-...

# Cron Secret (generate random string)
CRON_SECRET=generate-a-random-32-char-string
```

---

## 📅 Week-by-Week Plan

### Week 1: Foundation

#### Day 1-2: Project Setup (Together via screen share)

**Both people, same call:**

```bash
# Person A shares screen, Person B follows along

# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/legislative-tracker.git
cd legislative-tracker

# 2. Create Next.js app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# 3. Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk openai
npm install date-fns lucide-react zod
npm install use-debounce

# 4. Install shadcn/ui
npx shadcn-ui@latest init
# Choose: Yes to TypeScript, Default style, Slate color, Yes to CSS variables

# 5. Add components
npx shadcn-ui@latest add button card input textarea badge tabs avatar dropdown-menu dialog toast alert

# 6. Create .env.local with all the keys
# (copy from your shared secrets doc)

# 7. Push to GitHub
git add .
git commit -m "Initial project setup"
git push origin main
```

**Then Person A:**
- Go to Vercel → Import Git Repository → Select legislative-tracker
- Add all environment variables from your secrets doc
- Deploy

**You now have:**
- ✅ Shared repo both can push to
- ✅ Shared database
- ✅ Live preview URL that updates on every push

#### Day 3-4: Database Setup

**Person B does this with Claude Code:**

Open Claude Code and say:

```
I'm building a NYC legislation civic engagement app. 

Here's my database schema SQL file: [paste the schema I gave you]

Please help me:
1. Connect to my Supabase project
2. Run this schema in the SQL editor
3. Verify the tables were created
4. Seed some initial data for NYC Council

My Supabase URL is: [your URL]
```

**Deliverable:** Database with all tables, NYC Council as a legislature, initial topics seeded.

#### Day 5-7: Data Sync

**Person B continues with Claude Code:**

```
Now I need to sync NYC Council legislation from the Legistar API.

Here's the API documentation: https://webapi.legistar.com/Home/Examples
My API token is stored in LEGISTAR_API_TOKEN env variable.
The NYC client name is "nyc".

Please help me:
1. Create a Legistar API client at lib/legistar/client.ts
2. Create a sync function at lib/legistar/sync.ts
3. Create a cron API route at app/api/cron/sync-legislation/route.ts
4. Run an initial sync to populate our database

Use the schema I already have in Supabase.
```

**Deliverable:** Working sync that pulls real NYC legislation into your database.

---

### Week 2: Core Pages

**Person A focuses on frontend, Person B supports with data.**

#### Person A: Create Browse Page

Open Claude Code:

```
I'm building the legislation browse page for my NYC civic engagement app.

My Supabase database has these tables:
- legislation (id, file_number, slug, title, status, intro_date, ai_summary)
- legislators (id, full_name, slug, district, borough)
- sponsorships (legislation_id, legislator_id, is_primary)
- legislation_stats (view with support_count, oppose_count, trending_score)

Please create:
1. app/(public)/legislation/page.tsx - Browse all legislation
2. components/legislation/LegislationCard.tsx - Card component
3. components/legislation/LegislationFilters.tsx - Filter by status, topic

Use Tailwind and shadcn/ui components.
Make it look modern and polished with a dark theme.
Include search and filter functionality.
```

#### Person A: Create Detail Page

```
Now create the legislation detail page at app/(public)/legislation/[slug]/page.tsx

It should show:
- File number and status badge
- Full title
- AI summary (if available)
- Topics
- All sponsors with links to their profiles
- Legislative history timeline
- Support/Oppose buttons (disabled if not logged in)
- Comments section (we'll wire up later)

Fetch data from Supabase including:
- legislation table
- sponsorships with legislators
- legislation_history
- legislation_topics with topics
```

#### Person B: Create API Routes

```
I need API routes for the legislation app.

Please create:
1. app/api/legislation/[id]/route.ts - Get single legislation
2. app/api/legislation/route.ts - Get all with filters (status, topic, search)
3. app/api/legislation/trending/route.ts - Get trending legislation

Use Supabase server client. Include proper error handling.
```

**End of Week 2 Deliverables:**
- ✅ Browse page showing real NYC legislation
- ✅ Detail page for each bill
- ✅ Search and filtering
- ✅ Responsive design

---

### Week 3: Authentication & User Engagement

#### Person B: Set Up Auth

```
Help me set up Supabase Auth in my Next.js app.

I need:
1. lib/supabase/client.ts - Browser client
2. lib/supabase/server.ts - Server client using @supabase/ssr
3. lib/supabase/middleware.ts - Auth middleware
4. middleware.ts - Next.js middleware for protected routes
5. app/(auth)/login/page.tsx - Login page with email magic link + Google
6. app/(auth)/signup/page.tsx - Sign up page
7. app/auth/callback/route.ts - Handle auth redirects

Configure Supabase Auth in the dashboard:
- Enable Email auth with magic links
- Enable Google OAuth
```

**Also in Supabase Dashboard:**
1. Authentication → Providers → Enable Google
2. Authentication → URL Configuration → Add your Vercel URLs

#### Person A: Engagement UI

```
Create the engagement components:

1. components/legislation/StanceButtons.tsx
   - Support/Oppose/Watch buttons
   - Shows current counts
   - Optimistic updates
   - Disabled state when not logged in
   - Calls server action to save

2. components/legislation/BookmarkButton.tsx
   - Toggle bookmark
   - Syncs with database

3. app/actions/engagement.ts (Server Actions)
   - setStance(legislationId, stance)
   - toggleBookmark(legislationId)
   - Use Supabase to save to user_stances and bookmarks tables

Make sure to revalidate the page after actions.
```

#### Person B: User Profile Setup

```
Create user profile functionality:

1. When a user signs up, create their profile in user_profiles table
   (use a Supabase trigger or handle in auth callback)

2. app/(auth)/onboarding/page.tsx
   - Ask for username, display name
   - Optionally ask for NYC zip code or district
   - Save to user_profiles

3. app/(auth)/profile/page.tsx
   - View/edit profile
   - Show engagement stats
```

**End of Week 3 Deliverables:**
- ✅ User signup/login with Google and email
- ✅ Support/Oppose voting works
- ✅ Bookmarking works
- ✅ User profiles

---

### Week 4: Comments & Reviews

#### Person A: Comment UI

```
Create the comment/discussion system UI:

1. components/comments/CommentThread.tsx
   - Display threaded comments
   - Reply functionality
   - Like button
   - Show user avatars and timestamps
   - Load more / pagination

2. components/comments/CommentInput.tsx
   - Textarea with character count
   - Submit button
   - Show warning if content might be flagged (we'll add moderation later)

3. Integrate into the legislation detail page
```

#### Person B: Comments Backend

```
Create the comments backend:

1. app/actions/comments.ts
   - addComment(legislationId, body, parentCommentId?)
   - likeComment(commentId)
   - reportComment(commentId, reason)

2. Add moderation check before posting:
   - Call OpenAI Moderation API (it's free)
   - If flagged, either reject or queue for review
   - Create lib/moderation/check.ts

3. API route to fetch comments:
   - app/api/legislation/[id]/comments/route.ts
   - Return threaded structure
   - Include user info and like counts
```

**End of Week 4 Deliverables:**
- ✅ Users can comment on legislation
- ✅ Threaded replies work
- ✅ Like/report functionality
- ✅ Basic moderation prevents harmful content

---

### Week 5: AI Summaries & Polish

#### Person B: AI Integration

```
Add AI-generated summaries for legislation:

1. lib/ai/summarize.ts
   - Use Claude API (Anthropic)
   - Generate plain-language summary
   - Generate impact analysis
   - Extract topic tags

2. Add to sync job:
   - After syncing new legislation, generate AI summary
   - Save to legislation.ai_summary, ai_impact, ai_tags

3. Create manual trigger:
   - app/api/admin/generate-summaries/route.ts
   - Regenerate summaries for legislation without them
```

#### Person A: Polish & UX

```
Polish the UI:

1. Homepage (app/page.tsx):
   - Hero section
   - Trending legislation
   - Recent activity feed
   - Quick stats

2. Council Members pages:
   - app/(public)/council-members/page.tsx - List all
   - app/(public)/council-members/[slug]/page.tsx - Detail with their bills

3. Navigation:
   - components/layout/Header.tsx - With search, user menu
   - components/layout/MobileNav.tsx - Mobile drawer

4. Loading states:
   - Add loading.tsx files
   - Skeleton components

5. Error handling:
   - error.tsx files
   - 404 page
```

**End of Week 5 Deliverables:**
- ✅ AI summaries on legislation
- ✅ Polished homepage
- ✅ Council member pages
- ✅ Good loading/error states

---

### Week 6: Trending, Following, Notifications

#### Person B: Trending Algorithm

```
Implement the trending system:

1. Create a function to refresh the legislation_stats materialized view:
   - app/api/cron/refresh-stats/route.ts
   - Run every 15 minutes via Vercel cron

2. Trending page:
   - app/(public)/trending/page.tsx
   - Show top 20 by engagement in last 24h, 7d

3. Add engagement logging:
   - Log views, votes, comments to engagement_events table
   - Use this data for trending calculation
```

#### Person A: Following System

```
Create the following system:

1. components/council/FollowButton.tsx
   - Follow/unfollow council members
   - Saves to legislator_follows table

2. components/topics/FollowTopicButton.tsx
   - Follow topics
   - Saves to topic_follows table

3. app/(auth)/following/page.tsx
   - Show all followed council members and topics
   - Feed of recent legislation from followed

4. app/(auth)/bookmarks/page.tsx
   - Show all bookmarked legislation
```

#### Person B: Email Notifications (Basic)

```
Set up basic email notifications:

1. Use Resend (free tier: 3k emails/month)
   - Sign up at resend.com
   - Get API key

2. lib/email/send.ts
   - Send email via Resend API

3. app/api/cron/send-digests/route.ts
   - Daily digest of activity on followed items
   - Run once per day

4. Simple notification preferences in user profile
```

**End of Week 6 Deliverables:**
- ✅ Trending page with real data
- ✅ Follow council members and topics
- ✅ Bookmarks page
- ✅ Basic email notifications

---

### Week 7: Admin & Testing

#### Person B: Admin Dashboard

```
Create a simple admin area:

1. app/(admin)/admin/page.tsx
   - Overview stats
   - Require admin role

2. app/(admin)/admin/moderation/page.tsx
   - View flagged comments/reviews
   - Approve/reject actions
   - See moderation queue

3. app/(admin)/admin/sync/page.tsx
   - Trigger manual sync
   - View sync logs
   - See last sync status

Protect with role check (add is_admin to user_profiles)
```

#### Person A: Testing & Bug Fixes

```
Help me test and fix issues:

1. Test all user flows:
   - Sign up → Browse → Vote → Comment → Bookmark
   - Follow council member → See in feed
   
2. Mobile responsiveness check
   - Test on iPhone and Android sizes
   
3. Performance check
   - Add loading states where needed
   - Optimize images
   
4. Accessibility basics
   - Proper labels
   - Keyboard navigation
   - Color contrast
```

**End of Week 7 Deliverables:**
- ✅ Admin dashboard
- ✅ All major bugs fixed
- ✅ Mobile-friendly
- ✅ Basic accessibility

---

### Week 8: Launch Prep

#### Both Together:

1. **Content:**
   - Write community guidelines page
   - Write about page
   - Write FAQ
   - Add privacy policy (use a template)

2. **Domain:**
   - Buy domain (civicpulsenyc.com or similar)
   - Configure in Vercel

3. **Final Testing:**
   - Invite 5-10 friends to beta test
   - Fix any reported issues

4. **Analytics:**
   - Set up Vercel Analytics (free)
   - Add basic event tracking

5. **Launch!**
   - Post on social media
   - Share with NYC civic groups
   - Submit to local tech blogs

---

## 📁 File Structure Reference

```
legislative-tracker/
├── CLAUDE.md               # Context file for Claude Code
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── moderation/page.tsx
│   │       └── sync/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── bookmarks/page.tsx
│   │   ├── following/page.tsx
│   │   └── settings/page.tsx
│   ├── (public)/
│   │   ├── legislation/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── council-members/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── trending/page.tsx
│   │   ├── topics/
│   │   │   └── [slug]/page.tsx
│   │   └── hearings/page.tsx
│   ├── api/
│   │   ├── cron/
│   │   │   ├── sync-legislation/route.ts
│   │   │   ├── refresh-stats/route.ts
│   │   │   └── send-digests/route.ts
│   │   ├── legislation/
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── comments/route.ts
│   │   ├── moderation/
│   │   │   └── check/route.ts
│   │   └── admin/
│   │       └── generate-summaries/route.ts
│   ├── auth/
│   │   └── callback/route.ts
│   ├── actions/
│   │   ├── engagement.ts
│   │   ├── comments.ts
│   │   └── profile.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                 # shadcn components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   ├── legislation/
│   │   ├── LegislationCard.tsx
│   │   ├── LegislationDetail.tsx
│   │   ├── LegislationFilters.tsx
│   │   ├── StanceButtons.tsx
│   │   ├── BookmarkButton.tsx
│   │   └── HistoryTimeline.tsx
│   ├── comments/
│   │   ├── CommentThread.tsx
│   │   ├── CommentInput.tsx
│   │   └── CommentItem.tsx
│   ├── council/
│   │   ├── CouncilMemberCard.tsx
│   │   └── FollowButton.tsx
│   └── engagement/
│       ├── TrendingList.tsx
│       └── ActivityFeed.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── legistar/
│   │   ├── client.ts
│   │   ├── sync.ts
│   │   └── types.ts
│   ├── ai/
│   │   └── summarize.ts
│   ├── moderation/
│   │   └── check.ts
│   ├── email/
│   │   └── send.ts
│   └── utils/
│       ├── dates.ts
│       └── formatting.ts
├── hooks/
│   ├── useUser.ts
│   ├── useLegislation.ts
│   └── useStance.ts
├── types/
│   └── database.ts
├── public/
├── .env.local
├── middleware.ts
├── vercel.json
└── package.json
```

---

## 🔄 Daily Workflow

### Morning Standup (5 min, async or call)

Share in a Slack/Discord channel:
```
Yesterday: What I built
Today: What I'm building
Blockers: Any issues
```

### Working with Claude Code in VS Code

**Setup (do this once):**

1. Install the **Claude Code extension** in VS Code
2. Open the `legislative-tracker` folder in VS Code
3. Make sure CLAUDE.md is in your project root
4. Claude Code will read it automatically for context

**Start each session:**

1. Open VS Code with the legislative-tracker project
2. Open relevant files in tabs (Claude can see open files)
3. Open Claude Code panel (Cmd/Ctrl + Shift + P → "Claude Code")
4. Start asking questions!

**Good prompts for Claude Code in VS Code:**

```
Look at my open files and help me fix the TypeScript error 
on line 45 of StanceButtons.tsx
```

```
Based on the patterns in components/legislation/, create a new 
BookmarkButton component that toggles bookmark state.
```

```
Check my CLAUDE.md for the database schema, then help me write
a Supabase query to fetch legislation with sponsors and vote counts.
```

```
@workspace How is authentication currently implemented? I need 
to add a protected route.
```

**Using @workspace:**
- Type `@workspace` to let Claude search your entire project
- Useful for understanding existing patterns
- Example: `@workspace show me how we're fetching data from Supabase`

**End each session:**

```bash
# Commit your work
git add .
git commit -m "feat: add [feature name]"
git push origin main

# Or create a branch for big features
git checkout -b feature/comments
# ... work ...
git push origin feature/comments
# Then create Pull Request on GitHub
```

### Weekly Sync (30 min call)

- Demo what you built
- Review any PRs together
- Plan next week's priorities
- Address any technical debt

---

## 🆘 Getting Unstuck

### If you see an error in VS Code:

1. Open the file with the error
2. Select the error line(s)
3. Open Claude Code and ask:
```
I'm getting this error: [paste error from Problems panel]
Can you help me fix it?
```

### If you're not sure how to approach something:

```
I need to implement [feature].

Check my CLAUDE.md for the tech stack and database schema.
What's the best approach? Show me step by step.
```

### If something isn't working but no error:

```
This feature isn't working as expected.

Expected: [what should happen]
Actual: [what's happening]

The relevant code is in [filename]. Can you help me debug?
```

### Using @workspace for context:

```
@workspace How do other components handle loading states? 
I need to add one to my new component.
```

```
@workspace Find all places where we call the Supabase API. 
I want to understand the patterns we're using.
```

---

## 📊 Success Metrics

Track these to know you're on track:

| Week | Milestone | How to Verify |
|------|-----------|---------------|
| 1 | Data syncing | See real legislation in Supabase |
| 2 | Core pages work | Browse and view legislation at preview URL |
| 3 | Auth works | Can sign up and vote |
| 4 | Comments work | Can have threaded discussions |
| 5 | AI summaries appear | Plain-language summaries on bills |
| 6 | Trending works | Dynamic trending page |
| 7 | Admin works | Can moderate content |
| 8 | Launched! | Friends can use the real app |

---

## 💰 Cost Tracking

| Service | Free Tier | When You Pay | Estimated Cost |
|---------|-----------|--------------|----------------|
| Vercel | 100GB bandwidth | 10k+ daily users | $20/mo |
| Supabase | 500MB + 50k users | After MVP | $25/mo |
| Anthropic (Claude) | N/A | From start | $20-50/mo |
| OpenAI Moderation | Unlimited | Never | Free |
| Resend | 3k emails/mo | More emails | $20/mo |
| Domain | N/A | From launch | $15/year |
| **MVP Total** | | | **~$50-100/mo** |

---

## 🚀 Post-MVP Enhancements

Once your MVP is launched and you're seeing real usage, here are the key improvements to implement. These are ordered by typical need - you probably won't need all of them, so implement based on actual pain points.

---

### 📈 Phase 1: Redis/Valkey Caching (When: 5k+ active users OR slow page loads)

#### When You Need This

| Symptom | Solution |
|---------|----------|
| Trending page loads slowly (>500ms) | Cache trending data |
| Homepage feels sluggish | Cache aggregated stats |
| Database CPU spiking | Reduce repeated queries |
| Same data fetched repeatedly | Cache hot data |

#### Recommended Service: Upstash Redis

**Why Upstash:**
- Serverless (no server management)
- Pay-per-request pricing
- Free tier: 10k commands/day
- Works perfectly with Vercel Edge
- Redis-compatible (can switch to Valkey later)

**Cost:** Free → $10-30/month at scale

#### Setup Steps

**1. Create Upstash Account:**
```
1. Go to https://upstash.com
2. Sign up with GitHub
3. Create new Redis database
4. Select region: US-East-1 (closest to your Vercel deployment)
5. Copy the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
```

**2. Add Environment Variables:**
```bash
# Add to .env.local and Vercel
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
```

**3. Install Package:**
```bash
npm install @upstash/redis
```

**4. Create Redis Client:**

```typescript
// lib/redis/client.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache helper with automatic expiration
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string, 
  value: T, 
  expirationSeconds: number = 300 // 5 min default
): Promise<void> {
  try {
    await redis.set(key, value, { ex: expirationSeconds });
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
}
```

**5. Implement Caching Pattern:**

```typescript
// lib/legislation/trending.ts
import { cacheGet, cacheSet } from '@/lib/redis/client';
import { createServerClient } from '@/lib/supabase/server';

const TRENDING_CACHE_KEY = 'trending:legislation:top20';
const TRENDING_CACHE_TTL = 300; // 5 minutes

export async function getTrendingLegislation() {
  // Try cache first
  const cached = await cacheGet<TrendingLegislation[]>(TRENDING_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from database
  const supabase = createServerClient();
  const { data } = await supabase
    .from('legislation_stats')
    .select('*')
    .order('trending_score', { ascending: false })
    .limit(20);

  // Store in cache
  if (data) {
    await cacheSet(TRENDING_CACHE_KEY, data, TRENDING_CACHE_TTL);
  }

  return data;
}

// Call this when votes/comments change to invalidate cache
export async function invalidateTrendingCache() {
  await cacheDelete(TRENDING_CACHE_KEY);
}
```

**6. What to Cache:**

| Data | Cache TTL | Invalidation |
|------|-----------|--------------|
| Trending legislation | 5 minutes | On vote/comment |
| Homepage stats | 15 minutes | On any engagement |
| Council member list | 1 hour | On sync |
| Legislation detail | 10 minutes | On status change |
| User session data | 30 minutes | On logout |

**7. Cache Invalidation Strategy:**

```typescript
// In your server actions, invalidate relevant caches
// app/actions/engagement.ts

export async function setStance(legislationId: string, stance: string) {
  const supabase = createServerClient();
  
  // ... save to database ...
  
  // Invalidate caches
  await Promise.all([
    cacheDelete(`legislation:${legislationId}`),
    cacheDelete('trending:legislation:top20'),
    cacheDelete('stats:homepage'),
  ]);
  
  revalidatePath('/');
  revalidatePath('/trending');
}
```

#### Valkey Alternative

Valkey is an open-source Redis fork. If you want to self-host or avoid Redis licensing:

```typescript
// Valkey is wire-compatible with Redis
// Just point to your Valkey server instead
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.VALKEY_URL!, // Your Valkey server
  token: process.env.VALKEY_TOKEN!,
});
```

**Hosted Valkey options:**
- AWS ElastiCache (supports Valkey)
- Railway (can deploy Valkey container)
- Render (Valkey as a service)

---

### 🔄 Phase 2: GitHub Actions CI/CD (When: Team grows OR need automated testing)

#### When You Need This

| Symptom | Solution |
|---------|----------|
| Bugs slipping into production | Add automated tests |
| Inconsistent code style | Add linting checks |
| Type errors discovered late | Add type checking |
| Want faster feedback on PRs | Parallel CI checks |

#### Complete CI/CD Setup

**1. Create Workflow File:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  # ============================================
  # Code Quality Checks
  # ============================================
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript type check
        run: npm run type-check

      - name: ESLint
        run: npm run lint

      - name: Prettier format check
        run: npm run format:check

  # ============================================
  # Unit & Integration Tests
  # ============================================
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality  # Only run if quality passes
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          # Use test/mock values for CI
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        if: always()
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: false

  # ============================================
  # Build Check
  # ============================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  # ============================================
  # Security Audit
  # ============================================
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Audit dependencies
        run: npm audit --audit-level=high
        continue-on-error: true  # Don't fail build, just report

      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

**2. Add Required package.json Scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**3. Setup Testing (Vitest):**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
```

**4. Example Test:**

```typescript
// tests/components/LegislationCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LegislationCard } from '@/components/legislation/LegislationCard';

describe('LegislationCard', () => {
  const mockLegislation = {
    id: '1',
    fileNumber: 'Int 0209-2024',
    slug: 'int-0209-2024',
    title: 'Test Legislation Title',
    status: 'Committee',
    introDate: '2024-01-01',
    supportCount: 100,
    opposeCount: 20,
  };

  it('renders legislation title', () => {
    render(<LegislationCard legislation={mockLegislation} />);
    expect(screen.getByText('Test Legislation Title')).toBeInTheDocument();
  });

  it('renders file number', () => {
    render(<LegislationCard legislation={mockLegislation} />);
    expect(screen.getByText('Int 0209-2024')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<LegislationCard legislation={mockLegislation} />);
    expect(screen.getByText('Committee')).toBeInTheDocument();
  });
});
```

**5. Branch Protection Rules:**

Go to GitHub → Settings → Branches → Add rule:

```
Branch name pattern: main

☑️ Require a pull request before merging
   ☑️ Require approvals: 1
   ☑️ Dismiss stale pull request approvals when new commits are pushed
   
☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
   
   Required status checks:
   ├── CI / Code Quality
   ├── CI / Tests  
   ├── CI / Build
   └── Vercel – legislative-tracker

☑️ Require conversation resolution before merging

☑️ Do not allow bypassing the above settings
```

**6. PR Workflow After Setup:**

```
Developer opens PR
       │
       ▼
┌─────────────────────────────────────────┐
│           GitHub Actions                 │
├─────────────────────────────────────────┤
│  ├── ✅ Code Quality (lint, types)      │
│  ├── ✅ Tests (unit, integration)       │
│  ├── ✅ Build (verify it compiles)      │
│  └── ⚠️ Security Audit (advisory)       │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│              Vercel                      │
├─────────────────────────────────────────┤
│  └── ✅ Preview Deployment               │
│       https://civicpulse-pr-42.vercel.app│
└─────────────────────────────────────────┘
       │
       ▼
All checks pass → Ready for review → Merge → Auto-deploy to production
```

---

### 🔐 Phase 3: Secure Secrets Management (When: Team grows beyond 2 OR handling sensitive user data)

#### Why Upgrade from Encrypted Google Doc

| Risk | Impact |
|------|--------|
| Shared doc gets compromised | All secrets exposed |
| No access audit trail | Don't know who accessed what |
| No secret rotation | Old secrets never expire |
| Copy/paste errors | Wrong secrets in wrong places |
| Person leaves team | Manual secret rotation needed |

#### Option 1: 1Password (Recommended for Small Teams)

**Best for:** Teams of 2-10, simple setup, excellent UX

**Cost:** $7.99/user/month (Teams plan)

**Setup:**

```
1. Create 1Password Teams account
2. Create a vault called "CivicPulse NYC"
3. Add all environment variables as "Password" items
4. Invite team members to vault
5. Use 1Password CLI for automation
```

**Structure your vault:**

```
Legislative Tracker Vault
├── Production
│   ├── Supabase (URL, anon key, service key)
│   ├── API Keys (Anthropic, OpenAI, Legistar)
│   ├── Redis (URL, token)
│   └── Resend (API key)
├── Development
│   ├── Supabase Dev (separate project)
│   └── API Keys (can be same or different)
└── Shared
    ├── Domain registrar login
    └── Vercel team access
```

**1Password CLI Integration:**

```bash
# Install CLI
brew install 1password-cli

# Sign in
op signin

# Get a secret
op read "op://Legislative Tracker/Production/Supabase/SUPABASE_URL"

# Inject secrets into .env.local
op inject -i .env.template -o .env.local
```

**.env.template (checked into git):**
```bash
# Template with 1Password references
NEXT_PUBLIC_SUPABASE_URL=op://Legislative Tracker/Production/Supabase/url
NEXT_PUBLIC_SUPABASE_ANON_KEY=op://Legislative Tracker/Production/Supabase/anon_key
SUPABASE_SERVICE_ROLE_KEY=op://Legislative Tracker/Production/Supabase/service_role_key
ANTHROPIC_API_KEY=op://Legislative Tracker/Production/API Keys/anthropic
```

#### Option 2: Doppler (Recommended for Growing Teams)

**Best for:** Teams that want centralized secrets management with CI/CD integration

**Cost:** Free for up to 5 users, then $6/user/month

**Why Doppler:**
- Syncs directly to Vercel, GitHub Actions, etc.
- Environment-specific secrets (dev/staging/prod)
- Audit logs
- Secret rotation support
- No copy/paste needed

**Setup:**

```bash
# Install CLI
brew install dopplerhq/cli/doppler

# Login
doppler login

# Setup project
doppler setup

# Run with secrets injected
doppler run -- npm run dev
```

**Doppler Dashboard Structure:**

```
Legislative Tracker Project
├── Development
│   ├── NEXT_PUBLIC_SUPABASE_URL = https://dev-xxx.supabase.co
│   └── ...
├── Staging
│   ├── NEXT_PUBLIC_SUPABASE_URL = https://staging-xxx.supabase.co
│   └── ...
└── Production
    ├── NEXT_PUBLIC_SUPABASE_URL = https://prod-xxx.supabase.co
    └── ...
```

**Vercel Integration:**

```
1. Doppler Dashboard → Integrations → Vercel
2. Authorize Doppler to access Vercel
3. Map: Production config → Vercel Production
4. Map: Staging config → Vercel Preview
5. Secrets auto-sync!
```

**GitHub Actions Integration:**

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Doppler CLI
        uses: dopplerhq/cli-action@v3
        
      - name: Build with secrets
        run: doppler run -- npm run build
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

#### Option 3: HashiCorp Vault (Enterprise/Complex)

**Best for:** Large teams, compliance requirements, self-hosted needs

**Cost:** Free (open source) to $$$$ (enterprise)

**When to use:**
- You have compliance requirements (SOC2, HIPAA)
- Need dynamic secrets (auto-rotating database credentials)
- Multiple applications sharing secrets
- Self-hosted infrastructure

**This is overkill for CivicPulse MVP** - only consider if you scale significantly.

#### Option 4: GitHub Secrets + Vercel Environment Variables (Minimal Upgrade)

**Best for:** Keeping it simple, already using GitHub/Vercel

**Cost:** Free

**Setup:**

```
GitHub Repository
├── Settings → Secrets and variables → Actions
│   ├── SUPABASE_SERVICE_ROLE_KEY (for CI)
│   ├── DOPPLER_TOKEN (if using Doppler)
│   └── TEST_DATABASE_URL (for CI tests)

Vercel Project
├── Settings → Environment Variables
│   ├── Production
│   │   └── All production secrets
│   ├── Preview
│   │   └── Staging/test secrets
│   └── Development
│       └── Local dev secrets (optional)
```

**Pros:**
- No additional tools
- Secrets never in code or docs
- Role-based access via GitHub/Vercel teams

**Cons:**
- Secrets split between two places
- Manual sync if you change something
- No single audit log

#### Recommendation by Team Stage

| Stage | Recommendation | Why |
|-------|----------------|-----|
| **MVP (2 people)** | 1Password Teams | Simple, secure, good UX |
| **Growing (3-10 people)** | Doppler | Auto-sync, audit logs, free tier |
| **Scale (10+ people)** | Doppler or Vault | Compliance, dynamic secrets |

#### Migration Path from Google Doc

**Week 1: Setup**
```
1. Choose 1Password or Doppler
2. Create account and invite teammate
3. Import all secrets from Google Doc
4. Verify everything works locally
```

**Week 2: CI/CD Integration**
```
1. Update GitHub Actions to use new secret source
2. Update Vercel to sync from new source
3. Test a full deploy
```

**Week 3: Cleanup**
```
1. Rotate all secrets (generate new ones)
2. Update everywhere with new values
3. Delete the Google Doc permanently
4. Remove any local .env files from backups
```

---

### 💰 Post-MVP Cost Summary

| Phase | Service | Monthly Cost |
|-------|---------|--------------|
| **Caching** | Upstash Redis | Free → $10-30 |
| **CI/CD** | GitHub Actions | Free (2,000 min/mo) |
| **Secrets** | 1Password Teams | $8/user |
| **Secrets** | Doppler (alternative) | Free → $6/user |
| | | |
| **Total (2 people)** | | **~$30-60/mo additional** |

---

### 📋 Post-MVP Implementation Checklist

#### Phase 1: Caching (Week 1-2 post-launch)
- [ ] Sign up for Upstash Redis
- [ ] Add environment variables
- [ ] Create Redis client utility
- [ ] Cache trending legislation
- [ ] Cache homepage stats
- [ ] Add cache invalidation to server actions
- [ ] Monitor cache hit rates in Upstash dashboard

#### Phase 2: GitHub Actions (Week 2-3 post-launch)
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add testing framework (Vitest)
- [ ] Write tests for critical components
- [ ] Add package.json scripts
- [ ] Configure branch protection rules
- [ ] Test full PR workflow

#### Phase 3: Secrets Management (Week 3-4 post-launch)
- [ ] Choose provider (1Password or Doppler)
- [ ] Create account and structure
- [ ] Migrate all secrets
- [ ] Integrate with CI/CD
- [ ] Rotate all secrets
- [ ] Delete old Google Doc
- [ ] Document new secrets workflow

---

## 🎉 You're Ready!

You now have:
1. ✅ Complete architecture plan
2. ✅ Week-by-week implementation guide
3. ✅ Clear role division
4. ✅ Collaboration workflow
5. ✅ File structure reference
6. ✅ Troubleshooting tips for Claude Code in VS Code
7. ✅ Post-MVP scaling guide (caching, CI/CD, secrets)

**Next step:** Schedule a 2-hour session together to do the Day 1 setup. Once that's done, you can work independently and sync weekly.

Good luck building Legislative Tracker! 🗽
