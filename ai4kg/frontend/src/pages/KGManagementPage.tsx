import React, { useState, useEffect, useRef, useCallback } from 'react'
import { graphsApi } from '@/services/api'
import type { Graph, GraphData, GraphNode, GraphEdge } from '@/types'
import NodePropertiesPanel from '@/components/Graph/NodePropertiesPanel'
import EdgePropertiesPanel from '@/components/Graph/EdgePropertiesPanel'
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

const KGManagementPage: React.FC = () => {
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [selectedGraph, setSelectedGraph] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [graphLoading, setGraphLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [leftPanelMode, setLeftPanelMode] = useState<'graphs' | 'properties' | 'collapsed'>('graphs')
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null)

  // Fetch graphs on component mount
  useEffect(() => {
    const fetchGraphs = async () => {
      try {
        const response = await graphsApi.getGraphs()
        if (response.success && response.data) {
          setGraphs(response.data.graphs)
        }
      } catch (error) {
        console.error('Failed to fetch graphs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGraphs()
  }, [])

  // Handle graph selection
  const handleGraphSelect = async (graphId: string) => {
    setGraphLoading(true)
    setSelectedNode(null)
    setSelectedEdge(null)
    try {
      const response = await graphsApi.getGraph(graphId)
      if (response.success && response.data) {
        setSelectedGraph(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch graph data:', error)
    } finally {
      setGraphLoading(false)
    }
  }

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    console.log('Node clicked:', node)
    setSelectedNode(node)
    setSelectedEdge(null)
    setLeftPanelMode('properties')
  }, [])

  // Handle edge click
  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    console.log('Edge clicked:', edge)
    setSelectedEdge(edge)
    setSelectedNode(null)
    setLeftPanelMode('properties')
  }, [])

  // Initialize chart when graph data changes
  useEffect(() => {
    if (!chartRef.current || !selectedGraph) return

    // Dispose previous chart instance if exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
    }

    const myChart = echarts.init(chartRef.current)
    chartInstanceRef.current = myChart

    if (graphLoading) {
      myChart.showLoading()
      return
    }

    myChart.hideLoading()

    // Create a map from node ID to node name for edge linking
    const nodeIdToName = new Map<string, string>()
    selectedGraph.nodes.forEach(node => {
      nodeIdToName.set(node.id, node.label)
    })

    // Transform data for ECharts
    const nodes = selectedGraph.nodes.map(node => ({
      id: node.id,
      name: node.label,
      x: node.x,
      y: node.y,
      symbolSize: node.size || 20,
      itemStyle: {
        color: node.color || '#5470c6'
      },
      category: node.type
    }))

    const links = selectedGraph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      name: edge.label || edge.type || ''
    }))

    // Get unique node types for categories
    const categories = Array.from(new Set(selectedGraph.nodes.map(node => node.type)))
      .map(type => ({ name: type }))

    const option: EChartsOption = {
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `${params.data.name}<br/>类型: ${params.data.category}`
          } else {
            return `${params.data.source} → ${params.data.target}<br/>${params.data.name}`
          }
        }
      },
      legend: [
        {
          data: categories.map(cat => cat.name),
          top: 10
        }
      ],
      series: [
        {
          name: selectedGraph.title,
          type: 'graph',
          layout: 'none',
          data: nodes,
          links: links,
          categories: categories,
          roam: true,
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
            max: 10
          },
          lineStyle: {
            color: 'source',
            curveness: 0.3
          }
        }
      ]
    }

    myChart.setOption(option)

    // Handle click events
    myChart.on('click', (params: any) => {
      console.log('Chart clicked:', params)
      if (params.dataType === 'node') {
        const clickedNode = selectedGraph.nodes.find(n => n.id === params.data.id)
        if (clickedNode) {
          handleNodeClick(clickedNode)
        }
      } else if (params.dataType === 'edge') {
        // Find edge by source and target match
        const clickedEdge = selectedGraph.edges.find(e => 
          (e.source === params.data.source && e.target === params.data.target) ||
          (e.source === params.data.target && e.target === params.data.source)
        )
        if (clickedEdge) {
          handleEdgeClick(clickedEdge)
        }
      }
    })

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [selectedGraph, graphLoading, handleNodeClick, handleEdgeClick])

  // Resize chart when panels collapse/expand
  useEffect(() => {
    if (chartInstanceRef.current) {
      setTimeout(() => {
        chartInstanceRef.current?.resize()
      }, 300) // Wait for transition to complete
    }
  }, [leftPanelMode, bottomPanelCollapsed])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900">知识图谱管理</h1>
        <p className="text-gray-600 mt-2">选择知识图谱查看详细信息</p>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Graph Selector & Properties */}
        <div className={`${leftPanelMode === 'collapsed' ? 'w-12' : 'w-80'} border-r bg-gray-50 transition-all duration-300 ease-in-out flex-shrink-0`}>
          <div className="relative h-full">
            {/* Toggle Buttons */}
            <div className="absolute top-4 right-2 z-10 flex flex-col gap-2">
              {/* Graph Selector Toggle */}
              <button
                onClick={() => setLeftPanelMode(leftPanelMode === 'graphs' ? 'collapsed' : 'graphs')}
                className={`p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors ${
                  leftPanelMode === 'graphs' ? 'bg-blue-100 border-blue-300' : 'bg-white'
                }`}
                title="图谱选择"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
              
              {/* Properties Toggle */}
              <button
                onClick={() => setLeftPanelMode(leftPanelMode === 'properties' ? 'collapsed' : 'properties')}
                className={`p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors ${
                  leftPanelMode === 'properties' ? 'bg-blue-100 border-blue-300' : 'bg-white'
                }`}
                title="属性面板"
                disabled={!selectedNode && !selectedEdge}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            {/* Panel Content */}
            {leftPanelMode === 'graphs' && (
              <div className="p-4 overflow-y-auto h-full">
                <h2 className="text-lg font-semibold mb-4">选择图谱</h2>
                {graphs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无图谱数据</p>
                ) : (
                  <div className="space-y-2">
                    {graphs.map((graph) => (
                      <div
                        key={graph.id}
                        onClick={() => handleGraphSelect(graph.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedGraph?.id === graph.id
                            ? 'bg-blue-100 border-blue-200 border'
                            : 'bg-white border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900">{graph.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {graph.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          更新时间: {new Date(graph.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {leftPanelMode === 'properties' && (
              <div className="h-full bg-white">
                {selectedNode && (
                  <NodePropertiesPanel
                    node={selectedNode}
                    graphId={selectedGraph?.id || ''}
                    onClose={() => setSelectedNode(null)}
                    onNodeUpdate={(updatedNode) => {
                      setSelectedNode(updatedNode)
                    }}
                    onNodeDelete={(nodeId) => {
                      setSelectedNode(null)
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
                  <div className="p-4 text-center text-gray-500">
                    <div>点击节点或边查看属性</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {!selectedGraph ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>请选择一个知识图谱</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Graph Visualization */}
              <div className="flex-1 p-4">
                <div className="h-full border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    ref={chartRef} 
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Data Tables */}
              <div className={`${bottomPanelCollapsed ? 'h-12' : 'h-80'} border-t bg-white transition-all duration-300 ease-in-out overflow-hidden`}>
                <div className="relative h-full">
                  {/* Collapse/Expand Button */}
                  <button
                    onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
                    className="absolute top-2 right-4 z-10 p-1 rounded-md bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors"
                    title={bottomPanelCollapsed ? '展开数据表格' : '折叠数据表格'}
                  >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${bottomPanelCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  
                  <div className="p-4 h-full">
                    {!bottomPanelCollapsed ? (
                      <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Nodes Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b">
                            <h3 className="font-semibold">节点信息 ({selectedGraph.nodes.length})</h3>
                          </div>
                          <div className="overflow-y-auto max-h-60">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">标签</th>
                                  <th className="px-3 py-2 text-left">类型</th>
                                  <th className="px-3 py-2 text-left">位置</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedGraph.nodes.map((node) => (
                                  <tr 
                                    key={node.id} 
                                    className="border-b hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleNodeClick(node)}
                                  >
                                    <td className="px-3 py-2 font-medium">{node.label}</td>
                                    <td className="px-3 py-2">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                        {node.type}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      ({Math.round(node.x)}, {Math.round(node.y)})
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Edges Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b">
                            <h3 className="font-semibold">边信息 ({selectedGraph.edges.length})</h3>
                          </div>
                          <div className="overflow-y-auto max-h-60">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">源节点</th>
                                  <th className="px-3 py-2 text-left">目标节点</th>
                                  <th className="px-3 py-2 text-left">关系</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedGraph.edges.map((edge) => {
                                  // Find source and target node labels
                                  const sourceNode = selectedGraph.nodes.find(n => n.id === edge.source)
                                  const targetNode = selectedGraph.nodes.find(n => n.id === edge.target)
                                  
                                  return (
                                    <tr 
                                      key={edge.id} 
                                      className="border-b hover:bg-gray-50 cursor-pointer"
                                      onClick={() => handleEdgeClick(edge)}
                                    >
                                      <td className="px-3 py-2">{sourceNode?.label || edge.source}</td>
                                      <td className="px-3 py-2">{targetNode?.label || edge.target}</td>
                                      <td className="px-3 py-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                          {edge.label || edge.type}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center h-full px-4">
                        <span className="text-sm text-gray-500">数据表格已折叠</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KGManagementPage