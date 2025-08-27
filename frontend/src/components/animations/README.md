# Animation System Documentation

This document describes the comprehensive animation system implemented for the Mini Project Management System frontend.

## Overview

The animation system is built using **Framer Motion** and provides smooth, performant animations throughout the application. It includes:

- Page transitions
- Component animations
- Loading states
- Interactive feedback
- Micro-interactions
- Form field animations
- Notification animations

## Core Animation Utilities

### Animation Variants (`src/utils/animations.ts`)

The system provides pre-defined animation variants for common use cases:

#### Basic Animations
- `fadeIn` - Simple fade in/out
- `fadeInUp` - Fade in with upward movement
- `scaleIn` - Scale from 0.8 to 1.0
- `slideInFromRight` - Slide in from right side
- `slideInFromLeft` - Slide in from left side

#### Interactive Animations
- `hoverScale` - Scale on hover
- `hoverLift` - Lift effect on hover with shadow
- `statusChangeVariants` - Animation for status changes
- `fieldFocusVariants` - Form field focus animations

#### Layout Animations
- `staggerContainer` - Container for staggered children
- `staggerItem` - Individual items in staggered lists
- `pageTransition` - Page-level transitions

#### Specialized Animations
- `modalVariants` - Modal open/close animations
- `overlayVariants` - Backdrop animations
- `notificationVariants` - Notification slide-in animations
- `pulseVariants` - Continuous pulse animation

## Animation Components

### AnimatedWrapper

A flexible wrapper component for applying animations to any content:

```tsx
import { AnimatedWrapper } from '../components/common/AnimatedWrapper';

<AnimatedWrapper animation="fadeInUp" delay={0.2}>
  <div>Your content here</div>
</AnimatedWrapper>
```

**Props:**
- `animation`: 'fadeInUp' | 'fadeIn' | 'scaleIn' | 'stagger'
- `delay`: number (in seconds)
- `duration`: number (override default duration)
- `className`: string

### StaggeredList

For animating lists with staggered timing:

```tsx
import { StaggeredList } from '../components/common/AnimatedWrapper';

<StaggeredList className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <ItemComponent key={item.id} item={item} />
  ))}
</StaggeredList>
```

### AnimatedPresenceWrapper

For conditional rendering with animations:

```tsx
import { AnimatedPresenceWrapper } from '../components/common/AnimatedWrapper';

<AnimatedPresenceWrapper show={isVisible} animation="scaleIn">
  <div>Conditionally rendered content</div>
</AnimatedPresenceWrapper>
```

## Enhanced Components

### LoadingSpinner

Enhanced loading spinner with multiple variants:

```tsx
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Different variants
<LoadingSpinner variant="spinner" size="lg" />
<LoadingSpinner variant="dots" size="md" />
<LoadingSpinner variant="pulse" size="sm" />

// With overlay
<LoadingSpinner overlay text="Loading..." />
```

### InteractiveButton

Buttons with built-in hover and tap animations:

```tsx
import { PrimaryButton, SecondaryButton } from '../components/common/InteractiveButton';

<PrimaryButton animation="bounce" loading={isLoading}>
  Save Changes
</PrimaryButton>

<SecondaryButton animation="lift" icon={<EditIcon />}>
  Edit Project
</SecondaryButton>
```

**Animation Types:**
- `scale` - Simple scale effect
- `lift` - Lift with shadow
- `bounce` - Spring-based bounce
- `pulse` - Continuous pulse on hover

### FormField

Form fields with focus animations and error transitions:

```tsx
import { FormField } from '../components/common/FormField';

<FormField
  label="Project Name"
  name="name"
  value={name}
  onChange={setName}
  validation={{ required: true, minLength: 3 }}
/>
```

Features:
- Focus scale animation
- Smooth error message transitions
- Character count animations
- Validation state transitions

## Notification System

Animated notification system with slide-in effects:

```tsx
import { NotificationProvider, useNotificationHelpers } from '../components/common/NotificationSystem';

// Wrap your app
<NotificationProvider>
  <App />
</NotificationProvider>

// Use in components
const { showSuccess, showError, showWarning, showInfo } = useNotificationHelpers();

showSuccess('Task Created', 'Your task has been created successfully!');
```

