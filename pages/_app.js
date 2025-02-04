import '../styles/globals.css';

process.env.secretKey = process.env.NEXT_PUBLIC_secretKey;
process.env.accountId = process.env.NEXT_PUBLIC_accountId;
process.env.contractId = process.env.NEXT_PUBLIC_contractId;
process.env.mpcPublicKey = process.env.NEXT_PUBLIC_mpcPublicKey;
process.env.useDevAccount = process.env.NEXT_PUBLIC_useDevAccount;

function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />;
}

export default MyApp;
