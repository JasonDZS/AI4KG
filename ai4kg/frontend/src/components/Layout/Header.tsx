import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  UploadOutlined,
  FolderOpenOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import './Header.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'AI4KG 知识图谱' }) => {
  const { 
    isAuthenticated,
    logout,
    setUploadModalVisible,
    setGraphListVisible,
    currentGraph
  } = useAppStore();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'profile':
        console.log('打开个人资料');
        break;
      case 'settings':
        console.log('打开设置');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  const handleMainMenuClick = (key: string) => {
    switch (key) {
      case 'new':
        setUploadModalVisible(true);
        break;
      case 'open':
        setGraphListVisible(true);
        break;
      case 'save':
        console.log('保存图谱');
        break;
      case 'export':
        console.log('导出图谱');
        break;
      case 'undo':
        console.log('撤销');
        break;
      case 'redo':
        console.log('重做');
        break;
      case 'zoomIn':
        console.log('放大');
        break;
      case 'zoomOut':
        console.log('缩小');
        break;
      case 'fitScreen':
        console.log('适应屏幕');
        break;
      default:
        console.log('Menu clicked:', key);
    }
  };

  const mainMenuItems = [
    {
      key: 'file',
      label: '文件',
      children: [
        { key: 'new', label: '上传图谱', icon: <UploadOutlined /> },
        { key: 'open', label: '打开图谱', icon: <FolderOpenOutlined /> },
        { key: 'save', label: '保存', disabled: !currentGraph },
        { key: 'export', label: '导出', disabled: !currentGraph },
      ],
    },
    {
      key: 'edit',
      label: '编辑',
      children: [
        { key: 'undo', label: '撤销' },
        { key: 'redo', label: '重做' },
        { key: 'copy', label: '复制' },
        { key: 'paste', label: '粘贴' },
      ],
    },
    {
      key: 'view',
      label: '视图',
      children: [
        { key: 'zoomIn', label: '放大' },
        { key: 'zoomOut', label: '缩小' },
        { key: 'fitScreen', label: '适应屏幕' },
        { key: 'fullscreen', label: '全屏' },
      ],
    },
    {
      key: 'tools',
      label: '工具',
      children: [
        { key: 'layout', label: '布局算法' },
        { key: 'search', label: '搜索' },
        { key: 'filter', label: '筛选' },
        { key: 'analysis', label: '图分析' },
      ],
    },
  ];

  return (
    <AntHeader className="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-text">{title}</span>
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          items={mainMenuItems}
          style={{ background: 'transparent' }}
          onClick={({ key }) => handleMainMenuClick(key)}
        />
      </div>
      
      <div className="header-right">
        <Space>
          {currentGraph && (
            <span className="current-graph-info">
              当前图谱: {currentGraph.title}
            </span>
          )}
          
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
            style={{ marginRight: 8 }}
          >
            上传图谱
          </Button>
          
          <Button
            icon={<FolderOpenOutlined />}
            onClick={() => setGraphListVisible(true)}
            style={{ marginRight: 16 }}
          >
            打开图谱
          </Button>

          {isAuthenticated && (
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => handleMenuClick(key),
              }}
              placement="bottomRight"
            >
              <Avatar
                style={{ cursor: 'pointer' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          )}
        </Space>
      </div>
    </AntHeader>
  );
};

export default Header;
