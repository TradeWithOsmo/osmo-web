export interface Session {
    id: string;
    title: string;
    type?: 'chat' | 'position';
    isActive?: boolean;
    isLoading?: boolean;
    isEditing?: boolean;
}

export interface Workspace {
    id: string;
    name: string;
    isExpanded: boolean;
    sessions: Session[];
    isEditing?: boolean;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    thoughts?: (string | ThoughtStep)[];
    isThinking?: boolean;
    modelId?: string;
    artifact?: {
        type: 'chart' | 'other';
        title: string;
        data?: any;
    };
    attachments?: ChatAttachment[];
    runtimePhases?: { name: string; status?: string; detail?: string; meta?: any }[];
    timestamp?: number;
    feedback?: 'like' | 'dislike';
}

export interface ChatAttachment {
    name: string;
    type: string;
    data: string; // data URL (base64)
    size?: number;
}

export interface SearchResult {
    title: string;
    url: string;
    domain: string;
    icon?: string;
}

export interface ThoughtStep {
    type:
        | 'text'
        | 'browsing'
        | 'code'
        | 'tool'
        | 'reasoning'
        | 'summary'
        | 'warning'
        | 'info'
        | 'plan'
        | string;
    title: string;
    content?: string;
    results?: SearchResult[];
    codeLanguage?: string;
    toolName?: string;
    status?: string;
    phase?: string;
    meta?: any;
}
