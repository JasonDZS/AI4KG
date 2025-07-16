import { useEffect } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { edgesApi } from '@/services/api'
import type { GraphNode, GraphEdge } from '@/types'

interface ContextMenuProps {
  x: number
  y: number
  type: 'node' | 'edge' | 'canvas'
  target?: GraphNode | GraphEdge
  onClose: () => void
  graphId: string
  onEdgeUpdate?: (edge: GraphEdge) => void
  onEdgeDelete?: (edgeId: string) => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  target,
  onClose,
  graphId,
  onEdgeUpdate: _onEdgeUpdate,
  onEdgeDelete,
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

  const handleEditEdge = () => {
    if (target && 'source' in target) {
      // TODO: 实现边编辑对话框
      console.log('Edit edge:', target)
      alert('边编辑功能待实现')
    }
    onClose()
  }

  const handleDeleteEdge = async () => {
    if (!target || !('source' in target)) return
    
    if (confirm('确定要删除这条边吗？删除后无法恢复。')) {
      try {
        await edgesApi.deleteEdge(graphId, target.id)
        onEdgeDelete?.(target.id)
        console.log('Edge deleted successfully')
      } catch (error) {
        console.error('Failed to delete edge:', error)
        alert('删除边失败，请稍后重试')
      }
    }
    onClose()
  }

  const renderNodeMenu = () => (
    <div className="space-y-1">
      <div className="px-3 py-2 text-sm text-gray-500">
        节点操作已禁用
      </div>
    </div>
  )

  const renderEdgeMenu = () => (
    <div className="space-y-1">
      <button
        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
        onClick={handleEditEdge}
      >
        <Edit className="h-4 w-4 mr-2" />
        编辑边
      </button>
      <button
        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
        onClick={handleDeleteEdge}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        删除边
      </button>
    </div>
  )

  const renderCanvasMenu = () => (
    <div className="space-y-1">
      <div className="px-3 py-2 text-sm text-gray-500">
        画布操作已禁用
      </div>
    </div>
  )

  return (
    <div
      className="fixed z-50 min-w-[150px] bg-white border border-gray-200 rounded-md shadow-lg py-2"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === 'node' && renderNodeMenu()}
      {type === 'edge' && renderEdgeMenu()}
      {type === 'canvas' && renderCanvasMenu()}
    </div>
  )
}

export default ContextMenu