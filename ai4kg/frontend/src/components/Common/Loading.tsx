import React from 'react';
import { Spin } from 'antd';
import './Loading.css';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'default',
  tip = '加载中...',
  spinning = true,
  children,
}) => {
  if (children) {
    return (
      <Spin size={size} tip={tip} spinning={spinning}>
        {children}
      </Spin>
    );
  }

  return (
    <div className="loading-container">
      <Spin size={size} tip={tip} />
    </div>
  );
};

export default Loading;
