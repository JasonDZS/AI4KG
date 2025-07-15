import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Upload, FileText, AlertCircle } from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any) => void
}

const SUPPORTED_FORMATS = [
  { extension: '.json', description: 'JSON格式 (NetworkX node-link)' },
  { extension: '.gml', description: 'GML格式 (Graph Modeling Language)' },
  { extension: '.graphml', description: 'GraphML格式' },
  { extension: '.gexf', description: 'GEXF格式' },
]

const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    const supportedExtensions = SUPPORTED_FORMATS.map(f => f.extension)
    
    if (!supportedExtensions.includes(extension)) {
      setError(`不支持的文件格式: ${extension}`)
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)

    try {
      const extension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
      
      if (extension === '.json') {
        // Handle JSON files
        const text = await selectedFile.text()
        const data = JSON.parse(text)
        
        // Validate JSON structure
        if (!data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('JSON文件必须包含nodes数组')
        }
        if (!data.edges || !Array.isArray(data.edges)) {
          throw new Error('JSON文件必须包含edges数组')
        }
        
        onImport(data)
        onOpenChange(false)
      } else {
        // For other formats, we need to send to backend for processing
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        // This would typically call an API endpoint for file processing
        // For now, we'll show an error message
        throw new Error('目前仅支持JSON格式的直接导入。其他格式请使用后端导入工具。')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setError(null)
    setDragActive(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">导入图谱</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* File Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
              ${selectedFile ? 'border-green-400 bg-green-50' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-green-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  重新选择
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  拖拽文件到此处或
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    点击选择文件
                  </button>
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.gml,.graphml,.gexf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Supported Formats */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">支持的格式:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              {SUPPORTED_FORMATS.map(format => (
                <li key={format.extension} className="flex items-center">
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    {format.extension}
                  </span>
                  <span className="ml-2">{format.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? '导入中...' : '导入'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportDialog