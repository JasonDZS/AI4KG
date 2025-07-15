import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import type { CreateEdgeRequest, GraphNode } from '@/types'

interface AddEdgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEdge: (edge: CreateEdgeRequest) => void
  nodes: GraphNode[]
}

const EDGE_TYPES = [
  { value: 'relationship', label: '关系' },
  { value: 'contains', label: '包含' },
  { value: 'belongs_to', label: '属于' },
  { value: 'works_for', label: '工作于' },
  { value: 'located_in', label: '位于' },
  { value: 'knows', label: '认识' },
  { value: 'related_to', label: '相关' },
  { value: 'part_of', label: '部分' },
]

const AddEdgeDialog: React.FC<AddEdgeDialogProps> = ({
  open,
  onOpenChange,
  onAddEdge,
  nodes,
}) => {
  const [formData, setFormData] = useState<CreateEdgeRequest>({
    source: '',
    target: '',
    label: '',
    type: 'relationship',
    weight: 1.0,
    properties: {},
  })

  const [customProperty, setCustomProperty] = useState({ key: '', value: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.source || !formData.target || formData.source === formData.target) return
    
    onAddEdge(formData)
    onOpenChange(false)
    // Reset form
    setFormData({
      source: '',
      target: '',
      label: '',
      type: 'relationship',
      weight: 1.0,
      properties: {},
    })
    setCustomProperty({ key: '', value: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight' ? Number(value) : value,
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

  const availableSourceNodes = nodes
  const availableTargetNodes = nodes.filter(node => node.id !== formData.source)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">添加边</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {nodes.length < 2 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                需要至少2个节点才能创建边。请先添加节点。
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="source" className="text-sm font-medium">
              源节点 *
            </label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              required
              disabled={nodes.length < 2}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">选择源节点</option>
              {availableSourceNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} ({node.type})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="target" className="text-sm font-medium">
              目标节点 *
            </label>
            <select
              id="target"
              name="target"
              value={formData.target}
              onChange={handleChange}
              required
              disabled={nodes.length < 2 || !formData.source}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">选择目标节点</option>
              {availableTargetNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} ({node.type})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="label" className="text-sm font-medium">
              边标签
            </label>
            <Input
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              placeholder="输入边的标签（可选）"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              边类型
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {EDGE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="weight" className="text-sm font-medium">
              权重
            </label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={handleChange}
              min="0"
              max="10"
            />
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
              disabled={!formData.source || !formData.target || formData.source === formData.target}
            >
              添加边
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEdgeDialog