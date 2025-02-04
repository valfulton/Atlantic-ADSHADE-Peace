import Head from 'next/head';
import styles from '../styles/Home.module.css';

import { saveAs } from 'file-saver';
import { useState, useEffect } from 'react';

export default function Home() {
    const [accountId, setAccountId] = useState();

    const getKey = async () => {
        const res = await fetch('/api/derive').then((r) => r.json());
        setAccountId(res.accountId);
        console.log(res);
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
                <h1 className={styles.title}>Phala dStack x NEAR</h1>
                <ol>
                    <li>
                        This app is designed to run on Phala Cloud inside a TEE
                        and be verified.
                    </li>
                    <li>
                        It produces a remote attestation quote that is verified
                        by a NEAR contract.
                    </li>
                    <li>Follow the steps below to verify your app.</li>
                </ol>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <a
                            href="https://github.com/mattlockyer/dcap-qvl/"
                            target="_blank"
                        >
                            <h3>Step 1. Get the tools &rarr;</h3>
                            <p>
                                Clone this repo and make sure you have Rust
                                cargo installed. You will need it later.
                            </p>
                        </a>
                    </div>

                    <a
                        href="#"
                        className={styles.card}
                        onClick={async () => {
                            const res = await fetch('/api/quote').then((r) =>
                                r.json(),
                            );

                            console.log(res);

                            const file = new File(
                                [res.quote.substring(2)],
                                'quote_hex',
                                {
                                    type: 'text/plain;charset=utf-8',
                                },
                            );
                            saveAs(file);
                        }}
                    >
                        <h3>Step 2. Download quote hex &rarr;</h3>
                        <p>
                            Download this TEE's remote attestation quote hex and
                            save it in the /cli folder of the cloned repo from
                            Step 1.
                        </p>
                    </a>

                    <div className={styles.card}>
                        <h3>Step 3.</h3>
                        <p>Run the cli and get the quote collateral.</p>
                    </div>

                    <div className={styles.card}>
                        <h3>Step 4.</h3>
                        <p>
                            Send NEAR to the TEE's account:
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
                        </p>
                    </div>

                    <a
                        href="#"
                        className={styles.card}
                        onClick={async () => {
                            const res = await fetch('/api/verify').then((r) =>
                                r.json(),
                            );

                            console.log(res);
                        }}
                    >
                        <h3>Step 5.</h3>
                        <p>
                            Verify the TEE in the contract:
                            <br />
                            <br />
                            {process.env.contractId}
                        </p>
                    </a>
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
