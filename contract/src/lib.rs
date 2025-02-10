use hex::decode;
use near_sdk::{
    env::{self, block_timestamp},
    log, near, require,
    store::IterableMap,
    AccountId, PanicOnDefault,
};

use dcap_qvl::verify;

mod collateral;

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Worker {
    checksum: String,
    image_hash: String,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub worker_by_account_id: IterableMap<AccountId, Worker>,
}

#[near]
impl Contract {
    #[init]
    #[private]
    pub fn init(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            worker_by_account_id: IterableMap::new(b"a"),
        }
    }

    // owner methods

    pub fn owner_only(&mut self) {
        require!(env::predecessor_account_id() == self.owner_id);

        log!("hello owner");
    }

    pub fn register_worker(
        &mut self,
        quote_hex: String,
        collateral: String,
        checksum: String,
        image_hash: String,
    ) -> bool {
        let collateral = collateral::get_collateral(collateral);
        let quote = decode(quote_hex).unwrap();
        let now = block_timestamp() / 1000000000;
        let result = verify::verify(&quote, &collateral, now);

        log!("{:?}", result);

        if result.ok().is_some() {
            let predecessor = env::predecessor_account_id();
            self.worker_by_account_id.insert(
                predecessor,
                Worker {
                    checksum,
                    image_hash,
                },
            );
            return true;
        }
        false
    }

    pub fn get_worker(&self, account_id: AccountId) -> Worker {
        self.worker_by_account_id
            .get(&account_id)
            .unwrap()
            .to_owned()
    }
}
