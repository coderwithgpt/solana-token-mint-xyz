import { useState, useCallback, useEffect, type FC } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { Pencil, Lock, Key, ChevronDown, Link2, Coins, Snowflake, AlertTriangle, Check, ExternalLink, User } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { uploadFileToPinata, uploadJsonToPinata, buildTokenMetadata } from '../utils/ipfs';
import { updateTokenMetadata, revokeAuthorities, getMetadataInfo, type MetadataInfo } from '../utils/solana';

type ManageMode = 'metadata' | 'revoke';

interface MintAuthorities {
    mintAuthority: string | null;
    freezeAuthority: string | null;
    decimals: number;
    supply: string;
}

interface MetadataForm {
    mintAddress: string;
    name: string;
    symbol: string;
    description: string;
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
}

interface RevokeForm {
    mintAddress: string;
    revokeMint: boolean;
    revokeFreeze: boolean;
}

const initialMetadataForm: MetadataForm = {
    mintAddress: '',
    name: '',
    symbol: '',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
};

const initialRevokeForm: RevokeForm = {
    mintAddress: '',
    revokeMint: false,
    revokeFreeze: false,
};

export const ManageTokenTab: FC = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [mode, setMode] = useState<ManageMode>('metadata');
    const [pinataJwt, setPinataJwt] = useState(() => localStorage.getItem('pinata_jwt') || '');
    const [jwtExpanded, setJwtExpanded] = useState(false);

    const [metadataForm, setMetadataForm] = useState<MetadataForm>(initialMetadataForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [manualImageUrl, setManualImageUrl] = useState<string>(''); // Manual URL input
    const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('url'); // Default to URL mode
    const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateTxHash, setUpdateTxHash] = useState<string | null>(null);

    // Metadata info for update authority check
    const [metadataInfo, setMetadataInfo] = useState<MetadataInfo | null>(null);
    const [loadingMetadataInfo, setLoadingMetadataInfo] = useState(false);

    const [revokeForm, setRevokeForm] = useState<RevokeForm>(initialRevokeForm);
    const [revoking, setRevoking] = useState(false);
    const [revokeSuccess, setRevokeSuccess] = useState(false);
    const [revokeTxHash, setRevokeTxHash] = useState<string | null>(null);

    // Mint authority info
    const [mintInfo, setMintInfo] = useState<MintAuthorities | null>(null);
    const [loadingMintInfo, setLoadingMintInfo] = useState(false);
    const [mintInfoError, setMintInfoError] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    // Fetch metadata info when address changes (for update tab)
    useEffect(() => {
        const fetchMetadataInfo = async () => {
            if (!metadataForm.mintAddress || metadataForm.mintAddress.length < 32) {
                setMetadataInfo(null);
                return;
            }

            try {
                setLoadingMetadataInfo(true);
                const info = await getMetadataInfo(connection, metadataForm.mintAddress);
                setMetadataInfo(info);

                // Auto-fill form with current values
                if (info) {
                    setMetadataForm(prev => ({
                        ...prev,
                        name: info.name || prev.name,
                        symbol: info.symbol || prev.symbol,
                    }));
                    // Pre-fill the image URL with current value
                    if (info.uri) {
                        // Try to extract image URL from metadata URI (fetch the JSON)
                        try {
                            const response = await fetch(info.uri);
                            const metadata = await response.json();
                            if (metadata.image) {
                                setManualImageUrl(metadata.image);
                            }
                        } catch {
                            // If fetch fails, just use the URI as is
                            setManualImageUrl(info.uri);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch metadata info:', err);
                setMetadataInfo(null);
            } finally {
                setLoadingMetadataInfo(false);
            }
        };

        const timer = setTimeout(fetchMetadataInfo, 500);
        return () => clearTimeout(timer);
    }, [metadataForm.mintAddress, connection]);

    // Fetch mint info when address changes
    useEffect(() => {
        const fetchMintInfo = async () => {
            if (!revokeForm.mintAddress || revokeForm.mintAddress.length < 32) {
                setMintInfo(null);
                setMintInfoError(null);
                return;
            }

            try {
                setLoadingMintInfo(true);
                setMintInfoError(null);

                const mintPubkey = new PublicKey(revokeForm.mintAddress);
                const info = await getMint(connection, mintPubkey);

                setMintInfo({
                    mintAuthority: info.mintAuthority?.toBase58() || null,
                    freezeAuthority: info.freezeAuthority?.toBase58() || null,
                    decimals: info.decimals,
                    supply: info.supply.toString(),
                });
            } catch (err) {
                console.error('Failed to fetch mint info:', err);
                setMintInfoError('Invalid token address or token not found');
                setMintInfo(null);
            } finally {
                setLoadingMintInfo(false);
            }
        };

        const timer = setTimeout(fetchMintInfo, 500); // Debounce
        return () => clearTimeout(timer);
    }, [revokeForm.mintAddress, connection]);

    const handleJwtChange = (value: string) => {
        setPinataJwt(value);
        if (value) localStorage.setItem('pinata_jwt', value);
        else localStorage.removeItem('pinata_jwt');
    };

    const handleImageSelect = useCallback(async (file: File) => {
        setImageFile(file);
        setImageUrl(null);
        setMetadataUrl(null);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
        if (pinataJwt) {
            try {
                const url = await uploadFileToPinata(file, pinataJwt);
                setImageUrl(url);
            } catch (err) {
                console.error('Image upload failed:', err);
            }
        }
    }, [pinataJwt]);

    const handleUpdateMetadata = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setUpdateSuccess(false);
        setUpdateTxHash(null);

        if (!wallet.connected || !wallet.publicKey) {
            setError('Please connect your wallet first.');
            return;
        }
        if (!metadataForm.mintAddress || !metadataForm.name || !metadataForm.symbol) {
            setError('Please fill in all required fields.');
            return;
        }
        if (!pinataJwt) {
            setError('Please enter your Pinata JWT.');
            return;
        }

        try {
            setUpdating(true);

            let finalImageUrl: string;

            if (imageInputMode === 'url') {
                // Use manual URL
                if (!manualImageUrl) {
                    setError('Please enter an image URL.');
                    setUpdating(false);
                    return;
                }
                finalImageUrl = manualImageUrl;
            } else {
                // Upload mode
                if (imageFile) {
                    if (!imageUrl) {
                        finalImageUrl = await uploadFileToPinata(imageFile, pinataJwt);
                        setImageUrl(finalImageUrl);
                    } else {
                        finalImageUrl = imageUrl;
                    }
                } else if (imageUrl) {
                    finalImageUrl = imageUrl;
                } else {
                    setError('Please upload an image.');
                    setUpdating(false);
                    return;
                }
            }

            const metadata = buildTokenMetadata(
                metadataForm.name, metadataForm.symbol, metadataForm.description,
                finalImageUrl,
                { website: metadataForm.website, twitter: metadataForm.twitter, telegram: metadataForm.telegram, discord: metadataForm.discord }
            );
            const newMetadataUrl = await uploadJsonToPinata(metadata, `${metadataForm.symbol}-metadata.json`, pinataJwt);
            setMetadataUrl(newMetadataUrl);

            const signature = await updateTokenMetadata(connection, wallet, metadataForm.mintAddress, metadataForm.name, metadataForm.symbol, newMetadataUrl);
            setUpdateTxHash(signature);
            setUpdateSuccess(true);
        } catch (err: unknown) {
            console.error('Update failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to update metadata.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRevokeAuthorities = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRevokeSuccess(false);
        setRevokeTxHash(null);

        if (!wallet.connected || !wallet.publicKey) {
            setError('Please connect your wallet first.');
            return;
        }
        if (!revokeForm.mintAddress) {
            setError('Please enter the token mint address.');
            return;
        }
        if (!revokeForm.revokeMint && !revokeForm.revokeFreeze) {
            setError('Please select at least one authority to revoke.');
            return;
        }

        try {
            setRevoking(true);
            const signature = await revokeAuthorities(connection, wallet, revokeForm.mintAddress, revokeForm.revokeMint, revokeForm.revokeFreeze);
            setRevokeTxHash(signature);
            setRevokeSuccess(true);
            setRevokeForm(prev => ({ ...prev, revokeMint: false, revokeFreeze: false }));
            // Refresh mint info to show updated authorities
            setMintInfo(null);
        } catch (err: unknown) {
            console.error('Revoke failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to revoke authorities.');
        } finally {
            setRevoking(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Mode Tabs */}
            <div className="flex rounded-lg sm:rounded-xl bg-dark-700/50 p-1">
                <button type="button" onClick={() => { setMode('metadata'); setError(null); setUpdateSuccess(false); setRevokeSuccess(false); }}
                    className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${mode === 'metadata' ? 'bg-sol-blue/20 text-sol-blue' : 'text-gray-400 hover:text-white'}`}>
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Update</span> Metadata
                </button>
                <button type="button" onClick={() => { setMode('revoke'); setError(null); setUpdateSuccess(false); setRevokeSuccess(false); }}
                    className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${mode === 'revoke' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Revoke
                </button>
            </div>

            {mode === 'metadata' && (
                <form onSubmit={handleUpdateMetadata} className="space-y-5">
                    <div className={`rounded-xl border transition-all ${pinataJwt ? 'bg-dark-700/30 border-sol-green/30' : 'bg-dark-700/50 border-amber-500/30'}`}>
                        <button type="button" onClick={() => setJwtExpanded(!jwtExpanded)} className="w-full flex items-center justify-between p-3">
                            <span className={`text-sm font-medium flex items-center gap-2 ${pinataJwt ? 'text-sol-green' : 'text-amber-400'}`}>
                                <Key className="w-4 h-4" /> Pinata JWT {pinataJwt ? <Check className="w-3 h-3" /> : '(Required)'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${jwtExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {jwtExpanded && <div className="px-3 pb-3"><input type="password" value={pinataJwt} onChange={(e) => handleJwtChange(e.target.value)} placeholder="Enter your Pinata JWT" className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" /></div>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Token Mint Address <span className="text-sol-purple">*</span></label>
                        <div className="relative">
                            <input type="text" value={metadataForm.mintAddress} onChange={(e) => setMetadataForm(prev => ({ ...prev, mintAddress: e.target.value }))} placeholder="Enter the token mint address..." className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-blue/50" required />
                            {loadingMetadataInfo && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Authority Info */}
                    {metadataInfo && (
                        <div className="bg-dark-700/50 rounded-xl p-3 border border-white/10 space-y-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Token Info</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-dark-800/50 rounded-lg">
                                    <span className="text-gray-500">Name:</span>
                                    <span className="text-white ml-1">{metadataInfo.name}</span>
                                </div>
                                <div className="p-2 bg-dark-800/50 rounded-lg">
                                    <span className="text-gray-500">Symbol:</span>
                                    <span className="text-white ml-1">{metadataInfo.symbol}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-dark-800/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-sol-blue" />
                                    <span className="text-xs text-gray-400">Update Authority</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs text-sol-blue font-mono">
                                        {metadataInfo.updateAuthority?.slice(0, 4)}...{metadataInfo.updateAuthority?.slice(-4)}
                                    </code>
                                    {wallet.publicKey?.toBase58() === metadataInfo.updateAuthority && (
                                        <span className="px-1.5 py-0.5 bg-sol-green/20 text-sol-green text-[10px] rounded">YOU</span>
                                    )}
                                    {wallet.publicKey && wallet.publicKey.toBase58() !== metadataInfo.updateAuthority && (
                                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">NOT YOU</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-dark-800/50 rounded-lg">
                                <span className="text-xs text-gray-400">Mutable</span>
                                {metadataInfo.isMutable ? (
                                    <span className="text-xs text-sol-green flex items-center gap-1"><Check className="w-3 h-3" /> Yes</span>
                                ) : (
                                    <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No (locked)</span>
                                )}
                            </div>
                            {!metadataInfo.isMutable && (
                                <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">This metadata is immutable and cannot be updated.</p>
                            )}
                            {wallet.publicKey && wallet.publicKey.toBase58() !== metadataInfo.updateAuthority && (
                                <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded">You are not the Update Authority. You cannot update this token's metadata.</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-300">Token Image <span className="text-sol-purple">*</span></label>
                            <div className="flex rounded-lg bg-dark-700/50 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setImageInputMode('url')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${imageInputMode === 'url'
                                        ? 'bg-sol-blue text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Use URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageInputMode('upload')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${imageInputMode === 'upload'
                                        ? 'bg-sol-blue text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Upload New
                                </button>
                            </div>
                        </div>

                        {imageInputMode === 'url' ? (
                            <div className="space-y-2">
                                <input
                                    type="url"
                                    value={manualImageUrl}
                                    onChange={(e) => setManualImageUrl(e.target.value)}
                                    placeholder="https://ipfs.io/ipfs/... or any image URL"
                                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-blue/50"
                                />
                                {manualImageUrl && (
                                    <div className="flex items-center gap-3 p-2 bg-dark-700/50 rounded-lg border border-sol-green/30">
                                        <img src={manualImageUrl} alt="Preview" className="w-10 h-10 rounded object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        <p className="text-xs text-sol-green break-all flex-1">Current image URL</p>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500">Keep the original image URL or enter a new one</p>
                            </div>
                        ) : (
                            <>
                                <ImageUpload onImageSelect={handleImageSelect} imagePreview={imagePreview} uploading={false} uploadedUrl={imageUrl} compact />
                                {imageUrl && (
                                    <div className="bg-dark-700/50 rounded-lg p-2 border border-sol-green/30">
                                        <p className="text-xs text-gray-500">Uploaded:</p>
                                        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sol-green hover:underline break-all">{imageUrl}</a>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="space-y-1"><label className="block text-xs font-medium text-gray-400">New Name <span className="text-sol-purple">*</span></label><input type="text" value={metadataForm.name} onChange={(e) => setMetadataForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Token Name" className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-blue/50" required /></div>
                        <div className="space-y-1"><label className="block text-xs font-medium text-gray-400">New Symbol <span className="text-sol-purple">*</span></label><input type="text" value={metadataForm.symbol} onChange={(e) => setMetadataForm(prev => ({ ...prev, symbol: e.target.value }))} placeholder="SYMBOL" maxLength={10} className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-blue/50" required /></div>
                    </div>

                    <div className="space-y-1"><label className="block text-xs font-medium text-gray-400">Description</label><textarea value={metadataForm.description} onChange={(e) => setMetadataForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your token..." rows={2} className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-blue/50 resize-none" /></div>

                    <div className="space-y-2 pt-3 border-t border-white/10">
                        <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Extensions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input type="url" value={metadataForm.website} onChange={(e) => setMetadataForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://yourproject.com" className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none" />
                            <input type="url" value={metadataForm.twitter} onChange={(e) => setMetadataForm(prev => ({ ...prev, twitter: e.target.value }))} placeholder="https://x.com/yourhandle" className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none" />
                            <input type="url" value={metadataForm.telegram} onChange={(e) => setMetadataForm(prev => ({ ...prev, telegram: e.target.value }))} placeholder="https://t.me/yourgroup" className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none" />
                            <input type="url" value={metadataForm.discord} onChange={(e) => setMetadataForm(prev => ({ ...prev, discord: e.target.value }))} placeholder="https://discord.gg/xxx" className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none" />
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Enter full URLs (e.g., https://x.com/yourhandle)</p>
                    </div>

                    {metadataUrl && <div className="bg-dark-700/50 rounded-lg p-2 border border-sol-cyan/30"><p className="text-xs text-gray-500">Metadata:</p><a href={metadataUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sol-cyan hover:underline break-all">{metadataUrl}</a></div>}
                    {updateSuccess && (
                        <div className="bg-sol-green/10 border border-sol-green/30 rounded-lg p-3 text-sol-green text-sm space-y-2">
                            <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Metadata updated successfully!</div>
                            {updateTxHash && (
                                <a href={`https://solscan.io/tx/${updateTxHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs hover:underline">
                                    <ExternalLink className="w-3 h-3" /> View transaction: {updateTxHash.slice(0, 8)}...{updateTxHash.slice(-8)}
                                </a>
                            )}
                        </div>
                    )}
                    {error && mode === 'metadata' && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

                    <button type="submit" disabled={updating || !wallet.connected} className={`w-full py-3 rounded-xl font-semibold transition-all ${wallet.connected && !updating ? 'bg-sol-blue text-white hover:bg-sol-blue/80' : 'bg-dark-600 text-gray-500 cursor-not-allowed'}`}>
                        {updating ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</span> : 'Update Metadata'}
                    </button>
                    <p className="text-xs text-gray-500 text-center">Note: You must be the Update Authority of the token</p>
                </form>
            )}

            {mode === 'revoke' && (
                <form onSubmit={handleRevokeAuthorities} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Token Mint Address <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <input type="text" value={revokeForm.mintAddress} onChange={(e) => setRevokeForm(prev => ({ ...prev, mintAddress: e.target.value }))} placeholder="Enter the token mint address..." className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50" required />
                            {loadingMintInfo && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Authority Info */}
                    {mintInfo && (
                        <div className="bg-dark-700/50 rounded-xl p-4 border border-white/10 space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Authorities</p>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-sol-green" />
                                        <span className="text-sm text-gray-300">Mint Authority</span>
                                    </div>
                                    {mintInfo.mintAuthority ? (
                                        <div className="text-right flex items-center gap-2">
                                            <code className="text-xs text-sol-green font-mono">
                                                {mintInfo.mintAuthority.slice(0, 4)}...{mintInfo.mintAuthority.slice(-4)}
                                            </code>
                                            {wallet.publicKey?.toBase58() === mintInfo.mintAuthority && (
                                                <span className="px-1.5 py-0.5 bg-sol-green/20 text-sol-green text-[10px] rounded">YOU</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-500 italic flex items-center gap-1">Revoked <Check className="w-3 h-3" /></span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Snowflake className="w-4 h-4 text-sol-cyan" />
                                        <span className="text-sm text-gray-300">Freeze Authority</span>
                                    </div>
                                    {mintInfo.freezeAuthority ? (
                                        <div className="text-right flex items-center gap-2">
                                            <code className="text-xs text-sol-cyan font-mono">
                                                {mintInfo.freezeAuthority.slice(0, 4)}...{mintInfo.freezeAuthority.slice(-4)}
                                            </code>
                                            {wallet.publicKey?.toBase58() === mintInfo.freezeAuthority && (
                                                <span className="px-1.5 py-0.5 bg-sol-cyan/20 text-sol-cyan text-[10px] rounded">YOU</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-500 italic flex items-center gap-1">Revoked <Check className="w-3 h-3" /></span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs text-gray-500">
                                <span>Decimals: {mintInfo.decimals}</span>
                                <span>Supply: {BigInt(mintInfo.supply) / BigInt(10 ** mintInfo.decimals)} tokens</span>
                            </div>
                        </div>
                    )}

                    {mintInfoError && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {mintInfoError}
                        </div>
                    )}

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-300">Select authorities to revoke:</p>
                        <label className={`flex items-center gap-4 p-4 bg-dark-700/50 rounded-xl transition-all border ${mintInfo?.mintAuthority === null
                            ? 'opacity-50 cursor-not-allowed border-transparent'
                            : 'cursor-pointer hover:bg-dark-700 hover:border-red-500/30 border-transparent'
                            }`}>
                            <input
                                type="checkbox"
                                checked={revokeForm.revokeMint}
                                onChange={(e) => setRevokeForm(prev => ({ ...prev, revokeMint: e.target.checked }))}
                                disabled={mintInfo?.mintAuthority === null}
                                className="w-5 h-5 rounded border-gray-600 bg-dark-800 text-red-500"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white flex items-center gap-2"><Coins className="w-4 h-4 text-sol-green" /> Mint Authority</p>
                                <p className="text-xs text-gray-500">
                                    {mintInfo?.mintAuthority === null
                                        ? 'Already revoked'
                                        : 'Permanently disable minting new tokens'}
                                </p>
                            </div>
                            {mintInfo?.mintAuthority && wallet.publicKey?.toBase58() !== mintInfo.mintAuthority && (
                                <span className="text-xs text-amber-400">Not owner</span>
                            )}
                        </label>
                        <label className={`flex items-center gap-4 p-4 bg-dark-700/50 rounded-xl transition-all border ${mintInfo?.freezeAuthority === null
                            ? 'opacity-50 cursor-not-allowed border-transparent'
                            : 'cursor-pointer hover:bg-dark-700 hover:border-red-500/30 border-transparent'
                            }`}>
                            <input
                                type="checkbox"
                                checked={revokeForm.revokeFreeze}
                                onChange={(e) => setRevokeForm(prev => ({ ...prev, revokeFreeze: e.target.checked }))}
                                disabled={mintInfo?.freezeAuthority === null}
                                className="w-5 h-5 rounded border-gray-600 bg-dark-800 text-red-500"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white flex items-center gap-2"><Snowflake className="w-4 h-4 text-sol-cyan" /> Freeze Authority</p>
                                <p className="text-xs text-gray-500">
                                    {mintInfo?.freezeAuthority === null
                                        ? 'Already revoked'
                                        : 'Permanently disable freezing accounts'}
                                </p>
                            </div>
                            {mintInfo?.freezeAuthority && wallet.publicKey?.toBase58() !== mintInfo.freezeAuthority && (
                                <span className="text-xs text-amber-400">Not owner</span>
                            )}
                        </label>
                    </div>

                    {(revokeForm.revokeMint || revokeForm.revokeFreeze) && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                            <div><p className="text-red-400 font-medium">Warning: Irreversible!</p><p className="text-red-400/80 text-sm mt-1">Once revoked, you <strong>cannot restore</strong> these authorities.</p></div>
                        </div>
                    )}

                    {revokeSuccess && (
                        <div className="bg-sol-green/10 border border-sol-green/30 rounded-lg p-3 text-sol-green text-sm space-y-2">
                            <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Authorities revoked successfully!</div>
                            {revokeTxHash && (
                                <a href={`https://solscan.io/tx/${revokeTxHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs hover:underline">
                                    <ExternalLink className="w-3 h-3" /> View transaction: {revokeTxHash.slice(0, 8)}...{revokeTxHash.slice(-8)}
                                </a>
                            )}
                        </div>
                    )}
                    {error && mode === 'revoke' && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

                    <button type="submit" disabled={revoking || !wallet.connected || (!revokeForm.revokeMint && !revokeForm.revokeFreeze)} className={`w-full py-3 rounded-xl font-semibold transition-all ${wallet.connected && !revoking && (revokeForm.revokeMint || revokeForm.revokeFreeze) ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-dark-600 text-gray-500 cursor-not-allowed'}`}>
                        {revoking ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Revoking...</span> : 'Revoke Selected Authorities'}
                    </button>
                    <p className="text-xs text-gray-500 text-center">Note: You must be the current authority holder</p>
                </form>
            )}
        </div>
    );
};

