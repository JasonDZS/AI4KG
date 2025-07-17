# 📈 图分析 API

图谱的统计分析、中心性分析、社区检测等功能。

## 端点概览

| 方法 | 路径 | 描述 | 认证 | 状态 |
|------|------|------|------|------|
| GET | `/api/graphs/{graph_id}/analysis/statistics` | 获取图谱统计信息 | ✅ | 🚧 待实现 |
| GET | `/api/graphs/{graph_id}/analysis/centrality` | 节点中心性分析 | ✅ | 🚧 待实现 |
| GET | `/api/graphs/{graph_id}/analysis/communities` | 社区检测 | ✅ | 🚧 待实现 |
| GET | `/api/graphs/{graph_id}/analysis/shortest-path` | 最短路径分析 | ✅ | 🚧 待实现 |
| GET | `/api/graphs/{graph_id}/analysis/clustering` | 聚类系数分析 | ✅ | 🚧 待实现 |
| GET | `/api/graphs/{graph_id}/analysis/pagerank` | PageRank算法 | ✅ | 🚧 待实现 |

> **注意**: 本模块的功能目前处于开发阶段，API接口已定义但功能待实现。

---

## 📊 图谱统计信息

获取图谱的基本统计指标。

**端点**: `GET /api/graphs/{graph_id}/analysis/statistics`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "图统计信息",
  "data": {
    "basic_stats": {
      "node_count": 150,
      "edge_count": 320,
      "density": 0.028,
      "is_connected": true,
      "components_count": 1
    },
    "node_stats": {
      "avg_degree": 4.27,
      "max_degree": 25,
      "min_degree": 1,
      "isolated_nodes": 0
    },
    "edge_stats": {
      "self_loops": 2,
      "multi_edges": 0,
      "directed": true
    },
    "type_distribution": {
      "nodes": {
        "Person": 80,
        "Organization": 45,
        "Location": 25
      },
      "edges": {
        "works_for": 120,
        "located_in": 95,
        "collaborates_with": 105
      }
    }
  }
}
```

### 统计指标说明

| 指标 | 描述 |
|------|------|
| node_count | 节点总数 |
| edge_count | 边总数 |
| density | 图密度 (实际边数/最大可能边数) |
| avg_degree | 平均度数 |
| is_connected | 是否连通 |
| components_count | 连通分量数量 |
| isolated_nodes | 孤立节点数量 |

### 示例

```bash
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/analysis/statistics" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🎯 节点中心性分析

计算图中各节点的中心性指标。

**端点**: `GET /api/graphs/{graph_id}/analysis/centrality`

### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| algorithm | string | ❌ | all | 中心性算法 (degree/betweenness/closeness/eigenvector/all) |
| top_k | integer | ❌ | 10 | 返回前K个最重要的节点 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "节点中心性分析功能待实现",
  "data": {
    "degree_centrality": [
      {
        "node_id": "person-001",
        "node_label": "张三",
        "score": 0.85,
        "rank": 1
      }
    ],
    "betweenness_centrality": [
      {
        "node_id": "person-002",
        "node_label": "李四",
        "score": 0.72,
        "rank": 1
      }
    ],
    "closeness_centrality": [
      {
        "node_id": "org-001",
        "node_label": "ABC公司",
        "score": 0.68,
        "rank": 1
      }
    ],
    "eigenvector_centrality": [
      {
        "node_id": "person-003",
        "node_label": "王五",
        "score": 0.91,
        "rank": 1
      }
    ]
  }
}
```

### 中心性算法说明

| 算法 | 描述 | 适用场景 |
|------|------|----------|
| degree | 度中心性，基于直接连接数 | 识别连接最多的节点 |
| betweenness | 介数中心性，基于经过该节点的最短路径数 | 识别桥梁节点 |
| closeness | 接近中心性，基于到其他节点的距离 | 识别信息传播效率高的节点 |
| eigenvector | 特征向量中心性，考虑邻居节点的重要性 | 识别影响力大的节点 |

---

## 👥 社区检测

识别图中的社区结构。

**端点**: `GET /api/graphs/{graph_id}/analysis/communities`

### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| algorithm | string | ❌ | louvain | 社区检测算法 (louvain/leiden/infomap) |
| resolution | float | ❌ | 1.0 | 分辨率参数 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "社区检测功能待实现",
  "data": {
    "algorithm": "louvain",
    "modularity": 0.72,
    "community_count": 5,
    "communities": [
      {
        "id": "community_1",
        "size": 35,
        "modularity_contribution": 0.18,
        "nodes": [
          {
            "id": "person-001",
            "label": "张三",
            "type": "Person"
          }
        ]
      }
    ],
    "community_stats": {
      "avg_size": 30,
      "max_size": 45,
      "min_size": 15,
      "size_distribution": {
        "small": 2,
        "medium": 2,
        "large": 1
      }
    }
  }
}
```

