import React from 'react';
import { Card, Space, Typography } from 'antd';
import { NODE_TYPES } from '../../utils/constants';

const { Text } = Typography;

// 节点类型颜色映射
const TYPE_COLOR_MAP: { [key: string]: string } = {
  [NODE_TYPES.ENTITY]: '#FA5A3D',     // 红色
  [NODE_TYPES.CONCEPT]: '#5A75DB',    // 蓝色  
  [NODE_TYPES.RELATION]: '#52c41a',   // 绿色
  'default': '#722ed1',               // 紫色作为默认色
};

// 节点类型中文名称
const TYPE_NAME_MAP: { [key: string]: string } = {
  [NODE_TYPES.ENTITY]: '实体',
  [NODE_TYPES.CONCEPT]: '概念', 
  [NODE_TYPES.RELATION]: '关系',
  'default': '其他',
};

interface GraphLegendProps {
  nodeTypes: string[];
}

const GraphLegend: React.FC<GraphLegendProps> = ({ nodeTypes }) => {
  // 获取唯一的节点类型
  const uniqueTypes = Array.from(new Set(nodeTypes));

  return (
    <Card 
      size="small" 
      title="图例"
      className="glass-panel animate-slide-right"
      style={{ 
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 160,
        zIndex: 1000,
        border: 'none',
        borderRadius: 'var(--border-radius-large)',
        pointerEvents: 'auto', /* 确保图例可以交互 */
      }}
      headStyle={{
        background: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '14px',
        padding: '12px 16px 8px',
      }}
      bodyStyle={{ 
        padding: '8px 16px 12px',
        background: 'transparent'
      }}
    >
      <Space direction="vertical" size={6}>
        {uniqueTypes.map(type => (
          <div 
            key={type} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              transition: 'all 0.3s ease',
              padding: '2px 0',
            }}
            className="legend-item"
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: TYPE_COLOR_MAP[type] || TYPE_COLOR_MAP['default'],
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
            />
            <Text 
              style={{ 
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontWeight: 500,
                transition: 'all 0.3s ease'
              }}
            >
              {TYPE_NAME_MAP[type] || type}
            </Text>
          </div>
        ))}
      </Space>
      
      <style>{`
        .legend-item:hover {
          transform: translateX(2px);
        }
        
        .legend-item:hover div {
          transform: scale(1.1);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Card>
  );
};

export default GraphLegend;