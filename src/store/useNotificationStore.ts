import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UINotification {
  id: string;
  userAddress?: string;
  type: string;
  rawType: string;
  message: string;
  timestamp: number;
  time: string;
  ctaText?: string;
  ctaLink?: string;
  icon?: string;
  image?: string;
  symbol?: string;
}

interface NotificationState {
  notifications: UINotification[];
  ws: WebSocket | null;
  connectedWallet: string | null;
  browserPushEnabled: boolean;
  connect: (walletAddress: string) => void;
  disconnect: () => void;
  enableBrowserPush: () => Promise<boolean>;
  setBrowserPushEnabled: (enabled: boolean) => void;
  removeNotification: (id: string) => void;
  clearAll: (walletAddress?: string) => void;
  pushNotification: (notification: UINotification) => void;
}

const MAX_NOTIFICATIONS = 100;

const formatAgo = (timestamp: number): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getApiBase = (): string => {
  return (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
};

const toWsUrl = (walletAddress: string): string => {
  const apiBase = getApiBase();
  try {
    const api = new URL(apiBase);
    api.protocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
    api.pathname = '/';
    api.search = '';
    api.hash = '';
    return new URL(`/ws/notifications/${walletAddress}`, api).toString();
  } catch {
    return apiBase.replace(/^http/, 'ws') + `/ws/notifications/${walletAddress}`;
  }
};

const truncateAddress = (value?: string): string => {
  const addr = String(value || '');
  if (addr.length < 10) return addr || 'User';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const parseEventToNotification = (event: any): UINotification | null => {
  const rawType = String(event?.type || '').toLowerCase();
  if (!rawType || rawType === 'initial_state' || rawType === 'position_update') return null;

  const meta = event?.meta || {};
  const data = event?.data || {};
  const nowTs = Date.now();
  const ts = Number.isFinite(Date.parse(String(event?.timestamp || '')))
    ? Date.parse(String(event?.timestamp))
    : nowTs;

  const symbol = String(meta?.symbol || data?.symbol || '').toUpperCase() || undefined;
  const eventId =
    String(
      data?.order_id ||
      data?.setup_id ||
      data?.tx_hash ||
      `${rawType}:${symbol || 'GEN'}:${Math.floor(ts / 1000)}`
    );

  const base: UINotification = {
    id: eventId,
    userAddress: String(event?.address || '').toLowerCase() || undefined,
    type: 'Event',
    rawType,
    message: 'New notification',
    timestamp: ts,
    time: formatAgo(ts),
    symbol,
  };

  if (rawType === 'order_placed') {
    const side = String(data?.side || meta?.side || '').toUpperCase();
    const lev = Number(data?.leverage || meta?.leverage || 0);
    const amount = Number(data?.amount_usd || meta?.amount_usd || 0);
    return {
      ...base,
      type: 'Order Placement',
      message: `${side || 'Order'} ${symbol || ''} placed${amount > 0 ? ` for $${amount.toFixed(2)}` : ''}${lev > 0 ? ` (${lev}x)` : ''}.`.trim(),
      ctaText: 'View Orders',
      ctaLink: '/portfolio?tab=Orders',
    };
  }

  if (rawType === 'trade_filled') {
    const side = String(meta?.side || '').toUpperCase();
    const px = Number(meta?.entry_price || meta?.close_price || 0);
    return {
      ...base,
      type: 'Order Filled',
      message: `${side || 'Order'} ${symbol || ''} filled${px > 0 ? ` at ${px.toLocaleString()}` : ''}.`.trim(),
      ctaText: 'View Position',
      ctaLink: '/portfolio?tab=Positions',
    };
  }

  if (rawType === 'trade_closed') {
    const pnl = Number(meta?.realized_pnl || 0);
    return {
      ...base,
      type: 'Position Closed',
      message: `${symbol || 'Position'} closed${Number.isFinite(pnl) ? ` (PnL ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDC)` : ''}.`,
      ctaText: 'View History',
      ctaLink: '/portfolio?tab=History',
    };
  }

  if (rawType === 'liquidation') {
    return {
      ...base,
      type: 'Liquidation',
      message: `${symbol || 'Position'} has been liquidated.`,
      ctaText: 'View History',
      ctaLink: '/portfolio?tab=History',
    };
  }

  if (rawType === 'deposit_confirmed' || rawType === 'withdrawal_confirmed') {
    const amount = Number(meta?.amount || 0);
    const asset = String(meta?.asset || 'USDC');
    const isDeposit = rawType === 'deposit_confirmed';
    return {
      ...base,
      type: isDeposit ? 'Deposit' : 'Withdraw',
      message: `${isDeposit ? 'Deposit' : 'Withdrawal'} ${amount > 0 ? `${amount.toFixed(2)} ${asset}` : asset} confirmed.`,
      ctaText: 'View Funding',
      ctaLink: '/portfolio?tab=History',
    };
  }

  if (rawType === 'gp_triggered' || rawType === 'gl_triggered') {
    const isGp = rawType === 'gp_triggered';
    return {
      ...base,
      type: isGp ? 'Validation Triggered' : 'Invalidation Triggered',
      message: String(data?.message || `${isGp ? 'GP' : 'GL'} triggered on ${symbol || 'market'}`),
      ctaText: 'View Position',
      ctaLink: '/portfolio?tab=Positions',
    };
  }

  if (rawType === 'ai_decision_triggered') {
    return {
      ...base,
      type: 'AI Follow-up',
      message: `AI follow-up decision generated for ${symbol || 'market'}.`,
      ctaText: 'View',
      ctaLink: '/autos',
    };
  }

  if (rawType === 'chat_reply') {
    const fromAddr = String(data?.from_address || '');
    const text = String(data?.message || 'Replied to your message');
    const firstImage = Array.isArray(data?.images) && data.images.length > 0 ? String(data.images[0]) : undefined;
    return {
      ...base,
      type: truncateAddress(fromAddr),
      message: text,
      ctaText: 'Reply',
      ctaLink: '#',
      icon: fromAddr ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromAddr}` : undefined,
      image: firstImage,
      symbol,
    };
  }

  if (rawType === 'referral_code_entered') {
    const code = String(data?.code || '').toUpperCase();
    return {
      ...base,
      type: 'Referral',
      message: code ? `Referral code ${code} saved.` : 'Referral code saved.',
      ctaText: 'View Refer',
      ctaLink: '/refer',
    };
  }

  if (rawType === 'referral_code_created') {
    const code = String(data?.code || '').toUpperCase();
    return {
      ...base,
      type: 'Referral',
      message: code ? `Referral code ${code} created.` : 'Referral code created.',
      ctaText: 'View Refer',
      ctaLink: '/refer',
    };
  }

  if (rawType === 'referral_reward_claimed') {
    const amount = Number(data?.claimed_amount || 0);
    const asset = String(data?.asset || 'USDC');
    return {
      ...base,
      type: 'Referral Reward',
      message: amount > 0
        ? `Claimed ${amount.toFixed(2)} ${asset} referral rewards.`
        : 'Referral rewards claimed.',
      ctaText: 'View Refer',
      ctaLink: '/refer',
    };
  }

  return {
    ...base,
    type: rawType.replace(/_/g, ' '),
    message: String(data?.message || `New event: ${rawType}`),
  };
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      ws: null,
      connectedWallet: null,
      browserPushEnabled: false,

      pushNotification: (notification) => {
        const state = get();
        if (
          state.browserPushEnabled &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            const n = new Notification(notification.type, {
              body: notification.message,
              icon: notification.icon,
              tag: notification.id,
            });
            n.onclick = () => {
              if (notification.ctaLink && notification.ctaLink !== '#') {
                window.location.href = notification.ctaLink;
              } else {
                window.focus();
              }
              n.close();
            };
          } catch {
            // no-op
          }
        }

        set((prev) => {
          if (prev.notifications.some((n) => n.id === notification.id)) return prev;
          return {
            notifications: [notification, ...prev.notifications].slice(0, MAX_NOTIFICATIONS),
          };
        });
      },

      connect: (walletAddress: string) => {
        const wallet = String(walletAddress || '').toLowerCase().trim();
        if (!wallet) return;

        const current = get();
        if (current.connectedWallet === wallet && current.ws?.readyState === WebSocket.OPEN) return;

        current.disconnect();

        const socket = new WebSocket(toWsUrl(wallet));
        socket.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            const notification = parseEventToNotification(payload);
            if (notification) get().pushNotification(notification);
          } catch {
            // no-op
          }
        };

        socket.onclose = () => {
          set((state) => ({ ...state, ws: null }));
        };

        socket.onerror = () => {
          try { socket.close(); } catch { /* noop */ }
        };

        set({ ws: socket, connectedWallet: wallet });
      },

      disconnect: () => {
        const ws = get().ws;
        if (ws) {
          ws.onmessage = null;
          ws.onclose = null;
          ws.onerror = null;
          try { ws.close(); } catch { /* noop */ }
        }
        set({ ws: null, connectedWallet: null });
      },

      enableBrowserPush: async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
          set({ browserPushEnabled: false });
          return false;
        }
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        set({ browserPushEnabled: granted });
        return granted;
      },

      setBrowserPushEnabled: (enabled: boolean) => {
        set({ browserPushEnabled: !!enabled });
      },

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: (walletAddress?: string) => set((state) => {
        const wallet = String(walletAddress || '').toLowerCase().trim();
        if (!wallet) return { notifications: [] };
        return {
          notifications: state.notifications.filter((n) => (n.userAddress || '').toLowerCase() !== wallet),
        };
      }),
    }),
    {
      name: 'osmo-notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        browserPushEnabled: state.browserPushEnabled,
      }),
    }
  )
);
