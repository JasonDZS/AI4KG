import React, { useState, useEffect, useRef } from 'react'
import { graphsApi } from '@/services/api'
import type { Graph, GraphData, GraphNode, GraphEdge } from '@/types'
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
  const chartRef = useRef<HTMLDivElement>(null)

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

  // Initialize chart when graph data changes
  useEffect(() => {
    if (!chartRef.current || !selectedGraph) return

    const myChart = echarts.init(chartRef.current)

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
            max: 2
          },
          lineStyle: {
            color: 'source',
            curveness: 0.3
          }
        }
      ]
    }

    myChart.setOption(option)

    return () => {
      myChart.dispose()
    }
  }, [selectedGraph, graphLoading])

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
        {/* Left Panel - Graph Selector */}
        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
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

        {/* Right Panel - Split Layout */}
        <div className="flex-1 flex flex-col">
          {!selectedGraph ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>请选择一个知识图谱</p>
              </div>
            </div>
          ) : (
            <>
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
              <div className="h-80 border-t bg-white p-4 overflow-y-auto">
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
                            <tr key={node.id} className="border-b hover:bg-gray-50">
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
                              <tr key={edge.id} className="border-b hover:bg-gray-50">
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default KGManagementPage