## How to Add Your Company Logo

### Option 1: Use Your Own Logo File

1. **Add your logo image** to the `public` folder:
   - Save your logo as `public/logo.png` (or `.svg` for best quality)
   - Recommended size: 200x200px or larger

2. **Update the Navbar component** to use your logo instead of the icon.

3. **Update the Login page** to show your logo.

### Option 2: Use a Simple SVG Icon (Current Approach)

The platform currently uses a Shield icon from Lucide React. You can:
- Replace it with a different icon from [lucide.dev](https://lucide.dev)
- Or upload your custom logo image

---

## Files to Modify

I'll update these files to support logo images:
1. `components/layout/Navbar.tsx` - Main navigation
2. `app/login/page.tsx` - Login screen
