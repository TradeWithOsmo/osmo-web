const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ReferralSummary {
    userAddress: string;
    displayAddress: string;
    customCode: string;
    enteredCode: string;
    tradersReferred: number;
    rewardsEarned: number;
    claimableRewards: number;
}

export interface ReferralRow {
    address: string;
    dateJoined: string;
    totalVolume: number;
    feesPaid: number;
    yourRewards: number;
}

export interface LegacyRow {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: string;
}

interface PagedResponse<T> {
    page: number;
    limit: number;
    total: number;
    rows: T[];
}

const normalizeAddress = (userAddress?: string) => {
    const raw = String(userAddress || '').trim();
    return /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw.toLowerCase() : '0x0000000000000000000000000000000000000000';
};

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body?.detail || body?.message || 'Request failed');
    }
    return body as T;
}

export const referralService = {
    getSummary(userAddress?: string) {
        const addr = normalizeAddress(userAddress);
        return requestJson<ReferralSummary>(`${API_URL}/api/referrals/${addr}/summary`);
    },

    getReferrals(userAddress: string, page = 1, limit = 10) {
        const addr = normalizeAddress(userAddress);
        return requestJson<PagedResponse<ReferralRow>>(
            `${API_URL}/api/referrals/${addr}/referrals?page=${page}&limit=${limit}`
        );
    },

    getLegacy(userAddress: string, page = 1, limit = 10) {
        const addr = normalizeAddress(userAddress);
        return requestJson<PagedResponse<LegacyRow>>(
            `${API_URL}/api/referrals/${addr}/legacy?page=${page}&limit=${limit}`
        );
    },

    enterCode(userAddress: string, code: string) {
        const addr = normalizeAddress(userAddress);
        return requestJson<{ success: boolean; message: string }>(
            `${API_URL}/api/referrals/${addr}/enter-code`,
            { method: 'POST', body: JSON.stringify({ code }) }
        );
    },

    createCode(userAddress: string, code: string) {
        const addr = normalizeAddress(userAddress);
        return requestJson<{ success: boolean; message: string }>(
            `${API_URL}/api/referrals/${addr}/create-code`,
            { method: 'POST', body: JSON.stringify({ code }) }
        );
    },

    claimRewards(userAddress: string) {
        const addr = normalizeAddress(userAddress);
        return requestJson<{ success: boolean; claimedAmount: number; remainingClaimable: number }>(
            `${API_URL}/api/referrals/${addr}/claim`,
            { method: 'POST' }
        );
    },
};
