import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { X, Edit, Trash2 } from 'lucide-react'
import type { GraphEdge } from '@/types'

interface EdgePropertiesPanelProps {
  edge: GraphEdge
  onClose: () => void
}

const EdgePropertiesPanel: React.FC<EdgePropertiesPanelProps> = ({
  edge,
  onClose,
}) => {
  const handleEdit = () => {
    // TODO: 实现编辑功能
    console.log('Edit edge:', edge.id)
  }

  const handleDelete = () => {
    // TODO: 实现删除功能
    if (confirm('确定要删除这条边吗？')) {
      console.log('Delete edge:', edge.id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <h3 className="font-medium">边属性</h3>
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
              <p className="text-sm mt-1">{edge.id}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">源节点</label>
              <p className="text-sm mt-1 font-medium">{edge.source}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">目标节点</label>
              <p className="text-sm mt-1 font-medium">{edge.target}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">关系类型</label>
              <p className="text-sm mt-1">{edge.type}</p>
            </div>
            {edge.weight !== undefined && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">权重</label>
                <p className="text-sm mt-1">{edge.weight}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {Object.keys(edge.properties || {}).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">自定义属性</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(edge.properties || {}).map(([key, value]) => (
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

export default EdgePropertiesPanel