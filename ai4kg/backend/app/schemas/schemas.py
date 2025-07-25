from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# 基础响应模型
class BaseResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None

class DataResponse(BaseResponse):
    data: Optional[Any] = None

# 用户相关模型
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserWithToken(BaseModel):
    user: User
    token: str

# 节点模型
class NodeBase(BaseModel):
    label: str
    type: str
    properties: Optional[Dict[str, Any]] = {}
    x: Optional[float] = None
    y: Optional[float] = None
    size: Optional[float] = None
    color: Optional[str] = None

class NodeCreate(NodeBase):
    id: Optional[str] = None
    node_id: Optional[str] = None

class NodeUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    x: Optional[float] = None
    y: Optional[float] = None
    size: Optional[float] = None
    color: Optional[str] = None

class Node(NodeBase):
    id: str
    
    class Config:
        from_attributes = True

# 边模型
class EdgeBase(BaseModel):
    source: str
    target: str
    label: Optional[str] = None
    type: str
    properties: Optional[Dict[str, Any]] = {}
    weight: Optional[float] = None
    color: Optional[str] = None

class EdgeCreate(BaseModel):
    id: Optional[str] = None
    edge_id: Optional[str] = None
    source: Optional[str] = None
    target: Optional[str] = None
    source_node_id: Optional[str] = None
    target_node_id: Optional[str] = None
    label: Optional[str] = None
    type: str
    properties: Optional[Dict[str, Any]] = {}
    weight: Optional[float] = None
    color: Optional[str] = None
    
    @property
    def effective_source(self) -> str:
        """获取有效的源节点ID"""
        return self.source or self.source_node_id
    
    @property
    def effective_target(self) -> str:
        """获取有效的目标节点ID"""
        return self.target or self.target_node_id

class EdgeUpdate(BaseModel):
    source: Optional[str] = None
    target: Optional[str] = None
    source_node_id: Optional[str] = None
    target_node_id: Optional[str] = None
    label: Optional[str] = None
    type: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    color: Optional[str] = None
    
    @property
    def effective_source(self) -> Optional[str]:
        """获取有效的源节点ID"""
        return self.source or self.source_node_id
    
    @property
    def effective_target(self) -> Optional[str]:
        """获取有效的目标节点ID"""
        return self.target or self.target_node_id

class Edge(EdgeBase):
    id: str
    
    class Config:
        from_attributes = True

# 图谱模型
class GraphBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="图谱标题")
    description: Optional[str] = Field(None, max_length=1000, description="图谱描述")

class GraphCreate(GraphBase):
    nodes: Optional[List[NodeCreate]] = []
    edges: Optional[List[EdgeCreate]] = []

class GraphUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[dict]] = None
    edges: Optional[List[dict]] = None

class GraphMetadata(BaseModel):
    created_at: datetime
    updated_at: datetime
    node_count: int
    edge_count: int

class Graph(GraphBase):
    id: str
    user_id: str
    metadata: GraphMetadata
    
    class Config:
        from_attributes = True

class GraphWithData(Graph):
    nodes: List[Node]
    edges: List[Edge]

class GraphList(BaseModel):
    graphs: List[Graph]
    total: int

# 图统计模型
class GraphStats(BaseModel):
    node_count: int
    edge_count: int
    density: float
    avg_degree: float
    connected_components: int
    node_types: Dict[str, int]
    edge_types: Dict[str, int]

# 搜索模型
class SearchQuery(BaseModel):
    q: str
    type: Optional[str] = None  # nodes/edges/graphs
    graph_id: Optional[str] = None

class CypherQuery(BaseModel):
    graph_id: str
    query: str
    parameters: Optional[Dict[str, Any]] = {}

# 分页模型
class PaginationParams(BaseModel):
    page: int = 1
    size: int = 10
    search: Optional[str] = None