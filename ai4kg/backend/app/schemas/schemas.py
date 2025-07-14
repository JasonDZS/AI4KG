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
    pass

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
    source_node_id: str
    target_node_id: str
    label: Optional[str] = None
    type: str
    properties: Optional[Dict[str, Any]] = {}
    weight: Optional[float] = None
    color: Optional[str] = None

class EdgeCreate(EdgeBase):
    pass

class EdgeUpdate(BaseModel):
    source_node_id: Optional[str] = None
    target_node_id: Optional[str] = None
    label: Optional[str] = None
    type: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    color: Optional[str] = None

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
    nodes: Optional[List[Node]] = None
    edges: Optional[List[Edge]] = None

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