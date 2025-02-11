import { TappdClient } from '../../utils/tappd';
import 'dotenv/config';
import { contractCall } from '../../utils/near-provider';

export const dynamic = 'force-dynamic';

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;

export default async function register(req, res) {
    const client = new TappdClient(endpoint);

    // get tcb info from tappd
    const { tcb_info } = await client.getInfo();
    console.log(typeof tcb_info, tcb_info);
    const { app_compose } = JSON.parse(tcb_info);
    console.log(typeof app_compose, app_compose);
    // first sha256: match of docker-compose.yaml will be codehash (arrange docker-compose.yaml accordingly)
    const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

    // get quote
    const randomNumString = Math.random().toString();
    const ra = await client.tdxQuote(randomNumString);
    let quote_hex = ra.quote;
    quote_hex = quote_hex.replace(/^0x/, '');

    // get quote collateral
    const formData = new FormData();
    formData.append('hex', quote_hex);
    let collateral, checksum;
    if (typeof endpoint === 'string' || process.env.NEXT_PUBLIC_accountId) {
        // getting collateral won't work with a simulated TEE quote
        console.log('RUNNING TAPPD SIMULATOR ENDPOINT:', endpoint);
        return;
    } else {
        // WARNING: this endpoint could throw or be offline
        const res2 = await (
            await fetch('https://proof.t16z.com/api/upload', {
                method: 'POST',
                body: formData,
            })
        ).json();
        checksum = res2.checksum;
        collateral = JSON.stringify(res2.quote_collateral);
    }

    // register the worker (returns bool)
    const res3 = await contractCall({
        methodName: 'register_worker',
        args: {
            quote_hex,
            collateral,
            checksum,
            codehash,
        },
    });

    res.status(200).json({ register_worker: res3 });
}
