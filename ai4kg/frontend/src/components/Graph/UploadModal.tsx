import React, { useState } from 'react';
import { 
  Modal, 
  Upload, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography,
  Alert,
  message
} from 'antd';
import { 
  InboxOutlined, 
  UploadOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAppStore } from '../../store/appStore';
import { useGraphStore } from '../../store/graphStore';

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { uploadGraph } = useAppStore();
  const { setGraph } = useGraphStore();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // 自动设置标题为文件名（不含扩展名）
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    form.setFieldsValue({ title: fileName });
    
    return false; // 阻止自动上传
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('请选择要上传的文件');
      return;
    }

    try {
      const values = await form.validateFields();
      setUploading(true);
      
      await uploadGraph(selectedFile, values.title);
      
      const { currentGraph } = useAppStore.getState();
      if (currentGraph) {
        setGraph(currentGraph);
      }
      
      message.success('图谱上传成功！');
      handleClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
      message.error(`上传失败: ${error.message || '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedFile(null);
    setUploading(false);
    onClose();
  };

  const uploadProps: UploadProps = {
    accept: '.graphml,.gml,.gexf,.json,.csv',
    multiple: false,
    showUploadList: false,
    beforeUpload: handleFileSelect,
  };

  return (
    <Modal
      title={
        <Space>
          <UploadOutlined />
          <span>上传知识图谱</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={uploading}>
          取消
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={!selectedFile}
        >
          上传图谱
        </Button>
      ]}
    >
      <div>
        <Alert
          message="支持的文件格式"
          description="支持 GraphML (.graphml), GML (.gml), GEXF (.gexf), JSON (.json), CSV (.csv) 格式的图数据文件"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: '',
            description: ''
          }}
        >
          <Form.Item
            name="title"
            label="图谱名称"
            rules={[
              { required: true, message: '请输入图谱名称' },
              { max: 100, message: '名称不能超过100个字符' }
            ]}
          >
            <Input
              placeholder="请输入图谱名称"
              prefix={<FileTextOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="图谱描述"
            rules={[
              { max: 500, message: '描述不能超过500个字符' }
            ]}
          >
            <TextArea
              placeholder="请输入图谱描述（可选）"
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item label="选择文件" required>
            <Dragger {...uploadProps} style={{ backgroundColor: selectedFile ? '#f6ffed' : undefined }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: selectedFile ? '#52c41a' : undefined }} />
              </p>
              <p className="ant-upload-text">
                {selectedFile ? selectedFile.name : '点击或拖拽文件到此区域上传'}
              </p>
              <p className="ant-upload-hint">
                {selectedFile 
                  ? `文件大小: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : '支持单个文件上传，文件大小限制为 100MB'
                }
              </p>
            </Dragger>
          </Form.Item>
        </Form>

        {selectedFile && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
            <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
              已选择文件
            </Title>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text><strong>文件名:</strong> {selectedFile.name}</Text>
              <Text><strong>文件大小:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Text>
              <Text><strong>文件类型:</strong> {selectedFile.type || '未知'}</Text>
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadModal;