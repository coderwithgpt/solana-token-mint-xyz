import { useMemo, type FC, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

type NetworkCluster = 'mainnet-beta' | 'testnet' | 'devnet';

interface Props {
    children: ReactNode;
    network: NetworkCluster;
}

export const WalletContextProvider: FC<Props> = ({ children, network }) => {
    const endpoint = useMemo(() => {
        if (network === 'mainnet-beta') {
            // Use a better RPC for mainnet
            return 'https://api.mainnet-beta.solana.com';
        }
        return clusterApiUrl(network);
    }, [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

