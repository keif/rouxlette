# Rouxlette UI Redesign - Complete Rebuild

## Overview

This is a **complete from-scratch redesign** of the Rouxlette restaurant roulette app with a modern, minimal iOS aesthetic. This is NOT an incremental update - it's a full rebuild of the UI layer.

## Design Principles

- **Modern Minimalist**: Clean, uncluttered interface
- **iOS-First**: Follows Apple Human Interface Guidelines
- **SF Symbols Only**: No emojis, consistent iconography
- **8pt Grid**: Precise spacing system
- **Subtle Depth**: iOS-style shadows and blur effects

---

## File Structure

```
rouxlette/
├── theme/
│   ├── colors.ts           # Color palette
│   ├── spacing.ts          # 8pt grid + radius
│   ├── typography.ts       # SF Pro scale
│   └── index.ts            # Central export
│
├── components/
│   ├── RouletteWheel.tsx   # Main spin button
│   ├── FilterChip.tsx      # Individual filter chip
│   ├── ActiveFilterBar.tsx # Scrollable chip row
│   └── RestaurantCard.tsx  # Minimal result card
│
├── screens/
│   ├── HomeScreenRedesign.tsx      # Landing/roulette
│   ├── SearchScreenRedesign.tsx    # Results list
│   ├── FiltersModal.tsx            # iOS bottom sheet
│   ├── DetailsScreen.tsx           # Restaurant details
│   ├── FavoritesScreen.tsx         # Saved restaurants
│   └── HistoryScreen.tsx           # Spin history
│
└── navigation/
    └── AppNavigator.tsx    # Bottom tabs + stacks
```

---

## Theme System

### Colors (`theme/colors.ts`)

```typescript
colors.primary      // #007AFF (iOS blue)
colors.success      // #34C759 (green)
colors.error        // #FF3B30 (red)
colors.warning      // #FF9500 (orange)
colors.gray50-900   // Neutral scale
```

### Spacing (`theme/spacing.ts`)

8pt grid system:
```typescript
spacing.xs    // 4pt
spacing.sm    // 8pt
spacing.md    // 16pt
spacing.lg    // 24pt
spacing.xl    // 32pt
spacing.2xl   // 48pt
spacing.3xl   // 64pt
```

### Typography (`theme/typography.ts`)

SF Pro scale with proper line heights and letter spacing:
```typescript
typography.display      // 40pt, bold
typography.title1       // 34pt, semibold
typography.title2       // 28pt, semibold
typography.headline     // 17pt, semibold
typography.body         // 17pt, regular
typography.callout      // 16pt, regular
typography.footnote     // 13pt, regular
typography.caption1     // 12pt, regular
```

---

## Components

### RouletteWheel

**File**: `components/RouletteWheel.tsx`

Circular spin button with animations and haptics.

```tsx
<RouletteWheel
  onSpin={() => {}}
  disabled={false}
  size={200}
/>
```

**Features**:
- Press animation (scale)
- 5-rotation spin (1800°)
- Haptic feedback (medium → success)
- Disabled state (gray)

**States**:
- Idle
- Pressed
- Spinning
- Disabled

---

### FilterChip

**File**: `components/FilterChip.tsx`

Individual filter chip with variants.

```tsx
<FilterChip
  label="Pizza"
  variant="included"  // 'default' | 'included' | 'excluded'
  onPress={() => {}}
/>
```

**Variants**:
- `default`: Gray background
- `included`: Blue background with checkmark
- `excluded`: Red background with minus icon

---

### ActiveFilterBar

**File**: `components/ActiveFilterBar.tsx`

Horizontal scrollable filter display.

```tsx
<ActiveFilterBar
  filters={[
    { id: '1', label: 'Pizza', variant: 'included', onRemove: () => {} },
    { id: '2', label: 'Bars', variant: 'excluded', onRemove: () => {} },
  ]}
/>
```

**Features**:
- Horizontal scroll
- Auto-hides when empty
- Proper spacing between chips

