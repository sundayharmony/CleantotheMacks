# Clean To The Mack's - Static HTML Website

A complete static HTML website for Clean To The Mack's cleaning company. All pages can be opened directly in a browser - no server or build process required!

## Features

- **All Pages**: Home, Our Work (Gallery), Membership/Pricing, Book Deep Clean (Intake Form), Sign In/Sign Up, Dashboard
- **Responsive Design**: Mobile-first design that works on all devices
- **Mobile Menu**: Functional hamburger menu for mobile navigation
- **Brand Colors**: Blue color scheme matching your logo
- **Interactive Elements**: Form validation, gallery filtering, tab switching

## File Structure

```
clean-to-the-macks-html/
├── index.html              # Home page
├── our-work.html           # Gallery page with category filters
├── book-deep-clean.html    # Intake form page
├── membership.html         # Membership/pricing page
├── signin.html             # Sign in/Sign up page
├── dashboard.html          # User dashboard (static example)
├── css/
│   └── styles.css          # Custom styles
├── js/
│   └── main.js             # JavaScript for interactivity
└── images/
    └── logo.png            # Company logo
```

## How to Use

### Option 1: Open Directly in Browser

1. Navigate to the `clean-to-the-macks-html` folder
2. Double-click `index.html` to open in your default browser
3. All pages will work - just click the navigation links!

### Option 2: Use a Local Server (Recommended)

For the best experience, use a simple local server:

**Using Python:**
```bash
cd clean-to-the-macks-html
python -m http.server 8000
```
Then open: `http://localhost:8000`

**Using Node.js (http-server):**
```bash
npx http-server clean-to-the-macks-html -p 8000
```

**Using PHP:**
```bash
cd clean-to-the-macks-html
php -S localhost:8000
```

## Pages

- **index.html** - Home page with hero, services, testimonials, and FAQ
- **our-work.html** - Gallery with category filters (Kitchen, Bathroom, Whole Home, Move-Out)
- **book-deep-clean.html** - Deep clean intake form (shows success message on submit)
- **membership.html** - Three membership plans (Basic, Premium, Enterprise)
- **signin.html** - Sign in/Sign up page with tab switching
- **dashboard.html** - User dashboard with membership status and request history

## Features & Limitations

### What Works:
✅ All pages and navigation
✅ Responsive mobile menu
✅ Form validation
✅ Gallery category filtering
✅ Success messages
✅ All styling and branding

### What Doesn't Work (Requires Backend):
❌ Real user authentication
❌ Database storage
❌ Form submissions to server
❌ Stripe payment processing
❌ Real-time data updates

### To Add Backend Functionality:

**Forms:**
- Use Formspree, Netlify Forms, or similar service
- Or add form action to submit to your server

**Payments:**
- Link to external Stripe Checkout pages
- Or integrate Stripe.js for client-side payments

**Authentication:**
- Use external auth service (Auth0, Firebase, etc.)
- Or implement your own backend

## Customization

### Change Colors:
Edit `css/styles.css` or modify Tailwind classes in HTML files.

### Add Real Images:
Replace placeholder gallery images in `our-work.html` with actual images.

### Update Content:
Edit any HTML file directly - all content is in plain HTML.

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Notes

- All pages use Tailwind CSS via CDN (no build step needed)
- Logo image should be in `images/logo.png`
- JavaScript handles mobile menu, forms, and gallery filtering
- Forms show success messages but don't actually submit (add backend for real submission)

## License

Private - All rights reserved

