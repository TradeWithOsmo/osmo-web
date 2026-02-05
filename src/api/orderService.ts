const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PlaceOrderParams {
    user_address: string;
    symbol: string;
    side: 'buy' | 'sell';
    order_type: 'market' | 'limit' | 'stop_limit';
    amount_usd: number;
    leverage?: number;
    price?: number;
    stop_price?: number;
    exchange?: string;
    reduce_only?: boolean;
    post_only?: boolean;
    time_in_force?: string; // 'GTC' | 'IOC' | 'FOK'
    trigger_condition?: 'ABOVE' | 'BELOW';
}

export interface OrderResult {
    success: boolean;
    order_id: string;
    exchange: string;
    status: string;
    message: string;
}

export interface PositionData {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entry_price: number;
    mark_price?: number;
    unrealized_pnl: number;
    unrealized_pnl_percent: number;
    liquidation_price?: number | null;
    leverage: number;
    margin_used?: number;
    exchange: string;
    tp?: string;
    sl?: string;
}

export interface OrderData {
    id: string;
    exchange: string;
    symbol: string;
    side: string;
    order_type: string;
    size: number;
    notional_usd: number;
    price?: number;
    reduce_only?: boolean;
    stop_price?: number;
    leverage: number;
    status: string;
    filled_size: number;
    avg_fill_price?: number;
    exchange_order_id?: string;
    confirmed_txn_hash?: string;
    created_at?: string;
    filled_at?: string;
}

export interface AccountSummary {
    account_value: number;
    total_margin_used: number;
    free_collateral: number;
    margin_usage: number;
    leverage: number;
}

export const orderService = {
    async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
        // console.warn('Deprecation Warning: ...'); // Re-enabled for Simulation
        const response = await fetch(`${API_URL}/api/orders/place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to place order');
        }

        return response.json();
    },

    async cancelOrder(order_id: string, user_address: string): Promise<any> {
        const response = await fetch(`${API_URL}/api/orders/cancel/${order_id}?user_address=${user_address}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to cancel order');
        }

        return response.json();
    },

    async getOrders(user_address: string, status?: string): Promise<{ success: boolean, orders: OrderData[] }> {
        const url = new URL(`${API_URL}/api/orders/history`);
        url.searchParams.append('user_address', user_address);
        if (status) url.searchParams.append('status', status);
        // Cache busting
        url.searchParams.append('_t', Date.now().toString());

        const response = await fetch(url.toString(), {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        return response.json();
    },

    async getPositions(user_address: string): Promise<{ success: boolean, positions: PositionData[], summary: AccountSummary }> {
        const url = new URL(`${API_URL}/api/orders/positions`);
        url.searchParams.append('user_address', user_address);
        url.searchParams.append('_t', Date.now().toString());

        const response = await fetch(url.toString(), {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch positions');
        }

        return response.json();
    },

    async updateTPSL(user_address: string, symbol: string, tp?: string, sl?: string): Promise<any> {
        const response = await fetch(`${API_URL}/api/orders/positions/tpsl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_address, symbol, tp, sl })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update TP/SL');
        }

        return response.json();
    },

    async reportOnchainOrder(params: {
        user_address: string;
        symbol: string;
        side: 'buy' | 'sell';
        order_type: 'market' | 'limit' | 'stop_limit';
        amount_usd: number;
        leverage: number;
        tx_hash: string;
        price?: number;
        stop_price?: number;
        exchange?: string;
    }): Promise<any> {
        const response = await fetch(`${API_URL}/api/orders/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to report order');
        }

        return response.json();
    },

    // --- Trade Actions ---
    async closePosition(user_address: string, symbol: string, price?: number, size_pct: number = 1.0): Promise<any> {
        const response = await fetch(`${API_URL}/api/orders/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_address, symbol, price, size_pct })
        });
        if (!response.ok) throw new Error('Failed to close position');
        return response.json();
    },

    async closeAllPositions(user_address: string): Promise<any> {
        const response = await fetch(`${API_URL}/api/orders/close/all?user_address=${user_address}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to close all positions');
        return response.json();
    },

    async reversePosition(user_address: string, symbol: string): Promise<any> {
        const response = await fetch(`${API_URL}/api/orders/reverse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_address, symbol })
        });
        if (!response.ok) throw new Error('Failed to reverse position');
        return response.json();
    }
};
