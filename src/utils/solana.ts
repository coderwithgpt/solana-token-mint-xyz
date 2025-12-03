import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createMintToInstruction,
    createSetAuthorityInstruction,
    AuthorityType,
} from '@solana/spl-token';

// Token Metadata Program ID
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Wallet interface
export interface WalletAdapter {
    publicKey: PublicKey | null;
    signTransaction: (<T extends Transaction>(transaction: T) => Promise<T>) | undefined;
    signAllTransactions: (<T extends Transaction>(transactions: T[]) => Promise<T[]>) | undefined;
}

// Get metadata PDA
export function getMetadataPDA(mint: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );
    return pda;
}

// Create Metadata Account instruction (CreateMetadataAccountV3)
export function createMetadataInstruction(
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: PublicKey,
    payer: PublicKey,
    updateAuthority: PublicKey,
    name: string,
    symbol: string,
    uri: string,
): TransactionInstruction {
    const nameBuffer = Buffer.from(name);
    const symbolBuffer = Buffer.from(symbol);
    const uriBuffer = Buffer.from(uri);

    const dataSize =
        1 + 4 + nameBuffer.length + 4 + symbolBuffer.length + 4 + uriBuffer.length +
        2 + 1 + 1 + 1 + 1 + 1;

    const data = Buffer.alloc(dataSize);
    let offset = 0;

    data.writeUInt8(33, offset); offset += 1;
    data.writeUInt32LE(nameBuffer.length, offset); offset += 4;
    nameBuffer.copy(data, offset); offset += nameBuffer.length;
    data.writeUInt32LE(symbolBuffer.length, offset); offset += 4;
    symbolBuffer.copy(data, offset); offset += symbolBuffer.length;
    data.writeUInt32LE(uriBuffer.length, offset); offset += 4;
    uriBuffer.copy(data, offset); offset += uriBuffer.length;
    data.writeUInt16LE(0, offset); offset += 2;
    data.writeUInt8(0, offset); offset += 1;
    data.writeUInt8(0, offset); offset += 1;
    data.writeUInt8(0, offset); offset += 1;
    data.writeUInt8(1, offset); offset += 1;
    data.writeUInt8(0, offset);

    return new TransactionInstruction({
        keys: [
            { pubkey: metadataAccount, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: mintAuthority, isSigner: true, isWritable: false },
            { pubkey: payer, isSigner: true, isWritable: true },
            { pubkey: updateAuthority, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: TOKEN_METADATA_PROGRAM_ID,
        data,
    });
}

// Update Metadata Account instruction (UpdateMetadataAccountV2)
// Reference: https://github.com/metaplex-foundation/mpl-token-metadata
export function createUpdateMetadataInstruction(
    metadataAccount: PublicKey,
    updateAuthority: PublicKey,
    name: string,
    symbol: string,
    uri: string,
): TransactionInstruction {
    const nameBuffer = Buffer.from(name.slice(0, 32)); // Max 32 chars
    const symbolBuffer = Buffer.from(symbol.slice(0, 10)); // Max 10 chars
    const uriBuffer = Buffer.from(uri.slice(0, 200)); // Max 200 chars

    // Calculate data size for UpdateMetadataAccountV2
    // Structure: discriminator(1) + data_option(1) + DataV2 + new_update_authority_option(1) + primary_sale_happened_option(1) + is_mutable_option(1)
    const dataSize =
        1 +  // instruction discriminator
        1 +  // data option (Some = 1)
        4 + nameBuffer.length +      // name string
        4 + symbolBuffer.length +    // symbol string  
        4 + uriBuffer.length +       // uri string
        2 +  // seller_fee_basis_points
        1 +  // creators option (None = 0)
        1 +  // collection option (None = 0)
        1 +  // uses option (None = 0)
        1 +  // new_update_authority option (None = 0, keep current)
        1 +  // primary_sale_happened option (None = 0, keep current)
        1;   // is_mutable option (None = 0, keep current)

    const data = Buffer.alloc(dataSize);
    let offset = 0;

    // Instruction discriminator: 15 = UpdateMetadataAccountV2
    data.writeUInt8(15, offset);
    offset += 1;

    // Data option: Some = 1 (we are providing new data)
    data.writeUInt8(1, offset);
    offset += 1;

    // DataV2.name (borsh string: 4 byte length + bytes)
    data.writeUInt32LE(nameBuffer.length, offset);
    offset += 4;
    nameBuffer.copy(data, offset);
    offset += nameBuffer.length;

    // DataV2.symbol
    data.writeUInt32LE(symbolBuffer.length, offset);
    offset += 4;
    symbolBuffer.copy(data, offset);
    offset += symbolBuffer.length;

    // DataV2.uri
    data.writeUInt32LE(uriBuffer.length, offset);
    offset += 4;
    uriBuffer.copy(data, offset);
    offset += uriBuffer.length;

    // DataV2.seller_fee_basis_points (0 for fungible tokens)
    data.writeUInt16LE(0, offset);
    offset += 2;

    // DataV2.creators: None = 0
    data.writeUInt8(0, offset);
    offset += 1;

    // DataV2.collection: None = 0
    data.writeUInt8(0, offset);
    offset += 1;

    // DataV2.uses: None = 0
    data.writeUInt8(0, offset);
    offset += 1;

    // new_update_authority: None = 0 (keep current)
    data.writeUInt8(0, offset);
    offset += 1;

    // primary_sale_happened: None = 0 (keep current)
    data.writeUInt8(0, offset);
    offset += 1;

    // is_mutable: None = 0 (keep current, should stay true)
    data.writeUInt8(0, offset);

    return new TransactionInstruction({
        keys: [
            { pubkey: metadataAccount, isSigner: false, isWritable: true },
            { pubkey: updateAuthority, isSigner: true, isWritable: false },
        ],
        programId: TOKEN_METADATA_PROGRAM_ID,
        data,
    });
}

// Metadata account info
export interface MetadataInfo {
    updateAuthority: string | null;
    isMutable: boolean;
    name: string;
    symbol: string;
    uri: string;
}

// Fetch metadata account info
export const getMetadataInfo = async (
    connection: Connection,
    mintAddress: string,
): Promise<MetadataInfo | null> => {
    try {
        const mint = new PublicKey(mintAddress);
        const metadataPDA = getMetadataPDA(mint);

        const accountInfo = await connection.getAccountInfo(metadataPDA);
        if (!accountInfo || !accountInfo.data) {
            return null;
        }

        const data = accountInfo.data;

        // Parse metadata account data (simplified)
        // Metadata account structure starts with:
        // - key (1 byte)
        // - update_authority (32 bytes)
        // - mint (32 bytes)
        // - name (4 bytes length + string)
        // - symbol (4 bytes length + string)
        // - uri (4 bytes length + string)
        // - seller_fee_basis_points (2 bytes)
        // - creators option (1 + variable)
        // - primary_sale_happened (1 byte)
        // - is_mutable (1 byte)

        let offset = 1; // skip key byte

        // Update authority (32 bytes)
        const updateAuthority = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;

        // Skip mint (32 bytes)
        offset += 32;

        // Name (4 byte length + string)
        const nameLength = data.readUInt32LE(offset);
        offset += 4;
        const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '');
        offset += nameLength;

        // Symbol
        const symbolLength = data.readUInt32LE(offset);
        offset += 4;
        const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '');
        offset += symbolLength;

        // URI
        const uriLength = data.readUInt32LE(offset);
        offset += 4;
        const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '');
        offset += uriLength;

        // Skip seller_fee_basis_points (2 bytes)
        offset += 2;

        // Skip creators option
        const hasCreators = data.readUInt8(offset);
        offset += 1;
        if (hasCreators) {
            const creatorsLength = data.readUInt32LE(offset);
            offset += 4;
            // Each creator is 32 + 1 + 1 = 34 bytes
            offset += creatorsLength * 34;
        }

        // primary_sale_happened (1 byte)
        offset += 1;

        // is_mutable (1 byte)
        const isMutable = data.readUInt8(offset) === 1;

        return {
            updateAuthority,
            isMutable,
            name,
            symbol,
            uri,
        };
    } catch (err) {
        console.error('Failed to fetch metadata info:', err);
        return null;
    }
};

