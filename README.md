# Barnet Premier Swim

Static website for Barnet Premier Swim, a swimming lesson provider in Barnet, North London.

Live site: https://www.bpswim.com/

## What Is Included

- Single-page marketing site for swimming lessons
- Local SEO metadata and structured data
- Pricing, timetable, FAQ, location, WhatsApp contact, and enquiry form sections
- Web3Forms enquiry and enrolment handling
- Firebase parent portal for private swimmer progress updates
- Swim England Stage 1-7 progress checklists with instructor-only editing
- GitHub Pages custom domain support

## Editing The Site

The site is built with plain HTML, CSS, and JavaScript:

- `index.html` contains the page content and SEO metadata
- `styles.css` contains visual styling
- `script.js` contains menu, FAQ, scroll shadow, and reveal interactions
- `thanks.html` is shown after a successful form submission
- `portal.html` and `portal.js` provide the parent and instructor portal
- `firebase-config.js` connects the portal to the BPSwim Firebase project
- `firestore.rules` contains the portal's database access rules
- `images/` contains the logo and pool image

No build step is required. Open `index.html` in a browser to preview local changes.

## Deployment

The repository is ready for GitHub Pages. The `CNAME` file points the site to:

```txt
www.bpswim.com
```

If the domain changes, update `CNAME`, `robots.txt`, `sitemap.xml`, canonical links, and social metadata URLs.

## Website Forms

The contact and enrolment forms submit through Web3Forms and redirect visitors to `thanks.html`.

## Parent Portal Setup

Before inviting parents to use the portal:

1. In Firebase Authentication settings, add `bpswim.com` and `www.bpswim.com` as authorised domains.
2. In Firestore Database, open **Rules**, replace the existing rules with the contents of `firestore.rules`, and publish them.
3. In Firebase Authentication, open **Users**, add the BPSwim instructor email with a secure password, and copy the new account's User UID.
4. In Firestore, create a `users` collection and a document whose ID is that User UID. Add `displayName` and `email` as string fields, then add `role` as a string field with the value `admin`.
5. Push the website changes and sign in at `https://www.bpswim.com/portal.html` using the instructor account.

An instructor creates each parent account from the private instructor area and chooses a temporary password to share privately. Parents can change it after signing in, and can request an email reset if they later forget it. The instructor can link a swimmer to that parent. Parents can only read swimmer records linked to their own account; only an admin can create accounts or update progress.
