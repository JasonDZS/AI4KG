from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    graphs = relationship("Graph", back_populates="user")

class Graph(Base):
    __tablename__ = "graphs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    user_id = Column(String(36), ForeignKey("users.id"))
    neo4j_graph_id = Column(String(100))  # Neo4j中的图ID
    node_count = Column(Integer, default=0)
    edge_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    user = relationship("User", back_populates="graphs")
    nodes = relationship("Node", back_populates="graph", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="graph", cascade="all, delete-orphan")

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    graph_id = Column(String(36), ForeignKey("graphs.id"), nullable=False, index=True)
    node_id = Column(String(255), nullable=False, index=True)  # 节点在图中的业务ID
    label = Column(String(500), nullable=False)
    type = Column(String(100), nullable=False, default="entity")
    properties = Column(JSON, default=dict)  # 自定义属性
    x = Column(Float, nullable=True)  # X坐标
    y = Column(Float, nullable=True)  # Y坐标
    size = Column(Float, nullable=True)  # 节点大小
    color = Column(String(50), nullable=True)  # 节点颜色
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    graph = relationship("Graph", back_populates="nodes")
    
    # 复合索引
    __table_args__ = (
        {'sqlite_autoincrement': True}
    )

class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    graph_id = Column(String(36), ForeignKey("graphs.id"), nullable=False, index=True)
    edge_id = Column(String(255), nullable=False, index=True)  # 边在图中的业务ID
    source_node_id = Column(String(255), nullable=False, index=True)  # 源节点业务ID
    target_node_id = Column(String(255), nullable=False, index=True)  # 目标节点业务ID
    label = Column(String(500), nullable=True)
    type = Column(String(100), nullable=False, default="relationship")
    properties = Column(JSON, default=dict)  # 自定义属性
    weight = Column(Float, nullable=True)  # 权重
    color = Column(String(50), nullable=True)  # 边颜色
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    graph = relationship("Graph", back_populates="edges")
    
    # 复合索引
    __table_args__ = (
        {'sqlite_autoincrement': True}
    )