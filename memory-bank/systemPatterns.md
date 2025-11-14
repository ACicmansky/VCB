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
- Canvas height accounts for toolbars (90px: generator + progress/reset bar)

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
**Pattern**: Foreground/background detection with boundary extraction
- Processes image pixels to identify foreground vs background
- Uses brightness threshold (> 240) to identify background (white/very light)
- Creates foreground mask (non-background pixels)
- Extracts only outer boundary (foreground pixels with background neighbors)
- Uses 8-connected neighbors for better boundary detection
- Creates separate outline image for rendering
- Prevents inner lines from appearing in final outline

### 8. Boundary Checking
**Pattern**: Pixel-level coordinate validation
- `isInsideSilhouette(x, y)` checks if coordinates are within silhouette
- Converts canvas coordinates to mask coordinates
- Checks pixel brightness in mask (< 250 = inside silhouette)
- Integrated into `drawAt()` to prevent erasing outside boundary
- Resets `lastPointRef` when outside boundary to prevent line connections

### 9. Scratch-Off Reveal System
**Pattern**: Layered canvas rendering with erasing
- **Layer 1 (Base)**: Original image (Elsa or AI-generated)
- **Layer 2 (Middle)**: White fill mask (covers inner content)
- **Layer 3 (Top)**: Black outline (boundary only)
- **White Fill Canvas**: Separate canvas for white fill layer management
- **Erasing**: Uses `destination-out` composite operation to erase white
- **Reset**: Recreates white fill mask and redraws all layers

### 10. React Ref Pattern for Reset
**Pattern**: Imperative handle with forwardRef
- `ColoringCanvasRef` interface exposes `reset()` method
- Component wrapped with `React.forwardRef`
- Uses `useImperativeHandle` to expose reset function
- Parent component calls `canvasRef.current?.reset()`

## Design Patterns

### Component Communication
- **Props Down**: Parent passes data and callbacks to children
- **Events Up**: Children call parent callbacks to update state
- **Unidirectional Data Flow**: State flows down, events flow up

### Drawing System (Scratch-Off Reveal)
```typescript
Erasing Flow:
1. User interaction (mouse/touch) → Event handler
2. Event handler → getCoordinates() → Normalized position
3. Position → isInsideSilhouette() → Boundary check
4. If inside → drawAt() → Erase white fill layer
5. drawAt() → Erase white fill canvas using destination-out
6. Redraw all layers → Image → White fill (with erased areas) → Outline
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
├── App.tsx                    # Main app component (reset button)
├── main.tsx                   # React entry point
└── components/
    ├── ColorPicker.tsx        # Color selection UI (hidden, not used)
    ├── ColoringCanvas.tsx     # Scratch-off reveal canvas with layered rendering
    ├── ImageGenerator.tsx     # AI image generation UI + Load Elsa button
    ├── ProgressBar.tsx        # Progress indicator
    └── Silhouette.tsx         # Shape drawing utilities (fallback)
└── services/
    └── aiService.ts            # Gemini LLM integration
└── assets/
    └── elsa.jpg                # Elsa image for scratch-off reveal
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
