import { useEffect, useRef } from 'react'
import { useTheme } from '../theme/ThemeContext'

type Node = { x: number; y: number; vx: number; vy: number; r: number; phase: number }

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ctx = context
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mouse = { x: -1000, y: -1000 }
    let nodes: Node[] = []
    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1
    const neon = theme === 'light' ? [0, 174, 255] : [57, 255, 136]
    const base = theme === 'light' ? [102, 151, 181] : [75, 129, 99]
    function rgba(rgb: number[], alpha: number) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})` }
    function resize() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(24, Math.min(95, Math.round(width * height / 17500)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - .5) * .20, vy: (Math.random() - .5) * .20,
        r: 1.5 + Math.random() * 1.35, phase: Math.random() * Math.PI * 2,
      }))
      render()
    }
    function onMouse(event: MouseEvent) { mouse.x = event.clientX; mouse.y = event.clientY }
    function onLeave() { mouse.x = -1000; mouse.y = -1000 }
    function render() {
      ctx.clearRect(0, 0, width, height)
      const reduced = motion.matches
      for (const node of nodes) {
        if (!reduced) {
          node.x += node.vx
          node.y += node.vy
          if (node.x < -15 || node.x > width + 15) node.vx *= -1
          if (node.y < -15 || node.y > height + 15) node.vy *= -1
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist > 158) continue
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const cursorDist = Math.hypot(mouse.x - mx, mouse.y - my)
          const intensity = Math.max(0, 1 - cursorDist / 135)
          const lineColor = intensity > 0 ? neon : base
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          const curve = intensity * 14 * (reduced ? 0 : 1)
          const normalX = dist ? -dy / dist : 0
          const normalY = dist ? dx / dist : 0
          ctx.quadraticCurveTo(mx + normalX * curve, my + normalY * curve, b.x, b.y)
          ctx.strokeStyle = rgba(lineColor, intensity ? 0.17 + intensity * 0.65 : (1 - dist / 158) * .23)
          ctx.lineWidth = intensity ? 0.9 + intensity * 1.35 : .7
          ctx.stroke()
        }
      }
      for (const node of nodes) {
        const dist = Math.hypot(mouse.x - node.x, mouse.y - node.y)
        const intensity = Math.max(0, 1 - dist / 122)
        if (intensity > 0) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.r + 5 + intensity * 5, 0, Math.PI * 2)
          ctx.fillStyle = rgba(neon, intensity * .10)
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r + intensity * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = rgba(intensity > 0 ? neon : base, .34 + intensity * .66)
        ctx.fill()
      }
      if (!reduced && !document.hidden) raf = window.requestAnimationFrame(render)
    }
    const onVisibility = () => { window.cancelAnimationFrame(raf); if (!document.hidden) render() }
    const onMotion = () => { window.cancelAnimationFrame(raf); render() }
    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('blur', onLeave)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotion)
    resize()
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
    }
  }, [theme])
  return <canvas ref={canvasRef} className="network-canvas" aria-hidden="true" />
}
