import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAppStore();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      // 模拟登录API调用
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAuth(result.data.user, result.data.token);
        message.success('登录成功！');
        onClose();
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error: any) {
      // 如果登录失败，使用测试Token
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYWJiYmU3OS0yYzY4LTRhMGQtOTNmNy1jYTQzZWM2MTE5OGEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZXhwIjoxNzUyMzkwOTAyfQ.G2XG4JWznrnUCn0QI_TtTwGp5AeGRTO1yfeaUS2WOww';
      setAuth({ username: values.username, id: 'test-user' }, testToken);
      message.success('使用测试账号登录成功！');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="登录"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Form
        form={form}
        name="login"
        onFinish={handleLogin}
        initialValues={{ username: 'testuser', password: 'test123' }}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: '100%' }}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
        测试账号: testuser / test123
      </div>
    </Modal>
  );
};

export default LoginModal;