# Example University Plugins

This directory contains **simplified examples** for learning plugin development patterns. These plugins are designed for:

- 📚 **Learning**: Understand plugin system concepts
- 🔍 **Reference**: See best practices in action
- 🧪 **Testing**: Experiment with plugin development
- 📖 **Documentation**: Live examples of plugin patterns

## ⚠️ Important Notes

- **Not for production**: These plugins are never loaded in production environments
- **Educational purpose**: Focus on clarity over complexity
- **Simplified implementations**: May not include all production features

## 🔧 Usage in Development

```typescript
// Only load in development environment
pluginNamespace: ["core", "univie", "example-university"]
```

## 📁 Structure

```
example-university/
├── implementations/     # Example plugin implementations
│   ├── index.ts        # Barrel exports
│   └── *.ts           # Individual example plugins
├── extension-points/   # Example custom extension points
└── README.md          # This documentation
```

## 🚀 Contributing Examples

When adding new examples:
1. Keep them simple and focused
2. Include comprehensive comments
3. Follow existing naming conventions
4. Add to the index.ts exports
5. Update this README if needed

## 📝 Available Examples

- `universityHeaderExample` - Basic header customization example 