const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
const accountId = process.env.accountId;
const useDevAccount = process.env.useDevAccount;

export default function hello(req, res) {
    res.status(200).json({
        test: 'hello',
    });
}
