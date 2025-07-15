import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'
import type { GraphNode, GraphEdge } from '@/types'

interface ContextMenuProps {
  x: number
  y: number
  type: 'node' | 'edge' | 'canvas'
  target?: GraphNode | GraphEdge
  onClose: () => void
  graphId: string
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  target,
  onClose,
  graphId,
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose()
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleAddNode = () => {
    // TODO: 实现添加节点功能
    console.log('Add node at position')
    onClose()
  }

  const handleEditNode = () => {
    // TODO: 实现编辑节点功能
    console.log('Edit node:', target)
    onClose()
  }

  const handleDeleteNode = () => {
    // TODO: 实现删除节点功能
    if (confirm('确定要删除这个节点吗？')) {
      console.log('Delete node:', target)
    }
    onClose()
  }

  const handleCopyNode = () => {
    // TODO: 实现复制节点功能
    console.log('Copy node:', target)
    onClose()
  }

  const handleEditEdge = () => {
    // TODO: 实现编辑边功能
    console.log('Edit edge:', target)
    onClose()
  }

  const handleDeleteEdge = () => {
    // TODO: 实现删除边功能
    if (confirm('确定要删除这条边吗？')) {
      console.log('Delete edge:', target)
    }
    onClose()
  }

  const renderNodeMenu = () => (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={handleEditNode}
      >
        <Edit className="h-4 w-4 mr-2" />
        编辑节点
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={handleCopyNode}
      >
        <Copy className="h-4 w-4 mr-2" />
        复制节点
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-destructive hover:text-destructive"
        onClick={handleDeleteNode}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        删除节点
      </Button>
    </>
  )

  const renderEdgeMenu = () => (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={handleEditEdge}
      >
        <Edit className="h-4 w-4 mr-2" />
        编辑边
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-destructive hover:text-destructive"
        onClick={handleDeleteEdge}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        删除边
      </Button>
    </>
  )

  const renderCanvasMenu = () => (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={handleAddNode}
      >
        <Plus className="h-4 w-4 mr-2" />
        添加节点
      </Button>
    </>
  )

  return (
    <div
      className="fixed z-50 min-w-[150px] bg-white border border-gray-200 rounded-md shadow-lg py-1"
      style={{ left: x, top: y }}
    >
      {type === 'node' && renderNodeMenu()}
      {type === 'edge' && renderEdgeMenu()}
      {type === 'canvas' && renderCanvasMenu()}
    </div>
  )
}

export default ContextMenu