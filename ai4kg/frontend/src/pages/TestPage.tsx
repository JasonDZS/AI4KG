import { useState } from 'react'
import NodePropertiesPanel from '../components/Graph/NodePropertiesPanel'
import type { GraphNode } from '../types'

const TestPage = () => {
  const [testNode] = useState<GraphNode>({
    id: 'test-node-1',
    label: '测试节点',
    type: 'TestType',
    x: 100,
    y: 200,
    size: 20,
    color: '#3498db',
    properties: {
      description: '这是一个测试节点',
      category: 'test'
    }
  })

  const handleNodeUpdate = (updatedNode: GraphNode) => {
    console.log('Node updated:', updatedNode)
  }

  const handleNodeDelete = (nodeId: string) => {
    console.log('Node deleted:', nodeId)
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">测试节点属性面板编辑功能</p>
      </div>
      <div className="w-80 border-l bg-white">
        <NodePropertiesPanel
          node={testNode}
          graphId="test-graph"
          onClose={() => console.log('Panel closed')}
          onNodeUpdate={handleNodeUpdate}
          onNodeDelete={handleNodeDelete}
        />
      </div>
    </div>
  )
}

export default TestPage
