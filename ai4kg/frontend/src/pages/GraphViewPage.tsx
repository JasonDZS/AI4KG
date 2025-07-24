import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as echarts from 'echarts/core'
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption
} from 'echarts/components'
import { GraphChart, GraphSeriesOption } from 'echarts/charts'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { graphsApi } from '@/services/api'
import NodePropertiesPanel from '@/components/Graph/NodePropertiesPanel'
import EdgePropertiesPanel from '@/components/Graph/EdgePropertiesPanel'
import GraphToolbar from '@/components/Graph/GraphToolbar'
import type { GraphNode, GraphEdge } from '@/types'

echarts.use([
  TooltipComponent,
  LegendComponent,
  GraphChart,
  CanvasRenderer,
  LabelLayout
])

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | LegendComponentOption | GraphSeriesOption
>

const GraphViewPage = () => {
  const { graphId } = useParams<{ graphId: string }>()
  const queryClient = useQueryClient()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [isTableViewOpen, setIsTableViewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'nodes' | 'edges'>('nodes')
  const [highlightMode, setHighlightMode] = useState<'direct' | 'extended'>('direct')
  const [isSelectionLocked, setIsSelectionLocked] = useState(false)

  // Convert backend data to ECharts format
  const transformDataForECharts = (nodes: GraphNode[], edges: GraphEdge[]) => {
    // Create category color mapping
    const uniqueTypes = Array.from(new Set(nodes.map(node => node.type || 'default')))
    const categoryColors = ['#4dabf7', '#ff6b6b', '#51cf66', '#ffd43b', '#9775fa', '#ff8cc8', '#74c0fc', '#ffa8a8']
    
    const categories = uniqueTypes.map((type, index) => ({ 
      name: type,
      itemStyle: {
        color: categoryColors[index % categoryColors.length]
      }
    }))

    const echartsNodes = nodes.map(node => {
      const categoryIndex = uniqueTypes.indexOf(node.type || 'default')
      const baseColor = categoryColors[categoryIndex % categoryColors.length]
      
      return {
        id: String(node.id), // Ensure ID is string
        name: node.label || node.id,
        category: categoryIndex,
        x: node.x,
        y: node.y,
        symbolSize: Math.max(20, Math.min(60, (node.value || 30))),
        value: node.value || 1,
        itemStyle: {
          color: selectedNodes.includes(String(node.id)) ? '#ff6b6b' : baseColor,
          borderColor: selectedNodes.includes(String(node.id)) ? '#d63031' : '#ffffff',
          borderWidth: selectedNodes.includes(String(node.id)) ? 3 : 1
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 12,
          color: '#333'
        }
      }
    })

    const echartsLinks = edges.map((edge, index) => {
      // Debug each edge
      if (index < 3) {
        console.log(`Edge ${index}:`, edge)
        console.log('Source:', edge.source, 'Target:', edge.target)
      }
      
      return {
        source: String(edge.source || ''), // Ensure source is string
        target: String(edge.target || ''), // Ensure target is string
        name: edge.label || '',
        value: edge.weight || 1
      }
    }).filter(link => link.source && link.target) // Remove invalid links

    return { nodes: echartsNodes, links: echartsLinks, categories }
  }

  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['graph', graphId],
    queryFn: () => graphsApi.getGraph(graphId!),
    enabled: !!graphId,
  })

  // Function to extract edges from different possible structures
  const extractEdges = (data: any) => {
    if (!data) return []
    
    // Try different possible edge locations and structures
    const possibleEdges = data.edges || data.links || data.relationships || data.connections || []
    
    // If edges exist but have different property names, try to normalize them
    return possibleEdges.map((edge: any, index: number) => {
      // Handle different possible property names for source/target
      const source = edge.source || edge.from || edge.start_node || edge.source_id || edge.sourceId
      const target = edge.target || edge.to || edge.end_node || edge.target_id || edge.targetId
      
      // Debug first few edges
      if (index < 3) {
        console.log(`Processing edge ${index}:`, edge)
        console.log(`Extracted source: ${source}, target: ${target}`)
      }
      
      return {
        ...edge,
        source: source,
        target: target,
        id: edge.id || `${source}-${target}`,
        label: edge.label || edge.name || edge.type || '',
        type: edge.type || 'default'
      }
    }).filter((edge: any) => edge.source && edge.target) // Filter out invalid edges
  }

  // Extract nodes and edges early to avoid initialization issues
  const nodes = graphData?.data?.nodes || []
  const edges = extractEdges(graphData?.data)
  
  // Debug the extracted data
  console.log('Full graphData response:', graphData)
  console.log('Extracted data:', {
    graphData: graphData?.data,
    nodes: nodes.length,
    edges: edges.length,
    firstEdge: edges[0]
  })
  
  // Check if edges might be in a different location
  if (graphData?.data) {
    console.log('All keys in graphData.data:', Object.keys(graphData.data))
    if (edges.length === 0) {
      console.log('Checking for alternative edge locations...')
      console.log('graphData.data.links:', graphData.data.links)
      console.log('graphData.data.relationships:', graphData.data.relationships)
      console.log('graphData.data.connections:', graphData.data.connections)
    }
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
      setSelectedEdges(directEdges.map(edge => edge.id || `${edge.source}-${edge.target}`))
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
      setSelectedEdges(allRelevantEdges.map(edge => edge.id || `${edge.source}-${edge.target}`))
    }
  }

  const handleEdgeClick = (edge: GraphEdge) => {
    // console.log('handleEdgeClick called with:', edge)
    setSelectedEdge(edge)
    setSelectedNode(null)
    
    if (highlightMode === 'direct') {
      // 直接模式：只高亮边连接的两个节点和当前边
      setSelectedNodes([edge.source, edge.target])
      setSelectedEdges([edge.id || `${edge.source}-${edge.target}`])
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
      setSelectedEdges(Array.from(allRelatedEdges).map(e => e.id || `${e.source}-${e.target}`))
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

  // Initialize ECharts when data is available
  useEffect(() => {
    if (!chartRef.current || !nodes || !edges) return

    // Debug logging
    console.log('Raw data:', { nodes: nodes.length, edges: edges.length })
    console.log('Sample edge:', edges[0])
    console.log('First few edges:', edges.slice(0, 3))
    console.log('Edge keys:', edges[0] ? Object.keys(edges[0]) : 'No edges')

    // Dispose previous chart instance if exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
    }

    const chart = echarts.init(chartRef.current)
    chartInstanceRef.current = chart

    // Transform data for ECharts
    const { nodes: echartsNodes, links: echartsLinks, categories } = transformDataForECharts(nodes, edges)
    
    // Debug transformed data
    console.log('ECharts data:', { 
      nodes: echartsNodes.length, 
      links: echartsLinks.length,
      sampleLink: echartsLinks[0]
    })
    
    // Check if all edge sources and targets have corresponding nodes
    const nodeIds = new Set(echartsNodes.map(n => n.id))
    const invalidLinks = echartsLinks.filter(link => 
      !nodeIds.has(link.source) || !nodeIds.has(link.target)
    )
    if (invalidLinks.length > 0) {
      console.warn('Invalid links found:', invalidLinks)
    }

    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const categoryName = categories[params.data.category]?.name || 'Unknown'
            return `节点: ${params.data.name}<br/>ID: ${params.data.id}<br/>类型: ${categoryName}<br/>值: ${params.data.value}`
          } else if (params.dataType === 'edge') {
            return `边: ${params.data.name || '连接'}<br/>从: ${params.data.source}<br/>到: ${params.data.target}`
          }
          return ''
        }
      },
      legend: [{
        data: categories.map(cat => cat.name),
        top: 10,
        left: 10,
        orient: 'horizontal',
        itemGap: 20,
        textStyle: {
          fontSize: 12,
          color: '#333'
        },
        selectedMode: 'multiple', // Enable legend selection
        selector: [
          {
            type: 'all',
            title: '全选'
          },
          {
            type: 'inverse',
            title: '反选'
          }
        ]
      }],
      series: [{
        name: '知识图谱',
        type: 'graph',
        layout: 'force',
        data: echartsNodes,
        links: echartsLinks,
        categories: categories,
        roam: true,
        force: {
          repulsion: 800,
          gravity: 0.1,
          edgeLength: 200,
          layoutAnimation: true
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        },
        labelLayout: {
          hideOverlap: true
        },
        scaleLimit: {
          min: 0.4,
          max: 2
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          }
        }
      }]
    }

    chart.setOption(option)
    
    // Debug: Log the final option
    console.log('Final ECharts option:', {
      seriesData: option.series[0].data.length,
      seriesLinks: option.series[0].links.length,
      categories: option.series[0].categories.length
    })

    // Handle click events
    chart.on('click', (params: any) => {
      if (params.dataType === 'node') {
        const clickedNode = nodes.find(n => n.id === params.data.id)
        if (clickedNode) {
          handleNodeClick(clickedNode)
        }
      } else if (params.dataType === 'edge') {
        // Find edge by source and target match
        const clickedEdge = edges.find(e => 
          (e.source === params.data.source && e.target === params.data.target) ||
          (e.source === params.data.target && e.target === params.data.source)
        )
        if (clickedEdge) {
          handleEdgeClick(clickedEdge)
        }
      }
    })

    // Handle window resize
    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [nodes, edges, selectedNodes, selectedEdges])

  // Update chart when selection changes
  useEffect(() => {
    if (!chartInstanceRef.current || !nodes || !edges) return

    const { nodes: echartsNodes, links: echartsLinks, categories } = transformDataForECharts(nodes, edges)
    
    chartInstanceRef.current.setOption({
      series: [{
        data: echartsNodes,
        links: echartsLinks
      }]
    })
  }, [selectedNodes, selectedEdges, nodes, edges])

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

  const { title, description } = graphData.data

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
          <div 
            ref={chartRef} 
            className="w-full h-full"
            onClick={handleCanvasClick}
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