---

### RestaurantCard

**File**: `components/RestaurantCard.tsx`

Clean minimal card for search results.

```tsx
<RestaurantCard
  restaurant={{
    id: '1',
    name: 'The Daily Pint',
    imageUrl: '...',
    rating: 4.5,
    reviewCount: 234,
    price: '$$',
    distance: 0.3,
    categories: ['Gastropub', 'American'],
    isFavorite: false,
  }}
  onPress={() => {}}
  onFavoriteToggle={() => {}}
/>
```

**Layout**:
- Hero image (200pt height)
- Favorite button overlay
- Name
- Rating + reviews
- Price + distance
- Categories

---

## Screens

### HomeScreenRedesign

**File**: `screens/HomeScreenRedesign.tsx`

Main landing screen - completely redesigned from scratch.

**Layout** (top to bottom):
1. Header
   - Title: "Rouxlette"
   - Subtitle: "Find your next meal"
   - Filters button (with badge)
2. Roulette Wheel (centered, 200pt)
3. Active Filter Chips (scrollable)
4. Search Input (unified, single field)
5. Location Selector
6. Results Info (count, success message)
7. CTA Buttons
   - "Spin for Me" (primary)
   - "View All Results" (secondary)

**Key Differences from Old Design**:
- ❌ No emoji title
- ❌ No "Quick Search" categories section
- ❌ No "Recent Spins" clutter
- ✅ Centered wheel
- ✅ Single unified search
- ✅ Clean white space

---

### SearchScreenRedesign

**File**: `screens/SearchScreenRedesign.tsx`

Results list screen.

**Layout**:
1. Header
   - Search input
   - Filters button
2. Location selector
3. Active filters bar
4. Results count
5. Restaurant cards list

**Features**:
- FlatList for performance
- Pull to refresh (ready)
- Favorite toggle inline
- Tap card → Details

---

### FiltersModal

**File**: `screens/FiltersModal.tsx`

iOS-style bottom sheet with filters.

**Sections**:
1. Price (4 buttons: $, $$, $$$, $$$$)
2. Distance (4 options: 0.5mi, 1mi, 2mi, 5mi)
3. Open Now (toggle switch)
4. Minimum Rating (5 options with stars)

**Features**:
- Modal presentation
- Clear All button
- Apply Filters button
- Proper iOS styling

---

### DetailsScreen

**File**: `screens/DetailsScreen.tsx`

Full-page restaurant details.

**Layout**:
1. Hero image (300pt)
2. Back button overlay
3. Header
   - Name
   - Rating + reviews
   - Price + distance
   - Categories
   - Open status badge
4. Quick Actions
   - Directions
   - Call
   - View on Yelp
5. Info Sections
   - Address
   - Phone

**Navigation**:
- Modal presentation
- Swipe down to dismiss
- Back button

---

## Navigation Structure

**File**: `navigation/AppNavigator.tsx`

```
Root Stack
├── Main (Bottom Tabs)
│   ├── Home (HomeScreenRedesign)
│   ├── Search (SearchScreenRedesign)
│   └── Saved (Nested Stack)
│       ├── Favorites
│       └── History
└── Details (Modal)
```

**Tab Bar**:
- iOS-style bottom tabs
- Filled/outline icons for active/inactive
- 88pt height (iOS safe area)
- Subtle shadow

---

## Animations

### RouletteWheel

**Spin Animation**:
```typescript
Duration: 1400ms
Rotation: 0° → 1800° (5 full rotations)
Easing: Linear
Haptics: Medium (start) → Success (end)
```

**Press Animation**:
```typescript
Scale: 1 → 0.95 → 1
Duration: 100ms + 100ms
```

### FilterChip

**Press**:
```typescript
Opacity: 1 → 0.8
Duration: Instant
```

### RestaurantCard

**Press**:
```typescript
Opacity: 1 → 0.95
Duration: Instant
```

---

