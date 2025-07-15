import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Plus, Download, Upload, Search } from 'lucide-react'
import { graphsApi, nodesApi, edgesApi } from '@/services/api'
import AddNodeDialog from './AddNodeDialog'
import AddEdgeDialog from './AddEdgeDialog'
import ImportDialog from './ImportDialog'
import SearchDialog from './SearchDialog'
import ExportDialog from './ExportDialog'
import type { CreateNodeRequest, CreateEdgeRequest, GraphNode, GraphEdge } from '@/types'

interface GraphToolbarProps {
  graphId: string
  nodes?: GraphNode[]
  edges?: GraphEdge[]
  onNodeSelect?: (nodeId: string) => void
  onEdgeSelect?: (edgeId: string) => void
}

const GraphToolbar: React.FC<GraphToolbarProps> = ({ 
  graphId, 
  nodes = [], 
  edges = [], 
  onNodeSelect, 
  onEdgeSelect 
}) => {
  const [addNodeOpen, setAddNodeOpen] = useState(false)
  const [addEdgeOpen, setAddEdgeOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  
  const queryClient = useQueryClient()

  // Mutations for node/edge operations
  const createNodeMutation = useMutation({
    mutationFn: (data: CreateNodeRequest) => nodesApi.createNode(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] })
    },
    onError: (error) => {
      console.error('Failed to create node:', error)
      // TODO: Show error notification
    }
  })

  const createEdgeMutation = useMutation({
    mutationFn: (data: CreateEdgeRequest) => edgesApi.createEdge(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] })
    },
    onError: (error) => {
      console.error('Failed to create edge:', error)
      // TODO: Show error notification
    }
  })

  const importGraphMutation = useMutation({
    mutationFn: (data: any) => graphsApi.importGraph(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] })
      // TODO: Show success notification
    },
    onError: (error) => {
      console.error('Failed to import graph:', error)
      // TODO: Show error notification
    }
  })

  const handleAddNode = () => {
    setAddNodeOpen(true)
  }

  const handleAddEdge = () => {
    setAddEdgeOpen(true)
  }

  const handleExport = () => {
    setExportOpen(true)
  }

  const handleExportWithFormat = async (format: 'json' | 'gml' | 'graphml' | 'gexf') => {
    try {
      const data = await graphsApi.exportGraph(graphId, format)
      
      // Create blob and download
      const mimeTypes = {
        json: 'application/json',
        gml: 'text/plain',
        graphml: 'application/xml',
        gexf: 'application/xml'
      }
      
      const extensions = {
        json: '.json',
        gml: '.gml',
        graphml: '.xml',
        gexf: '.gexf'
      }
      
      const blob = new Blob([data], { type: mimeTypes[format] })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `graph-${graphId}${extensions[format]}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // TODO: Show success notification
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error notification
    }
  }

  const handleImport = () => {
    setImportOpen(true)
  }

  const handleSearch = () => {
    setSearchOpen(true)
  }

  const handleNodeAdd = (nodeData: CreateNodeRequest) => {
    createNodeMutation.mutate(nodeData)
  }

  const handleEdgeAdd = (edgeData: CreateEdgeRequest) => {
    createEdgeMutation.mutate(edgeData)
  }

  const handleImportData = (data: any) => {
    importGraphMutation.mutate(data)
  }

  const handleNodeSelect = (nodeId: string) => {
    onNodeSelect?.(nodeId)
  }

  const handleEdgeSelect = (edgeId: string) => {
    onEdgeSelect?.(edgeId)
  }

  return (
    <>
      <div className="border-b px-6 py-3 flex items-center space-x-2">
        <Button size="sm" onClick={handleAddNode}>
          <Plus className="h-4 w-4 mr-2" />
          添加节点
        </Button>
        
        <Button size="sm" variant="outline" onClick={handleAddEdge}>
          <Plus className="h-4 w-4 mr-2" />
          添加边
        </Button>
        
        <div className="flex-1" />
        
        <Button size="sm" variant="ghost" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="ghost" onClick={handleImport}>
          <Upload className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="ghost" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Dialogs */}
      <AddNodeDialog
        open={addNodeOpen}
        onOpenChange={setAddNodeOpen}
        onAddNode={handleNodeAdd}
      />
      
      <AddEdgeDialog
        open={addEdgeOpen}
        onOpenChange={setAddEdgeOpen}
        onAddEdge={handleEdgeAdd}
        nodes={nodes}
      />
      
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportData}
      />
      
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        nodes={nodes}
        edges={edges}
        onSelectNode={handleNodeSelect}
        onSelectEdge={handleEdgeSelect}
      />
      
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        onExport={handleExportWithFormat}
      />
    </>
  )
}

export default GraphToolbar