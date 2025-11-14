# VCB - AI Coloring Book Setup Guide

## Prerequisites
- Node.js (v20.0.0 or higher)
- Google AI API Key

## Getting Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Key:**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```
   VITE_GOOGLE_AI_API_KEY=your_actual_api_key_here
   ```

## Running the App

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## How to Use

1. **Generate an Image:**
   - Type a category in the input field (e.g., "cat", "car", "flower", "dinosaur")
   - Press Enter or click "Generate"
   - Wait for the AI to create a coloring page (may take 5-10 seconds)

2. **Color the Image:**
   - Select a color from the palette
   - Click and drag on the canvas to color
   - The brush will paint with your selected color

3. **Generate New Images:**
   - Type a new category and generate another image
   - The canvas will update with the new image

## Features

- ✅ AI-powered SVG generation using Google's Gemini LLM
- ✅ Vector-based line art for crisp, scalable coloring pages
- ✅ Kid-friendly coloring interface
- ✅ 8 preset colors
- ✅ Touch and mouse support
- ✅ Responsive design

## Troubleshooting

### "API key is not configured" error
- Make sure your `.env` file exists in the project root
- Verify the API key is correctly copied (no extra spaces)
- Restart the dev server after creating/modifying `.env`

### Image generation fails
- Check your API key is valid
- Ensure you have internet connection
- Check the browser console for specific error messages
- Verify your Google AI account has Gemini API access
- Some categories may produce better results than others

### Canvas is blank
- Try refreshing the page
- Check browser console for errors
- Make sure the generated image loaded successfully

## API Usage Notes

- The Gemini API may have usage limits depending on your Google AI account
- SVG generation typically takes 3-8 seconds
- Generated images are vector-based SVG format
- SVGs are converted to data URLs for canvas rendering
- Vector format ensures crisp lines at any zoom level

## Next Steps

Future enhancements planned:
- Fill bucket tool
- Undo/redo functionality
- Save/load images
- Adjustable brush size
- More color options
