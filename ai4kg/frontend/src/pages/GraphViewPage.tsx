import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { graphsApi } from '@/services/api'
import GraphCanvas from '@/components/Graph/GraphCanvas'
import NodePropertiesPanel from '@/components/Graph/NodePropertiesPanel'
import EdgePropertiesPanel from '@/components/Graph/EdgePropertiesPanel'
import GraphToolbar from '@/components/Graph/GraphToolbar'
import type { GraphNode, GraphEdge } from '@/types'

const GraphViewPage = () => {
  const { graphId } = useParams<{ graphId: string }>()
  const queryClient = useQueryClient()
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)

  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['graph', graphId],
    queryFn: () => graphsApi.getGraph(graphId!),
    enabled: !!graphId,
  })

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
  }

  const handleEdgeClick = (edge: GraphEdge) => {
    console.log('handleEdgeClick called with:', edge)
    setSelectedEdge(edge)
    setSelectedNode(null)
    setSelectedEdges([edge.id])
    setSelectedNodes([])
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
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
          />
        </div>

        <div className="w-80 border-l bg-background flex-shrink-0">
          {selectedNode && (
            <NodePropertiesPanel
              node={selectedNode}
              graphId={graphId!}
              onClose={() => setSelectedNode(null)}
              onNodeUpdate={(updatedNode) => {
                setSelectedNode(updatedNode)
                // 更新React Query缓存中的节点数据
                queryClient.setQueryData(['graph', graphId], (oldData: any) => {
                  if (!oldData?.data) return oldData
                  
                  return {
                    ...oldData,
                    data: {
                      ...oldData.data,
                      nodes: oldData.data.nodes.map((node: GraphNode) =>
                        node.id === updatedNode.id ? updatedNode : node
                      )
                    }
                  }
                })
              }}
              onNodeDelete={(nodeId) => {
                // 从React Query缓存中删除节点
                queryClient.setQueryData(['graph', graphId], (oldData: any) => {
                  if (!oldData?.data) return oldData
                  
                  return {
                    ...oldData,
                    data: {
                      ...oldData.data,
                      nodes: oldData.data.nodes.filter((node: GraphNode) => node.id !== nodeId),
                      edges: oldData.data.edges.filter((edge: GraphEdge) => 
                        edge.source !== nodeId && edge.target !== nodeId
                      )
                    }
                  }
                })
              }}
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
              <div>点击节点或边查看属性</div>
              {nodes?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs">调试工具：</p>
                  <button 
                    onClick={() => handleNodeClick(nodes[0])}
                    className="block w-full px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                  >
                    选择节点: {nodes[0]?.label || nodes[0]?.id}
                  </button>
                  <div className="text-xs text-gray-500">
                    图谱包含 {nodes.length} 个节点
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GraphViewPage