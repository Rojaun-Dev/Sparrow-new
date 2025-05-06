# SparrowX Project

## Cursor Rules

This project uses Cursor IDE configuration rules to maintain consistent code formatting and editing behavior across the development team. The rules are stored in `.qodo/cursor-rules.json`.

### Rule Overview

The cursor rules define the following settings for various file types:

- **JavaScript/TypeScript/React**: 2-space indentation, format on save and type, trim trailing whitespace
- **CSS/SCSS**: 2-space indentation, format on save, trim trailing whitespace
- **HTML**: 2-space indentation, format on save, trim trailing whitespace
- **JSON**: 2-space indentation, format on save
- **Markdown**: 2-space indentation, preserve trailing whitespace, insert final newline
- **Configuration Files**: 2-space indentation, format on save, trim trailing whitespace
- **Python**: 4-space indentation, format on save, trim trailing whitespace

### Default Settings

The default settings for all files not matching specific patterns are:
- Tab size: 2 spaces
- Insert spaces (not tabs)
- Format on save
- Trim trailing whitespace
- Insert final newline

### Excluded Folders

The following folders are excluded from formatting:
- node_modules
- dist
- build
- .git
- coverage

## Development Guidelines

When working on the SparrowX project, ensure your editor is configured to respect these formatting rules. If you're using Cursor IDE, these settings will be automatically applied.

For other editors, please configure them to match these standards as closely as possible. 