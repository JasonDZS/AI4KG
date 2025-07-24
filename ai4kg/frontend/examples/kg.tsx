import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption
} from 'echarts/components';
import { GraphChart, GraphSeriesOption } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TooltipComponent,
  LegendComponent,
  GraphChart,
  CanvasRenderer,
  LabelLayout
]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | LegendComponentOption | GraphSeriesOption
>;

var ROOT_PATH = 'https://echarts.apache.org/examples';

var chartDom = document.getElementById('main')!;
var myChart = echarts.init(chartDom);
var option: EChartsOption;

myChart.showLoading();
$.getJSON(ROOT_PATH + '/data/asset/data/les-miserables.json', function (graph) {
  myChart.hideLoading();

  option = {
    tooltip: {},
    legend: [
      {
        data: graph.categories.map(function (a: { name: string }) {
          return a.name;
        })
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
  };

  myChart.setOption(option);
});

option && myChart.setOption(option);
