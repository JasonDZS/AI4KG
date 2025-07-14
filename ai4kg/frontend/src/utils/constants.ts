export const LAYOUTS = {
  FORCE: 'force',
  CIRCULAR: 'circular',
  RANDOM: 'random',
  HIERARCHICAL: 'hierarchical',
} as const;

export const NODE_TYPES = {
  ENTITY: 'entity',
  CONCEPT: 'concept',
  RELATION: 'relation',
} as const;

export const EDGE_TYPES = {
  RELATIONSHIP: 'relationship',
  INHERITANCE: 'inheritance',
  ASSOCIATION: 'association',
} as const;

export const DEFAULT_NODE_SIZE = 10;
export const DEFAULT_EDGE_SIZE = 2;

export const COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#ff4d4f',
  BACKGROUND: '#f0f2f5',
  WHITE: '#ffffff',
} as const;
