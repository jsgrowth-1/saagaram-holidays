# Saagram – Manual test checklist (run on real devices)
Serve locally first: `python3 -m http.server 8000` in this folder, then open http://localhost:8000

## Layout (Chrome DevTools device toolbar + at least one real phone)
Widths: 360, 390, 430, 768, 1024, 1440. On every page check:
- [ ] No sideways scrolling; text readable; buttons easy to tap
- [ ] Hamburger menu opens/closes; links close it (below 1024px)
- [ ] Sticky header stays readable over hero and content
- [ ] Hero text readable over the photo; WhatsApp button never covers key buttons
- [ ] Rooms, Blog, Tourist grids: 1 column phone, 2 tablet, 3 laptop

## Functions
- [ ] Booking: empty submit shows errors; bad phone blocked; check-out before check-in blocked
- [ ] Booking valid: WhatsApp opens with all details; Enquire Now on a room preselects it
- [ ] Contact form opens WhatsApp; call/email buttons work on phone
- [ ] Rooms lightbox opens, Esc/click closes; Directions buttons open Google Maps
- [ ] Admin: edit price + upload photo; open Rooms in same browser and see them; Enquiries show booking copies
- [ ] Browser console: no red errors on any page

## Before launch
- [ ] Real photos added (file names are in the HTML), real blog text, verified distances, real reviews
- [ ] Replace www.example.com in canonical/OG tags and sitemap.xml
- [ ] Protect or remove /admin/ ; check with Lighthouse (aim 90+ mobile) and Google Rich Results Test
