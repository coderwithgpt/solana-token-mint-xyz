import { useState, type FC } from 'react';
import { Plus, Settings, Zap, Shield, Globe, Github } from 'lucide-react';
import { CreateTokenTab } from './CreateTokenTab';
import { ManageTokenTab } from './ManageTokenTab';

type TabType = 'create' | 'manage';

export const TokenForm: FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('create');

    return (
        <div className="max-w-xl mx-auto">
            {/* Main Card */}
            <div className="bg-dark-800/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                {/* Tabs */}
                <div className="flex rounded-2xl bg-dark-700/50 p-1.5 mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${activeTab === 'create'
                            ? 'bg-gradient-to-r from-sol-purple to-sol-green text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create New
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('manage')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${activeTab === 'manage'
                            ? 'bg-gradient-to-r from-sol-blue to-sol-cyan text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Settings className="w-4 h-4" />
                            Manage Existing
                        </span>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'create' && <CreateTokenTab />}
                {activeTab === 'manage' && <ManageTokenTab />}
            </div>

            {/* Bottom Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-sol-purple/20 to-sol-green/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-sol-purple" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Fast</h3>
                    <p className="text-xs text-gray-500">Create in seconds</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-sol-green/20 to-sol-cyan/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-sol-green" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Secure</h3>
                    <p className="text-xs text-gray-500">Your keys, your tokens</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-sol-cyan/20 to-sol-blue/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-sol-cyan" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Decentralized</h3>
                    <p className="text-xs text-gray-500">IPFS metadata</p>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 space-y-3">
                <div className="flex items-center justify-center gap-4">
                    <a
                        href="https://github.com/coderwithgpt/solana-token-mint-xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <Github className="w-4 h-4" />
                        <span>Open Source</span>
                    </a>
                    <span className="text-gray-600">•</span>
                    <a
                        href="https://solana.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-sol-purple transition-colors"
                    >
                        Powered by Solana
                    </a>
                </div>
                <p className="text-xs text-gray-600">
                    solanatokenmint.xyz
                </p>
            </div>
        </div>
    );
};
