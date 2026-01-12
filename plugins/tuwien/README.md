# TU Wien Plugin - Custom Application

This plugin demonstrates how universities can create custom applications that can run both within the core shell and as standalone applications.

## Features

- **Dual Execution Mode**: Runs in core shell or standalone
- **Dedicated Port**: Standalone execution on port 3005
- **Full Provider Context**: Access to router, auth, plugins, query client
- **University-Specific Features**: Custom workflows and branding

## Development

### Standalone Development

```bash
# Navigate to the TU Wien plugin directory
cd plugins/tuwien

# Install dependencies (if not already installed)
pnpm install

# Start standalone development server
pnpm dev
```

The app will be available at: http://127.0.0.1:3005

### Core Shell Integration

The app is automatically registered through the plugin system and appears in the core shell navigation at `/tuwien-custom`.

## Architecture

### Files Structure

```
plugins/tuwien/
├── apps/
│   ├── TuWienCustomApp.tsx          # Main app component
│   └── tuwien-custom-app-plugin.ts  # Plugin registration
├── main.tsx                         # Standalone entry point
├── index.html                       # HTML template
├── vite.config.ts                   # Vite configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

### Key Components

1. **TuWienCustomApp.tsx**: Main application component wrapped with `AdaptiveAppWrapper`
2. **main.tsx**: Standalone bootstrap using `bootstrapStandaloneApp`
3. **tuwien-custom-app-plugin.ts**: Plugin registration for core shell integration

### Adaptive Execution

The app uses `AdaptiveAppWrapper` to automatically detect its execution context:

- **Core Shell**: Renders within the main application
- **Standalone**: Provides full provider context independently

## Configuration

### Port Assignment

- **Development**: Port 3005
- **Preview**: Port 3105
- **Base URL**: `/tuwien-custom`

### Dependencies

The plugin uses workspace dependencies for seamless integration:

- `@workspace/app-runtime`: Standalone execution support
- `@workspace/ui`: Shared UI components
- `@workspace/plugin-system`: Plugin architecture
- `@workspace/router`: Application routing
- `@workspace/query`: Data fetching

## Usage Examples

### Running Standalone

```bash
cd plugins/tuwien
pnpm dev
# Visit http://127.0.0.1:3005
```

### Building for Production

```bash
cd plugins/tuwien
pnpm build
pnpm preview
# Visit http://127.0.0.1:3105
```

### Integration with Core Shell

The app automatically appears in the core shell navigation when the TU Wien plugin is loaded.

## Customization

To create your own university plugin app:

1. Copy the TU Wien plugin structure
2. Update the package name and ports
3. Modify the app component for your specific needs
4. Register the plugin in your university's implementation index

## Benefits

- **Independent Development**: Develop and test without loading the entire core shell
- **Full Context**: Access to all providers and services
- **Consistent Experience**: Same UI and functionality in both modes
- **Easy Deployment**: Can be deployed independently or as part of the core system
