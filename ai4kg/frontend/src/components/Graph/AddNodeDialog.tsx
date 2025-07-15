import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import type { CreateNodeRequest } from '@/types'

interface AddNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddNode: (node: CreateNodeRequest) => void
}

const NODE_TYPES = [
  { value: 'entity', label: '实体' },
  { value: 'person', label: '人物' },
  { value: 'organization', label: '组织' },
  { value: 'location', label: '地点' },
  { value: 'concept', label: '概念' },
  { value: 'event', label: '事件' },
  { value: 'object', label: '对象' },
]

const NODE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#F39C12', '#95A5A6'
]

const AddNodeDialog: React.FC<AddNodeDialogProps> = ({
  open,
  onOpenChange,
  onAddNode,
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest>({
    label: '',
    type: 'entity',
    x: Math.random() * 800 + 100, // Random initial position
    y: Math.random() * 600 + 100,
    size: 20,
    color: NODE_COLORS[0],
    properties: {},
  })

  const [customProperty, setCustomProperty] = useState({ key: '', value: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.label.trim()) return
    
    onAddNode(formData)
    onOpenChange(false)
    // Reset form
    setFormData({
      label: '',
      type: 'entity',
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      size: 20,
      color: NODE_COLORS[0],
      properties: {},
    })
    setCustomProperty({ key: '', value: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'x' || name === 'y' || name === 'size' ? Number(value) : value,
    }))
  }

  const handleAddProperty = () => {
    if (customProperty.key && customProperty.value) {
      setFormData(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [customProperty.key]: customProperty.value,
        },
      }))
      setCustomProperty({ key: '', value: '' })
    }
  }

  const handleRemoveProperty = (key: string) => {
    setFormData(prev => ({
      ...prev,
      properties: Object.fromEntries(
        Object.entries(prev.properties || {}).filter(([k]) => k !== key)
      ),
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">添加节点</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="label" className="text-sm font-medium">
              节点标签 *
            </label>
            <Input
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              required
              placeholder="输入节点标签"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              节点类型
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {NODE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="x" className="text-sm font-medium">
                X 坐标
              </label>
              <Input
                id="x"
                name="x"
                type="number"
                value={formData.x}
                onChange={handleChange}
                min="0"
                max="1200"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="y" className="text-sm font-medium">
                Y 坐标
              </label>
              <Input
                id="y"
                name="y"
                type="number"
                value={formData.y}
                onChange={handleChange}
                min="0"
                max="800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="size" className="text-sm font-medium">
              节点大小
            </label>
            <Input
              id="size"
              name="size"
              type="number"
              value={formData.size}
              onChange={handleChange}
              min="5"
              max="50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="color" className="text-sm font-medium">
              节点颜色
            </label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                name="color"
                type="color"
                value={formData.color}
                onChange={handleChange}
                className="w-20 h-10"
              />
              <div className="flex space-x-1">
                {NODE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Custom Properties */}
          <div className="space-y-2">
            <label className="text-sm font-medium">自定义属性</label>
            <div className="space-y-2">
              {Object.entries(formData.properties || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{key}:</span>
                  <span className="text-sm">{String(value)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProperty(key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <Input
                  placeholder="属性名"
                  value={customProperty.key}
                  onChange={(e) => setCustomProperty(prev => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="属性值"
                  value={customProperty.value}
                  onChange={(e) => setCustomProperty(prev => ({ ...prev, value: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddProperty}
                  disabled={!customProperty.key || !customProperty.value}
                >
                  添加
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!formData.label.trim()}
            >
              添加节点
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNodeDialog