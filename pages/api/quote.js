import { TappdClient } from '@phala/dstack-sdk';
import 'dotenv/config';
import { contractCall } from '../../utils/near-provider';

export const dynamic = 'force-dynamic';

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;

export default async function quote(req, res) {
    const client = new TappdClient(endpoint);
    const randomNumString = Math.random().toString();
    const ra = await client.tdxQuote(randomNumString);

    let quote_hex = ra.quote;
    quote_hex = quote_hex.replace(/^0x/, '');

    const formData = new FormData();
    formData.append('hex', quote_hex);

    let collateral, checksum;
    if (typeof endpoint === 'string' || process.env.NEXT_PUBLIC_accountId) {
        console.log('RUNNING TAPPD SIMULATOR ENDPOINT:', endpoint);
        return;
    } else {
        try {
            const res2 = await (
                await fetch('https://proof.t16z.com/api/upload', {
                    method: 'POST',
                    body: formData,
                })
            ).json();

            checksum = res2.checksum;
            collateral = JSON.stringify(res2.quote_collateral);
        } catch (e) {
            console.log(e);
        }
    }

    const res3 = await contractCall({
        methodName: 'verify_quote',
        args: {
            quote_hex,
            collateral,
            checksum,
            image_hash: 'foo',
        },
    });

    res.status(200).json({ verify_quote: res3 });
}
