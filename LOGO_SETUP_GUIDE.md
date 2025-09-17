# Adding Your Logo to Community Connect

## Step 1: Prepare Your Logo
1. Save your logo file in: `C:/python/Community_connect/frontend/src/assets/images/`
2. Recommended filename: `logo.png`, `logo.svg`, or `logo.jpg`
3. Recommended size: 32x32px to 64x64px (or vector SVG for scalability)

## Step 2: Update the Logo Component
1. Open: `frontend/src/components/Layout/Logo.js`
2. Uncomment line 3 and update the path to your logo:
   ```javascript
   import logoImage from '../../assets/images/logo.png'; // Change to your logo filename
   ```
3. Uncomment lines 15-19 (the img tag) and comment out lines 21 (the placeholder div):
   ```javascript
   <img 
     src={logoImage} 
     alt="Community Connect Logo" 
     className={`${sizeClasses[size]} object-contain ${showText ? 'mr-3' : ''}`}
   />
   // <div className={`${sizeClasses[size]} bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg ${showText ? 'mr-3' : ''}`}></div>
   ```

## Step 3: Test Your Logo
1. Start the frontend server:
   ```bash
   cd frontend && npm start
   ```
2. Check your logo appears in:
   - Navigation bar (top of every page)
   - Footer (bottom of every page)

## Logo Component Usage
The Logo component supports different sizes and configurations:
- `<Logo />` - Default size with text
- `<Logo size="large" />` - Large logo with text
- `<Logo showText={false} />` - Logo only, no text
- `<Logo size="small" showText={false} />` - Small logo only

## File Locations
- Logo Component: `frontend/src/components/Layout/Logo.js`
- Navbar: `frontend/src/components/Layout/Navbar.js`
- Footer: `frontend/src/components/Layout/Footer.js`
- Assets Directory: `frontend/src/assets/images/`