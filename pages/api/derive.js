// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { TappdClient } from '@phala/dstack-sdk';
import { generateSeedPhrase } from 'near-seed-phrase';
import { setKey, getImplicit, getAccount } from '../../utils/near-provider';
import 'dotenv/config';

export const dynamic = 'force-dynamic';

const randomArray = new Uint8Array(32);
crypto.getRandomValues(randomArray);

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;

export default async function derive(req, res) {
    console.log('hey');
    if (process.env.NEXT_PUBLIC_useDevAccount === 'true') {
        const accountId = process.env.NEXT_PUBLIC_accountId;
        const account = getAccount(accountId);
        const balance = await account.getAccountBalance();

        res.status(200).json({
            accountId,
            balance,
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
    // console.log(data);
    const accountId = (process.env.accountId = getImplicit(data.publicKey));
    setKey(accountId, data.secretKey);

    let balance = { available: '0' };
    try {
        const account = getAccount(accountId);
        balance = await account.getAccountBalance();
    } catch (e) {
        if (e.type === 'AccountDoesNotExist') {
            console.log(e.type);
        } else {
            throw e;
        }
    }

    res.status(200).json({
        accountId,
        balance,
    });
}
