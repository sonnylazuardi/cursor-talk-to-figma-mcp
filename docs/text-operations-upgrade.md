This PR introduces intelligent text scanning and replacement capabilities with chunking strategies for improved reliability when working with large designs in Figma.

## Demo

https://youtu.be/j05gGT3xfCs

## Key Improvements

### 1. Text Bundle Scanning & Replacement
- Added `scan_text_nodes` with intelligent chunking to handle large designs without timeouts
- Implemented `set_multiple_text_contents` for batch text replacements
- Added structure recognition system to understand text relationships

### 2. Progressive Processing System
- Implemented chunking mechanism in `code.js` to handle operations in manageable segments
- Added real-time progress tracking with WebSocket-based communication
- Extended timeout management and keep-alive mechanism for long-running operations

### 3. Smart Text Replacement Strategy
- Updated `text_replacement_strategy` prompt with intelligent structure-aware methods
- Added pattern recognition for tables, lists, cards, and forms
- Integrated verification system with chunk-specific image exports

## Use Cases
- Extract all text content to Markdown/CSV for documentation
- Localize designs with intelligent language adaptation
- Improve UX writing with consistent tone and terminology
- Map external data (CSV, Markdown) to design elements

## Technical Improvements

### New & Enhanced Functions
- `scan_text_nodes`: Added chunking parameters (`useChunking`, `chunkSize`) to process large node trees
- `set_multiple_text_contents`: Enhanced with batch processing and intelligent error handling
- `sendProgressUpdate`: New helper function to provide real-time operation status
- `connectToFigma`: Improved connection stability with enhanced timeout management

### Plugin UI Enhancements
- Added progress bar visualization for long-running operations
- Implemented progress percentage and status indicators
- Added success/error state visualization

### Server-Side Improvements
- Extended WebSocket message handler to process progress updates
- Implemented `CommandProgressUpdate` interface for standardized progress tracking
- Added dynamic timeout extension based on activity to prevent disconnections
- Enhanced error handling for large-scale operations

### Structure-Aware Processing
- Implemented table row/column chunking strategies
- Added component-based processing for repeated elements
- Integrated chunk verification with targeted image exports

This upgrade significantly enhances Figma text operations for large and complex designs, enabling seamless content management, localization, and data integration while maintaining design integrity.