import React, { useEffect, useRef, useState } from 'react';
import Sigma from 'sigma';
import Graph from 'graphology';
import { useGraphStore } from '../../store/graphStore';
import { useAppStore } from '../../store/appStore';
import { createGraphFromData, createTestGraph, debugEdgeProcessing } from '../../utils/graphUtils';
import { Empty, Spin } from 'antd';
import GraphLegend from './GraphLegend';
import './GraphViewer.css';

interface GraphViewerProps {
  width?: number;
  height?: number;
}

const GraphViewer: React.FC<GraphViewerProps> = ({ width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  
  const {
    selectedNodes,
    setSelectedNodes,
    clearSelection,
    setCamera,
  } = useGraphStore();

  const { currentGraph, loading } = useAppStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);

  // 初始化 Sigma 实例
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    console.log('🚀 Initializing GraphViewer...', currentGraph);
    
    // 详细检查当前图谱数据
    if (currentGraph) {
      console.log('📊 Current Graph Details:');
      console.log('- Title:', currentGraph.title);
      console.log('- Nodes count:', currentGraph.nodes?.length || 0);
      console.log('- Edges count:', currentGraph.edges?.length || 0);
      console.log('- Raw graph object:', currentGraph);
      console.log('- Raw edges data:', currentGraph.edges);
      
      // 检查nodes数据结构
      if (currentGraph.nodes && currentGraph.nodes.length > 0) {
        console.log('📋 Sample node data:');
        currentGraph.nodes.slice(0, 3).forEach((node, index) => {
          console.log(`Node ${index + 1}:`, node);
        });
      }
      
      // 检查edges数据结构
      if (currentGraph.edges && currentGraph.edges.length > 0) {
        console.log('📋 Sample edge data:');
        currentGraph.edges.slice(0, 5).forEach((edge, index) => {
          console.log(`Edge ${index + 1}:`, {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: edge.type,
            fullEdge: edge,
            hasSourceProperty: edge.hasOwnProperty('source'),
            hasTargetProperty: edge.hasOwnProperty('target'),
            keys: Object.keys(edge)
          });
        });
        
        // 检查边的source和target是否在nodes中存在
        const nodeIds = new Set(currentGraph.nodes.map(n => n.id));
        console.log('Available node IDs (first 10):', Array.from(nodeIds).slice(0, 10));
        console.log('Total available node IDs:', nodeIds.size);
        
        const missingNodes = currentGraph.edges.filter(edge => 
          !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
        );
        
        if (missingNodes.length > 0) {
          console.error('❌ Found edges with missing nodes:', missingNodes.slice(0, 5));
          console.error('Total edges with missing nodes:', missingNodes.length);
        } else {
          console.log('✅ All edges have valid source and target nodes');
        }
        
        // 检查数据类型
        const firstEdge = currentGraph.edges[0];
        console.log('First edge data types:', {
          source: typeof firstEdge.source,
          target: typeof firstEdge.target,
          sourceValue: firstEdge.source,
          targetValue: firstEdge.target
        });        } else {
          console.warn('⚠️ No edges found in currentGraph!');
        }
        
        // 运行调试函数
        debugEdgeProcessing(currentGraph);
      }

    try {
      let graphologyGraph: Graph;
      
      if (currentGraph && currentGraph.nodes.length > 0) {
        // 检查边数据是否存在
        if (!currentGraph.edges || currentGraph.edges.length === 0) {
          console.log('🔧 No edges in real data, creating test graph with edges for debugging');
          graphologyGraph = createTestGraph();
          setNodeTypes(['entity', 'concept', 'relation']);      } else {
        // 使用真实数据
        console.log('🔄 Creating graph from real data...');
        graphologyGraph = createGraphFromData(currentGraph);
        console.log('✅ Created graphology graph from real data:');
        console.log('- Nodes in graphology:', graphologyGraph.order);
        console.log('- Edges in graphology:', graphologyGraph.size);
        
        // 输出graphology中的边信息进行调试
        if (graphologyGraph.size > 0) {
          console.log('🔍 Edges in graphology graph:');
          graphologyGraph.forEachEdge((edge, attributes, source, target) => {
            console.log(`- Edge ${edge}: ${source} -> ${target}`, attributes);
          });
        } else {
          console.error('❌ No edges found in graphology graph after createGraphFromData!');
        }
        
        // 提取节点类型
        const types = currentGraph.nodes.map(node => node.type);
        setNodeTypes(types);
      }
      } else {
        // 使用测试数据
        console.log('📝 No real data available, using test graph');
        graphologyGraph = createTestGraph();
        setNodeTypes(['entity', 'concept', 'relation']);
      }
      
      graphRef.current = graphologyGraph;

      // 创建 Sigma 实例（确保边被正确渲染）
      const sigma = new Sigma(graphologyGraph, containerRef.current, {
        // 启用渲染
        renderLabels: true,
        renderEdgeLabels: true, // 启用边标签以便调试
        
        // 默认样式
        defaultNodeColor: '#1890ff',
        defaultEdgeColor: '#FF0000', // 使用红色让边更明显
        
        // 标签样式  
        labelFont: 'Arial, sans-serif',
        labelSize: 14,
        labelWeight: 'normal',
        labelColor: { color: '#000' },
        
        // 边渲染设置
        defaultEdgeType: 'arrow', // 使用箭头边
        edgeLabelFont: 'Arial, sans-serif',
        edgeLabelSize: 12,
        edgeLabelWeight: 'normal',
        edgeLabelColor: { color: '#666' },
      });

      console.log('Created sigma instance:', sigma);
      console.log('Sigma graph nodes count:', sigma.getGraph().order);
      console.log('Sigma graph edges count:', sigma.getGraph().size);
      console.log('Sigma settings:', sigma.getSettings());
      
      // 输出边的详细信息进行调试
      if (sigma.getGraph().size > 0) {
        console.log('Edges in sigma graph:');
        sigma.getGraph().forEachEdge((edge, attributes, source, target) => {
          console.log(`Edge ${edge}: ${source} -> ${target}`, attributes);
        });
      } else {
        console.warn('No edges found in sigma graph!');
      }
      
      sigmaRef.current = sigma;

      // 设置事件监听器
      setupEventListeners(sigma);

      setIsInitialized(true);
      console.log('GraphViewer initialized successfully');

    } catch (error) {
      console.error('Error initializing GraphViewer:', error);
    }

    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [currentGraph, containerRef.current]);

  // 当图数据变化时更新
  useEffect(() => {
    if (!currentGraph || !sigmaRef.current) return;

    const graphologyGraph = createGraphFromData(currentGraph);
    graphRef.current = graphologyGraph;
    
    // 更新 Sigma 图
    sigmaRef.current.setGraph(graphologyGraph);
    sigmaRef.current.refresh();
    
    // 更新节点类型
    const types = currentGraph.nodes.map(node => node.type);
    setNodeTypes(types);
  }, [currentGraph]);

  // 当选中节点变化时更新高亮
  useEffect(() => {
    if (!sigmaRef.current || !graphRef.current) return;

    // 重置所有节点样式
    graphRef.current.forEachNode((node: string, attributes: any) => {
      graphRef.current!.setNodeAttribute(node, 'highlighted', false);
      graphRef.current!.setNodeAttribute(node, 'color', attributes.originalColor || '#1890ff');
    });

    // 高亮选中节点
    selectedNodes.forEach(nodeId => {
      if (graphRef.current!.hasNode(nodeId)) {
        graphRef.current!.setNodeAttribute(nodeId, 'highlighted', true);
        graphRef.current!.setNodeAttribute(nodeId, 'color', '#ff4d4f');
      }
    });

    sigmaRef.current.refresh();
  }, [selectedNodes]);

  const setupEventListeners = (sigma: Sigma) => {
    // 节点点击事件
    sigma.on('clickNode', (event) => {
      const nodeId = event.node;
      const isCtrlPressed = event.event.original.ctrlKey || event.event.original.metaKey;
      
      if (isCtrlPressed) {
        // Ctrl+点击：多选
        if (selectedNodes.includes(nodeId)) {
          setSelectedNodes(selectedNodes.filter(id => id !== nodeId));
        } else {
          setSelectedNodes([...selectedNodes, nodeId]);
        }
      } else {
        // 普通点击：单选
        setSelectedNodes([nodeId]);
      }
    });

    // 背景点击事件
    sigma.on('clickStage', () => {
      clearSelection();
    });

    // 相机移动事件
    sigma.on('afterRender', () => {
      const camera = sigma.getCamera();
      setCamera({
        x: camera.x,
        y: camera.y,
        ratio: camera.ratio,
      });
    });

    // 节点悬停事件
    sigma.on('enterNode', (event) => {
      const nodeId = event.node;
      if (graphRef.current && !selectedNodes.includes(nodeId)) {
        graphRef.current.setNodeAttribute(nodeId, 'highlighted', true);
        sigma.refresh();
      }
    });

    sigma.on('leaveNode', (event) => {
      const nodeId = event.node;
      if (graphRef.current && !selectedNodes.includes(nodeId)) {
        graphRef.current.setNodeAttribute(nodeId, 'highlighted', false);
        sigma.refresh();
      }
    });
  };

  const handleZoomIn = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedZoom({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedUnzoom({ duration: 300 });
    }
  };

  const handleResetView = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedReset({ duration: 500 });
    }
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className="graph-viewer">
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在加载图谱...</div>
        </div>
      </div>
    );
  }

  // 显示空状态
  if (!currentGraph) {
    return (
      <div className="graph-viewer">
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Empty
            description="请选择或上传一个知识图谱"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <button 
            onClick={() => {
              // 加载测试图形以便调试
              if (containerRef.current && !isInitialized) {
                try {
                  const testGraph = createTestGraph();
                  const sigma = new Sigma(testGraph, containerRef.current, {
                    renderLabels: true,
                    renderEdgeLabels: true,
                    defaultNodeColor: '#1890ff',
                    defaultEdgeColor: '#999',
                    labelFont: 'Arial, sans-serif',
                    labelSize: 14,
                    labelWeight: 'normal',
                    labelColor: { color: '#000' },
                  });
                  sigmaRef.current = sigma;
                  graphRef.current = testGraph;
                  setNodeTypes(['entity', 'concept', 'relation']);
                  setIsInitialized(true);
                  setupEventListeners(sigma);
                  console.log('Loaded test graph for debugging');
                } catch (error) {
                  console.error('Failed to load test graph:', error);
                }
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            加载测试图谱 (调试用)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-viewer animate-fade-up">
      {/* 控制栏 - 移到容器上方 */}
      <div className="graph-toolbar">
        <div className="graph-info-bar">
          {currentGraph && (
            <div className="graph-info-text">
              {currentGraph.nodes.length} 节点 · {currentGraph.edges.length} 边
            </div>
          )}
        </div>
        
        <div className="graph-controls">
          <button onClick={handleZoomIn} className="control-btn" title="放大">
            <span>+</span>
          </button>
          <button onClick={handleZoomOut} className="control-btn" title="缩小">
            <span>-</span>
          </button>
          <button onClick={handleResetView} className="control-btn" title="重置视图">
            <span>⌂</span>
          </button>
        </div>
      </div>

      {/* 画布容器 - 占据剩余空间 */}
      <div className="graph-canvas-wrapper">
        {!isInitialized && (
          <div className="initializing-hint animate-scale-in">
            正在渲染图谱...
          </div>
        )}
        <div
          ref={containerRef}
          className="graph-container"
        />
        
        {/* 图例 - 移到画布包装器内部 */}
        {currentGraph && nodeTypes.length > 0 && (
          <GraphLegend nodeTypes={nodeTypes} />
        )}
      </div>
    </div>
  );
};

export default GraphViewer;