## Usage Guide

### Integrating the Redesign

1. **Update App.tsx** to use `AppNavigator`:

```tsx
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

2. **Import theme tokens**:

```tsx
import { colors, spacing, typography } from '../theme';
```

3. **Use components**:

```tsx
import { RouletteWheel } from '../components/RouletteWheel';
import { FilterChip } from '../components/FilterChip';
import { RestaurantCard } from '../components/RestaurantCard';
```

---

## What's Different

### Old Design Issues

- ❌ Emoji-heavy (🎲, 🍕, ❤️ everywhere)
- ❌ Inconsistent spacing
- ❌ Mixed icon styles (SF Symbols + Material + emoji)
- ❌ Cluttered layout
- ❌ Top tabs (not iOS standard)
- ❌ Messy "Quick Search" section
- ❌ No design system

### New Design

- ✅ SF Symbols only (Ionicons)
- ✅ 8pt grid spacing
- ✅ Consistent iOS aesthetic
- ✅ Centered, focused layouts
- ✅ Bottom tabs (iOS standard)
- ✅ Minimal, clean sections
- ✅ Complete design system

---

## Animations & Haptics

### Haptic Patterns

**RouletteWheel**:
```typescript
onPress: ImpactFeedbackStyle.Medium
onComplete: NotificationFeedbackType.Success
```

**Buttons**:
```typescript
onPress: ImpactFeedbackStyle.Light (optional)
```

### Animation Timings

All animations use native driver for 60fps performance:
- Press feedback: 100-200ms
- Wheel spin: 1400ms
- Modal slide: 300ms (system default)

---

## Testing

### Screens to Test

1. **HomeScreenRedesign**
   - Wheel disabled/enabled states
   - Filter chips display
   - Search input
   - Location selector
   - CTA buttons

2. **SearchScreenRedesign**
   - Results list rendering
   - Filter integration
   - Card press → details
   - Favorite toggle

3. **FiltersModal**
   - All filter types
   - Clear all
   - Apply filters
   - Modal dismiss

4. **DetailsScreen**
   - Hero image
   - All action buttons
   - Back navigation

---

## Next Steps

1. **Integration**
   - Connect to existing Yelp API hooks
   - Wire up context/state management
   - Implement actual search logic

2. **Polish**
   - Add loading skeletons
   - Empty states with SF Symbols
   - Error handling
   - Pull to refresh

3. **Advanced Features**
   - Save filters to AsyncStorage
   - Location picker modal
   - Category selector
   - Share functionality

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `theme/colors.ts` | Color palette |
| `theme/spacing.ts` | 8pt grid + radius |
| `theme/typography.ts` | Text styles |
| `components/RouletteWheel.tsx` | Spin button |
| `components/RestaurantCard.tsx` | Result card |
| `screens/HomeScreenRedesign.tsx` | Landing |
| `screens/SearchScreenRedesign.tsx` | Results |
| `screens/FiltersModal.tsx` | Filters |
| `screens/DetailsScreen.tsx` | Details |
| `navigation/AppNavigator.tsx` | Navigation |

---

## Design Tokens Quick Reference

```tsx
// Colors
colors.primary      // #007AFF
colors.gray900      // #1C1C1E
colors.white        // #FFFFFF

// Spacing
spacing.xs          // 4
spacing.sm          // 8
spacing.md          // 16
spacing.lg          // 24

// Radius
radius.sm           // 8
radius.md           // 12
radius.lg           // 16
radius.full         // 9999

// Typography
typography.title1   // 34pt, semibold
typography.headline // 17pt, semibold
typography.body     // 17pt, regular
```

---

## Summary

This is a **complete UI rebuild** that transforms Rouxlette from a cluttered, emoji-heavy app into a clean, modern iOS experience. All components are built from scratch following Apple Human Interface Guidelines with proper design system, spacing, and animations.

The redesign focuses on the core user flow: **search → spin → discover** with minimal friction and maximum clarity.
