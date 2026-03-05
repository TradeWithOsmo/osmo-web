/**
 * Cloudflare Pages Function — full reverse proxy to the Osmo backend.
 *
 * Handles both HTTP REST requests and WebSocket upgrades so the frontend
 * can use a single HTTPS/WSS origin (*.pages.dev) without mixed-content errors.
 */

const BACKEND_HTTP = 'http://76.13.219.146:8000';
const BACKEND_WS   = 'ws://76.13.219.146:8000';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathAndQuery = url.pathname + url.search;

    // Strip hop-by-hop headers that shouldn't be forwarded
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('x-forwarded-for');
    headers.delete('x-forwarded-proto');
    headers.delete('x-real-ip');

    const upgradeHeader = request.headers.get('Upgrade');
    const isWebSocket = upgradeHeader?.toLowerCase() === 'websocket';

    if (isWebSocket) {
        // WebSocket proxy — Cloudflare Workers runtime handles bidirectional streaming
        return fetch(`${BACKEND_WS}${pathAndQuery}`, { headers });
    }

    // Regular HTTP proxy
    return fetch(`${BACKEND_HTTP}${pathAndQuery}`, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    });
}
