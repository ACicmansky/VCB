import { useState } from 'react';
import { generateColoringImage, svgToDataUrl } from '../services/aiService';
import elsaImage from '../assets/elsa.jpg';

interface ImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
}

export default function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [category, setCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!category.trim()) {
      setError('Please enter a category');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateColoringImage({
        category: category.trim(),
        width: 800,
        height: 800,
      });

      const imageUrl = svgToDataUrl(result.svgContent);
      onImageGenerated(imageUrl);
      setCategory(''); // Clear input after successful generation
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  const handleLoadElsa = () => {
    onImageGenerated(elsaImage);
  };

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderBottom: '2px solid #ddd',
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter category (e.g., cat, car, flower)..."
        disabled={isGenerating}
        style={{
          padding: '10px 15px',
          fontSize: '16px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          minWidth: '300px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.target.style.borderColor = '#4ECDC4'}
        onBlur={(e) => e.target.style.borderColor = '#ddd'}
      />
      
      <button
        onClick={handleLoadElsa}
        disabled={isGenerating}
        style={{
          padding: '10px 25px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: isGenerating ? '#ccc' : '#FF6B9D',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          minWidth: '120px',
        }}
        onMouseEnter={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.backgroundColor = '#E55A8D';
          }
        }}
        onMouseLeave={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.backgroundColor = '#FF6B9D';
          }
        }}
      >
        Load Elsa
      </button>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !category.trim()}
        style={{
          padding: '10px 25px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: isGenerating || !category.trim() ? '#ccc' : '#4ECDC4',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isGenerating || !category.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          minWidth: '120px',
        }}
        onMouseEnter={(e) => {
          if (!isGenerating && category.trim()) {
            e.currentTarget.style.backgroundColor = '#3DBDB3';
          }
        }}
        onMouseLeave={(e) => {
          if (!isGenerating && category.trim()) {
            e.currentTarget.style.backgroundColor = '#4ECDC4';
          }
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>

      {error && (
        <div style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
