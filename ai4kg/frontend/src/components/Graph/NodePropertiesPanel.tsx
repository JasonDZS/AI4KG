import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { X, Edit, Trash2 } from 'lucide-react'
import type { GraphNode } from '@/types'

interface NodePropertiesPanelProps {
  node: GraphNode
  onClose: () => void
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  onClose,
}) => {
  const handleEdit = () => {
    // TODO: 实现编辑功能
    console.log('Edit node:', node.id)
  }

  const handleDelete = () => {
    // TODO: 实现删除功能
    if (confirm('确定要删除这个节点吗？')) {
      console.log('Delete node:', node.id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <h3 className="font-medium">节点属性</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ID</label>
              <p className="text-sm mt-1">{node.id}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">标签</label>
              <p className="text-sm mt-1">{node.label}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">类型</label>
              <p className="text-sm mt-1">{node.type}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">可视化属性</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">X坐标</label>
                <p className="text-sm mt-1">{node.x?.toFixed(2) || '0'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Y坐标</label>
                <p className="text-sm mt-1">{node.y?.toFixed(2) || '0'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">大小</label>
                <p className="text-sm mt-1">{node.size || 10}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">颜色</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: node.color || '#3498db' }}
                  />
                  <span className="text-sm">{node.color || '#3498db'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.keys(node.properties || {}).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">自定义属性</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(node.properties || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground">{key}</label>
                  <p className="text-sm mt-1">{String(value)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="p-4 border-t flex space-x-2 flex-shrink-0">
        <Button size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          编辑
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          删除
        </Button>
      </div>
    </div>
  )
}

export default NodePropertiesPanel