// Token creation result
export interface CreateTokenResult {
    mintAddress: string;
    tokenAccount: string;
    signature: string;
    metadataAddress: string;
    imageUrl: string;
    metadataUrl: string;
}

// Create SPL Token with Metadata
export const createSplToken = async (
    connection: Connection,
    wallet: WalletAdapter,
    config: {
        name: string;
        symbol: string;
        decimals: number;
        supply: number;
        metadataUri: string;
        imageUrl: string;
        revokeMintAuthority: boolean;
        revokeFreezeAuthority: boolean;
    }
): Promise<CreateTokenResult> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
    }

    const payer = wallet.publicKey;
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, payer);
    const supplyWithDecimals = BigInt(config.supply) * BigInt(10 ** config.decimals);
    const metadataPDA = getMetadataPDA(mint);

    const transaction = new Transaction();

    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: mint,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    transaction.add(
        createInitializeMintInstruction(mint, config.decimals, payer, payer, TOKEN_PROGRAM_ID)
    );

    transaction.add(
        createMetadataInstruction(metadataPDA, mint, payer, payer, payer, config.name, config.symbol, config.metadataUri)
    );

    transaction.add(
        createAssociatedTokenAccountInstruction(payer, associatedTokenAddress, payer, mint)
    );

    transaction.add(
        createMintToInstruction(mint, associatedTokenAddress, payer, supplyWithDecimals)
    );

    if (config.revokeMintAuthority) {
        transaction.add(
            createSetAuthorityInstruction(mint, payer, AuthorityType.MintTokens, null, [], TOKEN_PROGRAM_ID)
        );
    }

    if (config.revokeFreezeAuthority) {
        transaction.add(
            createSetAuthorityInstruction(mint, payer, AuthorityType.FreezeAccount, null, [], TOKEN_PROGRAM_ID)
        );
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;
    transaction.partialSign(mintKeypair);

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');

    return {
        mintAddress: mint.toBase58(),
        tokenAccount: associatedTokenAddress.toBase58(),
        signature,
        metadataAddress: metadataPDA.toBase58(),
        imageUrl: config.imageUrl,
        metadataUrl: config.metadataUri,
    };
};

// Update token metadata
export const updateTokenMetadata = async (
    connection: Connection,
    wallet: WalletAdapter,
    mintAddress: string,
    name: string,
    symbol: string,
    uri: string,
): Promise<string> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
    }

    const mint = new PublicKey(mintAddress);
    const metadataPDA = getMetadataPDA(mint);

    const transaction = new Transaction().add(
        createUpdateMetadataInstruction(metadataPDA, wallet.publicKey, name, symbol, uri)
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');
    return signature;
};

// Revoke token authorities
export const revokeAuthorities = async (
    connection: Connection,
    wallet: WalletAdapter,
    mintAddress: string,
    revokeMint: boolean,
    revokeFreeze: boolean,
): Promise<string> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
    }

    const mint = new PublicKey(mintAddress);
    const transaction = new Transaction();

    if (revokeMint) {
        transaction.add(
            createSetAuthorityInstruction(mint, wallet.publicKey, AuthorityType.MintTokens, null, [], TOKEN_PROGRAM_ID)
        );
    }

    if (revokeFreeze) {
        transaction.add(
            createSetAuthorityInstruction(mint, wallet.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_PROGRAM_ID)
        );
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');
    return signature;
};

