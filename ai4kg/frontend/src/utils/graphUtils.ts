import Graph from 'graphology';
import { cropToLargestConnectedComponent } from 'graphology-components';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import circular from 'graphology-layout/circular';
import { Node, Edge, Graph as GraphData } from '../types/graph';
import { DEFAULT_NODE_SIZE, DEFAULT_EDGE_SIZE, NODE_TYPES, COLORS } from './constants';

// 为不同节点类型定义颜色映射
const TYPE_COLOR_MAP: { [key: string]: string } = {
  [NODE_TYPES.ENTITY]: '#FA5A3D',     // 红色
  [NODE_TYPES.CONCEPT]: '#5A75DB',    // 蓝色  
  [NODE_TYPES.RELATION]: '#52c41a',   // 绿色
  'default': '#722ed1',               // 紫色作为默认色
};

// 根据类型获取颜色
const getNodeColorByType = (type: string): string => {
  return TYPE_COLOR_MAP[type] || TYPE_COLOR_MAP['default'];
};

export const createGraphFromData = (data: GraphData): Graph => {
  const graph = new Graph();

  console.log('=== STARTING createGraphFromData ===');
  console.log('Creating graph from data:', data);
  console.log('Input nodes count:', data.nodes.length);
  console.log('Input edges count:', data.edges.length);
  
  // 首先检查输入数据的完整性
  console.log('Checking input data integrity...');
  console.log('Data keys:', Object.keys(data));
  console.log('Edges is array:', Array.isArray(data.edges));
  console.log('Edges exists:', !!data.edges);
  
  if (data.edges && data.edges.length > 0) {
    console.log('First edge structure:', JSON.stringify(data.edges[0], null, 2));
    console.log('Edge keys:', Object.keys(data.edges[0]));
  }

  // 1. 添加节点
  data.nodes.forEach((node, index) => {
    // 确保坐标是有效数字
    let x = node.x;
    let y = node.y;
    
    // 如果坐标无效，生成随机坐标
    if (typeof x !== 'number' || isNaN(x) || !isFinite(x)) {
      x = Math.random() * 1000;
    }
    if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
      y = Math.random() * 1000;
    }
    
    console.log(`Adding node ${index + 1}/${data.nodes.length}:`, {
      id: node.id,
      label: node.label,
      type: node.type,
      x: x,
      y: y,
      originalCoords: { x: node.x, y: node.y }
    });
    
    graph.addNode(node.id, {
      label: node.label,
      nodeType: node.type,
      x: x,
      y: y,
      originalType: node.type,
      ...node.properties,
    });
  });

  console.log(`Graph after adding nodes: ${graph.order} nodes`);

  // 2. 添加边
  console.log('Starting to add edges...');
  console.log('Input edges data:', JSON.stringify(data.edges?.slice(0, 3), null, 2));
  console.log('Total edges to process:', data.edges?.length || 0);
  
  if (!data.edges || data.edges.length === 0) {
    console.warn('No edges found in input data!');
    // 不要提前返回，继续处理其他逻辑
  } else {
    let successfulEdges = 0;
    let failedEdges = 0;
    
    data.edges.forEach((edge, index) => {
      console.log(`Processing edge ${index + 1}/${data.edges.length}:`, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type,
        sourceType: typeof edge.source,
        targetType: typeof edge.target
      });
      
      // 确保source和target是字符串
      const sourceStr = String(edge.source);
      const targetStr = String(edge.target);
      
      // 检查节点是否存在
      const sourceExists = graph.hasNode(sourceStr);
      const targetExists = graph.hasNode(targetStr);
      
      console.log(`Source node '${sourceStr}' exists: ${sourceExists}`);
      console.log(`Target node '${targetStr}' exists: ${targetExists}`);
      
      if (sourceExists && targetExists) {
        try {
          const edgeId = edge.id || `${sourceStr}-${targetStr}-${index}`;
          
          // 检查边是否已存在
          if (graph.hasEdge(sourceStr, targetStr)) {
            console.warn(`Edge ${sourceStr} -> ${targetStr} already exists, skipping`);
            return;
          }
          
          graph.addEdge(sourceStr, targetStr, {
            id: edge.id,
            label: edge.label,
            weight: edge.weight || 1,
            originalType: edge.type,
            color: '#FF0000', // 明显的红色
            size: 3, // 边的粗细
            ...edge.properties,
          });
          
          successfulEdges++;
          console.log(`✅ Successfully added edge ${index + 1}: ${sourceStr} -> ${targetStr} (${edge.label})`);
        } catch (error) {
          failedEdges++;
          console.error(`❌ Failed to add edge ${index + 1}:`, error);
        }
      } else {
        failedEdges++;
        console.warn(`❌ Skipping edge ${edge.id}: missing source ${sourceStr} (exists: ${sourceExists}) or target ${targetStr} (exists: ${targetExists})`);
        if (!sourceExists || !targetExists) {
          console.warn('Available nodes:', graph.nodes().slice(0, 10), '... (showing first 10)');
        }
      }
    });

    console.log(`Edge processing summary: ${successfulEdges} successful, ${failedEdges} failed`);
  }
  
  console.log(`Graph after adding edges: ${graph.order} nodes, ${graph.size} edges`);

  // 立即验证边是否真的被添加了
  console.log('=== EDGE VERIFICATION ===');
  console.log('Graph has edges:', graph.size > 0);
  if (graph.size > 0) {
    console.log('Edge details:');
    graph.forEachEdge((edge, attributes, source, target) => {
      console.log(`- ${edge}: ${source} -> ${target}`, attributes);
    });
  } else {
    console.error('❌ NO EDGES FOUND IN GRAPHOLOGY GRAPH!');
    console.log('Graph nodes:', graph.nodes());
    console.log('Attempting to add a test edge...');
    
    // 尝试添加一个测试边来验证graphology是否工作
    const allNodes = graph.nodes();
    if (allNodes.length >= 2) {
      try {
        graph.addEdge(allNodes[0], allNodes[1], {
          label: 'test edge',
          color: '#00FF00',
          size: 5
        });
        console.log('✅ Test edge added successfully. Graph now has', graph.size, 'edges');
      } catch (error) {
        console.error('❌ Failed to add test edge:', error);
      }
    }
  }

  // 3. 保留最大连通分量 (暂时禁用以调试)
  // if (graph.order > 1) {
  //   try {
  //     const originalOrder = graph.order;
  //     cropToLargestConnectedComponent(graph);
  //     console.log(`Cropped from ${originalOrder} to ${graph.order} nodes`);
  //   } catch (error) {
  //     console.warn('Could not crop to largest connected component:', error);
  //   }
  // }

  // 4. 根据节点类型设置颜色
  graph.forEachNode((node, attributes) => {
    const color = getNodeColorByType(attributes.nodeType as string);
    graph.setNodeAttribute(node, 'color', color);
    console.log(`Set color for node ${node}: ${color} (type: ${attributes.nodeType})`);
  });

  // 5. 根据度数设置节点大小
  const degrees = graph.nodes().map((node) => graph.degree(node));
  const minDegree = Math.min(...degrees);
  const maxDegree = Math.max(...degrees);
  const minSize = 8; // 增大最小尺寸以便看见
  const maxSize = 25; // 增大最大尺寸
  
  console.log(`Node degrees: min=${minDegree}, max=${maxDegree}`);
  
  graph.forEachNode((node) => {
    const degree = graph.degree(node);
    const size = degrees.length > 1 
      ? minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize)
      : 15; // 默认大小
    graph.setNodeAttribute(node, 'size', size);
    console.log(`Set size for node ${node}: ${size} (degree: ${degree})`);
  });

  // 6. 应用布局算法
  if (graph.order > 1) {
    // 检查是否所有节点都有有效位置
    const hasValidPositions = graph.nodes().every(node => {
      const attrs = graph.getNodeAttributes(node);
      return typeof attrs.x === 'number' && typeof attrs.y === 'number' && 
             !isNaN(attrs.x) && !isNaN(attrs.y) && isFinite(attrs.x) && isFinite(attrs.y);
    });

    console.log(`Has valid positions: ${hasValidPositions}`);

    // 如果节点没有有效位置信息，先应用圆形布局
    if (!hasValidPositions) {
      console.log('Some nodes have invalid positions, applying circular layout');
      circular.assign(graph);
      console.log('Applied circular layout');
      
      // 检查布局后的位置
      graph.forEachNode((node) => {
        const attrs = graph.getNodeAttributes(node);
        console.log(`Node ${node} position after circular layout: x=${attrs.x}, y=${attrs.y}`);
      });
    }

    // 暂时禁用ForceAtlas2以简化调试
    // try {
    //   const settings = forceAtlas2.inferSettings(graph);
    //   forceAtlas2.assign(graph, { 
    //     settings: {
    //       ...settings,
    //       gravity: 1,
    //       strongGravityMode: true,
    //       barnesHutOptimize: true,
    //     }, 
    //     iterations: 100 
    //   });
    //   console.log('Applied ForceAtlas2 layout');
    // } catch (error) {
    //   console.warn('Could not apply ForceAtlas2 layout:', error);
    // }
  }

  // 7. 设置边的颜色和样式
  console.log('Setting edge attributes...');
  graph.forEachEdge((edge, attributes) => {
    // 使用Sigma.js v3的正确属性名
    graph.setEdgeAttribute(edge, 'color', '#FF0000'); // 用红色确保可见
    graph.setEdgeAttribute(edge, 'size', 5); // 增大边的粗细让它更明显
    
    console.log(`Set edge ${edge} attributes:`, {
      color: graph.getEdgeAttribute(edge, 'color'),
      size: graph.getEdgeAttribute(edge, 'size'),
      sourceNode: graph.source(edge),
      targetNode: graph.target(edge)
    });
  });
  
  console.log('Edge attribute setting completed.');

  console.log(`Final graph: ${graph.order} nodes, ${graph.size} edges`);
  
  // 输出最终的节点信息用于调试
  graph.forEachNode((node, attrs) => {
    console.log(`Final node ${node}:`, {
      label: attrs.label,
      x: attrs.x,
      y: attrs.y,
      size: attrs.size,
      color: attrs.color,
      type: attrs.nodeType
    });
  });
  
  return graph;
};