---

## 🛣️ 最短路径分析

计算节点间的最短路径。

**端点**: `GET /api/graphs/{graph_id}/analysis/shortest-path`

### 查询参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| source | string | ✅ | 起始节点ID |
| target | string | ❌ | 目标节点ID（不提供则计算从source到所有节点的距离） |
| algorithm | string | ❌ | dijkstra | 算法选择 (dijkstra/floyd) |
| max_depth | integer | ❌ | 6 | 最大搜索深度 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "最短路径分析功能待实现",
  "data": {
    "source_node": {
      "id": "person-001",
      "label": "张三"
    },
    "target_node": {
      "id": "person-002",
      "label": "李四"
    },
    "path_length": 3,
    "path": [
      {
        "node_id": "person-001",
        "node_label": "张三",
        "step": 0
      },
      {
        "node_id": "org-001",
        "node_label": "ABC公司",
        "step": 1,
        "edge_id": "edge-001",
        "edge_label": "工作于"
      },
      {
        "node_id": "person-003",
        "node_label": "王五",
        "step": 2,
        "edge_id": "edge-002",
        "edge_label": "同事"
      },
      {
        "node_id": "person-002",
        "node_label": "李四",
        "step": 3,
        "edge_id": "edge-003",
        "edge_label": "朋友"
      }
    ],
    "alternative_paths": [
      {
        "length": 4,
        "path": ["person-001", "loc-001", "org-002", "person-002"]
      }
    ]
  }
}
```

---

## 🔗 聚类系数分析

计算图的聚类系数，衡量节点邻居之间的连接密度。

**端点**: `GET /api/graphs/{graph_id}/analysis/clustering`

### 成功响应 (200)

```json
{
  "success": true,
  "message": "聚类系数分析功能待实现",
  "data": {
    "global_clustering": 0.42,
    "average_clustering": 0.38,
    "clustering_distribution": {
      "0.0-0.2": 25,
      "0.2-0.4": 35,
      "0.4-0.6": 40,
      "0.6-0.8": 30,
      "0.8-1.0": 20
    },
    "top_clustered_nodes": [
      {
        "node_id": "person-001",
        "node_label": "张三",
        "clustering_coefficient": 0.85
      }
    ]
  }
}
```

---

## 📊 PageRank算法

使用PageRank算法计算节点重要性。

**端点**: `GET /api/graphs/{graph_id}/analysis/pagerank`

### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| damping_factor | float | ❌ | 0.85 | 阻尼因子 |
| max_iterations | integer | ❌ | 100 | 最大迭代次数 |
| tolerance | float | ❌ | 1e-6 | 收敛容差 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "PageRank分析功能待实现",
  "data": {
    "algorithm_params": {
      "damping_factor": 0.85,
      "iterations": 45,
      "converged": true
    },
    "rankings": [
      {
        "node_id": "person-001",
        "node_label": "张三",
        "pagerank_score": 0.0234,
        "rank": 1
      }
    ],
    "score_distribution": {
      "mean": 0.0067,
      "std": 0.0123,
      "min": 0.0001,
      "max": 0.0234
    }
  }
}
```

---

## 💡 使用建议

### 分析策略

1. **基础分析**: 先查看统计信息了解图的整体结构
2. **中心性分析**: 识别关键节点和影响力节点
3. **社区发现**: 了解图的模块化结构
4. **路径分析**: 分析节点间的连接关系

### 性能考虑

1. **大图处理**: 对于大型图谱，分析可能需要较长时间
2. **采样分析**: 考虑对大图进行采样后分析
3. **缓存结果**: 缓存分析结果避免重复计算
4. **异步处理**: 复杂分析可考虑异步处理

### 结果解释

1. **中心性指标**: 不同中心性反映节点的不同重要性
2. **社区质量**: 模块度(modularity)越高表示社区结构越明显
3. **路径分析**: 关注关键路径和桥梁节点
4. **聚类系数**: 反映局部连接的紧密程度

### 应用场景

1. **社交网络**: 识别意见领袖和社群结构
2. **知识图谱**: 发现核心概念和关联模式
3. **组织分析**: 识别关键岗位和团队结构
4. **推荐系统**: 基于图结构进行推荐

---

## 🚧 开发状态

当前所有分析功能都处于待实现状态，API接口已定义完成。计划实现的功能包括：

- [x] API接口设计
- [ ] 基础统计算法实现
- [ ] 中心性算法实现  
- [ ] 社区检测算法实现
- [ ] 路径分析算法实现
- [ ] 性能优化
- [ ] 大图处理策略
- [ ] 结果可视化支持

---

*返回 [API文档首页](./API.md)*
