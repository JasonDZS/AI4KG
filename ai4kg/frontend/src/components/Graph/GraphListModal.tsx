import React from 'react';
import { 
  Modal, 
  List, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Space,
  Empty,
  Spin 
} from 'antd';
import { 
  FileOutlined, 
  ClockCircleOutlined,
  NodeIndexOutlined,
  ShareAltOutlined 
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import { useGraphStore } from '../../store/graphStore';

const { Title, Text } = Typography;

interface GraphListModalProps {
  visible: boolean;
  onClose: () => void;
}

const GraphListModal: React.FC<GraphListModalProps> = ({ visible, onClose }) => {
  const { 
    graphList, 
    loading, 
    selectedGraphId,
    loadGraph,
    fetchGraphList 
  } = useAppStore();
  
  const { setGraph } = useGraphStore();

  React.useEffect(() => {
    if (visible && !graphList) {
      fetchGraphList();
    }
  }, [visible, graphList, fetchGraphList]);

  const handleSelectGraph = async (graphId: string) => {
    try {
      await loadGraph(graphId);
      const { currentGraph } = useAppStore.getState();
      if (currentGraph) {
        setGraph(currentGraph);
      }
      onClose();
    } catch (error) {
      console.error('Failed to load graph:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <Modal
      title={
        <Space>
          <FileOutlined />
          <span>选择知识图谱</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载图谱列表...</div>
          </div>
        ) : !graphList || graphList.graphs.length === 0 ? (
          <Empty
            description="暂无图谱数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={graphList.graphs}
            renderItem={(graph) => (
              <List.Item>
                <Card
                  hoverable
                  className={selectedGraphId === graph.id ? 'selected-graph-card' : ''}
                  onClick={() => handleSelectGraph(graph.id)}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div>
                    <Title level={5} ellipsis={{ rows: 1 }} style={{ marginBottom: 8 }}>
                      {graph.title}
                    </Title>
                    
                    {graph.description && (
                      <Text type="secondary" ellipsis style={{ display: 'block', marginBottom: 12 }}>
                        {graph.description}
                      </Text>
                    )}
                    
                    <Space wrap style={{ marginBottom: 12 }}>
                      <Tag icon={<NodeIndexOutlined />} color="blue">
                        {graph.metadata.node_count} 节点
                      </Tag>
                      <Tag icon={<ShareAltOutlined />} color="green">
                        {graph.metadata.edge_count} 边
                      </Tag>
                    </Space>
                    
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        创建时间: {formatDate(graph.metadata.created_at)}
                      </Text>
                    </div>
                    
                    {graph.metadata.updated_at !== graph.metadata.created_at && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          更新时间: {formatDate(graph.metadata.updated_at)}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
      
      <style>{`
        .selected-graph-card {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
        }
      `}</style>
    </Modal>
  );
};

export default GraphListModal;