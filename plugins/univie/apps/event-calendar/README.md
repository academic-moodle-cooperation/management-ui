# UniVie Event Calendar App

A standalone React application for displaying university event calendars with room filtering capabilities.

## Features

- 📅 **Date Navigation**: Navigate through different dates using arrows or date picker
- 🏢 **Room Filtering**: Filter events by specific rooms and buildings
- 🔄 **Real-time Data**: Fetches events from UniVie's digital signage API
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Loading**: Optimized with React Query for caching

## Configuration

### API Data vs Mock Data

The app can work with both **real API data** and **mock data** for development:

#### **Using Real API Data** (Recommended for Production)

Create a `.env.development` file in this directory (`plugins/univie/apps/event-calendar/.env.development`):

```bash
# Real UniVie API URL - replace with your actual endpoint
VITE_UNIVIE_API_BASE_URL=https://digitalsignage.univie.ac.at

# Or for testing:
# VITE_UNIVIE_API_BASE_URL=https://your-api-domain.com
```

#### **Using Mock Data** (Default for Development)

If no environment variable is set, the app will use mock data with sample events. This is useful for:

- Development when you don't have API access
- Testing UI components
- Demonstrating functionality

### Room Configuration

The app filters events to show only rooms specified in `src/components/api/allowedRoomIds.ts`.

**Current configuration:**

- ✅ **45 unique room IDs** (deduplicated from original 62 entries)
- 🏢 **Multiple buildings**: Hauptgebäude, Campus, Juridicum, UZA II, etc.
- 🎯 **Production-ready**: Uses real UniVie room IDs

## Room Count Explanation

You might notice different numbers in the UI:

- **62 entries** in the original `allowedRoomIds.ts` (with duplicates)
- **45 unique room IDs** after deduplication
- **Filter count** shows selected rooms (starts with all rooms selected)

## Development

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the app
open http://localhost:3001
```

### Environment Setup

1. **For Real Data**: Create `.env.development` with your API URL
2. **For Mock Data**: No setup needed (default behavior)

### API Endpoints

When using real data, the app expects these endpoints:

```
GET /digitalsignage/v1/getAllRaeume
- Returns: Array of Room objects with extRaumId, nummer, gebaeudeName, etc.

GET /digitalsignage/v1/findRaumbelegungenByDays?days={number}
- Returns: Array of Event objects with extRaumId, datum, beginn, ende, etc.
- days=1: Today's events
- days=2: Today + tomorrow's events
- days=N: Today + next N-1 days
```

### Debugging

Check the browser console for configuration logs:

```
🔧 Event Calendar API Configuration: {
  apiBaseUrl: "https://digitalsignage.univie.ac.at",
  allowedRoomCount: 45,
  usingMockData: false
}
```

## Architecture

- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for API state management
- **Shadcn/UI** components with Tailwind CSS
- **Workspace packages** for shared utilities

## Troubleshooting

### "Filter Rooms (0)" or Wrong Count

- Check that `VITE_UNIVIE_API_BASE_URL` is set correctly
- Verify the API is returning rooms that match IDs in `allowedRoomIds.ts`
- Look for console errors about failed API calls

### No Events Displayed

- Ensure the date calculation is working (check console logs)
- Verify the API endpoint `/findRaumbelegungenByDays` is working
- Check that events have `extRaumId` values matching your allowed rooms

### Still Seeing Mock Data

- Restart the development server after setting environment variables
- Check that `.env.development` is in the correct directory
- Verify the environment variable name is exactly `VITE_UNIVIE_API_BASE_URL`
