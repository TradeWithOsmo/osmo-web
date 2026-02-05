
import { createConfig } from '@privy-io/wagmi';
import { arbitrumSepolia } from 'viem/chains';
import { http } from 'wagmi';

export const config = createConfig({
    chains: [arbitrumSepolia],
    transports: {
        [arbitrumSepolia.id]: http(),
    },
});
