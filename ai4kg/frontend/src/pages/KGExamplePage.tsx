import React, { useEffect, useRef } from 'react'
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

const KGExamplePage: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const myChart = echarts.init(chartRef.current)
    
    myChart.showLoading()
    
    // Use local data instead of remote fetch
    fetch('/examples/les-miserables.json')
      .then(response => response.json())
      .then(graph => {
        myChart.hideLoading()

        const option: EChartsOption = {
          tooltip: {},
          legend: [
            {
              data: graph.categories.map((a: { name: string }) => a.name)
            }
          ],
          series: [
            {
              name: 'Les Miserables',
              type: 'graph',
              layout: 'none',
              data: graph.nodes,
              links: graph.links,
              categories: graph.categories,
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
      })
      .catch(error => {
        console.error('Failed to load graph data:', error)
        myChart.hideLoading()
      })

    // Cleanup function
    return () => {
      myChart.dispose()
    }
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">知识图谱示例</h1>
        <p className="text-gray-600 mt-2">基于 ECharts 的知识图谱可视化示例</p>
      </div>
      <div 
        ref={chartRef} 
        className="w-full h-[600px] border border-gray-200 rounded-lg"
      />
    </div>
  )
}

export default KGExamplePage