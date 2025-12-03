import { useState } from 'react';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import { Header } from './components/Header';
import { TokenForm } from './components/TokenForm';

type NetworkCluster = 'mainnet-beta' | 'testnet' | 'devnet';

function App() {
  const [network, setNetwork] = useState<NetworkCluster>('devnet');

  return (
    <WalletContextProvider network={network}>
      <div className="min-h-screen relative">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sol-purple/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sol-green/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sol-cyan/5 rounded-full blur-3xl" />
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <Header network={network} onNetworkChange={setNetwork} />

        <main className="relative pt-20 sm:pt-28 pb-8 sm:pb-16 px-3 sm:px-4">
          {/* Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-700/50 border border-white/5 mb-3 sm:mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-sol-green animate-pulse" />
              <span className="text-xs text-gray-400">{network}</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
              <span className="bg-gradient-to-r from-white via-sol-purple to-sol-green bg-clip-text text-transparent">
                Solana Token Mint
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Free &amp; Open Source SPL Token Creator
            </p>
          </div>

          <TokenForm />
        </main>
      </div>
    </WalletContextProvider>
  );
}

export default App;
