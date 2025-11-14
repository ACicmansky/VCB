# Technical Context

## Technology Stack

### Core Framework
- **React 19.2.0**: UI framework
- **TypeScript 5.9.3**: Type safety and developer experience
- **Vite 7.2.2**: Build tool and dev server

### Development Tools
- **ESLint 9.39.1**: Code linting
- **@vitejs/plugin-react 5.1.0**: React fast refresh
- **typescript-eslint 8.46.3**: TypeScript-specific linting

### Runtime Environment
- **Browser**: Modern browsers with Canvas API support
- **Node.js**: Development environment (version not specified in package.json)

## Dependencies

### Current Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0"
}
```

### Installed Dependencies
- **@google/genai**: For AI image generation (Gemini API) ✅ INSTALLED

### Potential Future Dependencies
- **localforage** or **idb**: Better IndexedDB wrapper for storage
- **react-toastify**: User notifications
- **lucide-react**: Icon library for UI controls

## Development Setup

### Scripts
```json
{
  "dev": "vite",              // Start dev server
  "build": "tsc -b && vite build",  // Type check + build
  "lint": "eslint .",         // Run linter
  "preview": "vite preview"   // Preview production build
}
```

### Build Configuration
- **TypeScript Config**: 
  - `tsconfig.app.json`: App-specific TS config
  - `tsconfig.node.json`: Node/build tool config
  - `tsconfig.json`: Base configuration

- **Vite Config** (`vite.config.ts`):
  - React plugin enabled
  - Standard Vite defaults

### ESLint Configuration
- React hooks rules enabled
- React refresh rules enabled
- TypeScript-specific rules

## Technical Constraints

### Browser Requirements
- **Canvas API**: Required for drawing functionality
- **Touch Events**: For mobile/tablet support
- **Local Storage**: For save/load functionality
- **ES6+**: Modern JavaScript features used
- **Fetch API**: For AI API calls

### Performance Targets
- **First Paint**: < 1 second
- **Drawing Latency**: < 16ms (60fps)
- **AI Generation**: < 10 seconds
- **Save/Load**: < 500ms

### Canvas Limitations
- **Max Size**: Browser-dependent (typically 32,767px)
- **Memory**: Large canvases consume significant memory
- **Export Size**: Base64 encoding increases data size by ~33%

## API Integration

### Google Gemini API (@google/genai)
**Status**: ✅ Integrated and functional

**Setup Completed**:
1. ✅ Package installed: `@google/genai`
2. ✅ Environment variable: `VITE_GOOGLE_AI_API_KEY`
3. ✅ Service module: `src/services/aiService.ts`
4. ✅ UI component: `src/components/ImageGenerator.tsx`

**Current Implementation**:
```typescript
import { GoogleGenAI } from "@google/genai"

const genAI = new GoogleGenAI({ apiKey: API_KEY })

// Generate SVG from category using Gemini LLM
const result = await genAI.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt, // Detailed prompt for SVG generation
})

const svgContent = result.text // Extract SVG code from response
```

**Model**: `gemini-2.5-flash` (text generation model for SVG code)
**Output Format**: SVG vector graphics (converted to canvas for coloring)
**Generation Time**: ~3-8 seconds

## Storage Strategy

### MVP: Local Storage
- **Capacity**: ~5-10MB depending on browser
- **Persistence**: Survives browser restarts
- **Scope**: Per-origin
- **Format**: String-based (JSON + base64 images)

### Future: IndexedDB
- **Capacity**: Much larger (hundreds of MB)
- **Performance**: Better for large data
- **Complexity**: More complex API

### Cloud Storage (Post-MVP)
- Firebase Storage
- AWS S3
- Cloudinary

## Development Environment

### Operating System
- **Primary**: Windows (as per user environment)
- **Shell**: PowerShell 7

### IDE
- Modern IDE with TypeScript support
- ESLint integration recommended

### Browser DevTools
- Canvas inspection
- Performance profiling
- Network monitoring for AI API calls

## Security Considerations

### API Key Management
- **Never commit API keys to repository**
- Use environment variables (`.env` file)
- Add `.env` to `.gitignore`
- Consider backend proxy for production

### Content Safety
- AI-generated content must be kid-appropriate
- Implement content filtering/moderation
- Use Google's safety settings in API calls

### Data Privacy
- No personal data collection in MVP
- Local storage only
- No analytics or tracking

## Build & Deployment

### Development
```bash
npm run dev  # Start on http://localhost:5173
```

### Production Build
```bash
npm run build  # Output to dist/
```

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **Requirements**: 
  - Serve static files
  - HTTPS for security
  - Environment variable support for API keys

## Known Technical Debt
1. ✅ Environment variable setup for API keys (completed)
2. No error boundaries for React components
3. ✅ Loading states and error handling (implemented)
4. ✅ Canvas state persists on resize (redraws correctly)
5. No TypeScript strict mode enabled
6. No unit tests or E2E tests
7. Boundary checking coordinate transformation may need refinement
8. No caching for generated images
