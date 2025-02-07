import 'dotenv/config';
export const dynamic = 'force-dynamic';
import { contractCall } from '../../utils/near-provider';

export default async function verify(req, res) {
    const res2 = await contractCall({
        methodName: 'verify_quote',
        args: {
            quote_hex,
            collateral: JSON.stringify(collateral),
        },
    });

    if (!res2) {
        res.status(200).json({ ok: true });
        return;
    }

    res.status(200).json(res2);
}
