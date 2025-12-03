import axios from 'axios';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning';

interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

// Upload file to Pinata
export const uploadFileToPinata = async (file: File, jwt: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({ name: file.name }));
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinFileToIPFS`,
        formData,
        {
            maxBodyLength: Infinity,
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${jwt}`,
            },
        }
    );

    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
};

// Upload JSON to Pinata
export const uploadJsonToPinata = async (json: object, name: string, jwt: string): Promise<string> => {
    const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinJSONToIPFS`,
        {
            pinataContent: json,
            pinataMetadata: { name },
            pinataOptions: { cidVersion: 1 },
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`,
            },
        }
    );

    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
};

// Ensure URL has protocol
const ensureFullUrl = (url: string): string => {
    if (!url) return '';
    // If already has http:// or https://, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Otherwise, add https://
    return `https://${url}`;
};

// Build token metadata JSON (Metaplex standard)
export const buildTokenMetadata = (
    name: string,
    symbol: string,
    description: string,
    imageUrl: string,
    extensions?: {
        website?: string;
        twitter?: string;
        telegram?: string;
        discord?: string;
    }
) => {
    const metadata: Record<string, unknown> = {
        name,
        symbol,
        description,
        image: imageUrl,
    };

    // Only add extensions if there are any non-empty values
    if (extensions) {
        const ext: Record<string, string> = {};
        
        if (extensions.website) {
            ext.website = ensureFullUrl(extensions.website);
        }
        if (extensions.twitter) {
            ext.twitter = ensureFullUrl(extensions.twitter);
        }
        if (extensions.telegram) {
            ext.telegram = ensureFullUrl(extensions.telegram);
        }
        if (extensions.discord) {
            ext.discord = ensureFullUrl(extensions.discord);
        }
        
        if (Object.keys(ext).length > 0) {
            metadata.extensions = ext;
        }
    }

    return metadata;
};

