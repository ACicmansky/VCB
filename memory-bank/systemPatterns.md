# System Patterns

## Architecture Overview
VCB follows a component-based React architecture with TypeScript for type safety.

```
┌─────────────────────────────────────┐
│           App.tsx                   │
│  (Main container & state)           │
└────────┬────────────────────┬───────┘
         │                    │
    ┌────▼─────┐         ┌────▼──────────┐
    │ColorPicker│         │ColoringCanvas │
    │Component  │         │  Component    │
    └───────────┘         └────┬──────────┘
                               │
                          ┌────▼─────────┐
                          │  Silhouette  │
                          │   Functions  │
                          └──────────────┘
```

## Key Technical Decisions

### 1. Canvas-Based Rendering
**Decision**: Use HTML5 Canvas for drawing surface
**Rationale**: 
- Better performance for pixel-based drawing
- Native support for brush strokes
- Easier to implement flood fill
- Good touch event support

**Trade-offs**:
- Less scalable than SVG
- Harder to implement selection/editing
- No built-in shape primitives

### 2. Component Structure
**Pattern**: Functional components with hooks
**Components**:
- `App.tsx`: Root component, manages global state
- `ColorPicker.tsx`: Presentational component for color selection
- `ColoringCanvas.tsx`: Stateful component managing canvas interactions
- `Silhouette.tsx`: Utility functions for drawing shapes

### 3. State Management
**Current**: React useState at component level
**Future Consideration**: May need Context API or reducer for:
- Tool selection (brush, fill, eraser)
- Undo/redo history
- Canvas state snapshots
- AI generation status

### 4. Event Handling
**Pattern**: Unified mouse and touch event handling
- `getCoordinates()`: Normalizes mouse/touch events
- Prevents default to avoid scrolling during drawing
- Uses `touchAction: 'none'` CSS for better touch control

### 5. Responsive Design
**Pattern**: Dynamic canvas sizing
- Canvas dimensions set via JavaScript
- Window resize listener updates canvas
- Silhouette redraws on resize
- Full viewport layout (100vw x 100vh)
- Canvas height accounts for toolbars (140px total)

### 6. Silhouette Mask System
**Pattern**: ImageData-based boundary detection
- Creates silhouette mask using flood fill algorithm
- Stores mask in `silhouetteMaskRef` as ImageData
- Uses mask for:
  - Boundary checking (`isInsideSilhouette()`)
  - Progress calculation (`calculateProgress()`)
- Mask created from:
  - Generated images: Outline extraction + flood fill
  - Butterfly fallback: Filled shape drawing

### 7. Outline Extraction
**Pattern**: Edge detection algorithm
- Processes image pixels to identify silhouette boundaries
- Uses brightness threshold (80) to identify silhouette pixels
- Extracts only outer boundary (pixels with non-silhouette neighbors)
- Creates separate outline image for rendering
- Prevents inner lines from appearing in final outline

### 8. Boundary Checking
**Pattern**: Pixel-level coordinate validation
- `isInsideSilhouette(x, y)` checks if coordinates are within silhouette
- Converts canvas coordinates to mask coordinates
- Checks pixel brightness in mask (< 250 = inside silhouette)
- Integrated into `drawAt()` to prevent coloring outside boundary
- Resets `lastPointRef` when outside boundary to prevent line connections

## Design Patterns

### Component Communication
- **Props Down**: Parent passes data and callbacks to children
- **Events Up**: Children call parent callbacks to update state
- **Unidirectional Data Flow**: State flows down, events flow up

### Drawing System
```typescript
Drawing Flow:
1. User interaction (mouse/touch) → Event handler
2. Event handler → getCoordinates() → Normalized position
3. Position → isInsideSilhouette() → Boundary check
4. If inside → drawAt() → Canvas rendering
5. drawAt() → Draw line from last point + circle at current point
6. Redraw outline on top → Maintain outline visibility
7. Update progress → CalculateProgress() → onProgressChange callback
```

### Canvas Management
- **Ref Pattern**: useRef to access canvas DOM element
- **Effect Hooks**: 
  - Canvas initialization on mount
  - Resize handling
  - Silhouette drawing

## Code Organization

### File Structure
```
src/
├── App.tsx                    # Main app component
├── main.tsx                   # React entry point
└── components/
    ├── ColorPicker.tsx        # Color selection UI
    ├── ColoringCanvas.tsx     # Drawing canvas with mask system
    ├── ImageGenerator.tsx     # AI image generation UI
    ├── ProgressBar.tsx        # Progress indicator
    └── Silhouette.tsx         # Shape drawing utilities (fallback)
└── services/
    └── aiService.ts            # Gemini LLM integration
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ColoringCanvas`)
- **Functions**: camelCase (e.g., `drawButterfly`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `COLORS`)
- **Interfaces**: PascalCase with Props suffix (e.g., `ColorPickerProps`)

## Future Patterns to Implement

### 1. Tool System
```typescript
type Tool = 'brush' | 'fill' | 'eraser'
interface ToolConfig {
  type: Tool
  size?: number
  color?: string
}
```

### 2. History Management
```typescript
interface HistoryState {
  past: ImageData[]
  present: ImageData
  future: ImageData[]
}
```

### 3. Storage Layer
```typescript
interface SavedImage {
  id: string
  name: string
  data: string // base64 encoded
  timestamp: number
  thumbnail?: string
}
```

### 4. AI Generation
```typescript
interface GenerationRequest {
  category?: string
  prompt?: string
  style: 'line-art' | 'outline'
}

interface GenerationResponse {
  imageData: string
  prompt: string
  timestamp: number
}
```

## Performance Considerations
- Canvas operations are synchronous and can block UI
- Large brush strokes should be optimized
- Consider requestAnimationFrame for smooth drawing
- Debounce resize events
- Lazy load AI generation UI
- Cache generated images
