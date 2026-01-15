# TU Wien Sidebar Implementation

This directory contains the TU Wien (Vienna University of Technology) specific sidebar implementation, migrated from the old extension system to the new Plugin Architecture 3.0.

## Components

### 🎯 **CustomNavMain.tsx**

- Extends core NavMain component with TU Wien-specific styling
- Active state indicators with TU Wien branding colors
- Simplified approach following univie implementation pattern
- Maintains all core navigation functionality

### 🏛️ **SidebarHeader.tsx**

- LectureTube branding header
- Language switcher (DE/EN)
- Uses TU Wien theme colors (`var(--color-header)`)
- Logo collapse animation

### 👤 **SidebarUserMenu.tsx**

- User profile menu with avatar
- Login/logout functionality
- Environment-aware URL routing (dev/prod)

### ⚙️ **SidebarToggle.tsx**

- Sidebar expand/collapse toggle button
- Positioned at bottom right of sidebar
- Smooth rotation animation

### 🎨 **LTLogo.tsx**

- LectureTube SVG logo component
- White fill for header visibility
- Scalable vector graphics

## Features

### 🎨 **TU Wien Branding**

- Uses university-specific colors from theme
- Corporate blue (`var(--color-tuwien-primary)`) for active states
- Header background uses TU Wien blue

### 🌐 **Internationalization**

- Language switcher in header
- Fallback to core translations
- University-specific namespaces

### 📱 **Responsive Design**

- Mobile-friendly collapsed states
- Smooth transitions and animations
- Proper accessibility support

## Migration Notes

### ✅ **Successfully Migrated**

- All original components preserved
- Theme integration completed
- Plugin system registration working
- University branding maintained

### ⚠️ **Current Issues**

- TypeScript configuration issues (module resolution)
- Some linter errors remain due to workspace setup
- Components are functionally complete despite warnings

### 🔄 **Changes from Original**

- Converted hardcoded colors to theme variables
- Updated imports to new workspace structure
- Changed `useConfig` to `useAppConfig`
- Simplified CustomNavMain to extend core NavMain component (following univie pattern)
- Removed custom SidebarListEntry component in favor of core implementation

## Usage

The sidebar implementation is automatically registered when the TU Wien plugin is active. It replaces the default sidebar components with university-specific versions while maintaining full compatibility with the core system.
