import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error("Google AI API key is not configured. Please add VITE_GOOGLE_AI_API_KEY to your .env file");
}

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface ImageGenerationOptions {
  category: string;
  width?: number;
  height?: number;
}

export interface GeneratedSVG {
  svgContent: string;
  width: number;
  height: number;
}

/**
 * Generate a coloring book line art SVG using LLM
 * @param options - Generation options including category/prompt
 * @returns SVG content as string
 */
export async function generateColoringImage(
  options: ImageGenerationOptions
): Promise<GeneratedSVG> {
  if (!genAI) {
    throw new Error("Google AI is not initialized. Please check your API key configuration.");
  }

  const width = options.width || 800;
  const height = options.height || 800;

  try {
    // Create a detailed prompt for SVG generation
    const prompt = `Generate a simple SVG coloring page for kids featuring: ${options.category}

Requirements:
- Create clean, simple line art suitable for coloring
- Use only black strokes (stroke="black") with no fill colors
- Stroke width should be 3-4 for clear outlines
- Design should be kid-friendly and age-appropriate (4-12 years)
- Keep shapes simple and easy to color
- Center the design in the viewBox
- Use viewBox="0 0 ${width} ${height}"
- Include only the SVG code, no explanations
- Use basic SVG elements: path, circle, ellipse, rect, polygon, line
- Make sure all paths are closed for easy coloring
- All lines are connected

Respond with ONLY the complete SVG code starting with <svg and ending with </svg>.`;

    // Use Gemini model for text generation
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    
    const text = result.text;
    
    if (!text) {
      throw new Error("No text response from LLM");
    }

    // Extract SVG from response
    let svgContent = text.trim();
    
    // Remove markdown code blocks if present
    svgContent = svgContent.replace(/```svg\n?/g, '');
    svgContent = svgContent.replace(/```xml\n?/g, '');
    svgContent = svgContent.replace(/```\n?/g, '');
    svgContent = svgContent.trim();

    // Validate that we have SVG content
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      throw new Error("Generated content is not valid SVG");
    }

    // Extract just the SVG portion
    const svgStart = svgContent.indexOf('<svg');
    const svgEnd = svgContent.lastIndexOf('</svg>') + 6;
    svgContent = svgContent.substring(svgStart, svgEnd);

    return {
      svgContent,
      width,
      height,
    };
  } catch (error) {
    console.error("Error generating SVG:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate coloring page: ${error.message}`);
    }
    throw new Error("Failed to generate coloring page. Please try again.");
  }
}

/**
 * Convert SVG string to a data URL for canvas rendering
 */
export function svgToDataUrl(svgContent: string): string {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Parse SVG and draw it on a canvas context
 */
export async function drawSVGToCanvas(
  svgContent: string,
  canvas: HTMLCanvasElement
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const dataUrl = svgToDataUrl(svgContent);
    
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Clear canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scaling to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      ) * 0.9;
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      resolve();
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = dataUrl;
  });
}
