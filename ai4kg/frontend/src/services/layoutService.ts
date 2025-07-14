import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import circular from 'graphology-layout/circular';
import random from 'graphology-layout/random';
import { LayoutConfig } from '../types/graph';

class LayoutService {
  applyLayout(graph: Graph, config: LayoutConfig): void {
    switch (config.type) {
      case 'force':
        this.applyForceLayout(graph, config);
        break;
      case 'circular':
        this.applyCircularLayout(graph);
        break;
      case 'random':
        this.applyRandomLayout(graph);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(graph);
        break;
      default:
        this.applyForceLayout(graph, config);
    }
  }

  private applyForceLayout(graph: Graph, config: LayoutConfig): void {
    // 设置初始随机位置（如果节点没有位置）
    graph.forEachNode((node, attributes) => {
      if (attributes.x === undefined || attributes.y === undefined) {
        graph.setNodeAttribute(node, 'x', Math.random() * 1000);
        graph.setNodeAttribute(node, 'y', Math.random() * 1000);
      }
    });

    // 应用 ForceAtlas2 布局
    const settings = {
      iterations: config.iterations || 50,
      settings: {
        gravity: config.gravity || 1,
        strongGravityMode: true,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        scalingRatio: config.repulsion || 1,
      },
    };

    forceAtlas2.assign(graph, settings);
  }

  private applyCircularLayout(graph: Graph): void {
    circular.assign(graph);
  }

  private applyRandomLayout(graph: Graph): void {
    random.assign(graph);
  }

  private applyHierarchicalLayout(graph: Graph): void {
    // 简单的层次布局实现
    const levels: { [key: string]: string[] } = {};
    const visited = new Set<string>();
    
    // 找到根节点（入度为0的节点）
    const roots: string[] = [];
    graph.forEachNode((node) => {
      if (graph.inDegree(node) === 0) {
        roots.push(node);
      }
    });

    if (roots.length === 0) {
      // 如果没有根节点，随机选择一个
      roots.push(graph.nodes()[0]);
    }

    // BFS遍历分层
    let currentLevel = 0;
    let queue = [...roots];
    
    while (queue.length > 0) {
      const nextQueue: string[] = [];
      levels[currentLevel] = [];
      
      queue.forEach(node => {
        if (!visited.has(node)) {
          visited.add(node);
          levels[currentLevel].push(node);
          
          graph.forEachOutNeighbor(node, (neighbor) => {
            if (!visited.has(neighbor)) {
              nextQueue.push(neighbor);
            }
          });
        }
      });
      
      queue = nextQueue;
      currentLevel++;
    }

    // 未访问的节点放在最后一层
    graph.forEachNode((node) => {
      if (!visited.has(node)) {
        if (!levels[currentLevel]) {
          levels[currentLevel] = [];
        }
        levels[currentLevel].push(node);
      }
    });

    // 设置节点位置
    Object.keys(levels).forEach(levelStr => {
      const level = parseInt(levelStr);
      const nodesInLevel = levels[level];
      const y = level * 150;
      
      nodesInLevel.forEach((node, index) => {
        const x = (index - (nodesInLevel.length - 1) / 2) * 100;
        graph.setNodeAttribute(node, 'x', x);
        graph.setNodeAttribute(node, 'y', y);
      });
    });
  }
}

export const layoutService = new LayoutService();
