import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { graphsApi } from '@/services/api'
import GraphCanvas from '@/components/Graph/GraphCanvas'
import NodePropertiesPanel from '@/components/Graph/NodePropertiesPanel'
import EdgePropertiesPanel from '@/components/Graph/EdgePropertiesPanel'
import GraphToolbar from '@/components/Graph/GraphToolbar'
import ContextMenu from '@/components/Graph/ContextMenu'
import type { GraphNode, GraphEdge } from '@/types'

interface ContextMenuState {
  show: boolean
  x: number
  y: number
  type: 'node' | 'edge' | 'canvas'
  target?: GraphNode | GraphEdge
}

const GraphViewPage = () => {
  const { graphId } = useParams<{ graphId: string }>()
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    type: 'canvas',
  })

  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['graph', graphId],
    queryFn: () => graphsApi.getGraph(graphId!),
    enabled: !!graphId,
  })

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, show: false }))
  }

  const handleNodeSelect = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      handleNodeClick(node)
    }
  }

  const handleEdgeSelect = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId)
    if (edge) {
      handleEdgeClick(edge)
    }
  }

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)
    setSelectedEdge(null)
    setSelectedNodes([node.id])
    setSelectedEdges([])
    hideContextMenu()
  }

  const handleEdgeClick = (edge: GraphEdge) => {
    console.log('handleEdgeClick called with:', edge)
    setSelectedEdge(edge)
    setSelectedNode(null)
    setSelectedEdges([edge.id])
    setSelectedNodes([])
    hideContextMenu()
  }

  const handleNodeRightClick = (node: GraphNode, event: MouseEvent) => {
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      target: node,
    })
  }

  const handleCanvasRightClick = (event: MouseEvent) => {
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      type: 'canvas',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !graphData?.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500">无法加载图谱数据</p>
        </div>
      </div>
    )
  }

  const { title, description, nodes, edges } = graphData.data

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="border-b px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="flex-shrink-0">
        <GraphToolbar 
          graphId={graphId!} 
          nodes={nodes}
          edges={edges}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
        />
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1" style={{ position: 'relative', minHeight: '500px' }}>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodeRightClick={handleNodeRightClick}
            onCanvasRightClick={handleCanvasRightClick}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
          />
        </div>

        <div className="w-80 border-l bg-background flex-shrink-0">
          {selectedNode && (
            <NodePropertiesPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
          {selectedEdge && (
            <EdgePropertiesPanel
              edge={selectedEdge}
              onClose={() => setSelectedEdge(null)}
            />
          )}
          {!selectedNode && !selectedEdge && (
            <div className="p-4 text-center text-muted-foreground">
              点击节点或边查看属性
            </div>
          )}
        </div>
      </div>

      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          target={contextMenu.target}
          onClose={hideContextMenu}
          graphId={graphId!}
        />
      )}
    </div>
  )
}

export default GraphViewPage