# Tech Masters Academy

Clickable prototype of the academy desk from the Tech Masters proposal: enquiries, admissions and fees, expenses, internal placements, consultancy, reports, staff access and an audit trail.

Records live in the browser tab and reset on refresh. Sign in with any demo account using the password `demo1234`.

From the `front-end` directory:

```bash
npm install
npm run dev
```

The app is a progressive web app. `next-pwa` generates the production service worker on `npm run build`. A small worker in `public/sw.js` keeps the install prompt available while developing.
