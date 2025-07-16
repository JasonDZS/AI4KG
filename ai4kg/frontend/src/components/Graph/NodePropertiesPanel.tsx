import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Save, RotateCcw, Plus } from 'lucide-react'
import { nodesApi } from '@/services/api'
import type { GraphNode } from '@/types'

interface NodePropertiesPanelProps {
  node: GraphNode
  graphId: string
  onClose: () => void
  onNodeUpdate?: (updatedNode: GraphNode) => void
  onNodeDelete?: (nodeId: string) => void
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  graphId,
  onClose,
  onNodeUpdate,
  onNodeDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedNode, setEditedNode] = useState<GraphNode>(node)
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')

  // 调试日志
  // console.log('NodePropertiesPanel rendered with:', { node, graphId, isEditing })

  // 重置编辑状态当节点改变时
  useEffect(() => {
    setIsEditing(false)
    setEditedNode({ ...node })
    setNewPropertyKey('')
    setNewPropertyValue('')
  }, [node.id])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedNode({ ...node })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedNode({ ...node })
  }

  const handleSave = async () => {
    // 验证必要字段
    if (!editedNode.label.trim()) {
      alert('标签不能为空')
      return
    }
    if (!editedNode.type.trim()) {
      alert('类型不能为空')
      return
    }

    try {
      setIsSaving(true)
      const response = await nodesApi.updateNode(graphId, node.id, {
        label: editedNode.label.trim(),
        type: editedNode.type.trim(),
        x: editedNode.x,
        y: editedNode.y,
        size: editedNode.size,
        color: editedNode.color,
        properties: editedNode.properties,
      })
      
      if (response.success && response.data) {
        onNodeUpdate?.(response.data)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update node:', error)
      alert('保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('确定要删除这个节点吗？删除后无法恢复。')) {
      try {
        await nodesApi.deleteNode(graphId, node.id)
        onNodeDelete?.(node.id)
        onClose()
      } catch (error) {
        console.error('Failed to delete node:', error)
        alert('删除失败，请稍后重试')
      }
    }
  }

  const handleInputChange = (field: keyof GraphNode, value: any) => {
    setEditedNode(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePropertyChange = (key: string, value: string) => {
    setEditedNode(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: value
      }
    }))
  }

  const handleAddProperty = () => {
    if (newPropertyKey.trim() && !editedNode.properties?.[newPropertyKey]) {
      setEditedNode(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [newPropertyKey]: newPropertyValue
        }
      }))
      setNewPropertyKey('')
      setNewPropertyValue('')
    }
  }

  const handleDeleteProperty = (key: string) => {
    setEditedNode(prev => {
      const newProperties = { ...prev.properties }
      delete newProperties[key]
      return {
        ...prev,
        properties: newProperties
      }
    })
  }

  const displayNode = isEditing ? editedNode : node

  // 如果没有节点数据，显示错误信息
  if (!node || !node.id) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          <p>无法加载节点数据</p>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 bg-gray-500 text-white rounded"
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white min-h-0">
      {/* 标题栏 */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">节点属性</h3>
          {isEditing && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              编辑模式
            </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* 基本信息 */}
        <div className={`border rounded-lg p-4 ${isEditing ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3">基本信息</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">ID</label>
              <p className="text-sm mt-1">{displayNode.id}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                标签 {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={displayNode.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="请输入节点标签"
                />
              ) : (
                <p className="text-sm mt-1">{displayNode.label}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                类型 {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={displayNode.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="请输入节点类型"
                />
              ) : (
                <p className="text-sm mt-1">{displayNode.type}</p>
              )}
            </div>
          </div>
        </div>

        {/* 可视化属性 */}
        <div className={`border rounded-lg p-4 ${isEditing ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3">可视化属性</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">X坐标</label>
              {isEditing ? (
                <input
                  type="number"
                  value={displayNode.x?.toFixed(2) || '0'}
                  onChange={(e) => handleInputChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                  step="0.01"
                />
              ) : (
                <p className="text-sm mt-1">{displayNode.x?.toFixed(2) || '0'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Y坐标</label>
              {isEditing ? (
                <input
                  type="number"
                  value={displayNode.y?.toFixed(2) || '0'}
                  onChange={(e) => handleInputChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                  step="0.01"
                />
              ) : (
                <p className="text-sm mt-1">{displayNode.y?.toFixed(2) || '0'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">大小</label>
              {isEditing ? (
                <input
                  type="number"
                  value={displayNode.size || 10}
                  onChange={(e) => handleInputChange('size', parseInt(e.target.value) || 10)}
                  className="w-full mt-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                  min="1"
                  max="100"
                />
              ) : (
                <p className="text-sm mt-1">{displayNode.size || 10}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">颜色</label>
              {isEditing ? (
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="color"
                    value={displayNode.color || '#3498db'}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer border-blue-300"
                  />
                  <input
                    type="text"
                    value={displayNode.color || '#3498db'}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="#3498db"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: displayNode.color || '#3498db' }}
                  />
                  <span className="text-sm">{displayNode.color || '#3498db'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 自定义属性 */}
        {(Object.keys(displayNode.properties || {}).length > 0 || isEditing) && (
          <div className={`border rounded-lg p-4 ${isEditing ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
            <h4 className="text-sm font-medium mb-3">自定义属性</h4>
            <div className="space-y-3">
              {Object.entries(displayNode.properties || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600">{key}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm mt-1">{String(value)}</p>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteProperty(key)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="删除属性"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {isEditing && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-600 mb-2">添加新属性</p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="属性名"
                      value={newPropertyKey}
                      onChange={(e) => setNewPropertyKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="属性值"
                      value={newPropertyValue}
                      onChange={(e) => setNewPropertyValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddProperty}
                      disabled={!newPropertyKey.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                      title="添加属性"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮区域 */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">        
        <div className="grid grid-cols-2 gap-3 mb-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors min-h-[44px]"
              >
                <Edit className="h-4 w-4" />
                编辑节点
              </button>
              
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors min-h-[44px]"
              >
                <Trash2 className="h-4 w-4" />
                删除节点
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors min-h-[44px]"
              >
                <Save className="h-4 w-4" />
                {isSaving ? '保存中...' : '保存更改'}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors min-h-[44px]"
              >
                <RotateCcw className="h-4 w-4" />
                取消编辑
              </button>
            </>
          )}
        </div>

        {/* 状态信息 */}
        <div className="text-xs text-gray-500 border-t pt-2">
          节点状态: {isEditing ? '编辑模式' : '查看模式'} | ID: {node.id?.slice(0, 8)}...
        </div>
      </div>
    </div>
  )
}

export default NodePropertiesPanel
