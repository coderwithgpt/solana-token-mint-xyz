import { useState, useCallback, useRef, type FC } from 'react';

interface ImageUploadProps {
    onImageSelect: (file: File) => void;
    imagePreview: string | null;
    uploading: boolean;
    uploadedUrl: string | null;
    compact?: boolean;
}

export const ImageUpload: FC<ImageUploadProps> = ({
    onImageSelect,
    imagePreview,
    uploading,
    uploadedUrl,
    compact = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onImageSelect(file);
            }
        }
    }, [onImageSelect]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                onImageSelect(file);
            }
        }
    }, [onImageSelect]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
            {!compact && (
                <label className="block text-sm font-medium text-gray-300">
                    Token Image <span className="text-sol-purple">*</span>
                </label>
            )}

            <div
                onClick={handleClick}
                onDrag={handleDrag}
                onDragStart={handleDrag}
                onDragEnd={handleDragOut}
                onDragOver={handleDragIn}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDrop={handleDrop}
                className={`
                    relative cursor-pointer border-2 border-dashed transition-all duration-300
                    ${compact ? 'rounded-xl' : 'rounded-2xl'}
                    ${isDragging
                        ? 'border-sol-green bg-sol-green/10 scale-[1.02]'
                        : 'border-white/20 hover:border-sol-purple/50 hover:bg-white/5'
                    }
                    ${imagePreview ? (compact ? 'p-2' : 'p-4') : (compact ? 'p-4' : 'p-8')}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {imagePreview ? (
                    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Token preview"
                                className={`${compact ? 'w-14 h-14 rounded-lg' : 'w-24 h-24 rounded-xl'} object-cover ring-2 ring-white/10`}
                            />
                            {uploading && (
                                <div className={`absolute inset-0 bg-black/50 ${compact ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center`}>
                                    <div className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} border-2 border-sol-green border-t-transparent rounded-full animate-spin`} />
                                </div>
                            )}
                            {uploadedUrl && (
                                <div className={`absolute ${compact ? '-top-1 -right-1 w-4 h-4' : '-top-2 -right-2 w-6 h-6'} bg-sol-green rounded-full flex items-center justify-center`}>
                                    <svg className={`${compact ? 'w-2.5 h-2.5' : 'w-4 h-4'} text-black`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white`}>Image selected</p>
                            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-0.5`}>
                                {uploadedUrl ? (
                                    <span className="text-sol-green">✓ Uploaded to IPFS</span>
                                ) : uploading ? (
                                    <span className="text-sol-purple">Uploading...</span>
                                ) : (
                                    'Click to change'
                                )}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className={`${compact ? 'w-10 h-10 mb-2 rounded-xl' : 'w-16 h-16 mb-4 rounded-2xl'} mx-auto bg-gradient-to-br from-sol-purple/20 to-sol-green/20 flex items-center justify-center`}>
                            <svg className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white mb-1`}>
                            {compact ? 'Click or drop image' : 'Drop your image here or click to browse'}
                        </p>
                        <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                            PNG, JPG, GIF up to 5MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

