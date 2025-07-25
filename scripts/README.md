# AI4KG pn�e,

,�U+(�����1pn�e0 AI4KG �߄,�w

## ��

AI4KG /��<�e���1pn;��/�	�Q�pnӄlb:��������<

## /�pn<

### 1. NetworkX <
- **��{�**: `.gml`, `.graphml`, `.gexf`, `.json` (NetworkX ��<)
- **(**: �fv>�Q��BQ�v
- **y�**: /0̄����^'

### 2. �<
- **JSON**: (�pn�b<
- **CSV**: ��h��h�<
- **GEXF**: Gephi ��o�<

## ,h

### `import_networkx.py`
 NetworkX <��pn�e0 AI4KG pn�

**��y':**
- ��K����^'
- /� NetworkX ��<
- z�^' �{���
- y�'��pn
- /����

**(��:**
```bash
# �,�e
python import_networkx.py --file graph.gml --title "����1"

# �(7���
python import_networkx.py --file network.json --user admin --title ">�Q�" --description "(7s��"

# y��e
python import_networkx.py --directory ./graphs --user researcher
```

**/��p:**
- `--file`: �e���
- `--directory`: y��e�U
- `--title`: �1�
- `--description`: �1��
- `--user`: �(7(7ID	
- `--format`: :6�< (gml/graphml/gexf/json)
- `--batch-size`: y'ؤ1000	
- `--dry-run`: ��!�E�e

### `export_to_networkx.py`
 AI4KG -��pn��: NetworkX |�<

**(��:**
```bash
# ��U*�1
python export_to_networkx.py --graph-id abc123 --format gml --output my_graph.gml

# ��(7@	�1
python export_to_networkx.py --user admin --format json --output-dir ./exports
```

### `validate_graph.py`
���pn��t'�<cn'

**(��:**
```bash
# ����
python validate_graph.py --file graph.gml

# ��pn�-��1
python validate_graph.py --graph-id abc123
```

## pn �

### NetworkX 0 AI4KG  

| NetworkX ^' | AI4KG W� | � |
|---------------|------------|------|
| �� `id` | `node.id` | / �& |
| �� `label` | `node.label` | >:~ |
| �� `type` | `node.type` | ��{� |
| ��v�^' | `node.properties` | �I^' |
| � `source` | `edge.source` | ���ID |
| � `target` | `edge.target` | ���ID |
| � `weight` | `edge.weight` | �C� |
| � `label` | `edge.label` | �~ |
| �v�^' | `edge.properties` | �I^' |

### �^'��

,ꨨ��lb�^'

**��^':**
- `pos`, `position` � `x`, `y` P
- `size`, `node_size` � `size` ��'
- `color`, `node_color` � `color` ���r
- `category`, `class`, `group` � `type` ��{�

**�^':**
- `weight`, `strength` � `weight` �C�
- `relation`, `relationship` � `type` �{�
- `color`, `edge_color` � `color` ��r

## (:�

### :� 1: �ef/\Q�

```python
import networkx as nx

# �:�Q�
G = nx.Graph()
G.add_node(" 	", type="vX", affiliation="N'f", field=":hf`")
G.add_node("N�", type="vX", affiliation="�'f", field="pn�")
G.add_edge(" 	", "N�", relation="\", papers=5, weight=0.8)

# �X:GraphML<
nx.write_graphml(G, "academic_network.graphml")
```

```bash
# �e0AI4KG
python import_networkx.py --file academic_network.graphml --title "f/\Q�" --user researcher
```

### :� 2: �e>�Q�

```python
import networkx as nx

# �>�Q�
G = nx.karate_club_graph()
# ����^'
for node in G.nodes():
    G.nodes[node]['type'] = 'person'
    G.nodes[node]['community'] = G.nodes[node]['club']

# �X:GML<
nx.write_gml(G, "social_network.gml")
```

```bash
# �e0AI4KG
python import_networkx.py --file social_network.gml --title "zKS�P�Q�" --description "�x>�Q�pn�"
```

### :� 3: y��evpn

```bash
# *���>(graphs�U
mkdir graphs
cp *.gml *.graphml *.json graphs/

# y��e
python import_networkx.py --directory graphs --user data_scientist --batch-size 500
```

## '�

### '��pn

��'��pn>10��	��

1. **y**: ( `--batch-size` �p
2. **"**: n�pn�"���
3. **�X�**: ѧ�X(ŵ
4. **vL**: (�

```bash
# '��pn�e:�
python import_networkx.py --file large_graph.gml --batch-size 1000 --title "'�Q�"
```

### '���

| �' | ��p | �p | �e�� | �X( |
|--------|--------|------|----------|----------|
| � | <1K | <5K | <10s | <100MB |
| -� | 1K-10K | 5K-50K | 10s-2min | 100MB-1GB |
| '� | 10K-100K | 50K-500K | 2min-20min | 1GB-5GB |
| �'� | >100K | >500K | >20min | >5GB |

## �

### 8���㳹H

1. **��</**
   ```
   �: Unsupported file format
   �: ���iUn�//�<
   ```

2. **��ID��**
   ```
   �: Duplicate node ID
   �: ( --allow-duplicates �p�pn
   ```

3. **�X�**
   ```
   �: MemoryError
   �: � batch-size (A
   ```

4. **pn�ޥ1%**
   ```
   �: Database connection failed
   �: ��pn����ޥMn
   ```

## pn��

�eM���Lpn��

```bash
# ����<���
python validate_graph.py --file graph.gml --verbose

# ���
Graph validation results:
 File format: Valid GML
 Node count: 100
 Edge count: 250
 Node attributes: ['type', 'label', 'x', 'y']
 Edge attributes: ['weight', 'type']
�  Missing node labels: 5 nodes
�  Isolated nodes: 2 nodes
```

## Mn��

���Mn�� `import_config.json` e�nؤ�p

```json
{
  "default_user": "admin",
  "batch_size": 1000,
  "auto_detect_type": true,
  "attribute_mapping": {
    "node_size": "size",
    "node_color": "color",
    "edge_weight": "weight"
  },
  "default_node_type": "entity",
  "default_edge_type": "relationship"
}
```

## API �

,_/� API ��0v���

```python
from scripts.import_networkx import NetworkXImporter

# ��eh��
importer = NetworkXImporter(api_url="http://localhost:8000", token="your_jwt_token")

# �e�pn
result = importer.import_graph(
    file_path="graph.gml",
    title="My Graph",
    user_id="user123"
)

print(f"�e��1ID: {result['graph_id']}")
```

## ��y

1. **pn�**: �eM���	pn
2. **CP��**: n�(7	�CP��1
3. **<|�**: ЛB�NetworkXy'���Ռh�Y
4. **�**: n݇�(UTF-8
5. **'P6**: U*�1����100*��

## �//

�G��

1. ��ׇ� `logs/import.log`
2. ( `--verbose` �p�����o
3. (y�Issues-�J�
4. � [API�c](../ai4kg/backend/README.md) ����/Ƃ