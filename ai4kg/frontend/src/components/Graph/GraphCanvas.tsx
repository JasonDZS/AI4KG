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
  selectedNodes?: string[]
  selectedEdges?: string[]
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  selectedNodes = [],
  selectedEdges = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const [isLayoutRunning, setIsLayoutRunning] = useState(false)

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
    
    // Add updated listeners
    sigma.on('clickNode', ({ node }) => {
      const nodeData = nodes.find(n => n.id === node)
      if (nodeData && onNodeClick) {
        onNodeClick(nodeData)
      }
    })

    sigma.on('clickEdge', ({ edge }) => {
      console.log('Edge clicked:', edge)
      const graph = graphRef.current!
      const edgeAttrs = graph.getEdgeAttributes(edge)
      console.log('Edge attributes:', edgeAttrs)
      const edgeData = edges.find(e => e.id === edgeAttrs.id)
      console.log('Found edge data:', edgeData)
      console.log('Available edges:', edges)
      if (edgeData && onEdgeClick) {
        console.log('Calling onEdgeClick with:', edgeData)
        onEdgeClick(edgeData)
      } else {
        console.log('Edge data not found or onEdgeClick not provided')
      }
    })
  }, [nodes, edges, onNodeClick, onEdgeClick])

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
          color: '#e74c3c', // Use red color to make edges more visible
          size: 1, // Make edges thicker for easier clicking
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

    // Update node selection colors
    graph.forEachNode((node) => {
      const isSelected = selectedNodes.includes(node)
      const nodeData = nodes.find(n => n.id === node)
      graph.setNodeAttribute(node, 'color', isSelected ? '#e74c3c' : 
        nodeData?.color || '#3498db')
    })

    // Update edge selection colors
    graph.forEachEdge((edge) => {
      const edgeAttrs = graph.getEdgeAttributes(edge)
      const isSelected = selectedEdges.includes(edgeAttrs.id)
      graph.setEdgeAttribute(edge, 'color', isSelected ? '#ff6b6b' : '#e74c3c')
      graph.setEdgeAttribute(edge, 'size', isSelected ? 8 : 5)
    })

    sigma.refresh()
  }, [selectedNodes, selectedEdges, nodes, edges])

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
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <button
          onClick={runForceLayout}
          disabled={isLayoutRunning}
          className="px-3 py-1 bg-white shadow rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {isLayoutRunning ? '布局中...' : '力导向布局'}
        </button>
        <button
          onClick={runCircularLayout}
          className="px-3 py-1 bg-white shadow rounded text-sm hover:bg-gray-50"
        >
          圆形布局
        </button>
        <button
          onClick={runRandomLayout}
          className="px-3 py-1 bg-white shadow rounded text-sm hover:bg-gray-50"
        >
          随机布局
        </button>
      </div>

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