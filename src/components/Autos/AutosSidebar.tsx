import React, { useState } from 'react';
import styles from './Autos.module.css';
import type { Workspace, Session } from '../../types/autos';
import sidebarIcon from '../../assets/Icons/Sidebar.png';

interface AutosSidebarProps {
    activeSessionId: string;
    onSessionChange: (id: string) => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    workspaces: Workspace[];
    setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
    inboxSessions: Session[];
    setInboxSessions: React.Dispatch<React.SetStateAction<Session[]>>;
    forceMobileMode?: boolean;
    hideToggle?: boolean;
}

interface MenuState {
    visible: boolean;
    type: 'workspace' | 'session' | null;
    targetId: string | null;
    parentId?: string | null;
    x: number;
    y: number;
}

interface DragItem {
    type: 'session';
    data: Session;
    sourceId: string;
}

const AutosSidebar: React.FC<AutosSidebarProps> = ({
    activeSessionId,
    onSessionChange,
    isMinimized,
    onToggleMinimize,
    workspaces,
    setWorkspaces,
    inboxSessions,
    setInboxSessions,
    forceMobileMode,
    hideToggle = false
}) => {
    // UI State
    const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
    const [menu, setMenu] = useState<MenuState>({ visible: false, type: null, targetId: null, x: 0, y: 0 });
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

    // Close menu on outside click
    React.useEffect(() => {
        const handleClick = () => setMenu({ ...menu, visible: false });
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [menu]);

    // Data Handlers
    // ... rest of the file ...

    // We need to apply the class in render.
    // I can't see the render return here in the context, but I know I need to update it.
    // I'll make a separate replacement call for the render part if needed, or include everything?
    // The previous view_file gave me the full content.
    // I will split this into two calls or one large one, but context limits might be hit.
    // I'll do the props update first.


    // Data Handlers
    const toggleWorkspace = (workspaceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setWorkspaces(prev => prev.map(ws =>
            ws.id === workspaceId ? { ...ws, isExpanded: !ws.isExpanded } : ws
        ));
    };

    const handleRenameWorkspace = (id: string, newName: string) => {
        setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, name: newName } : ws));
    };

    const handleNameSubmit = (id: string) => {
        setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, isEditing: false, name: ws.name.trim() || 'Workspace' } : ws));
    };

    const handleRenameSession = (parentId: string, sessionId: string, newTitle: string) => {
        if (parentId === 'inbox') {
            setInboxSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === parentId ? {
                ...ws, sessions: ws.sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
            } : ws));
        }
    };

    const handleSessionNameSubmit = (parentId: string, sessionId: string) => {
        if (parentId === 'inbox') {
            setInboxSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isEditing: false, title: s.title.trim() || 'New Chat' } : s));
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === parentId ? {
                ...ws, sessions: ws.sessions.map(s => s.id === sessionId ? { ...s, isEditing: false, title: s.title.trim() || 'New Chat' } : s)
            } : ws));
        }
    };

    // Menu Actions
    const handleAddWorkspace = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newWorkspace: Workspace = {
            id: `ws-${Date.now()}`,
            name: '',
            isExpanded: true,
            sessions: [],
            isEditing: true
        };
        setWorkspaces([...workspaces, newWorkspace]);
    };

    const handleAddSession = (workspaceId: string) => {
        if (workspaceId === 'inbox') {
            const newSession: Session = { id: `inbox-${Date.now()}`, title: 'New Chat', type: 'chat', isEditing: false };
            setInboxSessions([newSession, ...inboxSessions]);
            onSessionChange(newSession.id); // Auto-switch to new session
        } else {
            const newSession: Session = { id: `s-${Date.now()}`, title: 'New Chat', type: 'chat', isEditing: false };
            setWorkspaces(prev => prev.map(ws => ws.id === workspaceId ? {
                ...ws, isExpanded: true, sessions: [newSession, ...ws.sessions]
            } : ws));
            onSessionChange(newSession.id); // Valid if onSessionChange is available in scope (it is prop)
        }
    };

    const handleAddPosition = (workspaceId: string) => {
        const newPosition: Session = {
            id: `pos-${Date.now()}`,
            title: 'Trade Journal',
            type: 'position',
            isEditing: false
        };

        if (workspaceId === 'inbox') {
            setInboxSessions([newPosition, ...inboxSessions]);
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === workspaceId ? {
                ...ws, isExpanded: true, sessions: [newPosition, ...ws.sessions]
            } : ws));
        }

        onSessionChange(newPosition.id);
    };

    const handleDelete = (type: 'workspace' | 'session', id: string, parentId?: string) => {
        if (type === 'workspace') {
            setWorkspaces(prev => prev.filter(ws => ws.id !== id));
        } else if (type === 'session') {
            if (parentId === 'inbox') {
                setInboxSessions(prev => prev.filter(s => s.id !== id));
            } else {
                setWorkspaces(prev => prev.map(ws => ws.id === parentId ? {
                    ...ws, sessions: ws.sessions.filter(s => s.id !== id)
                } : ws));
            }
        }
    };

    const handleMenuClick = (e: React.MouseEvent, type: 'workspace' | 'session', targetId: string, parentId?: string) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        // Calculate position relative to sidebar or viewport? Fixed to viewport is safer for overflow.
        // Simple relative adjust:
        setMenu({
            visible: true,
            type,
            targetId,
            parentId,
            x: rect.right - 180, // Align right edge of menu (approx width 160px) with right edge of button
            y: rect.bottom + 4 // Position below the button
        });
    };

    // Drag & Drop
    const onDragStart = (e: React.DragEvent, session: Session, sourceId: string) => {
        setDraggedItem({ type: 'session', data: session, sourceId });
        e.dataTransfer.effectAllowed = 'move';
        // Add style for dragging
        (e.target as HTMLElement).classList.add(styles.isDragging);
    };

    const onDragEnd = (e: React.DragEvent) => {
        setDraggedItem(null);
        (e.target as HTMLElement).classList.remove(styles.isDragging);
        document.querySelectorAll(`.${styles.dropTarget}`).forEach(el => el.classList.remove(styles.dropTarget));
    };

    const onDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault(); // Allow drop
        if (draggedItem && draggedItem.sourceId !== targetId) {
            e.dataTransfer.dropEffect = 'move';
            (e.currentTarget as HTMLElement).classList.add(styles.dropTarget);
        }
    };

    const onDragLeave = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove(styles.dropTarget);
    };

    const onDrop = (e: React.DragEvent, targetId: string) => { // targetId is 'inbox' or workspaceId
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove(styles.dropTarget);

        if (!draggedItem) return;

        // Remove from source
        if (draggedItem.sourceId === 'inbox') {
            setInboxSessions(prev => prev.filter(s => s.id !== draggedItem.data.id));
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === draggedItem.sourceId ? {
                ...ws, sessions: ws.sessions.filter(s => s.id !== draggedItem.data.id)
            } : ws));
        }

        // Add to target
        if (targetId === 'inbox') {
            setInboxSessions(prev => [draggedItem.data, ...prev]);
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === targetId ? {
                ...ws, isExpanded: true, sessions: [draggedItem.data, ...ws.sessions]
            } : ws));
        }
    };

    return (
        <div className={`${styles.sidebar} ${isMinimized ? styles.sidebarMinimized : ''} ${forceMobileMode ? styles.sidebarMobile : ''}`}>

            {/* Context Menu Render */}
            {menu.visible && (
                <div
                    className={styles.dropdownMenu}
                    style={{ top: menu.y, left: menu.x, position: 'fixed' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {menu.type === 'workspace' && (
                        <>
                            <div className={styles.dropdownItem} onClick={() => { setMenu({ ...menu, visible: false }); handleAddSession(menu.targetId!); }}>
                                <span>+</span>
                                <span>New Chat Session</span>
                            </div>
                            <div className={styles.dropdownItem} onClick={() => { setMenu({ ...menu, visible: false }); handleAddPosition(menu.targetId!); }}>
                                <span>⌖</span>
                                <span>Trade Journal</span>
                            </div>
                            <div className={styles.dropdownItem} onClick={() => {
                                setMenu({ ...menu, visible: false });
                                setWorkspaces(prev => prev.map(ws => ws.id === menu.targetId ? { ...ws, isEditing: true } : ws));
                            }}>
                                <span>✎</span>
                                <span>Rename</span>
                            </div>
                            <div className={`${styles.dropdownItem} ${styles.delete}`} onClick={() => { setMenu({ ...menu, visible: false }); handleDelete('workspace', menu.targetId!); }}>
                                <span>🗑</span>
                                <span>Delete Workspace</span>
                            </div>
                        </>
                    )}
                    {menu.type === 'session' && (
                        <>
                            <div className={styles.dropdownItem} onClick={() => {
                                setMenu({ ...menu, visible: false });
                                if (menu.parentId === 'inbox') {
                                    setInboxSessions(prev => prev.map(s => s.id === menu.targetId ? { ...s, isEditing: true } : s));
                                } else {
                                    setWorkspaces(prev => prev.map(ws => ws.id === menu.parentId ? {
                                        ...ws, sessions: ws.sessions.map(s => s.id === menu.targetId ? { ...s, isEditing: true } : s)
                                    } : ws));
                                }
                            }}>
                                <span>✎</span>
                                <span>Rename</span>
                            </div>
                            <div className={`${styles.dropdownItem} ${styles.delete}`} onClick={() => { setMenu({ ...menu, visible: false }); handleDelete('session', menu.targetId!, menu.parentId!); }}>
                                <span>🗑</span>
                                <span>Delete Session</span>
                            </div>
                        </>
                    )
                    }
                </div >
            )}

            {/* Toggle Button */}
            {!hideToggle && (
                <button
                    className={styles.toggleButton}
                    onClick={onToggleMinimize}
                    aria-label={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
                >
                    <img src={sidebarIcon} alt="Toggle Sidebar" className={styles.toggleIcon} />
                </button>
            )}

            {!isMinimized && (
                <>
                    {/* Inbox Section */}
                    <div className={styles.sidebarSectionTitle}>
                        <span>Inbox</span>
                    </div>

                    <button className={styles.startConversationBtn} onClick={() => handleAddSession('inbox')}>
                        <span className={styles.icon}>+</span>
                        {!isMinimized && <span>New Chat</span>}
                    </button>

                    {/* Scrollable Area */}
                    <div className={styles.sidebarScrollable}>
                        {/* Inbox Session List (Recent) */}
                        {!isMinimized && inboxSessions.length > 0 && (
                            <div
                                className={styles.workspaceSection}
                                style={{ marginBottom: '16px' }}
                                onDragOver={(e) => onDragOver(e, 'inbox')}
                                onDragLeave={onDragLeave}
                                onDrop={(e) => onDrop(e, 'inbox')}
                            >
                                <div className={styles.sectionHeader}>
                                    <span>Recent</span>
                                </div>
                                <div className={styles.workspaceList}>
                                    {inboxSessions.map(session => (
                                        <div
                                            key={session.id}
                                            className={`${styles.workspaceItem} ${activeSessionId === session.id ? styles.activeItem : ''}`}
                                            onClick={() => !session.isEditing && onSessionChange(session.id)}
                                            draggable="true"
                                            onDragStart={(e) => onDragStart(e, session, 'inbox')}
                                            onDragEnd={onDragEnd}
                                        >
                                            {session.isEditing ? (
                                                <input
                                                    autoFocus
                                                    className={styles.workspaceInput}
                                                    style={{ width: '100%', fontSize: '13px' }}
                                                    value={session.title}
                                                    onChange={(e) => handleRenameSession('inbox', session.id, e.target.value)}
                                                    onBlur={() => handleSessionNameSubmit('inbox', session.id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSessionNameSubmit('inbox', session.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <>
                                                    {session.type === 'position' && <span className={styles.positionIcon}>⌖</span>}
                                                    <span className={styles.sessionTitle}>{session.title}</span>

                                                    <span
                                                        className={styles.optionsBtn}
                                                        onClick={(e) => handleMenuClick(e, 'session', session.id, 'inbox')}
                                                    >
                                                        ...
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Workspaces Section */}
                        <div className={styles.workspaceSection}>
                            <div className={styles.sectionHeader}>
                                <span>Workspaces</span>
                                {!isMinimized && (
                                    <span
                                        className={styles.plusIcon}
                                        onClick={handleAddWorkspace}
                                        title="Create New Workspace"
                                    >
                                        +
                                    </span>
                                )}
                            </div>

                            {!isMinimized && workspaces.map(workspace => (
                                <div
                                    key={workspace.id}
                                    className={styles.workspaceGroup}
                                    onDragOver={(e) => onDragOver(e, workspace.id)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, workspace.id)}
                                >
                                    <div className={styles.workspaceHeader}>
                                        <div
                                            className={styles.headerTitleGroup}
                                            onClick={(e) => !workspace.isEditing && toggleWorkspace(workspace.id, e)}
                                        >
                                            <span className={`${styles.arrowIcon} ${workspace.isExpanded ? styles.expanded : ''}`}>›</span>
                                            {workspace.isEditing ? (
                                                <input
                                                    autoFocus
                                                    className={styles.workspaceInput}
                                                    value={workspace.name}
                                                    onChange={(e) => handleRenameWorkspace(workspace.id, e.target.value)}
                                                    onBlur={() => handleNameSubmit(workspace.id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit(workspace.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span>{workspace.name}</span>
                                            )}
                                        </div>
                                        {/* Workspace Menu Trigger (+) */}
                                        <span
                                            className={styles.plusIcon}
                                            onClick={(e) => handleMenuClick(e, 'workspace', workspace.id)}
                                        >
                                            +
                                        </span>
                                    </div>

                                    {workspace.isExpanded && (
                                        <div className={styles.workspaceList}>
                                            {workspace.sessions.map(session => (
                                                <div
                                                    key={session.id}
                                                    className={`${styles.workspaceItem} ${activeSessionId === session.id ? styles.activeItem : ''}`}
                                                    onClick={() => !session.isEditing && onSessionChange(session.id)}
                                                    draggable="true"
                                                    onDragStart={(e) => onDragStart(e, session, workspace.id)}
                                                    onDragEnd={onDragEnd}
                                                >
                                                    {session.isEditing ? (
                                                        <input
                                                            autoFocus
                                                            className={styles.workspaceInput}
                                                            style={{ width: '100%', fontSize: '13px', padding: '0' }}
                                                            value={session.title}
                                                            onChange={(e) => handleRenameSession(workspace.id, session.id, e.target.value)}
                                                            onBlur={() => handleSessionNameSubmit(workspace.id, session.id)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSessionNameSubmit(workspace.id, session.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <>
                                                            {session.type === 'position' && <span className={styles.positionIcon}>⌖</span>}
                                                            <span className={styles.sessionTitle}>{session.title}</span>

                                                            {/* Session Menu Trigger (...) */}
                                                            <span
                                                                className={styles.optionsBtn}
                                                                onClick={(e) => handleMenuClick(e, 'session', session.id, workspace.id)}
                                                            >
                                                                ...
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Dummy Items Logic for v1-web only for demonstration */}
                                            {workspace.name === 'v1-web' && (
                                                <>
                                                    {showAllWorkspaces && Array.from({ length: 70 }).map((_, index) => (
                                                        <div key={`dummy-${index}`} className={styles.workspaceItem}>
                                                            <span>Workspace Session {index + 1}</span>
                                                        </div>
                                                    ))}

                                                    <div
                                                        className={styles.workspaceItem}
                                                        style={{ color: '#3A2530' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowAllWorkspaces(!showAllWorkspaces);
                                                        }}
                                                    >
                                                        <span>{showAllWorkspaces ? 'Show less' : 'See all (73)'}</span>
                                                    </div>
                                                </>
                                            )}

                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AutosSidebar;