// 调试函数：用于测试边数据处理
export const debugEdgeProcessing = (data: GraphData) => {
  console.log('=== DEBUG EDGE PROCESSING ===');
  console.log('Total edges:', data.edges?.length || 0);
  
  if (!data.edges || data.edges.length === 0) {
    console.error('No edges in data!');
    return;
  }
  
  // 创建节点ID集合
  const nodeIds = new Set(data.nodes.map(n => n.id));
  console.log('Available node IDs:', Array.from(nodeIds).slice(0, 10));
  
  // 检查前几条边
  data.edges.slice(0, 5).forEach((edge, index) => {
    console.log(`Edge ${index + 1}:`, {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceExists: nodeIds.has(edge.source),
      targetExists: nodeIds.has(edge.target),
      sourceType: typeof edge.source,
      targetType: typeof edge.target
    });
  });
  
  // 统计有问题的边
  const problematicEdges = data.edges.filter(edge => 
    !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
  );
  
  console.log(`Problematic edges: ${problematicEdges.length}/${data.edges.length}`);
  
  if (problematicEdges.length > 0) {
    console.log('Sample problematic edges:', problematicEdges.slice(0, 3));
  }
};

export const exportGraphData = (graph: Graph): GraphData => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  graph.forEachNode((nodeId, attributes) => {
    nodes.push({
      id: nodeId,
      label: attributes.label,
      type: attributes.originalType || 'entity',
      x: attributes.x,
      y: attributes.y,
      size: attributes.size,
      color: attributes.color,
      properties: { ...attributes },
    });
  });

  graph.forEachEdge((edgeId, attributes, source, target) => {
    edges.push({
      id: attributes.id || edgeId,
      source,
      target,
      label: attributes.label,
      type: attributes.originalType || 'relationship',
      color: attributes.color,
      weight: attributes.weight,
      properties: { ...attributes },
    });
  });

  return {
    id: '',
    title: 'Knowledge Graph',
    description: 'Exported graph data',
    user_id: '',
    nodes,
    edges,
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      node_count: nodes.length,
      edge_count: edges.length,
    },
  };
};

