import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import { contractView, getAccount } from '../utils/near-provider';
import { formatNearAmount } from 'near-api-js/lib/utils/format';

export default function Home() {
    const [accountId, setAccountId] = useState();
    const [balance, setBalance] = useState();

    const getKey = async () => {
        const res = await fetch('/api/derive').then((r) => r.json());
        setAccountId(res.accountId);
        setBalance(res.balance);
    };

    useEffect(() => {
        getKey();
    }, []);

    return (
        <div className={styles.container}>
            <Head>
                <title>Create Next App</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Based Agent Template</h1>
                <ol>
                    <li>
                        This worker agent app is designed to run on Phala Cloud
                        inside a TEE and be verified by the worker's smart
                        contract.
                    </li>
                    <li>
                        The app derives a key that is unique to the running
                        instance and TEE hardware.
                    </li>
                    <li>
                        The app calls the worker smart contract and registers
                        itself by using the remote attestation quote.
                    </li>
                    <li>Follow the steps below to verify your app.</li>
                </ol>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h3>Step 1.</h3>
                        <p>
                            Fund the worker agent's account:
                            <br />
                            <br />
                            {accountId?.length >= 24
                                ? accountId?.substring(0, 24) + '...'
                                : accountId}
                            <br />
                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(accountId)
                                }
                            >
                                copy
                            </button>
                            <br />
                            <br />
                            balance:{' '}
                            {balance
                                ? formatNearAmount(balance.available, 4)
                                : 0}
                        </p>
                    </div>

                    {parseInt(balance?.available, 10) !== 0 && (
                        <>
                            <a
                                href="#"
                                className={styles.card}
                                onClick={async () => {
                                    const res = await fetch(
                                        '/api/register',
                                    ).then((r) => r.json());

                                    console.log(res);
                                }}
                            >
                                <h3>Step 2.</h3>
                                <p>
                                    Verify the worker agent in the contract:
                                    <br />
                                    <br />
                                    {process.env.NEXT_PUBLIC_contractId}
                                </p>
                            </a>

                            <a
                                href="#"
                                className={styles.card}
                                onClick={async () => {
                                    const account = getAccount();

                                    const res = await contractView({
                                        methodName: 'get_tee',
                                        args: {
                                            account_id: account.accountId,
                                        },
                                    });

                                    console.log(res);
                                }}
                            >
                                <h3>Step 3.</h3>
                                <p>Check if this agent is verified.</p>
                            </a>
                        </>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by{' '}
                    <img
                        src="/vercel.svg"
                        alt="Vercel Logo"
                        className={styles.logo}
                    />
                </a>
            </footer>
        </div>
    );
}
