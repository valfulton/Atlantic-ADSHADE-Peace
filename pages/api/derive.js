// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { TappdClient } from '@phala/dstack-sdk';
import { generateSeedPhrase } from 'near-seed-phrase';
import { setKey, getImplicit } from './utils/near-provider';
import 'dotenv/config';

export const dynamic = 'force-dynamic';

const randomArray = new Uint8Array(32);
crypto.getRandomValues(randomArray);

const endpoint =
    process.env.DSTACK_SIMULATOR_ENDPOINT || 'http://localhost:8090';

export default async function derive(req, res) {
    if (process.env.useDevAccount === 'true') {
        res.status(200).json({
            accountId: process.env.accountId,
        });
        return;
    }

    const client = new TappdClient(endpoint);

    const randomDeriveKey = await client.deriveKey(
        Buffer.from(randomArray).toString('hex'),
        Buffer.from(randomArray).toString('hex'),
    );

    const hash = await crypto.subtle.digest(
        'SHA-256',
        Buffer.concat([randomArray, randomDeriveKey.asUint8Array(32)]),
    );

    const data = generateSeedPhrase(hash);

    const accountId = (process.env.accountId = getImplicit(data.publicKey));
    process.env.secretKey = data.secretKey;

    setKey(accountId, data.secretKey);

    res.status(200).json({
        accountId,
    });
}
