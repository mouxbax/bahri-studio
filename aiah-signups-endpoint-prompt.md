# AIAH · Public signups endpoint for bahri.studio integration

## Goal
Expose a tiny public API that returns the live AIAH signup count, so bahri.studio can fetch it and show a live counter on the AIAH case-study card. No PII, no user data, just a single integer.

## Stack reminder
Next.js 14 App Router · TypeScript · Supabase + Prisma · Vercel.

## Build

Create a new App Router route handler at `app/api/public/signups/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust import path to your Prisma client

// Cache the response for 60 seconds at the edge so the DB isn't hit every page load
export const revalidate = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.bahri.studio',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export async function GET() {
  try {
    // Use whichever model represents a signed-up user in your schema.
    // Most common: User. If you have a separate Waitlist table, sum both.
    const count = await prisma.user.count();

    return NextResponse.json(
      { count, updated_at: new Date().toISOString() },
      { headers: CORS_HEADERS, status: 200 }
    );
  } catch (err) {
    // Fail soft: bahri.studio's fetcher silently ignores errors
    return NextResponse.json(
      { error: 'unavailable' },
      { headers: CORS_HEADERS, status: 503 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS, status: 204 });
}
```

## What to verify before pushing

1. **Adjust the Prisma model:** if your signup-equivalent model isn't `user`, change `prisma.user.count()` accordingly. Check `prisma/schema.prisma`.
2. **Confirm CORS origin:** `https://www.bahri.studio` (with `www`, no trailing slash). If bahri.studio also serves at the apex `https://bahri.studio`, either change to dynamic origin check or add both.
3. **Auth:** this endpoint should NOT require authentication. Make sure your `middleware.ts` doesn't gate the `/api/public/*` path.
4. **No PII:** only the count is returned. Do not add user emails, names, or IDs.

## Test it

After deploy:

```bash
curl -i https://aiah.app/api/public/signups
```

Expected:
- Status `200`
- Header `Access-Control-Allow-Origin: https://www.bahri.studio`
- Header `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- Body: `{"count": <integer>, "updated_at": "<iso timestamp>"}`

Cross-origin smoke test from bahri.studio:

```bash
curl -i -H "Origin: https://www.bahri.studio" https://aiah.app/api/public/signups
```

Should still return 200 with the CORS header.

## After it's live

Tell Moustafa the endpoint is live. The bahri.studio site will auto-pick up the count on the next page load. The signup metric on the AIAH case-study card stays hidden until count reaches the threshold set on bahri.studio (currently 25 signups; adjustable in `app.js`).

## Why this design

- 60-second cache means DB takes hit at most once per minute even at high traffic
- CORS locked to bahri.studio so the count can't be scraped from anywhere else
- Fails soft with 503: bahri.studio's fetcher catches it and the metric stays hidden, page renders normally
- No PII exposed, GDPR-safe
- Pure read, idempotent, no rate limit needed