export const createTestGraph = (): Graph => {
  const graph = new Graph();
  
  // 创建测试节点
  const testNodes = [
    { id: 'node1', label: '节点1', type: 'entity', x: 100, y: 100 },
    { id: 'node2', label: '节点2', type: 'concept', x: 200, y: 150 },
    { id: 'node3', label: '节点3', type: 'relation', x: 150, y: 250 },
    { id: 'node4', label: '节点4', type: 'entity', x: 300, y: 200 },
    { id: 'node5', label: '节点5', type: 'concept', x: 50, y: 200 },
  ];
  
  // 添加节点
  testNodes.forEach(node => {
    graph.addNode(node.id, {
      label: node.label,
      nodeType: node.type,
      x: node.x,
      y: node.y,
      size: 15,
      color: getNodeColorByType(node.type),
    });
  });
  
  // 添加测试边
  const testEdges = [
    { source: 'node1', target: 'node2', label: '关系1' },
    { source: 'node2', target: 'node3', label: '关系2' },
    { source: 'node3', target: 'node4', label: '关系3' },
    { source: 'node4', target: 'node5', label: '关系4' },
    { source: 'node5', target: 'node1', label: '关系5' },
  ];
  
  testEdges.forEach((edge, index) => {
    const edgeId = `edge-${index}`;
    graph.addEdge(edge.source, edge.target, {
      label: edge.label,
      color: '#FF0000', // 使用红色让边更明显
      size: 6, // 增大测试边的大小
    });
    console.log(`Added test edge ${edgeId}: ${edge.source} -> ${edge.target} (${edge.label})`);
    
    // 验证边是否真的被添加了
    const edgeExists = graph.hasEdge(edge.source, edge.target);
    console.log(`Edge ${edge.source} -> ${edge.target} exists:`, edgeExists);
  });
  
  console.log('Created test graph with', graph.order, 'nodes and', graph.size, 'edges');
  return graph;
};

export const generateRandomGraph = (nodeCount: number, edgeCount: number): GraphData => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 生成节点
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: 'entity',
      properties: {},
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      size: Math.random() * 20 + 5,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    });
  }

  // 生成边
  for (let i = 0; i < edgeCount; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    const target = Math.floor(Math.random() * nodeCount);
    
    if (source !== target) {
      edges.push({
        id: `edge-${i}`,
        source: `node-${source}`,
        target: `node-${target}`,
        type: 'relationship',
        properties: {},
        weight: Math.random(),
      });
    }
  }

  return {
    id: `random-graph-${Date.now()}`,
    title: 'Random Graph',
    description: `Generated graph with ${nodeCount} nodes and ${edgeCount} edges`,
    user_id: '',
    nodes,
    edges,
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      node_count: nodeCount,
      edge_count: edgeCount,
    },
  };
};
