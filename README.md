# NeuroBridge

An accessible learning platform for neurodivergent learners (autism, ADHD, dyslexia, Down syndrome) that connects students, parents, teachers and school admins around everyday life skills.

Built as a final-year engineering project.

**Live demo:** [your Vercel link]

## Demo logins

These use a separate demo school with sample data.

| Role | Login | PIN |
|------|-------|-----|
| Student (individual) | [demo phone] | [pin] |
| Student (school) | [demo enrollment code] | [pin] |
| Parent | Same details as the student | |
| Teacher | [demo teacher email] | [pin] |
| Admin | [demo admin email] | [pin] |

## Features

- **Screening:** a short picture-based check across 8 life-skill areas that decides where each learner starts.
- **Learning paths:** video lessons that unlock one by one, followed by a unit mastery check.
- **Practice activities:** picture-based questions with hints and read-aloud. A Gemini call picks the next activity from the student's weak areas, with a rule-based fallback when the API is unavailable.
- **AAC talk board:** learners build sentences from picture cards and hear them spoken (Web Speech API, Indian English voice). Next-card suggestions come from a small Markov-chain transition table.
- **Streaks, XP and badges:** all calculated from activity history, with no extra tables.
- **Parent–teacher messaging and teacher observations:** each parent can only reach teachers at their child's school.
- **Multi-school curriculum:** 8 shared default subjects. Each school can add its own subjects, lessons and activities, and override the mastery quizzes and screening.
- **Accessibility toolbar:** high contrast, text size, reading guide and reduced motion. Atkinson Hyperlegible and Lexend fonts, 48px touch targets, and keyboard focus styles throughout.

## Tech stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL) · Google Gemini API · Vercel

## How security works

- **Login:** custom PIN login (no third-party auth). PINs are hashed with bcrypt; older plaintext PINs are upgraded on first login.
- **Sessions:** HMAC-SHA256 signed, httpOnly cookies, one role per browser.
- **Database access:** only from the server, using the Supabase service-role key. Row Level Security is enabled with no public policies, so the public API key can't read any table.
- **Identity checks:** every server action takes the user's identity from the session cookie, never from browser input. Teachers and admins are limited to their own school.
- **Server-side grading:** practice activities and mastery checks are graded on the server, and correct answers are never sent to the browser.
- **Known limitation:** the screening check is still scored in the browser. It is a placement tool, not a grade.

## Run locally

```bash
git clone https://github.com/sumitmuley95/neurobridge.git
cd neurobridge
npm install
```

Create `.env.local`:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key
SESSION_SECRET=any-random-string-of-32-or-more-characters
GEMINI_API_KEY=your-gemini-key   # optional; falls back to rule-based picks
```

```bash
npm run dev
```

Open http://localhost:3000.

## Project structure

```
src/
  app/
    actions/      server actions (auth, learning, mastery, curriculum, messages…)
    student/      student portal
    parent/       parent portal
    teacher/      teacher portal
    admin/        school admin portal
  components/     UI components
  lib/
    aac/          AAC cards, predictor, sentence former, speech
    ai/           Gemini recommendation
    session.ts    signed session cookies
    curriculum.ts which subjects/quizzes a learner sees
  proxy.ts        route protection per portal
```

## Possible next steps

- Grade the screening on the server
- Rate-limit login attempts
- Add automated tests for the streak, scoring and AAC logic

## License

All rights reserved. Final-year academic project.