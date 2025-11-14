interface ColorPickerProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

const COLORS = [
  { name: 'Red', value: '#FF6B6B' },
  { name: 'Blue', value: '#4ECDC4' },
  { name: 'Green', value: '#95E1D3' },
  { name: 'Yellow', value: '#FFE66D' },
  { name: 'Pink', value: '#FF8B94' },
  { name: 'Purple', value: '#A8E6CF' },
  { name: 'Orange', value: '#FFB347' },
  { name: 'Black', value: '#2C3E50' },
]

export default function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderBottom: '2px solid #ddd',
      justifyContent: 'center',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onColorSelect(color.value)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: color.value,
            border: selectedColor === color.value ? '4px solid #333' : '2px solid #999',
            cursor: 'pointer',
            boxShadow: selectedColor === color.value ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.2s'
          }}
          title={color.name}
        />
      ))}
    </div>
  )
}

