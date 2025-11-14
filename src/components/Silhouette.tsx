export function drawButterfly(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const centerX = width / 2
  const centerY = height / 2
  const scale = Math.min(width, height) * 0.4

  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2

  // Left wing (top)
  ctx.beginPath()
  ctx.ellipse(centerX - scale * 0.3, centerY - scale * 0.2, scale * 0.4, scale * 0.5, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Left wing (bottom)
  ctx.beginPath()
  ctx.ellipse(centerX - scale * 0.3, centerY + scale * 0.2, scale * 0.4, scale * 0.5, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Right wing (top)
  ctx.beginPath()
  ctx.ellipse(centerX + scale * 0.3, centerY - scale * 0.2, scale * 0.4, scale * 0.5, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Right wing (bottom)
  ctx.beginPath()
  ctx.ellipse(centerX + scale * 0.3, centerY + scale * 0.2, scale * 0.4, scale * 0.5, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, scale * 0.08, scale * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.beginPath()
  ctx.arc(centerX, centerY - scale * 0.5, scale * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Antennae
  ctx.beginPath()
  ctx.moveTo(centerX, centerY - scale * 0.5)
  ctx.lineTo(centerX - scale * 0.1, centerY - scale * 0.65)
  ctx.moveTo(centerX, centerY - scale * 0.5)
  ctx.lineTo(centerX + scale * 0.1, centerY - scale * 0.65)
  ctx.stroke()

  // Antennae tips
  ctx.beginPath()
  ctx.arc(centerX - scale * 0.1, centerY - scale * 0.65, scale * 0.02, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(centerX + scale * 0.1, centerY - scale * 0.65, scale * 0.02, 0, Math.PI * 2)
  ctx.fill()
}

