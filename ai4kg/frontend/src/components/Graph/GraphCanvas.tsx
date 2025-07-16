import { useEffect, useRef, useState } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import { circular, random } from 'graphology-layout'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { GraphNode, GraphEdge } from '@/types'

interface GraphCanvasProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onEdgeClick?: (edge: GraphEdge) => void
  onCanvasClick?: () => void
  selectedNodes?: string[]
  selectedEdges?: string[]
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  onCanvasClick,
  selectedNodes = [],
  selectedEdges = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const [isLayoutRunning, setIsLayoutRunning] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const graph = new Graph()
    graphRef.current = graph

    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      renderEdgeLabels: true,
      labelSize: 12,
      defaultNodeColor: '#3498db',
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      // Ensure edges are visible and clickable
      defaultEdgeType: 'line',
      edgeLabelSize: 10,
      enableEdgeClickEvents: true,
      enableEdgeWheelEvents: true,
      enableEdgeHoverEvents: true,
    })
    sigmaRef.current = sigma

    sigma.on('clickNode', ({ node }) => {
      const nodeData = nodes.find(n => n.id === node)
      if (nodeData && onNodeClick) {
        onNodeClick(nodeData)
      }
    })

    sigma.on('clickEdge', ({ edge }) => {
      // Find edge by the stored edge ID in attributes
      const edgeAttrs = graph.getEdgeAttributes(edge)
      const edgeData = edges.find(e => e.id === edgeAttrs.id)
      if (edgeData && onEdgeClick) {
        onEdgeClick(edgeData)
      }
    })

    return () => {
      sigma.kill()
    }
  }, [])

  // Update event handlers when they change
  useEffect(() => {
    if (!sigmaRef.current) return
    
    const sigma = sigmaRef.current
    
    // Remove all existing listeners
    sigma.removeAllListeners('clickNode')
    sigma.removeAllListeners('clickEdge')
    sigma.removeAllListeners('clickStage')
    
    // Add updated listeners
    sigma.on('clickNode', ({ node }) => {
      const nodeData = nodes.find(n => n.id === node)
      if (nodeData && onNodeClick) {
        onNodeClick(nodeData)
      }
    })

    sigma.on('clickEdge', ({ edge }) => {
      // console.log('Edge clicked:', edge)
      const graph = graphRef.current!
      const edgeAttrs = graph.getEdgeAttributes(edge)
      // console.log('Edge attributes:', edgeAttrs)
      const edgeData = edges.find(e => e.id === edgeAttrs.id)
      // console.log('Found edge data:', edgeData)
      // console.log('Available edges:', edges)
      if (edgeData && onEdgeClick) {
        console.log('Calling onEdgeClick with:', edgeData)
        onEdgeClick(edgeData)
      } else {
        console.log('Edge data not found or onEdgeClick not provided')
      }
    })

    // Add click stage listener for clicking on empty space
    sigma.on('clickStage', () => {
      if (onCanvasClick) {
        onCanvasClick()
      }
    })

    // Add hover events for better interaction
    sigma.on('enterNode', ({ node }) => {
      setHoveredNode(node)
    })

    sigma.on('leaveNode', () => {
      setHoveredNode(null)
    })
  }, [nodes, edges, onNodeClick, onEdgeClick, onCanvasClick])

  useEffect(() => {
    if (!graphRef.current || !sigmaRef.current) return

    const graph = graphRef.current
    const sigma = sigmaRef.current

    graph.clear()

    // Create label to ID mapping for nodes
    const labelToId = new Map<string, string>()
    nodes.forEach(node => {
      labelToId.set(node.label, node.id)
    })

    // Add nodes first
    nodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label,
        x: node.x || Math.random() * 100,
        y: node.y || Math.random() * 100,
        size: node.size || 10,
        color: node.color || '#3498db',
        properties: node.properties,
        nodeType: node.type,
      })
    })

    // Add edges with label-to-ID mapping
    edges.forEach(edge => {
      // Try to resolve source and target using label mapping
      const sourceId = labelToId.get(edge.source) || edge.source
      const targetId = labelToId.get(edge.target) || edge.target
      
      if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
        // graphology addEdge signature: addEdge(source, target, attributes)
        graph.addEdge(sourceId, targetId, {
          id: edge.id,
          properties: edge.properties,
          weight: edge.weight,
          color: edge.color || '#666666', // Default edge color
          size: 1,
          edgeType: edge.type,
        })
      }
    })

    if (nodes.length > 0 && nodes.every(n => !n.x || !n.y)) {
      circular.assign(graph)
    }

    sigma.refresh()
  }, [nodes, edges])

  useEffect(() => {
    if (!graphRef.current || !sigmaRef.current) return

    const graph = graphRef.current
    const sigma = sigmaRef.current

    const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0

    // Update node selection colors
    graph.forEachNode((node) => {
      const isSelected = selectedNodes.includes(node)
      const isHovered = hoveredNode === node
      const nodeData = nodes.find(n => n.id === node)
      
      let color: string
      let size: number
      if (hasSelection) {
        if (isSelected) {
          // 高亮选中的节点：使用红色并增大尺寸
          color = '#e74c3c'
          size = (nodeData?.size || 10) * 1.5
        } else {
          // 非选中节点：使用灰色并减小尺寸
          color = '#d3d3d3'
          size = (nodeData?.size || 10) * 0.7
        }
      } else if (isHovered) {
        // 悬停状态：使用橙色
        color = '#f39c12'
        size = (nodeData?.size || 10) * 1.2
      } else {
        // 无选择时使用原始颜色和尺寸
        color = nodeData?.color || '#3498db'
        size = nodeData?.size || 10
      }
      
      graph.setNodeAttribute(node, 'color', color)
      graph.setNodeAttribute(node, 'size', size)
    })

    // Update edge selection colors
    graph.forEachEdge((edge) => {
      const edgeAttrs = graph.getEdgeAttributes(edge)
      const isSelected = selectedEdges.includes(edgeAttrs.id)
      const isConnectedToHovered = hoveredNode && (
        graph.source(edge) === hoveredNode || graph.target(edge) === hoveredNode
      )
      
      let color: string
      let size: number
      if (hasSelection) {
        if (isSelected) {
          // 高亮选中的边：使用红色并增加粗细
          color = '#e74c3c'
          size = 3
        } else {
          // 非选中边：使用浅灰色并减少粗细
          color = '#e8e8e8'
          size = 0.5
        }
      } else if (isConnectedToHovered) {
        // 连接到悬停节点的边：使用橙色
        color = '#f39c12'
        size = 2
      } else {
        // 无选择时使用默认颜色和粗细
        color = '#666666'
        size = 1
      }
      
      graph.setEdgeAttribute(edge, 'color', color)
      graph.setEdgeAttribute(edge, 'size', size)
    })

    sigma.refresh()
  }, [selectedNodes, selectedEdges, nodes, edges, hoveredNode])

  const runForceLayout = () => {
    if (!graphRef.current || isLayoutRunning) return

    setIsLayoutRunning(true)
    const graph = graphRef.current

    forceAtlas2.assign(graph, {
      iterations: 50,
      settings: {
        gravity: 0.0005,
        scalingRatio: 10,
        strongGravityMode: false,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
      },
    })

    sigmaRef.current?.refresh()
    setIsLayoutRunning(false)
  }

  const runCircularLayout = () => {
    if (!graphRef.current) return

    const graph = graphRef.current
    const nodeCount = graph.order
    
    graph.forEachNode((node, index) => {
      const angle = (2 * Math.PI * Number(index)) / nodeCount
      const radius = Math.min(200, nodeCount * 10)
      graph.setNodeAttribute(node, 'x', Math.cos(angle) * radius)
      graph.setNodeAttribute(node, 'y', Math.sin(angle) * radius)
    })
    
    sigmaRef.current?.refresh()
  }

  const runRandomLayout = () => {
    if (!graphRef.current) return

    random.assign(graphRef.current)
    sigmaRef.current?.refresh()
  }

  const zoomIn = () => {
    sigmaRef.current?.getCamera().animatedZoom({ duration: 300 })
  }

  const zoomOut = () => {
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 300 })
  }

  const resetView = () => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 500 })
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={zoomIn}
          className="px-3 py-1 bg-white shadow rounded text-sm hover:bg-gray-50"
        >
          放大
        </button>
        <button
          onClick={zoomOut}
          className="px-3 py-1 bg-white shadow rounded text-sm hover:bg-gray-50"
        >
          缩小
        </button>
        <button
          onClick={resetView}
          className="px-3 py-1 bg-white shadow rounded text-sm hover:bg-gray-50"
        >
          重置视图
        </button>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ 
          touchAction: 'none',
          userSelect: 'none'
        }}
      />
    </div>
  )
}

export default GraphCanvas