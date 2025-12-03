import { useState, useRef, useEffect, type FC, type ReactNode } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type NetworkCluster = 'mainnet-beta' | 'testnet' | 'devnet';

interface HeaderProps {
    network: NetworkCluster;
    onNetworkChange: (network: NetworkCluster) => void;
}

const networks: { value: NetworkCluster; label: string; icon: ReactNode; color: string }[] = [
    {
        value: 'devnet',
        label: 'Devnet',
        color: 'text-amber-400',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        value: 'testnet',
        label: 'Testnet',
        color: 'text-sky-400',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
    },
    {
        value: 'mainnet-beta',
        label: 'Mainnet',
        color: 'text-sol-green',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
    },
];

export const Header: FC<HeaderProps> = ({ network, onNetworkChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedNetwork = networks.find(n => n.value === network) || networks[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(27, 3, 61, 0.85)', borderColor: 'rgba(27, 3, 61, 0.5)' }}>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    <img src="/logo.png" alt="Solana Token Mint" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl" />
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-sol-purple via-sol-green to-sol-cyan bg-clip-text text-transparent">
                            Solana Token Mint
                        </h1>
                        <p className="text-xs text-gray-500">Create SPL Tokens</p>
                    </div>
                    <h1 className="sm:hidden text-base font-bold bg-gradient-to-r from-sol-purple via-sol-green to-sol-cyan bg-clip-text text-transparent">
                        SolMint
                    </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Network Selector */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-white cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-sol-purple/50"
                            style={{ backgroundColor: 'rgba(27, 3, 61, 0.6)', border: '1px solid rgba(153, 69, 255, 0.2)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(153, 69, 255, 0.4)';
                                e.currentTarget.style.backgroundColor = 'rgba(27, 3, 61, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(153, 69, 255, 0.2)';
                                e.currentTarget.style.backgroundColor = 'rgba(27, 3, 61, 0.6)';
                            }}
                        >
                            <span className={selectedNetwork.color}>{selectedNetwork.icon}</span>
                            <span className="hidden sm:inline">{selectedNetwork.label}</span>
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isOpen && (
                            <div className="absolute top-full right-0 mt-2 w-44 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50" style={{ backgroundColor: 'rgba(27, 3, 61, 0.95)', border: '1px solid rgba(153, 69, 255, 0.3)' }}>
                                {networks.map((net) => (
                                    <button
                                        key={net.value}
                                        onClick={() => {
                                            onNetworkChange(net.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${network === net.value
                                            ? 'text-white'
                                            : 'text-gray-300'
                                            }`}
                                        style={network === net.value
                                            ? { backgroundColor: 'rgba(153, 69, 255, 0.15)' }
                                            : {}
                                        }
                                        onMouseEnter={(e) => {
                                            if (network !== net.value) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (network !== net.value) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <span className={net.color}>{net.icon}</span>
                                        <span>{net.label}</span>
                                        {network === net.value && (
                                            <svg className="w-4 h-4 ml-auto text-sol-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Wallet Button */}
                    <WalletMultiButton />
                </div>
            </div>
        </header>
    );
};
