import { TwitterApi } from 'twitter-api-v2';

export default async function search(req, res) {
    res.status(200).json({ contractId: process.env.NEXT_PUBLIC_contractId });
}
