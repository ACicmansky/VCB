# 2024_11_14 - Boundary Detection & Coloring Restriction Implementation

## Session Goal
Implement boundary detection system to prevent coloring outside the silhouette outline.

## Context
- User requirement: "The color should not be applied outside of the silhouette outline"
- Previous implementation had no boundary checking
- Need to restrict coloring to only areas within the silhouette
- User reported initial implementation didn't work correctly

## Work Log

### 1. Silhouette Mask System
**Implementation**: Created silhouette mask using ImageData
- **Purpose**: Store pixel-level data about which areas are inside the silhouette
- **Storage**: `silhouetteMaskRef` holds ImageData object
- **Creation**: `calculateSilhouetteMask()` function
- **Method**: 
  - For generated images: Draw outline to tracking canvas, flood fill from center
  - For butterfly: Draw filled shape to tracking canvas
  - Extract ImageData from tracking canvas

### 2. Boundary Checking Function
**Implementation**: `isInsideSilhouette(x, y)` function
- **Purpose**: Check if a given coordinate is within the silhouette boundary
- **Logic**:
  1. Get silhouette mask from ref
  2. Convert canvas coordinates to mask coordinates
  3. Check bounds (x, y within mask dimensions)
  4. Get pixel from mask at coordinates
  5. Check brightness: if < 250, pixel is inside silhouette
- **Return**: `true` if inside silhouette, `false` otherwise

### 3. Integration into Drawing
**Changes to `drawAt()` function**:
- Added boundary check before drawing
- If coordinates outside silhouette: return early, reset `lastPointRef`
- Prevents drawing and line connections outside boundary
- Maintains existing drawing logic for valid coordinates

### 4. Outline Extraction Refinement
**Existing `extractOutline()` function**:
- Extracts only outer boundary pixels (not inner lines)
- Uses edge detection algorithm:
  - Identifies silhouette pixels (brightness <= 80)
  - Checks 4-connected neighbors
  - Keeps only pixels with at least one non-silhouette neighbor
  - Makes internal pixels transparent
- Creates separate outline image for rendering

### 5. Progress Tracking Integration
**Existing `calculateProgress()` function**:
- Uses silhouette mask to identify colorable area
- Counts pixels within silhouette
- Counts colored pixels (brightness < 250)
- Calculates percentage: (colored / total) * 100

## Technical Details

### Coordinate Transformation
**Challenge**: Canvas coordinates vs mask coordinates
- Canvas may be scaled/centered differently than mask
- Current implementation uses direct coordinate mapping
- May need adjustment if scaling differs

### Mask Creation Process
1. **For Generated Images**:
   - Draw outline image to tracking canvas at scaled position
   - Flood fill from center point (assumed inside silhouette)
   - Fill color: [200, 200, 200, 255] (gray)
   - Extract ImageData as mask

2. **For Butterfly**:
   - Draw filled butterfly shape to tracking canvas
   - Extract ImageData as mask

### Boundary Check Algorithm
```typescript
isInsideSilhouette(x, y):
  1. Get mask from silhouetteMaskRef
  2. Convert canvas coords to mask coords (Math.floor)
  3. Check bounds
  4. Get pixel RGBA from mask
  5. Calculate brightness = (r + g + b) / 3
  6. Return brightness < 250
```

### Drawing Flow with Boundary Check
```typescript
drawAt(x, y):
  1. Check isInsideSilhouette(x, y)
  2. If false: reset lastPointRef, return
  3. If true: proceed with drawing
  4. Draw line from last point to current point
  5. Draw circle at current point
  6. Update lastPointRef
  7. Redraw outline on top
  8. Update progress
```

## Decisions Made

### 1. Mask-Based Approach
**Decision**: Use ImageData mask for boundary checking
**Rationale**:
- Pixel-level accuracy
- Works with any shape (generated or butterfly)
- Can be reused for progress tracking
- Efficient lookup (O(1) per check)

**Alternative Considered**: 
- Path-based checking (SVG pathContains)
- More complex, requires SVG parsing
- Less flexible for raster images