## Page Transitions

Automatic page transitions using React Router:

```tsx
// In App.tsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
    {/* Your routes */}
  </Routes>
</AnimatePresence>
```

Each page should use the `pageTransition` variant:

```tsx
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/animations';

export const MyPage = () => (
  <motion.div
    variants={pageTransition}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {/* Page content */}
  </motion.div>
);
```

## Card Animations

### TaskCard

Task cards include:
- Hover lift effect
- Status change animations
- Button micro-interactions
- Layout animations for reordering

### ProjectCard

Project cards feature:
- Hover effects
- Progress bar animations
- Interactive buttons
- Smooth transitions

## Performance Considerations

### Optimization Techniques

1. **Layout Animations**: Use `layout` prop for automatic layout transitions
2. **Transform Animations**: Prefer transform properties (scale, translate) over layout properties
3. **GPU Acceleration**: Animations use transform3d for hardware acceleration
4. **Reduced Motion**: Respect user's motion preferences

### Best Practices

1. **Duration Guidelines**:
   - Micro-interactions: 0.1-0.2s
   - Component transitions: 0.2-0.3s
   - Page transitions: 0.3-0.5s
   - Loading states: 0.8-1.5s

2. **Easing Functions**:
   - `easeOut` for entrances
   - `easeIn` for exits
   - `easeInOut` for continuous animations

3. **Stagger Timing**:
   - List items: 0.05-0.1s between items
   - Cards: 0.1-0.15s between items
   - Complex layouts: 0.05s between items

## Accessibility

### Motion Preferences

The system respects the user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Management

- Animations don't interfere with keyboard navigation
- Focus states are preserved during transitions
- Screen readers can access content during animations

## Custom Animations

### Creating New Variants

```tsx
// In animations.ts
export const customVariant: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    rotate: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    rotate: 10,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};
```

### Using Custom Animations

```tsx
import { motion } from 'framer-motion';
import { customVariant } from '../utils/animations';

<motion.div
  variants={customVariant}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>
```

## Tailwind CSS Integration

Custom animation classes are available in Tailwind:

```tsx
<div className="animate-fade-in-up">
  <div className="animate-bounce-gentle">
    <div className="animate-pulse-gentle">
```

Available classes:
- `animate-fade-in`
- `animate-fade-in-up`
- `animate-slide-in-right`
- `animate-slide-in-left`
- `animate-scale-in`
- `animate-bounce-gentle`
- `animate-pulse-gentle`
- `animate-wiggle`

## Testing Animations

### Animation Testing

```tsx
import { render, screen } from '@testing-library/react';
import { motion } from 'framer-motion';

// Mock framer-motion for tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    // ... other elements
  },
  AnimatePresence: ({ children }) => children,
}));
```

### Performance Testing

Monitor animation performance using:
- Chrome DevTools Performance tab
- React DevTools Profiler
- Framer Motion DevTools

## Troubleshooting

### Common Issues

1. **Animations not working**:
   - Check if Framer Motion is properly installed
   - Ensure AnimatePresence wraps conditional content
   - Verify variant names match

2. **Performance issues**:
   - Use transform properties instead of layout properties
   - Reduce animation complexity
   - Check for unnecessary re-renders

3. **Layout shifts**:
   - Use `layout` prop for automatic layout animations
   - Set explicit dimensions when possible
   - Use `layoutId` for shared element transitions

### Debug Mode

Enable Framer Motion debug mode:

```tsx
import { motion } from 'framer-motion';

<motion.div
  animate={{ x: 100 }}
  transition={{ type: 'spring', visualDebug: true }}
>
```

## Future Enhancements

Planned improvements:
- Gesture-based interactions (drag, swipe)
- Advanced spring physics
- Scroll-triggered animations
- 3D transforms for depth
- WebGL-based animations for complex effects

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Animation Principles](https://material.io/design/motion/understanding-motion.html)
- [Web Animation Performance](https://web.dev/animations/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)