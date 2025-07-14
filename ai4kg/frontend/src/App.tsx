import React, { useEffect, useState } from 'react';
import { Layout, message } from 'antd';
import Header from './components/Layout/Header';
import LoginModal from './components/Layout/LoginModal';
import GraphViewer from './components/Graph/GraphViewer';
import NodePanel from './components/Graph/NodePanel';
import GraphListModal from './components/Graph/GraphListModal';
import UploadModal from './components/Graph/UploadModal';
import { useUIStore } from './store/uiStore';
import { useAppStore } from './store/appStore';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  const { panels } = useUIStore();
  const { 
    uploadModalVisible, 
    graphListVisible, 
    setUploadModalVisible, 
    setGraphListVisible,
    error,
    setError,
    isAuthenticated,
    setAuth
  } = useAppStore();
  
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // 错误提示
  useEffect(() => {
    if (error) {
      message.error(error);
      setError(null);
    }
  }, [error, setError]);

  // 检查认证状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      // 模拟用户信息
      setAuth({ username: 'testuser', id: 'test-user-id' }, token);
    } else if (!token && !isAuthenticated) {
      // 显示登录模态框
      setLoginModalVisible(true);
    }
  }, [isAuthenticated, setAuth]);

  return (
    <Layout className="app-layout">
      <Header />
      
      <Content className="app-content">
        <div className="graph-workspace">
          <GraphViewer />
          
          <NodePanel
            visible={panels.nodePanel}
            onClose={() => {}}
          />
        </div>
      </Content>

      {/* 登录模态框 */}
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
      />

      {/* 图谱列表模态框 */}
      <GraphListModal
        visible={graphListVisible}
        onClose={() => setGraphListVisible(false)}
      />

      {/* 上传模态框 */}
      <UploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
      />
    </Layout>
  );
};

export default App;
