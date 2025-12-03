import { useState, useCallback, useEffect, type FC } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Key, ChevronDown, Check, Link2, Lock, Coins, Snowflake, AlertTriangle, ExternalLink } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { uploadFileToPinata, uploadJsonToPinata, buildTokenMetadata } from '../utils/ipfs';
import { createSplToken, type CreateTokenResult } from '../utils/solana';

interface FormData {
    name: string;
    symbol: string;
    decimals: number;
    supply: string;
    description: string;
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
    revokeMintAuthority: boolean;
    revokeFreezeAuthority: boolean;
}

const initialFormData: FormData = {
    name: '',
    symbol: '',
    decimals: 9,
    supply: '1000000000',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    revokeMintAuthority: false,
    revokeFreezeAuthority: false,
};

export const CreateTokenTab: FC = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [pinataJwt, setPinataJwt] = useState('');
    const [jwtExpanded, setJwtExpanded] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState<CreateTokenResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'form' | 'uploading' | 'creating' | 'success'>('form');

    // Load JWT from localStorage
    useEffect(() => {
        const savedJwt = localStorage.getItem('pinata_jwt');
        if (savedJwt) {
            setPinataJwt(savedJwt);
        } else {
            setJwtExpanded(true);
        }
    }, []);

    const handleJwtChange = (value: string) => {
        setPinataJwt(value);
        if (value) {
            localStorage.setItem('pinata_jwt', value);
        } else {
            localStorage.removeItem('pinata_jwt');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = useCallback(async (file: File) => {
        setImageFile(file);
        setImageUrl(null);

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        if (pinataJwt) {
            setUploading(true);
            try {
                const url = await uploadFileToPinata(file, pinataJwt);
                setImageUrl(url);
            } catch (err) {
                console.error('Image upload failed:', err);
                setError('Failed to upload image. Please check your Pinata JWT.');
            } finally {
                setUploading(false);
            }
        }
    }, [pinataJwt]);

    const handleUploadImage = async () => {
        if (!imageFile || !pinataJwt) return;
        setUploading(true);
        setError(null);
        try {
            const url = await uploadFileToPinata(imageFile, pinataJwt);
            setImageUrl(url);
        } catch (err) {
            console.error('Image upload failed:', err);
            setError('Failed to upload image. Please check your Pinata JWT.');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!wallet.connected || !wallet.publicKey) {
            setError('Please connect your wallet first.');
            return;
        }

        if (!imageFile) {
            setError('Please upload a token image.');
            return;
        }

        if (!pinataJwt) {
            setError('Please enter your Pinata JWT.');
            return;
        }

        try {
            setStep('uploading');
            setCreating(true);

            let finalImageUrl = imageUrl;
            if (!finalImageUrl) {
                setUploading(true);
                finalImageUrl = await uploadFileToPinata(imageFile, pinataJwt);
                setImageUrl(finalImageUrl);
                setUploading(false);
            }

            const metadata = buildTokenMetadata(
                formData.name,
                formData.symbol,
                formData.description,
                finalImageUrl,
                {
                    website: formData.website,
                    twitter: formData.twitter,
                    telegram: formData.telegram,
                    discord: formData.discord,
                }
            );

            const metadataJsonUrl = await uploadJsonToPinata(
                metadata,
                `${formData.symbol}-metadata.json`,
                pinataJwt
            );

            setStep('creating');

            const result = await createSplToken(connection, wallet, {
                name: formData.name,
                symbol: formData.symbol,
                decimals: formData.decimals,
                supply: parseInt(formData.supply),
                metadataUri: metadataJsonUrl,
                imageUrl: finalImageUrl,
                revokeMintAuthority: formData.revokeMintAuthority,
                revokeFreezeAuthority: formData.revokeFreezeAuthority,
            });

            setResult(result);
            setStep('success');
        } catch (err: unknown) {
            console.error('Token creation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to create token. Please try again.');
            setStep('form');
        } finally {
            setCreating(false);
            setUploading(false);
        }
    };

    const resetForm = () => {
        setStep('form');
        setResult(null);
        setFormData(initialFormData);
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
    };

    const isFormValid =
        formData.name.trim() !== '' &&
        formData.symbol.trim() !== '' &&
        formData.supply !== '' &&
        parseInt(formData.supply) > 0 &&
        imageFile !== null &&
        pinataJwt.trim() !== '';

    // Success view
    if (step === 'success' && result) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-sol-green to-sol-cyan flex items-center justify-center animate-bounce">
                        <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Token Created Successfully!</h2>
                    <p className="text-gray-400">Your SPL token is now live on Solana</p>
                </div>

                <div className="bg-dark-700 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                        {imagePreview && (
                            <img src={imagePreview} alt={formData.name} className="w-16 h-16 rounded-xl object-cover" />
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-white">{formData.name}</h3>
                            <p className="text-sol-purple font-medium">${formData.symbol}</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        {[
                            { label: 'Mint Address', value: result.mintAddress, link: `https://solscan.io/token/${result.mintAddress}?cluster=devnet` },
                            { label: 'Token Account', value: result.tokenAccount },
                            { label: 'Supply', value: `${parseInt(formData.supply).toLocaleString()} ${formData.symbol}` },
                            { label: 'Decimals', value: formData.decimals },
                            { label: 'Transaction', value: 'View on Solscan', link: `https://solscan.io/tx/${result.signature}?cluster=devnet` },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <span className="text-gray-400">{item.label}</span>
                                {item.link ? (
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-mono text-sol-green hover:underline flex items-center gap-1">
                                        {typeof item.value === 'string' && item.value.length > 20
                                            ? `${item.value.slice(0, 8)}...${item.value.slice(-8)}`
                                            : item.value}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                ) : (
                                    <span className="font-mono text-white">{item.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* IPFS URLs */}
                <div className="bg-dark-700/50 rounded-2xl p-4 space-y-3 border border-sol-cyan/30">
                    <div className="flex items-center gap-2 text-sol-cyan text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        IPFS URLs
                    </div>
                    {[
                        { label: 'Image', url: result.imageUrl },
                        { label: 'Metadata', url: result.metadataUrl },
                    ].map((item, i) => (
                        <div key={i}>
                            <p className="text-xs text-gray-500 mb-1">{item.label}:</p>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sol-green hover:underline break-all">
                                {item.url}
                            </a>
                        </div>
                    ))}
                </div>

                <button onClick={resetForm} className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-dark-600 hover:bg-dark-500 transition-all">
                    Create Another Token
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleCreateToken} className="space-y-6">
            {/* Pinata JWT */}
            <div className={`rounded-2xl border transition-all ${pinataJwt ? 'bg-dark-700/30 border-sol-green/30' : 'bg-dark-700/50 border-amber-500/30'}`}>
                <button type="button" onClick={() => setJwtExpanded(!jwtExpanded)} className="w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pinataJwt ? 'bg-sol-green/20' : 'bg-amber-500/20'}`}>
                            <Key className={`w-4 h-4 ${pinataJwt ? 'text-sol-green' : 'text-amber-500'}`} />
                        </div>
                        <span className={`text-sm font-medium flex items-center gap-1.5 ${pinataJwt ? 'text-sol-green' : 'text-amber-400'}`}>
                            Pinata JWT {pinataJwt ? <><Check className="w-3.5 h-3.5" /> Configured</> : '(Required)'}
                        </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${jwtExpanded ? 'rotate-180' : ''}`} />
                </button>
                {jwtExpanded && (
                    <div className="px-4 pb-4">
                        <input
                            type="password"
                            value={pinataJwt}
                            onChange={(e) => handleJwtChange(e.target.value)}
                            placeholder="Enter your Pinata JWT"
                            className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Get from <a href="https://app.pinata.cloud/developers/api-keys" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Pinata Dashboard</a> • Saved locally
                        </p>
                    </div>
                )}
            </div>

            {/* Token Image */}
            <ImageUpload onImageSelect={handleImageSelect} imagePreview={imagePreview} uploading={uploading} uploadedUrl={imageUrl} />

            {imageUrl && (
                <div className="bg-dark-700/50 rounded-xl p-3 border border-sol-green/30">
                    <p className="text-xs text-gray-500 mb-1">Image IPFS:</p>
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sol-green hover:underline break-all flex items-center gap-1">{imageUrl} <ExternalLink className="w-3 h-3 shrink-0" /></a>
                </div>
            )}

            {imageFile && !imageUrl && pinataJwt && !uploading && (
                <button type="button" onClick={handleUploadImage} className="w-full py-3 rounded-xl font-medium text-white bg-amber-600 hover:bg-amber-500 transition-all">
                    Upload Image to IPFS
                </button>
            )}

            {/* Token Name & Symbol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-300">Token Name <span className="text-sol-purple">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Solana Cat" className="w-full bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-purple/50" required />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-300">Symbol <span className="text-sol-purple">*</span></label>
                    <input type="text" name="symbol" value={formData.symbol} onChange={handleInputChange} placeholder="SCAT" maxLength={10} className="w-full bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-purple/50" required />
                </div>
            </div>

            {/* Decimals & Supply */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-300">Decimals</label>
                    <input type="number" name="decimals" value={formData.decimals} onChange={handleInputChange} min={0} max={18} className="w-full bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-sol-purple/50" />
                    <p className="text-xs text-gray-500">Standard: 9</p>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-xs sm:text-sm font-medium text-gray-300">Total Supply <span className="text-sol-purple">*</span></label>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, supply: '100000000' }))} className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${formData.supply === '100000000' ? 'bg-sol-purple text-white' : 'bg-dark-600 text-gray-400 hover:text-white'}`}>100M</button>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, supply: '1000000000' }))} className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${formData.supply === '1000000000' ? 'bg-sol-purple text-white' : 'bg-dark-600 text-gray-400 hover:text-white'}`}>1B</button>
                    </div>
                    <input type="text" name="supply" value={formData.supply} onChange={handleInputChange} placeholder="1000000000" className="w-full bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-purple/50" required />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your token..." rows={2} className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-purple/50 resize-none" />
            </div>

            {/* Extensions */}
            <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-white/10">
                <p className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Extensions (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://yourproject.com" className="bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-cyan/50" />
                    <input type="url" name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="https://x.com/yourhandle" className="bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-cyan/50" />
                    <input type="url" name="telegram" value={formData.telegram} onChange={handleInputChange} placeholder="https://t.me/yourgroup" className="bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-cyan/50" />
                    <input type="url" name="discord" value={formData.discord} onChange={handleInputChange} placeholder="https://discord.gg/xxx" className="bg-dark-700 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sol-cyan/50" />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">Enter full URLs (e.g., https://x.com/yourhandle)</p>
            </div>

            {/* Revoke Authorities */}
            <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-white/10">
                <p className="text-xs sm:text-sm font-medium text-red-400 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Revoke Authorities (Irreversible)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <label className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-dark-700/50 rounded-lg sm:rounded-xl cursor-pointer hover:bg-dark-700 transition-all border border-transparent hover:border-red-500/30">
                        <input
                            type="checkbox"
                            checked={formData.revokeMintAuthority}
                            onChange={(e) => setFormData(prev => ({ ...prev, revokeMintAuthority: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-600 bg-dark-800 text-red-500"
                        />
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5"><Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sol-green" /> Revoke Mint</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">No more tokens can be minted</p>
                        </div>
                    </label>
                    <label className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-dark-700/50 rounded-lg sm:rounded-xl cursor-pointer hover:bg-dark-700 transition-all border border-transparent hover:border-red-500/30">
                        <input
                            type="checkbox"
                            checked={formData.revokeFreezeAuthority}
                            onChange={(e) => setFormData(prev => ({ ...prev, revokeFreezeAuthority: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-600 bg-dark-800 text-red-500"
                        />
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5"><Snowflake className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sol-cyan" /> Revoke Freeze</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Accounts cannot be frozen</p>
                        </div>
                    </label>
                </div>
                {(formData.revokeMintAuthority || formData.revokeFreezeAuthority) && (
                    <p className="text-[10px] sm:text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Warning: This action cannot be undone!</p>
                )}
            </div>

            {/* Error */}
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {error}</div>}

            {/* Submit */}
            <button
                type="submit"
                disabled={!isFormValid || creating || !wallet.connected}
                className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-lg transition-all ${isFormValid && wallet.connected && !creating
                    ? 'bg-gradient-to-r from-sol-purple to-sol-green text-white hover:shadow-lg hover:shadow-sol-purple/30'
                    : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {creating ? (
                    <span className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs sm:text-base">{step === 'uploading' ? 'Uploading to IPFS...' : 'Creating Token...'}</span>
                    </span>
                ) : !wallet.connected ? 'Connect Wallet to Continue' : 'Create Token'}
            </button>
        </form>
    );
};

