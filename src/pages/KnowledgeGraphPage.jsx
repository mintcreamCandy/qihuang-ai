import { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/api'
import './KnowledgeGraphPage.css'

// 国风矿物色与水墨印章配置
const COLOR_THEMES = {
  prescription: {
    main: '#b83030', // 朱砂红
    glow: 'rgba(184, 48, 48, 0.35)',
    text: '#d95b5b',
    watermark: '方',
    shape: 'square'
  },
  herb: {
    main: '#2d6345', // 石绿
    glow: 'rgba(45, 99, 69, 0.35)',
    text: '#53a675',
    watermark: '草',
    shape: 'circle'
  },
  syndrome: {
    main: '#b08028', // 赭石金/石黄
    glow: 'rgba(176, 128, 40, 0.35)',
    text: '#cca14d',
    watermark: '证',
    shape: 'square'
  },
  symptom: {
    main: '#245366', // 黛青
    glow: 'rgba(36, 83, 102, 0.35)',
    text: '#4a899e',
    watermark: '症',
    shape: 'circle'
  },
  meridian: {
    main: '#752a57', // 胭脂紫
    glow: 'rgba(117, 42, 87, 0.35)',
    text: '#8a5ca8',
    watermark: '经',
    shape: 'circle'
  }
}

// 十极地支常量用于绘制古风罗盘
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

function KnowledgeGraphPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const canvasRef = useRef(null)
  const imageCacheRef = useRef({})

  // 物理与镜头状态控制 Ref (防止60FPS重绘卡顿)
  const selectedNodeRef = useRef(null)
  const hoveredNodeRef = useRef(null)
  const targetCamera = useRef({ zoom: 1.0 })
  const currentCamera = useRef({ x: 0, y: 0, zoom: 1.0 })
  const targetParallax = useRef({ x: 0, y: 0 })
  const currentParallax = useRef({ x: 0, y: 0 })

  // 写意水墨与金屑粒子的 Ref
  const inkWashRef = useRef([])
  const goldLeafRef = useRef([])

  const width = 900
  const height = 650

  // 1. 从后端加载数据并固定背景轨道分布
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await apiService.getKnowledgeGraph()
        if (data && data.nodes) {
          // 固定随机种子生成节点全局序号，避免在星轨背景上的角度随重新聚焦乱跳
          const sortedNodes = [...data.nodes].sort((a, b) => a.id.localeCompare(b.id))
          const nodeIndexMap = {}
          sortedNodes.forEach((node, idx) => {
            nodeIndexMap[node.id] = idx
          })

          const initializedNodes = data.nodes.map(node => {
            const globalIndex = nodeIndexMap[node.id] || 0
            return {
              ...node,
              globalIndex,
              x: width / 2 + (Math.random() - 0.5) * 120,
              y: height / 2 + (Math.random() - 0.5) * 120,
              targetX: width / 2,
              targetY: height / 2,
              radius: 6,
              targetRadius: 6,
              opacity: 0,
              targetOpacity: 0
            }
          })

          setGraphData({ nodes: initializedNodes, links: data.links })

          // 预加载节点图片（若有）
          initializedNodes.forEach(node => {
            if (node.image) {
              const img = new Image()
              img.src = window.location.origin + node.image
              img.onload = () => {
                imageCacheRef.current[node.id] = img
              }
            }
          })

          // 默认选中首个方剂作为聚焦中心
          const firstPresc = initializedNodes.find(n => n.type === 'prescription')
          if (firstPresc) {
            setSelectedNode(firstPresc)
            selectedNodeRef.current = firstPresc
          }
        }
      } catch (err) {
        console.error("获取图谱数据失败:", err)
        setError("无法加载知识图谱数据，请确保后端服务正常运行。")
      } finally {
        setLoading(false)
      }
    }
    fetchGraph()
  }, [])

  // 2. 初始化写意墨晕和洒金粉粒子
  useEffect(() => {
    // 初始化墨晕大斑块 (极低透明度的深灰，在背景徐徐滑动)
    if (inkWashRef.current.length === 0) {
      const washes = []
      for (let i = 0; i < 8; i++) {
        washes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          size: Math.random() * 100 + 80,
          color: 'rgba(30, 30, 30, 0.035)'
        })
      }
      inkWashRef.current = washes
    }

    // 初始化流金碎粉 (飘落在画卷纸面上的金箔颗粒)
    if (goldLeafRef.current.length === 0) {
      const goldFlakes = []
      for (let i = 0; i < 30; i++) {
        goldFlakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          alpha: Math.random() * 0.4 + 0.2,
          speed: 0.002 + Math.random() * 0.003
        })
      }
      goldLeafRef.current = goldFlakes
    }
  }, [])

  // 3. Canvas 写意水墨渲染循环
  useEffect(() => {
    if (loading || graphData.nodes.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    // 防抖防模糊缩放
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const nodes = graphData.nodes
    const links = graphData.links

    const getNeighbors = (nodeId) => {
      if (!nodeId) return new Set()
      const neighbors = new Set()
      links.forEach(l => {
        if (l.source === nodeId) neighbors.add(l.target)
        if (l.target === nodeId) neighbors.add(l.source)
      })
      return neighbors
    }

    const runRenderLoop = () => {
      const activeNode = selectedNodeRef.current
      if (!activeNode) return

      const neighbors = getNeighbors(activeNode.id)

      // --- A. 宣纸星盘轨道靶心坐标重算 ---
      const centerNode = nodes.find(n => n.id === activeNode.id)
      const neighborNodes = nodes.filter(n => neighbors.has(n.id) && n.id !== activeNode.id)
      const otherNodes = nodes.filter(n => !neighbors.has(n.id) && n.id !== activeNode.id)

      // 1. 中心印章 (调大半径：从 46 调大到 52)
      if (centerNode) {
        centerNode.targetX = width / 2
        centerNode.targetY = height / 2
        centerNode.targetRadius = 52
        centerNode.targetOpacity = 1.0
      }

      // 2. 伴星内圈轨道 (一阶关联印章，R=175，半径从 35 调大到 42，悬停调大到 48)
      const rInner = 175
      neighborNodes.forEach((node, idx) => {
        const angle = (idx / neighborNodes.length) * 2 * Math.PI
        node.targetX = width / 2 + Math.cos(angle) * rInner
        node.targetY = height / 2 + Math.sin(angle) * rInner

        const isHovered = hoveredNodeRef.current && hoveredNodeRef.current.id === node.id
        node.targetRadius = isHovered ? 48 : 42
        node.targetOpacity = 1.0
      })

      // 3. 背景写意暗星 (排布在三层外轨，悬停显影印章从 34 调大到 40)
      otherNodes.forEach((node) => {
        const globalIdx = node.globalIndex || 0
        const orbitIdx = globalIdx % 3
        const rOuter = 265 + orbitIdx * 65

        const angle = (globalIdx / nodes.length) * 2 * Math.PI
        node.targetX = width / 2 + Math.cos(angle) * rOuter
        node.targetY = height / 2 + Math.sin(angle) * rOuter

        const isHovered = hoveredNodeRef.current && hoveredNodeRef.current.id === node.id
        node.targetRadius = isHovered ? 40 : 6
        node.targetOpacity = isHovered ? 1.0 : 0.45
      })

      // 4. 缓动过渡计算 (10% 阻尼插值)
      nodes.forEach(node => {
        node.x += (node.targetX - node.x) * 0.1
        node.y += (node.targetY - node.y) * 0.1
        node.radius += (node.targetRadius - node.radius) * 0.12
        node.opacity += (node.targetOpacity - node.opacity) * 0.12
      })

      // 5. 镜头缩放与三维纸面视差计算
      currentParallax.current.x += (targetParallax.current.x - currentParallax.current.x) * 0.05
      currentParallax.current.y += (targetParallax.current.y - currentParallax.current.y) * 0.05

      const idealZoom = neighborNodes.length > 8 ? 0.82 : neighborNodes.length > 5 ? 0.95 : 1.06
      targetCamera.current.zoom += (idealZoom - targetCamera.current.zoom) * 0.05
      currentCamera.current.zoom += (targetCamera.current.zoom - currentCamera.current.zoom) * 0.08

      // --- B. Canvas 绘图渲染 ---
      ctx.clearRect(0, 0, width, height)

      // 1. 绘制古画宣纸底色渐变 (黄褐色微纹理)
      ctx.save()
      const paperGrad = ctx.createLinearGradient(0, 0, width, height)
      paperGrad.addColorStop(0, '#f5ecd6') // 古典宣纸黄
      paperGrad.addColorStop(1, '#ebdcb8')
      ctx.fillStyle = paperGrad
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // 2. 绘制淡淡的古籍朱丝栏线 (书页分隔红竖格)
      ctx.save()
      ctx.strokeStyle = 'rgba(166, 48, 48, 0.025)'
      ctx.lineWidth = 1.0
      for (let x = 40; x < width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      ctx.restore()

      // 3. 绘制缓慢漂移的写意墨晕
      inkWashRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -p.size) p.x = width + p.size
        if (p.x > width + p.size) p.x = -p.size
        if (p.y < -p.size) p.y = height + p.size
        if (p.y > height + p.size) p.y = -p.size

        ctx.save()
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
        grad.addColorStop(0, p.color)
        grad.addColorStop(1, 'rgba(245, 237, 214, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()
      })

      // 4. 绘制洒金箔碎屑 (亮金色纸片，微微闪烁漂动)
      goldLeafRef.current.forEach(flake => {
        flake.x += flake.vx
        flake.y += flake.vy
        if (flake.x < 0) flake.x = width
        if (flake.x > width) flake.x = 0
        if (flake.y < 0) flake.y = height
        if (flake.y > height) flake.y = 0

        ctx.save()
        const alpha = flake.alpha * (0.6 + 0.4 * Math.sin(Date.now() * flake.speed))
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`
        ctx.shadowBlur = 3
        ctx.shadowColor = '#d4af37'
        ctx.beginPath()
        ctx.rect(flake.x, flake.y, flake.size, flake.size * 1.5)
        ctx.fill()
        ctx.restore()
      })

      // 5. 应用相机矩阵与阻尼视差
      ctx.save()
      ctx.translate(width / 2 + currentParallax.current.x, height / 2 + currentParallax.current.y)
      ctx.scale(currentCamera.current.zoom, currentCamera.current.zoom)
      ctx.translate(-width / 2, -height / 2)

      // 6. 绘制宣德水墨风虚线星轨
      const orbits = [175, 265, 330, 395]
      const orbitLabels = ["【 核心关联伴星轨 】", "【 配伍本草副星轨 】", "【 远景背景墨星云 】", "【 宇宙未央墨虚境 】"]
      orbits.forEach((r, idx) => {
        ctx.save()
        ctx.strokeStyle = idx === 0 ? 'rgba(120, 100, 80, 0.18)' : 'rgba(40, 40, 40, 0.045)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([3, 10]) // 模拟毛笔笔触的虚断效果
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI)
        ctx.stroke()

        // 核心一阶轨道绘制细密的中式日晷/罗盘方位刻度
        if (idx === 0) {
          ctx.strokeStyle = 'rgba(120, 100, 80, 0.15)'
          ctx.lineWidth = 0.6
          ctx.setLineDash([])
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 18) {
            const x1 = width / 2 + Math.cos(angle) * (r - 3)
            const y1 = height / 2 + Math.sin(angle) * (r - 3)
            const x2 = width / 2 + Math.cos(angle) * (r + 3)
            const y2 = height / 2 + Math.sin(angle) * (r + 3)
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
        }

        // 绘制轨道标注
        ctx.font = '9px "KaiTi", "STKaiti", serif'
        ctx.fillStyle = idx === 0 ? 'rgba(139, 69, 19, 0.32)' : 'rgba(40, 40, 40, 0.16)'
        ctx.fillText(orbitLabels[idx], width / 2 + 8, height / 2 - r - 4)
        ctx.restore()
      })

      // 7. 绘制中心主星旁的十二地支流注罗盘星环 (主星从46调大到52，星环半径从68、78对应调大到74、84)
      ctx.save()
      ctx.translate(width / 2, height / 2)
      const rot = Date.now() * 0.00015 // 极慢徐徐转动

      ctx.save()
      ctx.rotate(rot)
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.15)'
      ctx.lineWidth = 1.0
      ctx.beginPath()
      ctx.arc(0, 0, 74, 0, 2 * Math.PI)
      ctx.stroke()

      // 绘制十二地支文字 (随轮偏转)
      ctx.font = 'bold 10px "KaiTi", "STKaiti", "SimSun", serif'
      ctx.fillStyle = 'rgba(139, 69, 19, 0.38)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      EARTHLY_BRANCHES.forEach((branch, idx) => {
        const charAngle = (idx / 12) * 2 * Math.PI
        const cx = Math.cos(charAngle) * 74
        const cy = Math.sin(charAngle) * 74
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(charAngle + Math.PI / 2)
        ctx.fillText(branch, 0, 0)
        ctx.restore()
      })
      ctx.restore()

      // 外周八卦爻线环
      ctx.save()
      ctx.rotate(-rot * 0.7)
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.08)'
      ctx.lineWidth = 0.8
      ctx.setLineDash([6, 12, 18, 12])
      ctx.beginPath()
      ctx.arc(0, 0, 84, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()

      ctx.restore()

      // 8. 绘制写意毛笔灰墨连线与金碎滑行流光 (只连中心主星或悬停暗星)
      links.forEach(link => {
        const isConnectedToCenter = link.source === activeNode.id || link.target === activeNode.id
        const isConnectedToHovered = hoveredNodeRef.current && (link.source === hoveredNodeRef.current.id || link.target === hoveredNodeRef.current.id)

        if (isConnectedToCenter || isConnectedToHovered) {
          const sNode = nodes.find(n => n.id === link.source)
          const tNode = nodes.find(n => n.id === link.target)

          if (sNode && tNode) {
            // 写意水墨线 (木炭灰起伏感)
            ctx.save()
            ctx.strokeStyle = 'rgba(50, 45, 40, 0.28)'
            ctx.lineWidth = 2.2
            ctx.shadowBlur = 1.5
            ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
            ctx.beginPath()
            ctx.moveTo(sNode.x, sNode.y)
            ctx.lineTo(tNode.x, tNode.y)
            ctx.stroke()
            ctx.restore()

            // 飘金箔微粒流动
            ctx.save()
            const goldSpeed = 0.0016
            const goldT = (Date.now() * goldSpeed) % 1.0
            const px = sNode.x + (tNode.x - sNode.x) * goldT
            const py = sNode.y + (tNode.y - sNode.y) * goldT
            
            ctx.fillStyle = '#d4af37'
            ctx.shadowBlur = 4
            ctx.shadowColor = '#d4af37'
            ctx.beginPath()
            ctx.rect(px - 1.5, py - 1.5, 3, 3)
            ctx.fill()
            ctx.restore()

            // 连线正中央的古风悬挂药笺 (红细框、宣纸白底药量标签，调大字号到 9px)
            if (link.dose) {
              const midX = (sNode.x + tNode.x) / 2
              const midY = (sNode.y + tNode.y) / 2
              ctx.save()
              ctx.font = '9px "KaiTi", "STKaiti", serif'
              
              const tWidth = ctx.measureText(link.dose).width
              ctx.fillStyle = '#fefcf8'
              ctx.strokeStyle = '#a63a3a'
              ctx.lineWidth = 0.6
              ctx.beginPath()
              ctx.roundRect(midX - tWidth / 2 - 3, midY - 6.5, tWidth + 6, 13, 1)
              ctx.fill()
              ctx.stroke()

              ctx.fillStyle = '#222222'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(link.dose, midX, midY + 0.5)
              ctx.restore()
            }
          }
        }
      })

      // 9. 绘制古朴朱文/白文印章节点
      nodes.forEach(node => {
        ctx.save()

        const isCenter = node.id === activeNode.id
        const isNeighbor = neighbors.has(node.id)
        const isExpanded = node.radius > 15
        const theme = COLOR_THEMES[node.type] || COLOR_THEMES.herb

        if (isExpanded) {
          ctx.save()
          ctx.globalAlpha = node.opacity

          // 1. 绘制印泥边缘光圈 (古旧浸润感)
          ctx.shadowBlur = isCenter ? 12 : 6
          ctx.shadowColor = theme.glow

          // 2. 绘制印章外框
          ctx.strokeStyle = theme.main
          ctx.lineWidth = isCenter ? 2.5 : 1.2

          ctx.beginPath()
          if (theme.shape === 'square') {
            const side = node.radius * 2
            ctx.roundRect(node.x - node.radius, node.y - node.radius, side, side, 4)
          } else {
            ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
          }
          ctx.stroke()

          // 3. 填充印章底色
          ctx.fillStyle = theme.main
          ctx.fill()

          // 4. 绘制印章内线圈 (双线印框)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          if (theme.shape === 'square') {
            const innerSide = (node.radius - 2.5) * 2
            ctx.rect(node.x - (node.radius - 2.5), node.y - (node.radius - 2.5), innerSide, innerSide)
          } else {
            ctx.arc(node.x, node.y, node.radius - 2.5, 0, 2 * Math.PI)
          }
          ctx.stroke()
          ctx.restore()

          // 5. 绘制印章水印背景繁体大字印记 (印泥白文虚影)
          ctx.save()
          ctx.globalAlpha = node.opacity * 0.08
          ctx.font = `bold ${node.radius * 1.2}px "KaiTi", "STKaiti", "SimSun", serif`
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(theme.watermark, node.x, node.y)
          ctx.restore()

          // 6. 预加载头像
          const imgAvatar = imageCacheRef.current[node.id]
          if (imgAvatar && imgAvatar.complete) {
            ctx.save()
            ctx.globalAlpha = node.opacity
            ctx.beginPath()
            ctx.arc(node.x, node.y, node.radius - 5, 0, 2 * Math.PI)
            ctx.clip()
            ctx.drawImage(imgAvatar, node.x - node.radius + 5, node.y - node.radius + 5, (node.radius - 5) * 2, (node.radius - 5) * 2)
            ctx.restore()
          } else {
            // 7. 竖排书法名字 (大改：从 11.5/9.5 调大到 14.5/11.5，保障文字超清晰可读)
            ctx.save()
            ctx.globalAlpha = node.opacity
            const chars = node.name.split('')
            const len = chars.length
            
            const fontSize = isCenter ? 14.5 : 11.5
            ctx.font = `bold ${fontSize}px "STKaiti", "KaiTi", "Microsoft YaHei", serif`
            ctx.fillStyle = isCenter ? '#fdfcf7' : '#ffffff'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            
            // 增加阴影，增强文字与底盘红色/绿色的高对比度
            ctx.shadowBlur = 2
            ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'

            const spacing = fontSize * 1.25
            const totalH = (len - 1) * spacing
            
            chars.forEach((char, cIdx) => {
              const cy = node.y - totalH / 2 + cIdx * spacing
              ctx.fillText(char, node.x, cy)
            })
            ctx.restore()
          }

          // 8. 顶部悬浮标签说明
          if (isCenter) {
            ctx.save()
            ctx.globalAlpha = node.opacity
            ctx.font = 'bold 10px "KaiTi", "STKaiti", serif'
            ctx.fillStyle = '#a63a3a'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`【 ${node.type === 'prescription' ? '经方' : node.type === 'herb' ? '本草' : node.type === 'syndrome' ? '证型' : node.type === 'symptom' ? '症状' : '归经'} 】`, node.x, node.y - node.radius - 12)
            ctx.restore()
          }

        } else {
          // 作为未展开的星云尘埃 (小灰墨点)
          ctx.save()
          ctx.globalAlpha = node.opacity
          ctx.fillStyle = 'rgba(60, 50, 40, 0.35)'
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
          ctx.fill()
          ctx.restore()
        }

        ctx.restore()
      })

      // 10. 鼠标悬停悬浮纸笺说明 (调大字体)
      const hoverNode = hoveredNodeRef.current
      if (hoverNode && hoverNode.radius <= 8) {
        ctx.save()
        ctx.font = '10.5px "KaiTi", "STKaiti", serif'
        const labelVal = `${hoverNode.name} (${hoverNode.type === 'prescription' ? '方剂' : hoverNode.type === 'herb' ? '中药' : hoverNode.type === 'syndrome' ? '证型' : hoverNode.type === 'symptom' ? '症状' : '归经'})`
        const tw = ctx.measureText(labelVal).width
        
        const tx = hoverNode.x
        const ty = hoverNode.y - 18

        ctx.fillStyle = '#fdfbf7'
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.roundRect(tx - tw / 2 - 5, ty - 8, tw + 10, 16, 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#111111'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labelVal, tx, ty + 0.5)
        ctx.restore()
      }

      ctx.restore()

      animationFrameId = requestAnimationFrame(runRenderLoop)
    }

    // --- C. 画布事件监听 (印章点选与悬浮膨胀) ---

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const cP = currentParallax.current
      const cZ = currentCamera.current.zoom

      // 换算回世界坐标
      const worldX = (clickX - (width / 2 + cP.x)) / cZ + width / 2
      const worldY = (clickY - (height / 2 + cP.y)) / cZ + height / 2

      // 点击碰撞检测
      let foundNode = null
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const dx = worldX - node.x
        const dy = worldY - node.y
        const hitR = Math.max(node.radius, 14)
        if (dx * dx + dy * dy < (hitR + 10) * (hitR + 10)) {
          foundNode = node
          break
        }
      }

      if (foundNode) {
        setSelectedNode(foundNode)
        selectedNodeRef.current = foundNode
      }
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const moveX = e.clientX - rect.left
      const moveY = e.clientY - rect.top

      // 摆动三维纸面视差
      targetParallax.current.x = (width / 2 - moveX) * 0.06
      targetParallax.current.y = (height / 2 - moveY) * 0.06

      const cP = currentParallax.current
      const cZ = currentCamera.current.zoom
      const worldX = (moveX - (width / 2 + cP.x)) / cZ + width / 2
      const worldY = (moveY - (height / 2 + cP.y)) / cZ + height / 2

      // 悬浮检测
      let foundHover = null
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const dx = worldX - node.x
        const dy = worldY - node.y
        const hitR = Math.max(node.radius, 12)
        if (dx * dx + dy * dy < (hitR + 8) * (hitR + 8)) {
          foundHover = node
          break
        }
      }

      hoveredNodeRef.current = foundHover
    }

    const handleWheel = (e) => {
      e.preventDefault()
      const zoomFactor = 1.12
      const oldZoom = targetCamera.current.zoom
      const newZoom = e.deltaY < 0 ? oldZoom * zoomFactor : oldZoom / zoomFactor
      targetCamera.current.zoom = Math.max(0.4, Math.min(2.5, newZoom))
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel)

    runRenderLoop()

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [loading, graphData])

  // 4. 搜索框节点高亮及平滑定位
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const matchedNode = graphData.nodes.find(n => 
      n.name.includes(searchQuery.trim()) || 
      (n.classic_ref && n.classic_ref.includes(searchQuery.trim())) ||
      (n.category && n.category.includes(searchQuery.trim()))
    )

    if (matchedNode) {
      setSelectedNode(matchedNode)
      selectedNodeRef.current = matchedNode
      targetCamera.current.zoom = 1.1
    } else {
      alert(`在当前知识图谱中未搜到关于 "${searchQuery}" 的中医节点。`)
    }
  }

  const handleResetView = () => {
    targetCamera.current.zoom = 1.0
    targetParallax.current = { x: 0, y: 0 }
  }

  // 5. 详情卡片面板
  const renderDetailPanel = () => {
    if (!selectedNode) {
      return (
        <div className="empty-panel">
          <p>📜 点击书轴中的任意中药或方剂印章，更换聚焦核心以开启星盘诊断路径。</p>
        </div>
      )
    }

    const node = selectedNode
    return (
      <div className="detail-panel">
        <div className="panel-header">
          <span className={`tag tag-${node.type === 'prescription' ? 'cinnabar' : node.type === 'herb' ? 'jade' : node.type === 'syndrome' ? 'gold' : 'indigo'}`}>
            {node.type === 'prescription' ? '经方百科' : node.type === 'herb' ? '本草解析' : node.type === 'syndrome' ? '辨证证型' : '核心症状'}
          </span>
          <h2 className="panel-title">{node.name}</h2>
        </div>

        <div className="panel-body">
          {/* 中药详情 */}
          {node.type === 'herb' && (
            <>
              <div className="detail-row">
                <span className="detail-label">分类：</span>
                <span className="detail-value text-glow-green">{node.category}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">性味：</span>
                <span className="detail-value">{node.nature} / {node.temperature}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">经典出处：</span>
                <span className="detail-value text-italic text-glow-gold">{node.classic_ref || '《神农本草经》'}</span>
              </div>
              <div className="detail-section">
                <h4 className="section-title">主要功用</h4>
                <p className="section-content">{node.functions}</p>
              </div>
              <div className="detail-section">
                <h4 className="section-title">本草释义</h4>
                <p className="section-content text-muted">{node.description || '暂无描述'}</p>
              </div>
            </>
          )}

          {/* 方剂详情 */}
          {node.type === 'prescription' && (
            <>
              <div className="detail-row">
                <span className="detail-label">出处：</span>
                <span className="detail-value text-glow-red">{node.source}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">功用：</span>
                <span className="detail-value">{node.functions}</span>
              </div>
              <div className="detail-section">
                <h4 className="section-title">主治指征</h4>
                <p className="section-content">{node.indications}</p>
              </div>
              <div className="detail-section">
                <h4 className="section-title">用法歌诀</h4>
                <p className="section-content text-italic">{node.usage || '水煎服，温覆微出汗'}</p>
              </div>
              {node.description && (
                <div className="detail-section">
                  <h4 className="section-title">方解方义</h4>
                  <p className="section-content text-muted">{node.description}</p>
                </div>
              )}
            </>
          )}

          {/* 证型详情 */}
          {node.type === 'syndrome' && (
            <>
              <div className="detail-section">
                <h4 className="section-title">概念与治法</h4>
                <p className="section-content">
                  这是中医辨证论治体系中的证候分类。知识图谱关联网络揭示了该证型下的致病症状，以及与之对应的调和营卫、理气活血之对症经典名方。
                </p>
              </div>
            </>
          )}

          {/* 症状详情 */}
          {node.type === 'symptom' && (
            <>
              <div className="detail-section">
                <h4 className="section-title">症状说明</h4>
                <p className="section-content">
                  这是中医临床诊断中的基础症候表现。图谱以其为中心，向外辐射出主治该症状的草药（如酸枣仁主治失眠、川芎主治头痛）以及召回的相关名方。
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="kg-loading flex-center">
        <div className="loading-spinner"></div>
        <p className="loading-text">📜 正在翻展写意水墨古书药案图谱...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="kg-error flex-center">
        <p className="error-text">⚠️ {error}</p>
      </div>
    )
  }

  return (
    <div className="kg-page container">
      {/* 侧边信息详情栏 */}
      <aside className="kg-sidebar">
        <form className="kg-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="kg-search-input"
            placeholder="输入节点以检索水墨卷轴..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary kg-search-btn">
            检索
          </button>
        </form>

        {renderDetailPanel()}
      </aside>

      {/* 知识图谱 Canvas 主画布 */}
      <main className="kg-canvas-container">
        <div className="canvas-header">
          <h3 className="canvas-title">🎨 岐黄本草国风写意水墨图谱</h3>
          <div className="canvas-legend">
            <span className="legend-item"><span className="legend-dot dot-presc"></span>方剂印</span>
            <span className="legend-item"><span className="legend-dot dot-herb"></span>草药印</span>
            <span className="legend-item"><span className="legend-dot dot-synd"></span>证型印</span>
            <span className="legend-item"><span className="legend-dot dot-symp"></span>症状印</span>
            <span className="legend-item"><span className="legend-dot dot-meri"></span>归经印</span>
          </div>
        </div>

        {/* 顶部控制悬浮 HUD */}
        <div className="canvas-hud">
          <span className="hud-instructions">🖱️ 滚轮缩放 | 🔍 鼠标扫过背景暗星以显影，点选印章更换聚焦中心</span>
          <button className="hud-reset-btn" onClick={handleResetView} title="重置视角">
            🔄 重置视角
          </button>
        </div>
        
        <canvas ref={canvasRef} className="kg-canvas"></canvas>
      </main>
    </div>
  )
}

export default KnowledgeGraphPage
