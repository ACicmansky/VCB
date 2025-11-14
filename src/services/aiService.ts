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
    const prompt = `You are an expert children’s illustrator that generates **simple SVG coloring pages for kids (ages 3–8)**.
When given a single **category** ${options.category}, you must output **only valid SVG code** — nothing else, no titles, no explanations, no comments.

Follow these strict rules for every SVG you produce:

* **Output format**: a single valid <svg> element only (no surrounding Markdown, no extra text).
* **Canvas**: Use viewBox="0 0 ${width} ${height}" and an appropriate viewBox (e.g., viewBox="0 0 800 800").
* **Style**:
  * Thick black outlines: stroke="#000", stroke-width between 4 and 8.
  * No fills inside shapes: use fill="none" for colorable regions.
  * No colors, gradients, or shading.
* **Design**:

  * Simple, bold, and large shapes suitable for young children to color.
  * Centered composition with 1–4 main elements related to the category.
  * Include playful, friendly shapes—avoid any scary, violent, or realistic depictions.
  * No text anywhere in the SVG.
  * No external resources (fonts, images). Use only basic SVG primitives (path, rect, circle, ellipse, line, polyline, polygon, g).
* **Complexity**:

  * Keep detail low so areas are easy to color; avoid very thin lines or tiny shapes.
  * Ensure closed paths for fillable regions (so children can color easily).
* **Behavior on ambiguity**:

  * If the category is ambiguous or broad, choose a **simple, friendly interpretation** appropriate for ages 3–8.
* **Failure modes**:

  * Do not output anything other than the SVG element. If you cannot generate a safe SVG for the category, output a simple, generic kid-friendly frame (still as valid SVG).

When I provide a category, reply with **only** the SVG code that adheres to the rules above.
`;

    // Use Gemini model for text generation
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
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
