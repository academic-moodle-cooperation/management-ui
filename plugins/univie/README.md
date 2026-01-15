# UniVie Event Calendar Plugin

A comprehensive event calendar plugin for University of Vienna (UniVie) that provides room scheduling and event management capabilities.

## Features

- **Real-time Event Display**: Shows events from UniVie's digital signage API
- **Room Management**: Filter and select specific rooms to view
- **Date Navigation**: Navigate between different dates with intuitive controls
- **Responsive Design**: Works on desktop and mobile devices
- **Event Details**: Comprehensive event information including time, location, and participants
- **Auto-refresh**: Periodic data refresh to ensure up-to-date information

## API Integration

The plugin integrates with two REST endpoints:

- `GET /digitalsignage/v1/getAllRaeume` - Fetches all available rooms
- `GET /digitalsignage/v1/findRaumbelegungenByDays?days=1` - Fetches events by day

## Configuration

### Environment Variables

Set the following environment variable in your `.env` file:

```env
VITE_UNIVIE_API_BASE_URL=https://your-api-domain.com
```

### Room Filtering

The plugin filters rooms to show only a configured list of room IDs. To modify the allowed rooms, edit the `DEFAULT_CONFIG` in `components/api/eventCalendarApi.ts`:

```typescript
const DEFAULT_CONFIG: EventCalendarConfig = {
  allowedRoomIds: [1001, 1002, 1003, 2001, 2002], // Your room IDs here
  apiBaseUrl: process.env.VITE_UNIVIE_API_BASE_URL || "https://api.example.com",
};
```

## Usage

### Standalone Execution

To run the event calendar as a standalone application:

```bash
cd plugins/univie
pnpm dev
```

The app will be available at `http://127.0.0.1:3006`

### Core Shell Integration

The plugin automatically registers with the core shell when loaded, providing:

- Route: `/univie-calendar`
- Navigation title: "Event Calendar"
- Icon: "calendar"
- Required permission: `access_univie_calendar`

## Data Models

### Room Model

```typescript
interface Room {
  extRaumId: number;
  nummer: string;
  stockwerk: string;
  raumArtNeuCode: string;
  raumArtNeuBezeichnung: string;
  extGebaeudeId: number;
  gebaeudeName: string;
  gebaeudeNummer: string;
  gebaeudeStrasse: string;
  gebaeudePlz: string;
  gebaeudeOrt: string;
  gebaeudeLand: string;
  uscreenRaum: string;
}
```

### Event Model

```typescript
interface Event {
  extRaumId: number;
  datum: string; // "02.08.2025"
  beginn: string; // "08.00"
  ende: string; // "20.00"
  relationenName: string;
  name: string;
  lvKategorie: string;
}
```

## Components

- **CalendarView**: Main calendar interface
- **EventCard**: Individual event display component
- **RoomFilter**: Room selection and filtering interface

## Future Improvements

- Server-side filtering by room ID (currently filtered client-side)
- Event creation and editing capabilities
- Email notifications for event changes
- Calendar export functionality
- Integration with external calendar systems

## Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development server:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

### Testing

Run type checking:

```bash
pnpm check-types
```

Run linting:

```bash
pnpm lint
```

## License

This plugin is part of the management-ui project and follows the same licensing terms.
