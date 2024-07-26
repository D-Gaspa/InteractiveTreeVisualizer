# Interactive Tree Visualizer

A powerful, browser-based tool for creating, visualizing, and manipulating tree structures in real-time.
This application offers an intuitive interface for building custom trees, modifying nodes, and customizing the
appearance of your hierarchical data.

## [Live Demo](https://d-gaspa.github.io/InteractiveTreeVisualizer/)

Experience the Interactive Tree Visualizer firsthand! Click the link above to try out all the features in your browser.

## Features

### Tree Manipulation
- **Dynamic Tree Creation**: Build and modify tree structures on the fly.
- **Intuitive Node Manipulation**: 
  - Add child nodes to any existing node (using the UI or Enter key).
  - Edit node text with a simple click.
  - Delete nodes (except the root) effortlessly (using the UI or Backspace/Delete keys).
- **Multi-node Selection**: Select multiple nodes using Ctrl/Shift click for bulk operations.

### Advanced Layout Algorithm
- Automatically adjusts layout based on tree structure.
- Implements collision detection and resolution for optimal and aesthetically pleasing node placement.
- Handles complex tree structures with multiple children per node.
- Maintains structural integrity during manipulations.

### Customizable Appearance
- Highlight nodes with preset or custom colors.
- Customize node and border colors to suit your preferences.
- Customize node and border sizes for better visibility and tailored appearance.
- Option for transparent nodes and borders.
- Automatic contrast adjustment for text color based on node color.
- Improved node properties display for single and multiple selections.

### Interactive User Interface
- User-friendly slide-in node menu panel for quick edits and manipulations.
- Global color pickers for easy customization.
- Hover effects and selection indicators provide immediate visual feedback.
- Enhanced UI for managing single and multiple node selections.

### Keyboard Navigation and Shortcuts
- Arrow key navigation:
  - Up: Move to parent node
  - Down: Move to middle child node
  - Left/Right: Move between sibling nodes
- Enter: Add a child node to the selected node
- Backspace/Delete: Remove selected node(s)
- Ctrl+A: Select all nodes

### Import Functionality
- Import tree structures from JSON files.
- Automatically validates and transforms imported data to match the expected structure.
- Seamlessly integrates imported trees into the visualizer for immediate editing and manipulation.

### Export Functionality
- Export your tree in multiple formats:
  - PNG: High-quality raster image
  - SVG: Scalable vector graphic
  - JSON: Data format for easy parsing and manipulation
  - JPEG: Compressed raster image
- Customize export options including scale factor and background color.
- Option for a transparent background in exported images (PNG and SVG).

### State Management
- Automatically saves and loads tree state using local storage.
- Persists user preferences for colors, layout, and other settings.

### Responsive Design
- Adapts to different screen sizes for a consistent experience across devices.
- Implements a scrollable tree container for large structures.

### Accessibility and User Experience
- Color contrast checks ensure readability.
- Notification system for user feedback on actions.

## Plans

I am always looking to enhance the Interactive Tree Visualizer. Some features I am considering for future updates:

1. **Subtree Collapsing**: Implement the ability to collapse and expand subtrees for better navigation of large structures.
2. **Drag-and-Drop Functionality**: Allow users to rearrange nodes by dragging and dropping.
3. **Undo/Redo Functionality**: Implement a history stack for undoing and redoing tree modifications.
4. **Themes**: Offer multiple color themes and allow users to create custom themes.

I welcome contributions and suggestions from the community to make the Interactive Tree Visualizer even better!

## Feedback and Contributions

I value your input!
If you have suggestions, encounter any issues, or want to contribute to the project, please open an
issue or submit a pull request in the GitHub repository.

Enjoy creating and visualizing your data with the Interactive Tree Visualizer!