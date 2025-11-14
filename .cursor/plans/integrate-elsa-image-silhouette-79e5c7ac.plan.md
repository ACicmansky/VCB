<!-- 79e5c7ac-8951-4806-8ba9-97135e6c6532 3e330542-1754-4971-b22d-665dd89de8e7 -->
# Plan: Scratch-Off Reveal Effect

## Overview

Transform the coloring canvas into a scratch-off reveal effect where:

- Original Elsa image is the base layer
- White fill covers the inner content (respecting outline boundaries)
- Black outline is on top
- Drawing erases the white layer to reveal the original image underneath
- Color picker is removed/hidden since colors are no longer used

## Implementation Steps

### 1. Modify Canvas Rendering Layers

**File**: `src/components/ColoringCanvas.tsx`

**Current structure**:

- White background
- Outline only

**New structure**:

- Layer 1 (bottom): Original Elsa image
- Layer 2 (middle): White fill mask (covering inner content, respecting outline)
- Layer 3 (top): Black outline

**Changes needed**:

- Store original image reference separately
- Create white fill mask that covers only the inner area (inside outline)
- Draw layers in correct order: image → white fill → outline

### 2. Create White Fill Mask

**Approach**: Use the silhouette mask to create a white fill

- Use `calculateSilhouetteMask()` to identify inner area
- Draw white fill only in the silhouette area (inside outline)
- Leave outline area transparent/clear

**Implementation**:

- After outline extraction, create a white fill canvas
- Use flood fill or mask-based approach to fill inner area with white
- Store as separate image/canvas layer

### 3. Modify Drawing Function

**File**: `src/components/ColoringCanvas.tsx` - `drawAt()` function

**Current behavior**:

- Draws colored circles/lines
- Uses `source-over` composite operation

**New behavior**:

- Use `destination-out` composite operation to erase white layer
- Draw with white/transparent to "erase" the white fill
- Reveals original image underneath
- No color needed - just erasing effect

**Changes**:

```typescript
ctx.globalCompositeOperation = "destination-out";
// Draw white/transparent circles to erase white layer
ctx.fillStyle = "rgba(255, 255, 255, 1)"; // or use eraser pattern
```

### 4. Update Canvas Redraw Logic

**File**: `src/components/ColoringCanvas.tsx` - `useEffect` for canvas drawing

**New drawing order**:

1. Clear canvas
2. Draw original image (base layer)
3. Draw white fill mask (middle layer, only inside outline)
4. Draw outline on top (top layer)

**After user draws**:

- Redraw base image
- Redraw white fill (with erased areas)
- Redraw outline on top

### 5. Remove/Hide Color Picker

**File**: `src/App.tsx`

**Options**:

- Option A: Hide ColorPicker component conditionally
- Option B: Remove ColorPicker entirely
- Option C: Keep but disable (for future use)

**Recommendation**: Option A - Hide when using reveal mode

### 6. Update Progress Calculation

**File**: `src/components/ColoringCanvas.tsx` - `calculateProgress()`

**Current**: Calculates colored pixels vs silhouette pixels

**New**: Calculate revealed pixels (white layer erased) vs total silhouette pixels

- Count pixels where white layer is transparent/erased
- Compare to total silhouette area

### 7. Handle White Fill Layer State

**Approach**: Track white fill layer as separate canvas or ImageData

- Create separate canvas for white fill layer
- When drawing, erase from white fill canvas
- Redraw white fill canvas onto main canvas

**Alternative**: Use composite operations directly on main canvas

- Draw white fill initially
- Use `destination-out` to erase as user draws
- Redraw base image and outline after each draw

## Technical Details

### Layer Management Strategy

**Option A: Separate Canvas Layers**

- Base canvas: Original image
- White fill canvas: White mask layer
- Main canvas: Composite result
- Pros: Easier to manage, can redraw independently
- Cons: More memory, more complex

**Option B: Single Canvas with Composite Operations**

- Draw base image
- Draw white fill
- Use `destination-out` to erase white
- Redraw outline
- Pros: Simpler, less memory
- Cons: Need to redraw everything on each interaction

**Recommendation**: Option B (single canvas) for simplicity

### White Fill Creation

1. Use silhouette mask to identify inner area
2. Create white fill that covers only inside outline
3. Use flood fill from center point (inside silhouette)
4. Fill with white color
5. Store as separate image or draw directly

### Drawing/Erasing Implementation

```typescript
// Erase white layer to reveal image
ctx.globalCompositeOperation = "destination-out";
ctx.fillStyle = "rgba(255, 255, 255, 1)";
ctx.beginPath();
ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
ctx.fill();

// Redraw layers
// 1. Base image (already there, no need to redraw)
// 2. White fill (with erased areas)
// 3. Outline on top
```

## Considerations

### Performance

- Redrawing all layers on each draw might be slow
- Consider using offscreen canvas for white fill layer
- May need to optimize redraw frequency

### User Experience

- Brush size should be appropriate for reveal effect
- Smooth erasing (continuous strokes)
- Visual feedback when revealing

### Edge Cases

- What happens if user draws outside outline? (Should be prevented)
- What if white layer is completely erased? (Show full image)
- Resize handling (need to recreate white fill)

### Backward Compatibility

- Should this work for AI-generated images too?
- Or only for Elsa image?
- May need to detect image type and apply different logic

## Testing Checklist

- [ ] Original image displays as base layer
- [ ] White fill covers inner content only
- [ ] Outline is visible on top
- [ ] Drawing erases white layer correctly
- [ ] Original image is revealed underneath
- [ ] Drawing outside outline is prevented
- [ ] Progress tracking works (revealed vs total)
- [ ] Color picker is hidden/removed
- [ ] Works on resize
- [ ] Performance is acceptable

## Files to Modify

1. `src/components/ColoringCanvas.tsx` - Main implementation
2. `src/App.tsx` - Hide/remove ColorPicker
3. Potentially `src/components/ColorPicker.tsx` - Make conditional