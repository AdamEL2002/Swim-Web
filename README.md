# Barnet Premier Swim

Static website for Barnet Premier Swim, a swimming lesson provider in Barnet, North London.

Live site: https://www.barnetpremierswim.com/

## What Is Included

- Single-page marketing site for swimming lessons
- Local SEO metadata and structured data
- Pricing, timetable, FAQ, location, WhatsApp contact, and enquiry form sections
- FormSubmit enquiry handling
- GitHub Pages custom domain support

## Editing The Site

The site is built with plain HTML, CSS, and JavaScript:

- `index.html` contains the page content and SEO metadata
- `styles.css` contains visual styling
- `script.js` contains menu, FAQ, scroll shadow, and reveal interactions
- `thanks.html` is shown after a successful form submission
- `images/` contains the logo and pool image

No build step is required. Open `index.html` in a browser to preview local changes.

## Deployment

The repository is ready for GitHub Pages. The `CNAME` file points the site to:

```txt
www.barnetpremierswim.com
```

If the domain changes, update `CNAME`, `robots.txt`, `sitemap.xml`, canonical links, and social metadata URLs.

## Enquiry Form

The registration form posts to FormSubmit:

```txt
https://formsubmit.co/adamelassri2002@gmail.com
```

After submission, visitors are sent to `thanks.html`.

