export interface UIState {
  sidebarCollapsed: boolean;
  selectedTool: string | null;
  loading: boolean;
  error: string | null;
}

export interface PanelState {
  nodePanel: boolean;
  edgePanel: boolean;
  propertyPanel: boolean;
}

export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}
