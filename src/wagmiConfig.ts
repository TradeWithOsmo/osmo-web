
import { createConfig } from '@privy-io/wagmi';
import { baseSepolia } from 'viem/chains';
import { http } from 'wagmi';

export const config = createConfig({
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: http(),
    },
});

export const targetChain = baseSepolia;
