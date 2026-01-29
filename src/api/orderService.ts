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
}

export interface OrderResult {
    success: boolean;
    order_id: string;
    exchange: string;
    status: string;
    message: string;
}

export interface PositionData {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entry_price: number;
    mark_price?: number;
    unrealized_pnl: number;
    liquidation_price?: number | null;
    leverage: number;
    margin_used?: number;
    exchange: string;
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
    stop_price?: number;
    leverage: number;
    status: string;
    filled_size: number;
    avg_fill_price?: number;
    exchange_order_id?: string;
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

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        return response.json();
    },

    async getPositions(user_address: string): Promise<{ success: boolean, positions: PositionData[], summary: AccountSummary }> {
        const response = await fetch(
            `${API_URL}/api/orders/positions?user_address=${user_address}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch positions');
        }

        return response.json();
    }
};
