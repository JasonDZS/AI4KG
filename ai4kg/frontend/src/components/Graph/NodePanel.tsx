import React from 'react';
import { Card, Form, Input, Select, ColorPicker, Button, Space, Divider } from 'antd';
import { useGraphStore } from '../../store/graphStore';

const { Option } = Select;

interface NodePanelProps {
  visible: boolean;
  onClose: () => void;
}

const NodePanel: React.FC<NodePanelProps> = ({ visible, onClose }) => {
  const { selectedNodes, graph } = useGraphStore();
  
  if (!visible || selectedNodes.length === 0) {
    return null;
  }

  const selectedNode = graph?.nodes.find(node => node.id === selectedNodes[0]);
  
  if (!selectedNode) {
    return null;
  }

  const handleSave = (values: any) => {
    // TODO: 实现节点更新逻辑
    console.log('Updating node:', selectedNode.id, values);
  };

  return (
    <Card
      title="节点属性"
      size="small"
      extra={<Button type="text" onClick={onClose}>×</Button>}
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 300,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Form
        layout="vertical"
        initialValues={{
          id: selectedNode.id,
          label: selectedNode.label,
          type: selectedNode.type,
          color: selectedNode.color || '#1890ff',
          size: selectedNode.size || 10,
        }}
        onFinish={handleSave}
      >
        <Form.Item label="ID" name="id">
          <Input disabled />
        </Form.Item>
        
        <Form.Item label="标签" name="label">
          <Input />
        </Form.Item>
        
        <Form.Item label="类型" name="type">
          <Select>
            <Option value="entity">实体</Option>
            <Option value="concept">概念</Option>
            <Option value="relation">关系</Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="颜色" name="color">
          <ColorPicker />
        </Form.Item>
        
        <Form.Item label="大小" name="size">
          <Input type="number" min={1} max={50} />
        </Form.Item>
        
        <Divider />
        
        <h4>自定义属性</h4>
        {Object.entries(selectedNode.properties || {}).map(([key, value]) => (
          <Form.Item key={key} label={key}>
            <Input defaultValue={String(value)} />
          </Form.Item>
        ))}
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button onClick={onClose}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default NodePanel;
