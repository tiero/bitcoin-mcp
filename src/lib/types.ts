// Response type for MCP tools
export interface McpResponse {
  content: Array<{
    text: string;
    type: "text";
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
