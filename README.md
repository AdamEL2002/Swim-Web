# Barnet Premier Swim

Static website for Barnet Premier Swim, a swimming lesson provider in Barnet, North London.

Live site: https://www.bpswim.com/

## What Is Included

- Single-page marketing site for swimming lessons
- Local SEO metadata and structured data
- Pricing, timetable, FAQ, location, WhatsApp contact, and enquiry form sections
- Web3Forms enquiry and enrolment handling
- Firebase parent portal for private swimmer progress updates
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
3. Push the website changes and create an account through `https://www.bpswim.com/portal.html` using the BPSwim instructor email.
4. Verify the email address from the Firebase email.
5. In Firestore, open the `users` collection, select that account's document, and change its `role` field from `parent` to `admin`.

Parents can then create their own accounts. An instructor can link a swimmer to a registered parent from the instructor area. Parents can only read swimmer records linked to their own verified account; only an admin can create or update progress.
