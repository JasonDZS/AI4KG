#!/usr/bin/env python3
"""
AI4KG NetworkX 导入示例演示

创建示例图数据并演示导入过程。

Usage:
    python demo_import.py
"""

import os
import sys
import json
import tempfile
from pathlib import Path

try:
    import networkx as nx
    import numpy as np
except ImportError:
    print("Error: Required packages not installed.")
    print("Please run: pip install networkx numpy")
    sys.exit(1)

def create_sample_graphs():
    """创建示例图数据"""
    graphs = []
    
    # 1. 学术合作网络
    print("创建学术合作网络...")
    G1 = nx.Graph()
    
    # 添加研究员节点
    researchers = [
        ("张三", {"type": "researcher", "affiliation": "清华大学", "field": "机器学习", "h_index": 25}),
        ("李四", {"type": "researcher", "affiliation": "北京大学", "field": "数据挖掘", "h_index": 18}),
        ("王五", {"type": "researcher", "affiliation": "中科院", "field": "人工智能", "h_index": 32}),
        ("赵六", {"type": "researcher", "affiliation": "清华大学", "field": "深度学习", "h_index": 21}),
        ("钱七", {"type": "researcher", "affiliation": "复旦大学", "field": "自然语言处理", "h_index": 15}),
        ("孙八", {"type": "researcher", "affiliation": "上海交大", "field": "计算机视觉", "h_index": 28})
    ]
    
    for name, attrs in researchers:
        G1.add_node(name, **attrs)
    
    # 添加合作关系
    collaborations = [
        ("张三", "李四", {"relation": "合作", "papers": 5, "years": "2020-2023"}),
        ("张三", "赵六", {"relation": "合作", "papers": 8, "years": "2019-2023"}),
        ("王五", "钱七", {"relation": "合作", "papers": 3, "years": "2021-2022"}),
        ("李四", "孙八", {"relation": "合作", "papers": 6, "years": "2020-2023"}),
        ("赵六", "钱七", {"relation": "合作", "papers": 2, "years": "2022-2023"}),
        ("王五", "张三", {"relation": "合作", "papers": 4, "years": "2018-2021"})
    ]
    
    for source, target, attrs in collaborations:
        G1.add_edge(source, target, **attrs)
    
    graphs.append((G1, "academic_network.gml", "学术合作网络"))
    
    # 2. 社交网络（使用经典数据集）
    print("创建社交网络...")
    G2 = nx.karate_club_graph()
    
    # 添加节点属性
    for node in G2.nodes():
        G2.nodes[node]['type'] = 'person'
        G2.nodes[node]['label'] = f"成员{node}"
        G2.nodes[node]['community'] = G2.nodes[node]['club']
        G2.nodes[node]['degree'] = G2.degree(node)
    
    # 添加边属性
    for source, target in G2.edges():
        G2.edges[source, target]['type'] = 'friendship'
        G2.edges[source, target]['weight'] = np.random.uniform(0.1, 1.0)
    
    graphs.append((G2, "social_network.gml", "空手道俱乐部社交网络"))
    
    # 3. 知识图谱
    print("创建知识图谱...")
    G3 = nx.DiGraph()
    
    # 添加实体节点
    entities = [
        ("人工智能", {"type": "concept", "category": "技术领域"}),
        ("机器学习", {"type": "concept", "category": "技术分支"}),
        ("深度学习", {"type": "concept", "category": "技术分支"}),
        ("神经网络", {"type": "concept", "category": "技术方法"}),
        ("卷积神经网络", {"type": "concept", "category": "网络架构"}),
        ("循环神经网络", {"type": "concept", "category": "网络架构"}),
        ("自然语言处理", {"type": "concept", "category": "应用领域"}),
        ("计算机视觉", {"type": "concept", "category": "应用领域"})
    ]
    
    for name, attrs in entities:
        G3.add_node(name, **attrs)
    
    # 添加关系
    relations = [
        ("机器学习", "人工智能", {"type": "属于", "relation": "subfield_of"}),
        ("深度学习", "机器学习", {"type": "属于", "relation": "subfield_of"}),
        ("神经网络", "深度学习", {"type": "基础", "relation": "foundation_of"}),
        ("卷积神经网络", "神经网络", {"type": "类型", "relation": "type_of"}),
        ("循环神经网络", "神经网络", {"type": "类型", "relation": "type_of"}),
        ("自然语言处理", "人工智能", {"type": "应用", "relation": "application_of"}),
        ("计算机视觉", "人工智能", {"type": "应用", "relation": "application_of"}),
        ("卷积神经网络", "计算机视觉", {"type": "用于", "relation": "used_in"}),
        ("循环神经网络", "自然语言处理", {"type": "用于", "relation": "used_in"})
    ]
    
    for source, target, attrs in relations:
        G3.add_edge(source, target, **attrs)
    
    graphs.append((G3, "knowledge_graph.gml", "人工智能知识图谱"))
    
    # 4. 随机网络（用于测试大规模数据）
    print("创建随机网络...")
    G4 = nx.erdos_renyi_graph(50, 0.1)
    
    # 添加随机属性
    node_types = ['person', 'organization', 'location', 'concept']
    colors = ['red', 'blue', 'green', 'yellow', 'purple']
    
    for node in G4.nodes():
        G4.nodes[node]['type'] = np.random.choice(node_types)
        G4.nodes[node]['label'] = f"Node_{node}"
        G4.nodes[node]['size'] = np.random.randint(10, 50)
        G4.nodes[node]['color'] = np.random.choice(colors)
        G4.nodes[node]['value'] = np.random.uniform(0, 100)
    
    relation_types = ['connected_to', 'similar_to', 'related_to', 'depends_on']
    for source, target in G4.edges():
        G4.edges[source, target]['type'] = np.random.choice(relation_types)
        G4.edges[source, target]['weight'] = np.random.uniform(0.1, 1.0)
        G4.edges[source, target]['strength'] = np.random.randint(1, 10)
    
    graphs.append((G4, "random_network.json", "随机测试网络"))
    
    return graphs

