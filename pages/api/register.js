import 'dotenv/config';
import { TappdClient } from '../../utils/tappd';
import { contractCall } from '../../utils/near-provider';

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
export const dynamic = 'force-dynamic';

export default async function register(req, res) {
    // env dev
    if (process.env.NEXT_PUBLIC_accountId !== undefined) {
        // getting collateral won't work with a simulated TEE quote
        console.log('cannot register while running tappd simulator:', endpoint);
        return;
    }

    // env prod in TEE
    const client = new TappdClient(endpoint);

    // get tcb info from tappd
    const { tcb_info } = await client.getInfo();
    const { app_compose } = JSON.parse(tcb_info);
    // match 'sha256:' in docker-compose.yaml (arrange docker-compose.yaml accordingly)
    const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

    // get TDX quote
    const randomNumString = Math.random().toString();
    const ra = await client.tdxQuote(randomNumString);
    const quote_hex = ra.quote.replace(/^0x/, '');

    // get quote collateral
    const formData = new FormData();
    formData.append('hex', quote_hex);
    let collateral, checksum;
    // WARNING: this endpoint could throw or be offline
    const res2 = await (
        await fetch('https://proof.t16z.com/api/upload', {
            method: 'POST',
            body: formData,
        })
    ).json();
    checksum = res2.checksum;
    collateral = JSON.stringify(res2.quote_collateral);

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

    res.status(200).json({ registered: res3 });
}
