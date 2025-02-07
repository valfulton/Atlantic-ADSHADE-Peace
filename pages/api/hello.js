import { TappdClient } from '../../utils/tappd';

export const dynamic = 'force-dynamic';

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
export default async function hello(req, res) {
    const client = new TappdClient(endpoint);
    await client.getInfo();

    res.status(200).json({ ok: true });
}
