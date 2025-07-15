import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Download } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (format: 'json' | 'gml' | 'graphml' | 'gexf') => void
}

const EXPORT_FORMATS = [
  { 
    value: 'json' as const, 
    label: 'JSON', 
    description: 'JavaScript Object Notation - 适合程序处理',
    extension: '.json'
  },
  { 
    value: 'gml' as const, 
    label: 'GML', 
    description: 'Graph Modeling Language - NetworkX兼容',
    extension: '.gml'
  },
  { 
    value: 'graphml' as const, 
    label: 'GraphML', 
    description: 'Graph Markup Language - XML格式',
    extension: '.xml'
  },
  { 
    value: 'gexf' as const, 
    label: 'GEXF', 
    description: 'Graph Exchange XML Format - Gephi兼容',
    extension: '.gexf'
  },
]

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'gml' | 'graphml' | 'gexf'>('json')

  const handleExport = () => {
    onExport(selectedFormat)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">导出图谱</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">选择导出格式:</label>
            <div className="space-y-3">
              {EXPORT_FORMATS.map(format => (
                <label
                  key={format.value}
                  className={`
                    flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedFormat === format.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{format.label}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {format.extension}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {format.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>提示:</strong> 导出的文件将包含完整的图谱数据，包括节点、边和所有属性信息。
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog