import FormData from 'form-data';
export async function uploadToIPFS(buffer: Buffer, filename: string): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', buffer, { filename });

        const res = await fetch('https://api.thegraph.com/ipfs/api/v0/add', {
            method: 'POST',
            body: formData as any,
            headers: formData.getHeaders()
        });

        if (!res.ok) {
            throw new Error(`IPFS Upload failed: ${res.statusText}`);
        }

        const data = await res.json() as { Name: string, Hash: string, Size: string };
        return data.Hash;
    } catch (error) {
        console.error('[IPFS] Upload error:', error);
        throw error;
    }
}

export async function fetchFromIPFS(cid: string): Promise<Buffer> {
    try {
        const res = await fetch(`https://api.thegraph.com/ipfs/api/v0/cat?arg=${cid}`);
        
        if (!res.ok) {
            // Fallback to official IPFS gateway
            const fallback = await fetch(`https://ipfs.io/ipfs/${cid}`);
            if (!fallback.ok) throw new Error(`IPFS Fetch failed for CID: ${cid}`);
            const arrayBuffer = await fallback.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error(`[IPFS] Fetch error for CID ${cid}:`, error);
        throw error;
    }
}
