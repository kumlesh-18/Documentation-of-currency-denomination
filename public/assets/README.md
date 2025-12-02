# Currency Denomination Distributor - Logo Assets

## Logo Variants

### 1. **logo.svg** (200×200px)
- **Usage:** Main logo, hero sections, splash screens
- **Format:** SVG (scalable vector graphics)
- **Colors:** Blue gradient (#2563eb to #1e40af)
- **Features:** 
  - Multi-currency symbols (₹, $, €)
  - Stylized currency bills
  - Distribution arrows
  - Professional drop shadow

### 2. **logo-small.svg** (64×64px)
- **Usage:** Sidebar header, navigation, small UI components
- **Format:** SVG optimized for small sizes
- **Colors:** Blue gradient matching main logo
- **Features:**
  - Simplified design for clarity at small sizes
  - Currency symbols (₹, $)
  - Compact bill representation
  - Optimized for 48-64px display

### 3. **favicon.svg** (32×32px)
- **Usage:** Browser tab icon, bookmarks, PWA icon
- **Format:** SVG favicon
- **Colors:** Solid blue (#2563eb) background
- **Features:**
  - Single currency symbol (₹)
  - Minimal bill indicator
  - Optimized for 16-32px display
  - Clear visibility at tiny sizes

## Design System

### Color Palette
```css
Primary Blue: #2563eb (Brand color)
Primary Dark: #1e40af (Gradient end)
Light Blue: #60a5fa (Accents)
Lighter Blue: #93c5fd (Highlights)
White: #ffffff (Text/details)
```

### Implementation

All pages include:
```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">

<!-- Sidebar Logo -->
<img src="./assets/logo-small.svg" alt="Currency Distributor Logo" style="width: 48px; height: 48px;">
```

### CSS Animations

Logo includes hover effects:
```css
.sidebar-header:hover img {
  transform: scale(1.05) rotate(3deg);
}
```

## Brand Identity

The logo represents:
- **Currency Symbols**: Multi-currency support (INR, USD, EUR)
- **Bills/Notes**: Denomination distribution functionality
- **Arrows**: Intelligent calculation and distribution algorithm
- **Gradient**: Modern, professional, tech-forward approach

## File Formats

All logos are SVG (Scalable Vector Graphics):
- ✅ Infinite scalability without quality loss
- ✅ Small file size (~2-4KB)
- ✅ CSS-animatable
- ✅ Retina-display ready
- ✅ No compression artifacts

## Usage Guidelines

### ✅ DO:
- Use on blue or white backgrounds
- Maintain aspect ratio when scaling
- Keep minimum size: 32px for logo-small, 16px for favicon
- Use provided color scheme

### ❌ DON'T:
- Distort or stretch logos
- Change brand colors
- Add effects that reduce clarity
- Use on low-contrast backgrounds
- Rotate beyond hover animation angles

---

**Created:** December 2, 2025  
**Version:** 1.0.0  
**Project:** Currency Denomination Distributor Documentation
