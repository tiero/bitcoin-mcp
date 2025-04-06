// Response type for MCP tools
export interface McpResponse {
  content: Array<{
    text: string;
    type: "text";
  } | {
    type: "code";
    text: string;
    language: string;
  } | {
    type: "image";
    data: string;
    mimeType: string;
  } | {
    type: "resource";
    resource: {
      text: string;
      uri: string;
      mimeType?: string;
    } | {
      uri: string;
      blob: string;
      mimeType?: string;
    };
  }>;
  tools?: Array<{
    name: string;
    description: string;
  }>;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}

// Wallet state type
export interface WalletState {
  initialized: boolean;
  network: string;
  createdAt: number;
  lastAccessed?: number;
}