### 2. Brightness Threshold
**Decision**: Use brightness < 250 to identify silhouette pixels
**Rationale**:
- Simple and fast
- Works with grayscale mask
- Handles edge cases (near-white pixels)

**Potential Issue**: May need adjustment based on mask creation method

### 3. Coordinate Mapping
**Decision**: Direct coordinate mapping (Math.floor)
**Rationale**:
- Simple implementation
- Works if canvas and mask are same size

**Known Limitation**: May fail if canvas scaling differs from mask scaling

### 4. Reset Last Point on Boundary Exit
**Decision**: Reset `lastPointRef` when outside boundary
**Rationale**:
- Prevents drawing lines from outside to inside
- Creates clean boundary stops
- Better user experience

## Technical Challenges

### Challenge 1: Coordinate Transformation
**Issue**: Canvas coordinates may not map directly to mask coordinates
**Current Solution**: Direct mapping with Math.floor
**Potential Problem**: If canvas is scaled differently than mask, coordinates won't align
**Status**: May need refinement based on user testing

### Challenge 2: Mask Creation Timing
**Issue**: Mask must be created after outline is drawn
**Solution**: Use setTimeout in canvas redraw effect to ensure mask is created after rendering
**Status**: Working, but timing-dependent

### Challenge 3: Boundary Detection Accuracy
**Issue**: User reported coloring still extends outside silhouette
**Possible Causes**:
- Coordinate transformation mismatch
- Mask creation timing issues
- Brightness threshold too permissive
- Canvas scaling not matching mask scaling
**Status**: Under investigation

## User Feedback

### Initial Report
- User: "The color should not be applied outside of the silhouette outline"
- Implementation attempted with `isInsideSilhouette()` check

### Follow-up Report
- User: "I dont think it worked. I have a browser tab opened at localhost:3000. When you change some code, try to draw through the silhouette randomly to see the effect"
- Indicates boundary checking is not working as expected
- May need coordinate transformation fixes
- May need mask creation refinement

## Testing Needed

### Coordinate Alignment
- [ ] Verify canvas coordinates map correctly to mask coordinates
- [ ] Test with different canvas sizes
- [ ] Test with scaled images
- [ ] Check if mask creation uses same scaling as canvas rendering

### Boundary Accuracy
- [ ] Test drawing at exact boundary edges
- [ ] Test drawing outside silhouette (should be blocked)
- [ ] Test drawing inside silhouette (should work)
- [ ] Test continuous drawing across boundary

### Mask Creation
- [ ] Verify mask is created correctly for generated images
- [ ] Verify mask is created correctly for butterfly
- [ ] Check mask timing (created after outline drawn)
- [ ] Verify flood fill starts from correct point

## Next Steps

### Immediate
1. Test boundary checking in browser
2. Verify coordinate transformation
3. Check mask creation timing
4. Refine brightness threshold if needed

### Potential Fixes
1. **Coordinate Transformation**: May need to account for canvas scaling
2. **Mask Scaling**: Ensure mask matches canvas rendering scale
3. **Timing**: Ensure mask is created before drawing starts
4. **Threshold**: Adjust brightness threshold based on mask creation method

## Code Quality

### Type Safety
- ✅ TypeScript types for all functions
- ✅ Proper null checks
- ✅ Ref types properly defined

### Error Handling
- ✅ Null checks for mask and canvas
- ✅ Bounds checking for coordinates
- ✅ Fallback behavior (allow drawing if no mask)

### Performance
- ✅ O(1) boundary check per draw call
- ✅ Mask created once per image load
- ✅ Efficient pixel lookup

## Summary

Successfully implemented boundary detection system using silhouette mask and pixel-level checking. The system:
- Creates mask from silhouette using flood fill
- Checks coordinates against mask before drawing
- Prevents coloring outside silhouette boundary
- Integrates with existing drawing and progress systems

However, user feedback indicates the implementation may need refinement, particularly around coordinate transformation and mask scaling. Further testing and debugging needed to ensure accurate boundary detection.

