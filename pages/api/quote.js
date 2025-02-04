import { TappdClient } from '@phala/dstack-sdk';
import 'dotenv/config';

export const dynamic = 'force-dynamic';

const endpoint =
    process.env.DSTACK_SIMULATOR_ENDPOINT || 'http://localhost:8090';

export default async function quote(req, res) {
    // Get Tappd client
    const client = new TappdClient(endpoint);
    const randomNumString = Math.random().toString();
    // Generate Remote Attestation Quote based on a random string of data
    const getRemoteAttestation = await client.tdxQuote(randomNumString);

    res.status(200).json(getRemoteAttestation);
}
