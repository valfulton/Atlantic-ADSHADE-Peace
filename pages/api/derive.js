// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { TappdClient } from '@phala/dstack-sdk';
import { generateSeedPhrase } from 'near-seed-phrase';
import { setKey, getImplicit, getAccount } from '../../utils/near-provider';
import 'dotenv/config';

export const dynamic = 'force-dynamic';

// randomness only available to this instance of TEE
const randomArray = new Uint8Array(32);
crypto.getRandomValues(randomArray);

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;

export default async function derive(req, res) {
    if (process.env.NEXT_PUBLIC_accountId !== undefined) {
        const accountId = process.env.NEXT_PUBLIC_accountId;
        const account = getAccount(accountId);
        const balance = await account.getAccountBalance();

        setKey(
            'test',
            'ed25519:5Da461pSxbSX8pc8L2SiQMwgHJJBYEovMVp7XgZRZLVbf1sk8pu139ie89MftYEQBJtN5dLc349FPXgUyBBE1mpx',
        );

        res.status(200).json({
            accountId,
            balance,
        });
        return;
    }

    const client = new TappdClient(endpoint);
    // randomness from TEE hardware
    const randomDeriveKey = await client.deriveKey(
        Buffer.from(randomArray).toString('hex'),
        Buffer.from(randomArray).toString('hex'),
    );
    // hash of combined randomness
    const hash = await crypto.subtle.digest(
        'SHA-256',
        Buffer.concat([randomArray, randomDeriveKey.asUint8Array(32)]),
    );
    // data.secretKey should not be exfiltrated anywhere
    // no logs or debugging tools
    const data = generateSeedPhrase(hash);
    // set the accountId
    const accountId = (process.env.accountId = getImplicit(data.publicKey));
    // set the secretKey (inMemoryKeyStore only)
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
