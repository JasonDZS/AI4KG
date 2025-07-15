import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphsApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import type { CreateGraphRequest } from '@/types'

interface CreateGraphDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateGraphDialog: React.FC<CreateGraphDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState<CreateGraphRequest>({
    title: '',
    description: '',
  })
  const queryClient = useQueryClient()

  const createGraphMutation = useMutation({
    mutationFn: graphsApi.createGraph,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graphs'] })
      onOpenChange(false)
      setFormData({ title: '', description: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createGraphMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">创建新图谱</h2>
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
            <label htmlFor="title" className="text-sm font-medium">
              标题 *
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="输入图谱标题"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              描述
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="输入图谱描述"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
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
              disabled={createGraphMutation.isPending}
            >
              {createGraphMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGraphDialog