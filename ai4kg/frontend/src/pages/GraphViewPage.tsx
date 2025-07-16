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
  const [isTableViewOpen, setIsTableViewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'nodes' | 'edges'>('nodes')
  const [highlightMode, setHighlightMode] = useState<'direct' | 'extended'>('direct') // 新增高亮模式状态
  const [isSelectionLocked, setIsSelectionLocked] = useState(false) // 锁定选择状态

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
    // 如果选择被锁定，再次点击同一节点取消锁定
    if (isSelectionLocked && selectedNode?.id === node.id) {
      setIsSelectionLocked(false)
      setSelectedNode(null)
      setSelectedEdge(null)
      setSelectedNodes([])
      setSelectedEdges([])
      return
    }
    
    setSelectedNode(node)
    setSelectedEdge(null)
    
    // 如果已经选中了同一个节点，锁定选择
    if (selectedNode?.id === node.id && !isSelectionLocked) {
      setIsSelectionLocked(true)
      return
    }
    
    setIsSelectionLocked(false) // 选择新节点时取消锁定
    
    if (highlightMode === 'direct') {
      // 直接模式：只高亮直接连接的节点和边
      const directEdges = edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      )
      
      const directNodeIds = new Set<string>([node.id])
      directEdges.forEach(edge => {
        directNodeIds.add(edge.source)
        directNodeIds.add(edge.target)
      })
      
      setSelectedNodes(Array.from(directNodeIds))
      setSelectedEdges(directEdges.map(edge => edge.id))
    } else {
      // 扩展模式：高亮二跳邻居（邻居的邻居）
      const firstHopEdges = edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      )
      
      const firstHopNodes = new Set<string>([node.id])
      firstHopEdges.forEach(edge => {
        firstHopNodes.add(edge.source)
        firstHopNodes.add(edge.target)
      })
      
      // 找到二跳邻居
      const secondHopEdges = edges.filter(edge => 
        (firstHopNodes.has(edge.source) || firstHopNodes.has(edge.target)) &&
        !(edge.source === node.id || edge.target === node.id) // 排除已包含的一跳边
      )
      
      const allExtendedNodes = new Set(firstHopNodes)
      secondHopEdges.forEach(edge => {
        allExtendedNodes.add(edge.source)
        allExtendedNodes.add(edge.target)
      })
      
      const allRelevantEdges = [...firstHopEdges, ...secondHopEdges]
      
      setSelectedNodes(Array.from(allExtendedNodes))
      setSelectedEdges(allRelevantEdges.map(edge => edge.id))
    }
  }

  const handleEdgeClick = (edge: GraphEdge) => {
    // console.log('handleEdgeClick called with:', edge)
    setSelectedEdge(edge)
    setSelectedNode(null)
    
    if (highlightMode === 'direct') {
      // 直接模式：只高亮边连接的两个节点和当前边
      setSelectedNodes([edge.source, edge.target])
      setSelectedEdges([edge.id])
    } else {
      // 扩展模式：高亮边连接的节点以及这些节点的所有邻居
      const sourceEdges = edges.filter(e => 
        e.source === edge.source || e.target === edge.source
      )
      const targetEdges = edges.filter(e => 
        e.source === edge.target || e.target === edge.target
      )
      
      const relatedNodeIds = new Set<string>([edge.source, edge.target])
      const allRelatedEdges = new Set<GraphEdge>([edge])
      
      // 添加源节点的所有邻居
      sourceEdges.forEach(e => {
        relatedNodeIds.add(e.source)
        relatedNodeIds.add(e.target)
        allRelatedEdges.add(e)
      })
      
      // 添加目标节点的所有邻居
      targetEdges.forEach(e => {
        relatedNodeIds.add(e.source)
        relatedNodeIds.add(e.target)
        allRelatedEdges.add(e)
      })
      
      setSelectedNodes(Array.from(relatedNodeIds))
      setSelectedEdges(Array.from(allRelatedEdges).map(e => e.id))
    }
  }

  const handleCanvasClick = () => {
    // 如果选择被锁定，不要清除选择
    if (isSelectionLocked) return
    
    // 点击空白区域取消选中
    setSelectedNode(null)
    setSelectedEdge(null)
    setSelectedNodes([])
    setSelectedEdges([])
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>💡 点击节点/边高亮相关连接</div>
            <div>🔒 再次点击同一节点锁定选择</div>
            <div>🖱️ 鼠标悬停预览连接</div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-2 border-b bg-gray-50">
          <GraphToolbar 
            graphId={graphId!} 
            nodes={nodes}
            edges={edges}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
          />
          
          {/* 高亮模式切换 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">高亮模式:</span>
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setHighlightMode('direct')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  highlightMode === 'direct'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="只显示直接连接的节点和边"
              >
                直接邻居
              </button>
              <button
                onClick={() => setHighlightMode('extended')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  highlightMode === 'extended'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="显示二跳邻居（邻居的邻居）"
              >
                扩展邻居
              </button>
            </div>
            
            {/* 说明文字 */}
            {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
              <div className="text-xs text-gray-500 flex items-center space-x-2">
                <span>
                  已选择 {selectedNodes.length} 个节点，{selectedEdges.length} 条边
                </span>
                {isSelectionLocked && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    🔒 已锁定
                  </span>
                )}
              </div>
            )}
            
            {/* 清除选择按钮 */}
            {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
              <button
                onClick={() => {
                  setSelectedNode(null)
                  setSelectedEdge(null)
                  setSelectedNodes([])
                  setSelectedEdges([])
                  setIsSelectionLocked(false)
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                清除选择
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 左侧表格视图 */}
        <div className={`bg-background border-r transition-all duration-300 ${
          isTableViewOpen ? 'w-96' : 'w-12'
        }`}>
          {/* 展开/收起按钮 */}
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-2 border-b">
              <button
                onClick={() => setIsTableViewOpen(!isTableViewOpen)}
                className="w-full h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title={isTableViewOpen ? "收起表格" : "展开表格"}
              >
                {isTableViewOpen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* 表格内容 */}
            {isTableViewOpen && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* 标签切换 */}
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab('nodes')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'nodes' 
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    节点 ({nodes?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('edges')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'edges' 
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    边 ({edges?.length || 0})
                  </button>
                </div>
                
                {/* 表格内容 */}
                <div className="flex-1 overflow-auto">
                  {activeTab === 'nodes' ? (
                    <div className="p-2">
                      <div className="space-y-1">
                        {nodes?.map((node) => (
                          <div
                            key={node.id}
                            onClick={() => handleNodeClick(node)}
                            className={`p-2 rounded cursor-pointer border transition-colors ${
                              selectedNode?.id === node.id 
                                ? 'bg-blue-100 border-blue-300' 
                                : 'hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-sm truncate">
                              {node.label || node.id}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              ID: {node.id}
                            </div>
                            {node.type && (
                              <div className="text-xs text-gray-400 truncate">
                                类型: {node.type}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="space-y-1">
                        {edges?.map((edge) => (
                          <div
                            key={edge.id}
                            onClick={() => handleEdgeClick(edge)}
                            className={`p-2 rounded cursor-pointer border transition-colors ${
                              selectedEdge?.id === edge.id 
                                ? 'bg-blue-100 border-blue-300' 
                                : 'hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-sm truncate">
                              {edge.label || `${edge.source} → ${edge.target}`}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {edge.source} → {edge.target}
                            </div>
                            {edge.type && (
                              <div className="text-xs text-gray-400 truncate">
                                类型: {edge.type}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" style={{ position: 'relative', minHeight: '500px' }}>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onCanvasClick={handleCanvasClick}
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