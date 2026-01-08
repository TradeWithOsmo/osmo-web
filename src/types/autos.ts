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
    artifact?: {
        type: 'chart' | 'other';
        title: string;
        data?: any;
    };
    attachments?: File[];
    timestamp?: number;
    feedback?: 'like' | 'dislike';
}

export interface SearchResult {
    title: string;
    url: string;
    domain: string;
    icon?: string;
}

export interface ThoughtStep {
    type: 'text' | 'browsing' | 'code';
    title: string;
    content?: string;
    results?: SearchResult[];
    codeLanguage?: string;
}
