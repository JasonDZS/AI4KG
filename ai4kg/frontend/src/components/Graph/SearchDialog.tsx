import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Search } from 'lucide-react'
import type { GraphNode, GraphEdge } from '@/types'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: GraphNode[]
  edges: GraphEdge[]
  onSelectNode: (nodeId: string) => void
  onSelectEdge: (edgeId: string) => void
}

interface SearchResult {
  type: 'node' | 'edge'
  id: string
  label: string
  description: string
  data: GraphNode | GraphEdge
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onOpenChange,
  nodes,
  edges,
  onSelectNode,
  onSelectEdge,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const performSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setSelectedIndex(-1)
      return
    }

    const results: SearchResult[] = []
    const lowerTerm = term.toLowerCase()

    // Search nodes
    nodes.forEach(node => {
      let matches = false
      let description = ''

      // Search in label
      if (node.label.toLowerCase().includes(lowerTerm)) {
        matches = true
        description = `标签: ${node.label}`
      }

      // Search in type
      if (node.type.toLowerCase().includes(lowerTerm)) {
        matches = true
        description = `类型: ${node.type}`
      }

      // Search in properties
      if (node.properties) {
        for (const [key, value] of Object.entries(node.properties)) {
          if (
            key.toLowerCase().includes(lowerTerm) ||
            String(value).toLowerCase().includes(lowerTerm)
          ) {
            matches = true
            description = `属性: ${key} = ${value}`
            break
          }
        }
      }

      if (matches) {
        results.push({
          type: 'node',
          id: node.id,
          label: node.label,
          description,
          data: node,
        })
      }
    })

    // Search edges
    edges.forEach(edge => {
      let matches = false
      let description = ''

      // Search in type
      if (edge.type.toLowerCase().includes(lowerTerm)) {
        matches = true
        description = `类型: ${edge.type}`
      }

      // Search in properties
      if (edge.properties) {
        for (const [key, value] of Object.entries(edge.properties)) {
          if (
            key.toLowerCase().includes(lowerTerm) ||
            String(value).toLowerCase().includes(lowerTerm)
          ) {
            matches = true
            description = `属性: ${key} = ${value}`
            break
          }
        }
      }

      // Search by connected nodes
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      if (
        sourceNode?.label.toLowerCase().includes(lowerTerm) ||
        targetNode?.label.toLowerCase().includes(lowerTerm)
      ) {
        matches = true
        description = `连接: ${sourceNode?.label || edge.source} → ${targetNode?.label || edge.target}`
      }

      if (matches) {
        const sourceLabel = sourceNode?.label || edge.source
        const targetLabel = targetNode?.label || edge.target
        
        results.push({
          type: 'edge',
          id: edge.id,
          label: `${sourceLabel} → ${targetLabel}`,
          description,
          data: edge,
        })
      }
    })

    setSearchResults(results.slice(0, 20)) // Limit to 20 results
    setSelectedIndex(-1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    performSearch(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectResult(searchResults[selectedIndex])
      }
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'node') {
      onSelectNode(result.id)
    } else {
      onSelectEdge(result.id)
    }
    onOpenChange(false)
    setSearchTerm('')
    setSearchResults([])
    setSelectedIndex(-1)
  }

  const handleClose = () => {
    onOpenChange(false)
    setSearchTerm('')
    setSearchResults([])
    setSelectedIndex(-1)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">搜索图谱</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索节点、边或属性..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 mb-2">
                  找到 {searchResults.length} 个结果
                </p>
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors
                      ${index === selectedIndex 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`
                            text-xs px-2 py-1 rounded
                            ${result.type === 'node' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                            }
                          `}>
                            {result.type === 'node' ? '节点' : '边'}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {result.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {result.description}
                        </p>
                        {result.type === 'node' && (
                          <p className="text-xs text-gray-500 mt-1">
                            类型: {(result.data as GraphNode).type}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">没有找到匹配的结果</p>
                <p className="text-sm text-gray-400 mt-1">
                  尝试使用不同的关键词搜索
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">输入关键词开始搜索</p>
                <p className="text-sm text-gray-400 mt-1">
                  可以搜索节点标签、类型、属性或边的信息
                </p>
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              <strong>搜索提示:</strong> 
              使用 ↑↓ 键选择结果，Enter 键确认选择
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchDialog