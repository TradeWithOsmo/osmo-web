import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const buildAuthHeaders = (
    token?: string,
    walletAddress?: string,
    baseHeaders: Record<string, string> = {}
): Record<string, string> => {
    const headers: Record<string, string> = { ...baseHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (walletAddress && WALLET_REGEX.test(walletAddress)) {
        headers['X-Wallet-Address'] = walletAddress;
    }
    return headers;
};

export interface ChatRequest {
    model_id: string;
    message: string;
    session_id?: string;
    history?: { role: string; content: string }[];
    token?: string;
    wallet_address?: string;
    reasoning_effort?: string;
    tool_states?: any;
    attachments?: { name: string; type: string; data: string; size?: number }[];
    signal?: AbortSignal;
}

export interface ChatResponse {
    status: string;
    model: string;
    session_id: string;
    response: string;
    usage?: any;
    thoughts?: any[];
}

export interface ChatStreamEvent {
    type: 'meta' | 'delta' | 'thoughts' | 'thoughts_delta' | 'runtime' | 'runtime_phase' | 'done' | 'error';
    [key: string]: any;
}

export interface ChatStreamHandlers {
    onMeta?: (event: ChatStreamEvent) => void;
    onDelta?: (content: string) => void;
    onThoughts?: (thoughts: any[]) => void;
    onThoughtDelta?: (thought: string) => void;
    onRuntime?: (runtime: any) => void;
    onRuntimePhase?: (phase: any) => void;
    onDone?: (event: ChatStreamEvent) => void;
    onError?: (message: string) => void;
}

export interface PlanPreviewRequest {
    model_id?: string;
    message: string;
    history?: { role: string; content: string }[];
    token?: string;
    wallet_address?: string;
    tool_states?: any;
}

export interface PlanPreviewResponse {
    status: string;
    plan: any;
    render: {
        title: string;
        intent: string;
        steps: { id: string; label: string; reason?: string; args?: any }[];
        warnings: string[];
        blocks: string[];
    };
}

export const agentService = {
    chat: async (request: ChatRequest): Promise<ChatResponse> => {
        const { token, wallet_address, ...data } = request;
        const headers = buildAuthHeaders(token, wallet_address);
        const response = await axios.post(`${API_URL}/api/agent/chat`, data, { headers });
        return response.data;
    },

    chatStream: async (request: ChatRequest, handlers: ChatStreamHandlers = {}): Promise<void> => {
        const { token, wallet_address, ...data } = request;
        const headers = buildAuthHeaders(token, wallet_address, {
            'Content-Type': 'application/json'
        });

        const runNonStreamFallback = async () => {
            const fallbackResponse = await axios.post(`${API_URL}/api/agent/chat`, data, { headers });
            const payload = fallbackResponse.data || {};
            handlers.onMeta?.({
                type: 'meta',
                session_id: payload.session_id,
                model: payload.model || request.model_id
            } as ChatStreamEvent);
            if (Array.isArray(payload.thoughts) && payload.thoughts.length > 0) {
                handlers.onThoughts?.(payload.thoughts);
            }
            if (payload.runtime) {
                handlers.onRuntime?.(payload.runtime);
            }
            const content = typeof payload.response === 'string' ? payload.response : '';
            if (content) {
                handlers.onDelta?.(content);
            }
            handlers.onDone?.({
                type: 'done',
                content,
                usage: payload.usage || {},
                thoughts: payload.thoughts || []
            } as ChatStreamEvent);
        };

        let response: Response;
        try {
            response = await fetch(`${API_URL}/api/agent/chat/stream`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                signal: request.signal
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const isNetworkIssue = /failed to fetch|networkerror|load failed/i.test(message);
            if (isNetworkIssue) {
                await runNonStreamFallback();
                return;
            }
            throw error;
        }

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const err = await response.json();
                errorMessage = err.detail || err.message || errorMessage;
            } catch {
                // ignore
            }
            throw new Error(errorMessage);
        }

        if (!response.body) {
            await runNonStreamFallback();
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            // Normalize CRLF so SSE chunk splitting works across proxies/servers.
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

            let idx: number;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
                const chunk = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);

                const lines = chunk.split('\n');
                const dataLines = lines.filter(l => l.startsWith('data:'));
                const dataStr = dataLines.map(l => l.slice(5).trimStart()).join('\n');
                if (!dataStr) continue;

                let event: ChatStreamEvent;
                try {
                    event = JSON.parse(dataStr);
                } catch {
                    continue;
                }

                if (event.type === 'meta') handlers.onMeta?.(event);
                if (event.type === 'delta') handlers.onDelta?.(event.content || '');
                if (event.type === 'thoughts') handlers.onThoughts?.(event.thoughts || []);
                if (event.type === 'thoughts_delta') handlers.onThoughtDelta?.(event.thought || '');
                if (event.type === 'runtime') handlers.onRuntime?.(event.runtime || {});
                if (event.type === 'runtime_phase') handlers.onRuntimePhase?.(event.phase || {});
                if (event.type === 'done') {
                    handlers.onDone?.(event);
                    return;
                }
                if (event.type === 'error') {
                    handlers.onError?.(event.message || 'Unknown error');
                    return;
                }
            }
        }

        if (buffer.trim().length > 0) {
            const lines = buffer.split('\n');
            const dataLines = lines.filter(l => l.startsWith('data:'));
            const dataStr = dataLines.map(l => l.slice(5).trimStart()).join('\n');
            if (dataStr) {
                try {
                    const event: ChatStreamEvent = JSON.parse(dataStr);
                    if (event.type === 'meta') handlers.onMeta?.(event);
                    if (event.type === 'delta') handlers.onDelta?.(event.content || '');
                    if (event.type === 'thoughts') handlers.onThoughts?.(event.thoughts || []);
                    if (event.type === 'thoughts_delta') handlers.onThoughtDelta?.(event.thought || '');
                    if (event.type === 'runtime') handlers.onRuntime?.(event.runtime || {});
                    if (event.type === 'runtime_phase') handlers.onRuntimePhase?.(event.phase || {});
                    if (event.type === 'done') handlers.onDone?.(event);
                    if (event.type === 'error') handlers.onError?.(event.message || 'Unknown error');
                } catch {
                    // ignore trailing non-json fragments
                }
            }
        }
    },

    interruptSession: async (
        sessionId: string,
        token?: string,
        walletAddress?: string
    ): Promise<{ status: string; interrupted: boolean; session_id: string }> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.post(
            `${API_URL}/api/agent/chat/interrupt`,
            { session_id: sessionId },
            { headers }
        );
        return response.data;
    },

    planPreview: async (request: PlanPreviewRequest): Promise<PlanPreviewResponse> => {
        const { token, wallet_address, ...data } = request;
        const headers = buildAuthHeaders(token, wallet_address);
        const response = await axios.post(`${API_URL}/api/agent/plan/preview`, data, { headers });
        return response.data;
    },

    getModels: async (): Promise<any> => {
        const response = await axios.get(`${API_URL}/api/agent/models`);
        return response.data;
    },

    getSessions: async (token: string, walletAddress?: string): Promise<any[]> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.get(`${API_URL}/api/agent/sessions`, { headers });
        return response.data;
    },

    getHistory: async (sessionId: string, token: string, walletAddress?: string): Promise<any[]> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.get(`${API_URL}/api/agent/history/${sessionId}`, { headers });
        return response.data;
    },

    renameSession: async (sessionId: string, title: string, token: string, walletAddress?: string): Promise<any> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.patch(`${API_URL}/api/agent/session/${sessionId}`, { title }, { headers });
        return response.data;
    },

    deleteSession: async (sessionId: string, token: string, walletAddress?: string): Promise<any> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.delete(`${API_URL}/api/agent/session/${sessionId}`, { headers });
        return response.data;
    },

    // --- Workspace Methods ---
    getWorkspaces: async (token: string, walletAddress?: string): Promise<any[]> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.get(`${API_URL}/api/agent/workspaces`, { headers });
        return response.data;
    },

    createWorkspace: async (name: string, token: string, workspaceId?: string, walletAddress?: string): Promise<any> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.post(`${API_URL}/api/agent/workspaces`, { name, workspace_id: workspaceId }, { headers });
        return response.data;
    },

    updateWorkspace: async (
        workspaceId: string,
        data: { name?: string; icon?: string; is_expanded?: boolean },
        token: string,
        walletAddress?: string
    ): Promise<any> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.patch(`${API_URL}/api/agent/workspace/${workspaceId}`, data, { headers });
        return response.data;
    },

    moveSession: async (sessionId: string, workspaceId: string | null, token: string, walletAddress?: string): Promise<any> => {
        const headers = buildAuthHeaders(token, walletAddress);
        const response = await axios.patch(`${API_URL}/api/agent/session/${sessionId}/move`, { workspace_id: workspaceId }, { headers });
        return response.data;
    },

    // --- Tool Testing ---
    runTool: async (category: string, action: string, args: any, token: string, walletAddress?: string): Promise<any> => {
        const headers = buildAuthHeaders(token, walletAddress);
        // Construct endpoint dynamically: /api/tools/{category}/{action}
        // e.g. /api/tools/trade_execution/place_order
        // e.g. /api/tools/data/price
        // e.g. /api/tools/tradingview/add_indicator

        const endpoint = `/api/tools/${category}/${action}`;

        try {
            const response = await axios.post(`${API_URL}${endpoint}`, args, { headers });
            return response.data;
        } catch (error: any) {
            console.error(`runTool failed for ${category}/${action}:`, error);
            throw error.response?.data || error.message;
        }
    }
};
