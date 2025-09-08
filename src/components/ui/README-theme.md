# Theme System Documentation

## Overview
The ElectroBill application includes a comprehensive theme system that allows users to switch between light mode, dark mode, and system default themes.

## Features

### 🎨 Theme Options
- **Light Mode**: Clean, bright interface optimized for daytime use
- **Dark Mode**: Dark interface optimized for low-light environments
- **System Default**: Automatically follows the user's operating system theme preference

### 🔧 Components

#### ThemeProvider
- Wraps the entire application to provide theme context
- Manages theme state and persistence
- Handles system theme detection and updates

#### ThemeToggle
- Dropdown menu with all three theme options
- Visual indicators for current selection
- Accessible with proper ARIA labels

#### ThemeToggleCompact
- Alternative compact version for mobile
- Cycles through themes on click
- Space-efficient design

#### ThemeIndicator
- Shows current theme status
- Optional label display
- Useful for debugging or status displays

## Usage

### Basic Theme Toggle
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

### Using Theme Context
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Theme Provider Setup
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

## Theme Variables

The theme system uses CSS custom properties defined in `index.css`:

### Light Mode Variables
```css
:root {
  --background: 0 0% 98%;
  --foreground: 210 22% 22%;
  --primary: 210 100% 20%;
  --accent: 25 95% 53%;
  /* ... more variables */
}
```

### Dark Mode Variables
```css
.dark {
  --background: 210 30% 8%;
  --foreground: 210 30% 90%;
  --primary: 25 95% 53%;
  --accent: 210 100% 60%;
  /* ... more variables */
}
```

## Persistence

- Theme preference is automatically saved to localStorage
- Default storage key: `electrobill-theme`
- Persists across browser sessions
- System theme changes are detected automatically

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast support in both themes
- Focus indicators maintained across themes

## Browser Support

- Modern browsers with CSS custom properties support
- Automatic fallback to light theme for unsupported browsers
- System theme detection via `prefers-color-scheme` media query

## Customization

### Adding New Themes
1. Add new CSS variables to `index.css`
2. Update the Theme type in `ThemeContext.tsx`
3. Add new theme option to toggle components
4. Update theme detection logic

### Custom Storage
```tsx
<ThemeProvider 
  defaultTheme="light" 
  storageKey="my-custom-theme-key"
>
  {/* App content */}
</ThemeProvider>
```

## Best Practices

1. **Always use CSS custom properties** for theme-aware colors
2. **Test both themes** during development
3. **Provide visual feedback** for theme changes
4. **Respect user preferences** by defaulting to system theme
5. **Maintain accessibility** across all themes
