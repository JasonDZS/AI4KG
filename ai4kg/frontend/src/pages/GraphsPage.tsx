import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { graphsApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import CreateGraphDialog from '@/components/Graph/CreateGraphDialog'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import type { Graph } from '@/types'

const GraphsPage = () => {
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const queryClient = useQueryClient()

  const { data: graphsData, isLoading } = useQuery({
    queryKey: ['graphs', { search }],
    queryFn: () => graphsApi.getGraphs({ search }),
  })

  const deleteGraphMutation = useMutation({
    mutationFn: graphsApi.deleteGraph,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graphs'] })
    },
  })

  const handleDeleteGraph = (graphId: string) => {
    if (confirm('确定要删除这个图谱吗？')) {
      deleteGraphMutation.mutate(graphId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const graphs = graphsData?.data?.graphs || []

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">知识图谱</h1>
            <p className="text-muted-foreground">
              管理和查看您的知识图谱
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建图谱
          </Button>
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索图谱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {graphs.map((graph: Graph) => (
            <Card key={graph.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{graph.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {graph.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    创建于 {new Date(graph.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link to={`/graphs/${graph.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGraph(graph.id)}
                      disabled={deleteGraphMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {graphs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">还没有任何图谱</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个图谱
            </Button>
          </div>
        )}
      </div>

      <CreateGraphDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}

export default GraphsPage