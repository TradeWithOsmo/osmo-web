// Test script to verify Ostium data fetching
console.log('🧪 Testing Ostium Data Fetch...');

const testSymbols = ['EUR-USD', 'GBP-USD', 'XAU-USD', 'JPY-USD'];

async function testFetch(symbol) {
    try {
        const url = `http://localhost:8000/api/candles/${symbol}?exchange=ostium&limit=3`;
        console.log(`\n📡 Fetching: ${url}`);

        const response = await fetch(url);
        console.log(`✅ Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error(`❌ HTTP Error: ${response.status}`);
            return;
        }

        const data = await response.json();
        console.log(`📊 Received ${data.length} candles`);

        if (data.length > 0) {
            console.log('First candle:', data[0]);

            // Check timestamp format
            const timestamp = data[0].t || data[0].time || data[0].timestamp;
            console.log('Timestamp:', timestamp);
            console.log('Is milliseconds?', timestamp > 10000000000);
            console.log('Converted to seconds:', Math.floor(timestamp / 1000));
        }
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// Run tests
(async () => {
    for (const symbol of testSymbols) {
        await testFetch(symbol);
    }
    console.log('\n✅ Test completed!');
})();