def save_graphs(graphs, output_dir):
    """保存图数据到文件"""
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    saved_files = []
    
    for G, filename, description in graphs:
        filepath = output_dir / filename
        
        try:
            if filename.endswith('.gml'):
                nx.write_gml(G, filepath, stringizer=str)
            elif filename.endswith('.json'):
                data = nx.node_link_data(G)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            elif filename.endswith('.graphml'):
                nx.write_graphml(G, filepath)
            
            print(f"✅ 已保存: {filepath}")
            saved_files.append((str(filepath), description))
            
        except Exception as e:
            print(f"❌ 保存失败 {filepath}: {e}")
    
    return saved_files

def generate_import_commands(saved_files, api_url="http://localhost:8000"):
    """生成导入命令示例"""
    print("\n" + "="*60)
    print("📝 导入命令示例")
    print("="*60)
    
    for i, (filepath, description) in enumerate(saved_files, 1):
        filename = Path(filepath).name
        title = description
        
        print(f"\n{i}. {description}")
        print(f"python scripts/import_networkx.py \\")
        print(f"    --file {filepath} \\")
        print(f"    --title \"{title}\" \\")
        print(f"    --description \"由演示脚本生成的{description}\" \\")
        print(f"    --username admin \\")
        print(f"    --password password")
    
    # 批量导入示例
    print(f"\n{len(saved_files)+1}. 批量导入所有文件")
    print(f"python scripts/import_networkx.py \\")
    print(f"    --directory {Path(saved_files[0][0]).parent} \\")
    print(f"    --title-prefix \"演示_\" \\")
    print(f"    --username admin \\")
    print(f"    --password password")

def print_graph_statistics(graphs):
    """打印图统计信息"""
    print("\n" + "="*60)
    print("📊 图数据统计")
    print("="*60)
    
    for G, filename, description in graphs:
        print(f"\n📈 {description} ({filename})")
        print(f"   节点数: {len(G.nodes)}")
        print(f"   边数: {len(G.edges)}")
        print(f"   有向图: {'是' if G.is_directed() else '否'}")
        
        if len(G.nodes) > 0:
            print(f"   密度: {nx.density(G):.4f}")
            
            if not G.is_directed() and len(G.nodes) > 1:
                is_connected = nx.is_connected(G)
                print(f"   连通性: {'连通' if is_connected else '不连通'}")
                
                if not is_connected:
                    components = list(nx.connected_components(G))
                    print(f"   连通组件数: {len(components)}")
                    largest_cc = max(components, key=len)
                    print(f"   最大组件大小: {len(largest_cc)}")
        
        # 节点属性统计
        if G.nodes:
            node_attrs = set()
            for node, attrs in G.nodes(data=True):
                node_attrs.update(attrs.keys())
            if node_attrs:
                print(f"   节点属性: {list(node_attrs)}")
        
        # 边属性统计
        if G.edges:
            edge_attrs = set()
            for source, target, attrs in G.edges(data=True):
                edge_attrs.update(attrs.keys())
            if edge_attrs:
                print(f"   边属性: {list(edge_attrs)}")

def main():
    print("🚀 AI4KG NetworkX 导入演示")
    print("="*60)
    
    # 创建示例图
    print("\n📊 正在创建示例图数据...")
    graphs = create_sample_graphs()
    
    # 打印统计信息
    print_graph_statistics(graphs)
    
    # 保存到临时目录
    temp_dir = tempfile.mkdtemp(prefix="ai4kg_demo_")
    print(f"\n💾 正在保存图文件到: {temp_dir}")
    
    saved_files = save_graphs(graphs, temp_dir)
    
    # 生成导入命令
    generate_import_commands(saved_files)
    
    # 验证文件
    print("\n" + "="*60)
    print("🔍 验证生成的文件")
    print("="*60)
    
    for filepath, description in saved_files:
        print(f"\n验证 {description}:")
        print(f"python scripts/validate_graph.py --file {filepath} --verbose")
    
    print("\n" + "="*60)
    print("✅ 演示完成！")
    print("="*60)
    print(f"📁 示例文件位置: {temp_dir}")
    print("📖 使用说明:")
    print("   1. 启动 AI4KG 后端服务")
    print("   2. 创建用户账号（或使用默认的 admin/password）")
    print("   3. 运行上面的导入命令")
    print("   4. 在前端界面查看导入的图谱")
    
    print(f"\n🗑️  清理临时文件:")
    print(f"rm -rf {temp_dir}")

if __name__ == '__main__':
    main()