use dcap_qvl::QuoteCollateralV3;

pub fn get_collateral(raw_tcb_info: String) -> QuoteCollateralV3 {
    let tcb_info_json: serde_json::Value =
        serde_json::from_str(&raw_tcb_info).expect("TCB Info should be valid JSON");

    let tcb_info_issuer_chain = tcb_info_json["tcb_info_issuer_chain"]
        .as_str()
        .unwrap()
        .to_owned();
    let tcb_info = tcb_info_json["tcb_info"].as_str().unwrap().to_owned();
    let tcb_info_signature =
        hex::decode(tcb_info_json["tcb_info_signature"].as_str().unwrap()).unwrap();
    let qe_identity_issuer_chain = tcb_info_json["qe_identity_issuer_chain"]
        .as_str()
        .unwrap()
        .to_owned();
    let qe_identity = tcb_info_json["qe_identity"].as_str().unwrap().to_owned();
    let qe_identity_signature =
        hex::decode(tcb_info_json["qe_identity_signature"].as_str().unwrap()).unwrap();

    QuoteCollateralV3 {
        tcb_info_issuer_chain,
        tcb_info,
        tcb_info_signature,
        qe_identity_issuer_chain,
        qe_identity,
        qe_identity_signature,
    }
}

use hex::{decode, encode};
use serde_json::Value;
use sha2::{Digest as _, Sha256, Sha384};

pub fn replay_event_log(event_log: Vec<Value>, which: u8) -> String {
    let mut digest = [0u8; 48];

    for event in event_log {
        let imr = event["imr"].as_u64().unwrap() as u8;
        if imr != which {
            continue;
        }

        let mut hasher = Sha384::new();
        hasher.update(digest);
        hasher.update(
            decode(event["digest"].as_str().unwrap())
                .unwrap()
                .as_slice(),
        );
        digest = hasher.finalize().into();
    }

    encode(digest)
}

pub fn replay_app_compose(app_compose: &str) -> String {
    // let mod_app_compose = app_compose.re

    let mut sha256 = Sha256::new();
    sha256.update(app_compose);
    let sha256bytes: [u8; 32] = sha256.finalize().into();

    let mut hasher = Sha384::new();
    hasher.update(vec![0x01, 0x00, 0x00, 0x08]);
    hasher.update(b":");
    hasher.update("compose-hash".as_bytes());
    hasher.update(b":");
    hasher.update(sha256bytes);
    let digest: [u8; 48] = hasher.finalize().into();

    encode(digest)
}

//4dfdcda84a67cdf8add4be3b662112963fb1870daca4d2258e791c8e998bc95c8d768ffabb9c5ef12cc4c1de9007730d

#[test]
fn test_rtmr3() {
    use dcap_qvl::verify;
    use serde_json::json;

    let tcb_info = json!(
        {
            "rootfs_hash": "738ae348dbf674b3399300c0b9416c203e9b645c6ffee233035d09003cccad12f71becc805ad8d97575bc790c6819216",
            "mrtd": "c68518a0ebb42136c12b2275164f8c72f25fa9a34392228687ed6e9caeb9c0f1dbd895e9cf475121c029dc47e70e91fd",
            "rtmr0": "85e0855a6384fa1c8a6ab36d0dcbfaa11a5753e5a070c08218ae5fe872fcb86967fd2449c29e22e59dc9fec998cb6547",
            "rtmr1": "4a7db64a609c77e85f603c23e9a9fd03bfd9e6b52ce527f774a598e66d58386026cea79b2aea13b81a0b70cfacdec0ca",
            "rtmr2": "8a4fe048fea22663152ef128853caa5c033cbe66baf32ba1ff7f6b1afc1624c279f50a4cbc522a735ca6f69551e61ef2",
            "rtmr3": "561c1b02351cd6f7c803dd36bc95ba25463aa025ce7761156260c9131a5d7c03aeccc10e12160ec3205bb2876a203a7f",
            "event_log": [
              {
                "imr": 0,
                "event_type": 0,
                "digest": "0e35f1b315ba6c912cf791e5c79dd9d3a2b8704516aa27d4e5aa78fb09ede04aef2bbd02ac7a8734c48562b9c26ba35d",
                "event": "",
                "event_payload": "095464785461626c65000100000000000000af96bb93f2b9b84e9462e0ba745642360090800000000000"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "344bc51c980ba621aaa00da3ed7436f7d6e549197dfe699515dfa2c6583d95e6412af21c097d473155875ffd561d6790",
                "event": "",
                "event_payload": "2946762858585858585858582d585858582d585858582d585858582d58585858585858585858585829000000c0ff000000000040080000000000"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "9dc3a1f80bcec915391dcda5ffbb15e7419f77eab462bbf72b42166fb70d50325e37b36f93537a863769bcf9bedae6fb",
                "event": "",
                "event_payload": "61dfe48bca93d211aa0d00e098032b8c0a00000000000000000000000000000053006500630075007200650042006f006f007400"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "6f2e3cbc14f9def86980f5f66fd85e99d63e69a73014ed8a5633ce56eca5b64b692108c56110e22acadcef58c3250f1b",
                "event": "",
                "event_payload": "61dfe48bca93d211aa0d00e098032b8c0200000000000000000000000000000050004b00"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "d607c0efb41c0d757d69bca0615c3a9ac0b1db06c557d992e906c6b7dee40e0e031640c7bfd7bcd35844ef9edeadc6f9",
                "event": "",
                "event_payload": "61dfe48bca93d211aa0d00e098032b8c030000000000000000000000000000004b0045004b00"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "08a74f8963b337acb6c93682f934496373679dd26af1089cb4eaf0c30cf260a12e814856385ab8843e56a9acea19e127",
                "event": "",
                "event_payload": "cbb219d73a3d9645a3bcdad00e67656f0200000000000000000000000000000064006200"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "18cc6e01f0c6ea99aa23f8a280423e94ad81d96d0aeb5180504fc0f7a40cb3619dd39bd6a95ec1680a86ed6ab0f9828d",
                "event": "",
                "event_payload": "cbb219d73a3d9645a3bcdad00e67656f03000000000000000000000000000000640062007800"
              },
              {
                "imr": 0,
                "event_type": 4,
                "digest": "394341b7182cd227c5c6b07ef8000cdfd86136c4292b8e576573ad7ed9ae41019f5818b4b971c9effc60e1ad9f1289f0",
                "event": "",
                "event_payload": "00000000"
              },
              {
                "imr": 0,
                "event_type": 10,
                "digest": "68cd79315e70aecd4afe7c1b23a5ed7b3b8e51a477e1739f111b3156def86bbc56ebf239dcd4591bc7a9fff90023f481",
                "event": "",
                "event_payload": "414350492044415441"
              },
              {
                "imr": 0,
                "event_type": 10,
                "digest": "6bc203b3843388cc4918459c3f5c6d1300a796fb594781b7ecfaa3ae7456975f095bfcc1156c9f2d25e8b8bc1b520f66",
                "event": "",
                "event_payload": "414350492044415441"
              },
              {
                "imr": 0,
                "event_type": 10,
                "digest": "ec9e8622a100c399d71062a945f95d8e4cdb7294e8b1c6d17a6a8d37b5084444000a78b007ef533f290243421256d25c",
                "event": "",
                "event_payload": "414350492044415441"
              },
              {
                "imr": 1,
                "event_type": 0,
                "digest": "f51c5215e1ae1e5202fb0a710248e13c2bf2824b7f0b2a1675f63e9fd37befb93fbb97a4f8630879168b76aee3b198e2",
                "event": "",
                "event_payload": "1860447b0000000000f4b2000000000000000000000000002a000000000000000403140072f728144ab61e44b8c39ebdd7f893c7040412006b00650072006e0065006c0000007fff0400"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "1dd6f7b457ad880d840d41c961283bab688e94e4b59359ea45686581e90feccea3c624b1226113f824f315eb60ae0a7c",
                "event": "",
                "event_payload": "61dfe48bca93d211aa0d00e098032b8c0900000000000000020000000000000042006f006f0074004f0072006400650072000000"
              },
              {
                "imr": 0,
                "event_type": 0,
                "digest": "23ada07f5261f12f34a0bd8e46760962d6b4d576a416f1fea1c64bc656b1d28eacf7047ae6e967c58fd2a98bfa74c298",
                "event": "",
                "event_payload": "61dfe48bca93d211aa0d00e098032b8c08000000000000003e0000000000000042006f006f0074003000300030003000090100002c0055006900410070007000000004071400c9bdb87cebf8344faaea3ee4af6516a10406140021aa2c4614760345836e8ab6f46623317fff0400"
              },
              {
                "imr": 1,
                "event_type": 0,
                "digest": "77a0dab2312b4e1e57a84d865a21e5b2ee8d677a21012ada819d0a98988078d3d740f6346bfe0abaa938ca20439a8d71",
                "event": "",
                "event_payload": "43616c6c696e6720454649204170706c69636174696f6e2066726f6d20426f6f74204f7074696f6e"
              },
              {
                "imr": 1,
                "event_type": 4,
                "digest": "394341b7182cd227c5c6b07ef8000cdfd86136c4292b8e576573ad7ed9ae41019f5818b4b971c9effc60e1ad9f1289f0",
                "event": "",
                "event_payload": "00000000"
              },
              {
                "imr": 2,
                "event_type": 6,
                "digest": "a68ac6d65dd62f392826c2ae44f6846363ced3418c96574b3e168de9205c8553b8198c3b9d206bc432d70a923c25b098",
                "event": "",
                "event_payload": "ed223b8f1a0000004c4f414445445f494d4147453a3a4c6f61644f7074696f6e7300"
              },
              {
                "imr": 2,
                "event_type": 6,
                "digest": "21a1d39f7395e15c35b91dacf14714cf2e9ead77e69f076ce164798272c1838312b2d82b3307b91929a4d7dbc6f1e48b",
                "event": "",
                "event_payload": "ec223b8f0d0000004c696e757820696e6974726400"
              },
              {
                "imr": 1,
                "event_type": 0,
                "digest": "214b0bef1379756011344877743fdc2a5382bac6e70362d624ccf3f654407c1b4badf7d8f9295dd3dabdef65b27677e0",
                "event": "",
                "event_payload": "4578697420426f6f7420536572766963657320496e766f636174696f6e"
              },
              {
                "imr": 1,
                "event_type": 0,
                "digest": "0a2e01c85deae718a530ad8c6d20a84009babe6c8989269e950d8cf440c6e997695e64d455c4174a652cd080f6230b74",
                "event": "",
                "event_payload": "4578697420426f6f742053657276696365732052657475726e656420776974682053756363657373"
              },
              {
                "imr": 3,
                "event_type": 134217729,
                "digest": "738ae348dbf674b3399300c0b9416c203e9b645c6ffee233035d09003cccad12f71becc805ad8d97575bc790c6819216",
                "event": "rootfs-hash",
                "event_payload": "4a89dadfa8c6be6d312beb51e24ef5bd4b3aeb695f11f4e2ff9c87eac907389b"
              },
              {
                "imr": 3,
                "event_type": 134217729,
                "digest": "8ecf784c418ff83b7c8d67adfa7b6c13c93766e0356fd915d038133a170fa09b42ef91aad28642adcee58a0c8a542e7d",
                "event": "app-id",
                "event_payload": "9f91439ecacc4f8845a9cd81cc141256d5e1bce3"
              },
              {
                "imr": 3,
                "event_type": 134217729,
                "digest": "2ce008f8d73c3d9d6d0a176828da3ae21eea3f748f61d655d142416ac82c19a23eaf239a3654fac97e09588264c439ff",
                "event": "compose-hash",
                "event_payload": "9f91439ecacc4f8845a9cd81cc141256d5e1bce3ab2c1533c842402d1a306ff0"
              },
              {
                "imr": 3,
                "event_type": 134217729,
                "digest": "5b6a576d1da40f04179ad469e00f90a1c0044bc9e8472d0da2776acb108dc98a73560d42cea6b8b763eb4a0e6d4d82d5",
                "event": "ca-cert-hash",
                "event_payload": "d2d9c7c29e3f18e69cba87438cef21eea084c2110858230cd39c5decc629a958"
              },
              {
                "imr": 3,
                "event_type": 134217729,
                "digest": "5243ab8e3d13d9b22168b43c901b4559c534d9dafa434bba36e7b86756cdedb58e6cbc9a41473de3e117768f83e2f2cc",
                "event": "instance-id",
                "event_payload": "f96d8cde26eacea3712d3a4ffc693c4942701e08"
              }
            ],
            "app_compose": "{\"bash_script\":null,\"docker_compose_file\":\"version: \'4.0\'\\nservices:\\n    web:\\n        platform: linux/amd64 # Explicitly set for TDX\\n        image: mattdlockyer/based-agent-test:latest@sha256:67b7d2074ac0b6621035b9938f896ed2367707d8384e1e3baa4c0c4c39d05da7\\n        container_name: web\\n        ports:\\n            - \'3000:3000\'\\n        volumes:\\n            - /var/run/tappd.sock:/var/run/tappd.sock\\n        restart: always\\n\",\"docker_config\":{\"password\":\"\",\"registry\":null,\"username\":\"\"},\"features\":[\"kms\",\"tproxy-net\"],\"kms_enabled\":true,\"manifest_version\":2,\"name\":\"test\",\"pre_launch_script\":\"\\n#!/bin/bash\\necho \\\"----------------------------------------------\\\"\\necho \\\"Running Phala Cloud Pre-Launch Script v0.0.1\\\"\\necho \\\"----------------------------------------------\\\"\\nset -e\\n\\n# Function: Perform Docker cleanup\\nperform_cleanup() {\\n    echo \\\"Pruning unused images\\\"\\n    docker image prune -af\\n    echo \\\"Pruning unused volumes\\\"\\n    docker volume prune -f\\n}\\n\\n# Function: Check Docker login status without exposing credentials\\ncheck_docker_login() {\\n    # Try to verify login status without exposing credentials\\n    if docker info 2>/dev/null | grep -q \\\"Username\\\"; then\\n        return 0\\n    else\\n        return 1\\n    fi\\n}\\n\\n# Function: Check AWS ECR login status\\ncheck_ecr_login() {\\n    # Check if we can access the registry without exposing credentials\\n    if aws ecr get-authorization-token --region $DSTACK_AWS_REGION &>/dev/null; then\\n        return 0\\n    else\\n        return 1\\n    fi\\n}\\n\\n# Main logic starts here\\necho \\\"Starting login process...\\\"\\n\\n# Check if Docker credentials exist\\nif [[ -n \\\"$DSTACK_DOCKER_USERNAME\\\" && -n \\\"$DSTACK_DOCKER_PASSWORD\\\" ]]; then\\n    echo \\\"Docker credentials found\\\"\\n    \\n    # Check if already logged in\\n    if check_docker_login; then\\n        echo \\\"Already logged in to Docker registry\\\"\\n    else\\n        echo \\\"Logging in to Docker registry...\\\"\\n        # Login without exposing password in process list\\n        echo \\\"$DSTACK_DOCKER_PASSWORD\\\" | docker login -u \\\"$DSTACK_DOCKER_USERNAME\\\" --password-stdin\\n        \\n        if [ $? -eq 0 ]; then\\n            echo \\\"Docker login successful\\\"\\n        else\\n            echo \\\"Docker login failed\\\"\\n            exit 1\\n        fi\\n    fi\\n# Check if AWS ECR credentials exist\\nelif [[ -n \\\"$DSTACK_AWS_ACCESS_KEY_ID\\\" && -n \\\"$DSTACK_AWS_SECRET_ACCESS_KEY\\\" && -n \\\"$DSTACK_AWS_REGION\\\" && -n \\\"$DSTACK_AWS_ECR_REGISTRY\\\" ]]; then\\n    echo \\\"AWS ECR credentials found\\\"\\n    \\n    # Check if AWS CLI is installed\\n    if ! command -v aws &> /dev/null; then\\n        echo \\\"AWS CLI not installed, installing...\\\"\\n        curl \\\"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\\\" -o \\\"awscliv2.zip\\\"\\n        echo \\\"6ff031a26df7daebbfa3ccddc9af1450 awscliv2.zip\\\" | md5sum -c\\n        if [ $? -ne 0 ]; then\\n            echo \\\"MD5 checksum failed\\\"\\n            exit 1\\n        fi\\n        unzip awscliv2.zip &> /dev/null\\n        ./aws/install\\n        \\n        # Clean up installation files\\n        rm -rf awscliv2.zip aws\\n    else\\n        echo \\\"AWS CLI is already installed: $(which aws)\\\"\\n    fi\\n    \\n    # Configure AWS CLI\\n    aws configure set aws_access_key_id \\\"$DSTACK_AWS_ACCESS_KEY_ID\\\"\\n    aws configure set aws_secret_access_key \\\"$DSTACK_AWS_SECRET_ACCESS_KEY\\\"\\n    aws configure set default.region $DSTACK_AWS_REGION\\n    echo \\\"Logging in to AWS ECR...\\\"\\n    aws ecr get-login-password --region $DSTACK_AWS_REGION | docker login --username AWS --password-stdin \\\"$DSTACK_AWS_ECR_REGISTRY\\\"\\n    if [ $? -eq 0 ]; then\\n        echo \\\"AWS ECR login successful\\\"\\n    else\\n        echo \\\"AWS ECR login failed\\\"\\n        exit 1\\n    fi\\nfi\\n\\nperform_cleanup\\n\\necho \\\"----------------------------------------------\\\"\\necho \\\"Script execution completed\\\"\\necho \\\"----------------------------------------------\\\"\\n\",\"public_logs\":true,\"public_sysinfo\":true,\"runner\":\"docker-compose\",\"salt\":\"6412e8ad-2621-4166-8fdb-8a01df042e15\",\"tproxy_enabled\":true,\"version\":\"1.0.0\"}"
          }
    );

    let event_log = tcb_info["event_log"].as_array().unwrap();

    let digest = replay_event_log(event_log.to_owned(), 3);

    let compose_hash: String = replay_app_compose(tcb_info["app_compose"].as_str().unwrap());

    println!("digest {:?}", digest);
    println!("compose_hash {:?}", compose_hash);
    println!("expected compose_hash {:?}", "2ce008f8d73c3d9d6d0a176828da3ae21eea3f748f61d655d142416ac82c19a23eaf239a3654fac97e09588264c439ff");
}

#[test]
fn test() {
    use dcap_qvl::verify;
    use hex::decode;
    use serde_json::json;
    use std::time::SystemTime;

    let tcb_json = json!({"tcb_info_issuer_chain":"-----BEGIN CERTIFICATE-----\nMIICizCCAjKgAwIBAgIUfjiC1ftVKUpASY5FhAPpFJG99FUwCgYIKoZIzj0EAwIw\naDEaMBgGA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENv\ncnBvcmF0aW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJ\nBgNVBAYTAlVTMB4XDTE4MDUyMTEwNTAxMFoXDTI1MDUyMTEwNTAxMFowbDEeMBwG\nA1UEAwwVSW50ZWwgU0dYIFRDQiBTaWduaW5nMRowGAYDVQQKDBFJbnRlbCBDb3Jw\nb3JhdGlvbjEUMBIGA1UEBwwLU2FudGEgQ2xhcmExCzAJBgNVBAgMAkNBMQswCQYD\nVQQGEwJVUzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABENFG8xzydWRfK92bmGv\nP+mAh91PEyV7Jh6FGJd5ndE9aBH7R3E4A7ubrlh/zN3C4xvpoouGlirMba+W2lju\nypajgbUwgbIwHwYDVR0jBBgwFoAUImUM1lqdNInzg7SVUr9QGzknBqwwUgYDVR0f\nBEswSTBHoEWgQ4ZBaHR0cHM6Ly9jZXJ0aWZpY2F0ZXMudHJ1c3RlZHNlcnZpY2Vz\nLmludGVsLmNvbS9JbnRlbFNHWFJvb3RDQS5kZXIwHQYDVR0OBBYEFH44gtX7VSlK\nQEmORYQD6RSRvfRVMA4GA1UdDwEB/wQEAwIGwDAMBgNVHRMBAf8EAjAAMAoGCCqG\nSM49BAMCA0cAMEQCIB9C8wOAN/ImxDtGACV246KcqjagZOR0kyctyBrsGGJVAiAj\nftbrNGsGU8YH211dRiYNoPPu19Zp/ze8JmhujB0oBw==\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nMIICjzCCAjSgAwIBAgIUImUM1lqdNInzg7SVUr9QGzknBqwwCgYIKoZIzj0EAwIw\naDEaMBgGA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENv\ncnBvcmF0aW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJ\nBgNVBAYTAlVTMB4XDTE4MDUyMTEwNDUxMFoXDTQ5MTIzMTIzNTk1OVowaDEaMBgG\nA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENvcnBvcmF0\naW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJBgNVBAYT\nAlVTMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEC6nEwMDIYZOj/iPWsCzaEKi7\n1OiOSLRFhWGjbnBVJfVnkY4u3IjkDYYL0MxO4mqsyYjlBalTVYxFP2sJBK5zlKOB\nuzCBuDAfBgNVHSMEGDAWgBQiZQzWWp00ifODtJVSv1AbOScGrDBSBgNVHR8ESzBJ\nMEegRaBDhkFodHRwczovL2NlcnRpZmljYXRlcy50cnVzdGVkc2VydmljZXMuaW50\nZWwuY29tL0ludGVsU0dYUm9vdENBLmRlcjAdBgNVHQ4EFgQUImUM1lqdNInzg7SV\nUr9QGzknBqwwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwCgYI\nKoZIzj0EAwIDSQAwRgIhAOW/5QkR+S9CiSDcNoowLuPRLsWGf/Yi7GSX94BgwTwg\nAiEA4J0lrHoMs+Xo5o/sX6O9QWxHRAvZUGOdRQ7cvqRXaqI=\n-----END CERTIFICATE-----\n","tcb_info":"{\"id\":\"TDX\",\"version\":3,\"issueDate\":\"2025-02-05T16:49:21Z\",\"nextUpdate\":\"2025-03-07T16:49:21Z\",\"fmspc\":\"90c06f000000\",\"pceId\":\"0000\",\"tcbType\":0,\"tcbEvaluationDataNumber\":17,\"tdxModule\":{\"mrsigner\":\"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\",\"attributes\":\"0000000000000000\",\"attributesMask\":\"FFFFFFFFFFFFFFFF\"},\"tdxModuleIdentities\":[{\"id\":\"TDX_03\",\"mrsigner\":\"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\",\"attributes\":\"0000000000000000\",\"attributesMask\":\"FFFFFFFFFFFFFFFF\",\"tcbLevels\":[{\"tcb\":{\"isvsvn\":3},\"tcbDate\":\"2024-03-13T00:00:00Z\",\"tcbStatus\":\"UpToDate\"}]},{\"id\":\"TDX_01\",\"mrsigner\":\"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\",\"attributes\":\"0000000000000000\",\"attributesMask\":\"FFFFFFFFFFFFFFFF\",\"tcbLevels\":[{\"tcb\":{\"isvsvn\":4},\"tcbDate\":\"2024-03-13T00:00:00Z\",\"tcbStatus\":\"UpToDate\"},{\"tcb\":{\"isvsvn\":2},\"tcbDate\":\"2023-08-09T00:00:00Z\",\"tcbStatus\":\"OutOfDate\"}]}],\"tcbLevels\":[{\"tcb\":{\"sgxtcbcomponents\":[{\"svn\":2,\"category\":\"BIOS\",\"type\":\"Early Microcode Update\"},{\"svn\":2,\"category\":\"OS/VMM\",\"type\":\"SGX Late Microcode Update\"},{\"svn\":2,\"category\":\"OS/VMM\",\"type\":\"TXT SINIT\"},{\"svn\":2,\"category\":\"BIOS\"},{\"svn\":3,\"category\":\"BIOS\"},{\"svn\":1,\"category\":\"BIOS\"},{\"svn\":0},{\"svn\":5,\"category\":\"OS/VMM\",\"type\":\"SEAMLDR ACM\"},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0}],\"pcesvn\":13,\"tdxtcbcomponents\":[{\"svn\":5,\"category\":\"OS/VMM\",\"type\":\"TDX Module\"},{\"svn\":0,\"category\":\"OS/VMM\",\"type\":\"TDX Module\"},{\"svn\":2,\"category\":\"OS/VMM\",\"type\":\"TDX Late Microcode Update\"},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0}]},\"tcbDate\":\"2024-03-13T00:00:00Z\",\"tcbStatus\":\"UpToDate\"},{\"tcb\":{\"sgxtcbcomponents\":[{\"svn\":2,\"category\":\"BIOS\",\"type\":\"Early Microcode Update\"},{\"svn\":2,\"category\":\"OS/VMM\",\"type\":\"SGX Late Microcode Update\"},{\"svn\":2,\"category\":\"OS/VMM\",\"type\":\"TXT SINIT\"},{\"svn\":2,\"category\":\"BIOS\"},{\"svn\":3,\"category\":\"BIOS\"},{\"svn\":1,\"category\":\"BIOS\"},{\"svn\":0},{\"svn\":5,\"category\":\"OS/VMM\",\"type\":\"SEAMLDR ACM\"},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0}],\"pcesvn\":5,\"tdxtcbcomponents\":[{\"svn\":5,\"category\":\"OS/VMM\",\"type\":\"TDX Module\"},{\"svn\":0,\"category\":\"OS/VMM\",\"type\":\"TDX Module\"},{\"svn\":2,\"category\":\"OS/VMM\",\"type\":\"TDX Late Microcode Update\"},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0},{\"svn\":0}]},\"tcbDate\":\"2018-01-04T00:00:00Z\",\"tcbStatus\":\"OutOfDate\",\"advisoryIDs\":[\"INTEL-SA-00106\",\"INTEL-SA-00115\",\"INTEL-SA-00135\",\"INTEL-SA-00203\",\"INTEL-SA-00220\",\"INTEL-SA-00233\",\"INTEL-SA-00270\",\"INTEL-SA-00293\",\"INTEL-SA-00320\",\"INTEL-SA-00329\",\"INTEL-SA-00381\",\"INTEL-SA-00389\",\"INTEL-SA-00477\",\"INTEL-SA-00837\"]}]}","tcb_info_signature":"2b303685c8959e0c62b5d774621aa4545bb463bc4d28d2e1df14c4834438c3a22bd0a341ac4b8d5533957f419286f4bc0db28b5e9ce5764858cf09c4c409a80e","qe_identity_issuer_chain":"-----BEGIN CERTIFICATE-----\nMIICizCCAjKgAwIBAgIUfjiC1ftVKUpASY5FhAPpFJG99FUwCgYIKoZIzj0EAwIw\naDEaMBgGA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENv\ncnBvcmF0aW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJ\nBgNVBAYTAlVTMB4XDTE4MDUyMTEwNTAxMFoXDTI1MDUyMTEwNTAxMFowbDEeMBwG\nA1UEAwwVSW50ZWwgU0dYIFRDQiBTaWduaW5nMRowGAYDVQQKDBFJbnRlbCBDb3Jw\nb3JhdGlvbjEUMBIGA1UEBwwLU2FudGEgQ2xhcmExCzAJBgNVBAgMAkNBMQswCQYD\nVQQGEwJVUzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABENFG8xzydWRfK92bmGv\nP+mAh91PEyV7Jh6FGJd5ndE9aBH7R3E4A7ubrlh/zN3C4xvpoouGlirMba+W2lju\nypajgbUwgbIwHwYDVR0jBBgwFoAUImUM1lqdNInzg7SVUr9QGzknBqwwUgYDVR0f\nBEswSTBHoEWgQ4ZBaHR0cHM6Ly9jZXJ0aWZpY2F0ZXMudHJ1c3RlZHNlcnZpY2Vz\nLmludGVsLmNvbS9JbnRlbFNHWFJvb3RDQS5kZXIwHQYDVR0OBBYEFH44gtX7VSlK\nQEmORYQD6RSRvfRVMA4GA1UdDwEB/wQEAwIGwDAMBgNVHRMBAf8EAjAAMAoGCCqG\nSM49BAMCA0cAMEQCIB9C8wOAN/ImxDtGACV246KcqjagZOR0kyctyBrsGGJVAiAj\nftbrNGsGU8YH211dRiYNoPPu19Zp/ze8JmhujB0oBw==\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nMIICjzCCAjSgAwIBAgIUImUM1lqdNInzg7SVUr9QGzknBqwwCgYIKoZIzj0EAwIw\naDEaMBgGA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENv\ncnBvcmF0aW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJ\nBgNVBAYTAlVTMB4XDTE4MDUyMTEwNDUxMFoXDTQ5MTIzMTIzNTk1OVowaDEaMBgG\nA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENvcnBvcmF0\naW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJBgNVBAYT\nAlVTMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEC6nEwMDIYZOj/iPWsCzaEKi7\n1OiOSLRFhWGjbnBVJfVnkY4u3IjkDYYL0MxO4mqsyYjlBalTVYxFP2sJBK5zlKOB\nuzCBuDAfBgNVHSMEGDAWgBQiZQzWWp00ifODtJVSv1AbOScGrDBSBgNVHR8ESzBJ\nMEegRaBDhkFodHRwczovL2NlcnRpZmljYXRlcy50cnVzdGVkc2VydmljZXMuaW50\nZWwuY29tL0ludGVsU0dYUm9vdENBLmRlcjAdBgNVHQ4EFgQUImUM1lqdNInzg7SV\nUr9QGzknBqwwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwCgYI\nKoZIzj0EAwIDSQAwRgIhAOW/5QkR+S9CiSDcNoowLuPRLsWGf/Yi7GSX94BgwTwg\nAiEA4J0lrHoMs+Xo5o/sX6O9QWxHRAvZUGOdRQ7cvqRXaqI=\n-----END CERTIFICATE-----\n","qe_identity":"{\"id\":\"TD_QE\",\"version\":2,\"issueDate\":\"2025-02-05T17:04:30Z\",\"nextUpdate\":\"2025-03-07T17:04:30Z\",\"tcbEvaluationDataNumber\":17,\"miscselect\":\"00000000\",\"miscselectMask\":\"FFFFFFFF\",\"attributes\":\"11000000000000000000000000000000\",\"attributesMask\":\"FBFFFFFFFFFFFFFF0000000000000000\",\"mrsigner\":\"DC9E2A7C6F948F17474E34A7FC43ED030F7C1563F1BABDDF6340C82E0E54A8C5\",\"isvprodid\":2,\"tcbLevels\":[{\"tcb\":{\"isvsvn\":4},\"tcbDate\":\"2024-03-13T00:00:00Z\",\"tcbStatus\":\"UpToDate\"}]}","qe_identity_signature":"715093a4865972e5a8911c8c1acb18a91c4a8d579218d3430c774bb0b4b5bdc2377852e28fb159430c3a52eb4f4370390d27a4a1bd5af1010bda57ed86393aa2"});
    let raw_tcb_info = tcb_json.to_string();
    let collateral = get_collateral(raw_tcb_info);
    // println!("{:?}", collateral);
    let quote_hex = "040002008100000000000000939a7233f79c4ca9940a0db3957f060765004f4410967df7fc6a1faf0d9b6fc000000000060103000000000000000000000000005b38e33a6487958b72c3c12a938eaa5e3fd4510c51aeeab58c7d5ecee41d7c436489d6c8e4f92f160b7cad34207b00c100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000e702060000000000c68518a0ebb42136c12b2275164f8c72f25fa9a34392228687ed6e9caeb9c0f1dbd895e9cf475121c029dc47e70e91fd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000085e0855a6384fa1c8a6ab36d0dcbfaa11a5753e5a070c08218ae5fe872fcb86967fd2449c29e22e59dc9fec998cb65479b43f9f34a64bc7191352585be0da1774a1499e698ba77cbf6184547d53d1770d6524c1cfa00b86352f273fc272a8cfe7cc2dadd5849bad220ab122c4fbf25a74dc91cc12702447d3b5cac0f49b2b139994f5cd936b293e5f0f14dea4262d66835f7ab64f47b2be39b8e6ec73630df37fa4e7a391939b94092a32bcc0e297a468a11a6d1e495e6ab52df14378b54836fdd01e2ff5f121c9fe9517c0eddf3454d3ba7718e372eade98c54fbd547cc4bf035e52319e08c13b03caf9dc59614a51c99fc33095cc4b56ee80fb8edaa38e0dccc10000096ba8818409e5c6be88f1447ca674a415f3a298e3062fc0e6bace94ac795c85b8dac018b1d1f582e1a1b0c511d8f487a80f95a3c18a09e4f46cb6dc0b531d16dea2416715765b1163d7ab78e6365f880aaa949bcc52da6ee4f429c452d7c2a3840c70b07ac30baa63ea2aebdcc2c4412b33b5260871dde07855f7034437b27220600461000000303191b04ff0006000000000000000000000000000000000000000000000000000000000000000000000000000000001500000000000000e700000000000000e5a3a7b5d830c2953b98534c6c59a3a34fdc34e933f7f5898f0a85cf08846bca0000000000000000000000000000000000000000000000000000000000000000dc9e2a7c6f948f17474e34a7fc43ed030f7c1563f1babddf6340c82e0e54a8c500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ba6ecb2c97f5df2f0aab9df86134d244a3af486eb54cd8a7b3044142cb5ce31400000000000000000000000000000000000000000000000000000000000000007875d67120b2b6436dbd342770ecaa38e60b83c1acff344880717ccd2b6c94f15c8eeda61a90cc3796621adc89fd7ec9a101d607da7cafbba88a20c001abc4522000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f05005e0e00002d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d49494538544343424a65674177494241674956414e4f4175636f666a67516665314c54623476726e755543595454724d416f4743437147534d343942414d430a4d484178496a416742674e5642414d4d47556c756447567349464e4857434251513073675547786864475a76636d306751304578476a415942674e5642416f4d0a45556c756447567349454e76636e4276636d4630615739754d5251774567594456515148444174545957353059534244624746795954454c4d416b47413155450a4341774351304578437a414a42674e5642415954416c56544d423458445449314d4445774e4441784d4451774e6c6f5844544d794d4445774e4441784d4451770a4e6c6f77634445694d434147413155454177775a535735305a5777675530645949464244537942445a584a3061575a70593246305a5445614d426747413155450a43677752535735305a577767513239796347397959585270623234784644415342674e564241634d43314e68626e526849454e7359584a684d517377435159440a5651514944414a445154454c4d416b474131554542684d4356564d775754415442676371686b6a4f5051494242676771686b6a4f50514d4242774e43414151680a7a62304d687441516d44344f33734c784e6b504a59696a644e764a524b6f4e37726c392f6f4246632f675172634368516133706c45516c6437444b44717848530a504365415646346e4f646f655a38386e5467516a6f3449444444434341776777487759445652306a42426777466f41556c5739647a62306234656c4153636e550a3944504f4156634c336c5177617759445652306642475177596a42676f46366758495a616148523063484d364c79396863476b7564484a316333526c5a484e6c0a636e5a705932567a4c6d6c75644756734c6d4e766253397a5a3367765932567964476c6d61574e6864476c76626939324e4339775932746a636d772f593245390a6347786864475a76636d306d5a57356a62325270626d63395a4756794d4230474131556444675157424254782b665a7844612b434264464b536432675a4d544f0a4a676e58337a414f42674e56485138424166384542414d434273417744415944565230544151482f4241497741444343416a6b4743537147534962345451454e0a4151534341696f776767496d4d42344743697147534962345451454e4151454545486a495962494c5848593478736c6f53495663324655776767466a42676f710a686b69472b453042445145434d494942557a415142677371686b69472b4530424451454341514942417a415142677371686b69472b45304244514543416749420a417a415142677371686b69472b4530424451454341774942416a415142677371686b69472b4530424451454342414942416a415142677371686b69472b4530420a44514543425149424244415142677371686b69472b45304244514543426749424154415142677371686b69472b453042445145434277494241444151426773710a686b69472b45304244514543434149424254415142677371686b69472b45304244514543435149424144415142677371686b69472b45304244514543436749420a4144415142677371686b69472b45304244514543437749424144415142677371686b69472b45304244514543444149424144415142677371686b69472b4530420a44514543445149424144415142677371686b69472b45304244514543446749424144415142677371686b69472b453042445145434477494241444151426773710a686b69472b45304244514543454149424144415142677371686b69472b45304244514543455149424454416642677371686b69472b45304244514543456751510a41774d43416751424141554141414141414141414144415142676f71686b69472b45304244514544424149414144415542676f71686b69472b453042445145450a4241615177473841414141774477594b4b6f5a496876684e4151304242516f424154416542676f71686b69472b45304244514547424241546950326e50522f450a5a61623636497a666a5856624d45514743697147534962345451454e415163774e6a415142677371686b69472b45304244514548415145422f7a4151426773710a686b69472b45304244514548416745422f7a415142677371686b69472b45304244514548417745422f7a414b42676771686b6a4f5051514441674e49414442460a416945416853492f376b396854554743356f4d6a594d46624c3273365a45644a68715643616e32614e3958314b506b43494336425355506665336975746c77610a30385a654f46325337334a48566848326238614a4f634e3665556a690a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949436c6a4343416a32674177494241674956414a567658633239472b487051456e4a3150517a7a674658433935554d416f4743437147534d343942414d430a4d476778476a415942674e5642414d4d45556c756447567349464e48574342536232393049454e424d526f77474159445651514b4442464a626e526c624342440a62334a7762334a6864476c76626a45554d424947413155454277774c553246756447456751327868636d4578437a414a42674e564241674d416b4e424d5173770a435159445651514745774a56557a4165467730784f4441314d6a45784d4455774d5442614677307a4d7a41314d6a45784d4455774d5442614d484178496a41670a42674e5642414d4d47556c756447567349464e4857434251513073675547786864475a76636d306751304578476a415942674e5642416f4d45556c75644756730a49454e76636e4276636d4630615739754d5251774567594456515148444174545957353059534244624746795954454c4d416b474131554543417743513045780a437a414a42674e5642415954416c56544d466b77457759484b6f5a497a6a3043415159494b6f5a497a6a304441516344516741454e53422f377432316c58534f0a3243757a7078773734654a423732457944476757357258437478327456544c7136684b6b367a2b5569525a436e71523770734f766771466553786c6d546c4a6c0a65546d693257597a33714f42757a43427544416642674e5648534d4547444157674251695a517a575770303069664f44744a5653763141624f536347724442530a42674e5648523845537a424a4d45656752614244686b466f64485277637a6f764c324e6c636e52705a6d6c6a5958526c63793530636e567a6447566b633256790a646d6c6a5a584d75615735305a577775593239744c306c756447567355306459556d397664454e424c6d526c636a416442674e5648513445466751556c5739640a7a62306234656c4153636e553944504f4156634c336c517744675944565230504151482f42415144416745474d42494741315564457745422f7751494d4159420a4166384341514177436759494b6f5a497a6a30454177494452774177524149675873566b6930772b6936565947573355462f32327561586530594a446a3155650a6e412b546a44316169356343494359623153416d4435786b66545670766f34556f79695359787244574c6d5552344349394e4b7966504e2b0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949436a7a4343416a53674177494241674955496d554d316c71644e496e7a6737535655723951477a6b6e42717777436759494b6f5a497a6a3045417749770a614445614d4267474131554541777752535735305a5777675530645949464a766233516751304578476a415942674e5642416f4d45556c756447567349454e760a636e4276636d4630615739754d5251774567594456515148444174545957353059534244624746795954454c4d416b47413155454341774351304578437a414a0a42674e5642415954416c56544d423458445445344d4455794d5445774e4455784d466f58445451354d54497a4d54497a4e546b314f566f77614445614d4267470a4131554541777752535735305a5777675530645949464a766233516751304578476a415942674e5642416f4d45556c756447567349454e76636e4276636d46300a615739754d5251774567594456515148444174545957353059534244624746795954454c4d416b47413155454341774351304578437a414a42674e56424159540a416c56544d466b77457759484b6f5a497a6a3043415159494b6f5a497a6a3044415163445167414543366e45774d4449595a4f6a2f69505773437a61454b69370a314f694f534c52466857476a626e42564a66566e6b59347533496a6b4459594c304d784f346d717379596a6c42616c54565978465032734a424b357a6c4b4f420a757a43427544416642674e5648534d4547444157674251695a517a575770303069664f44744a5653763141624f5363477244425342674e5648523845537a424a0a4d45656752614244686b466f64485277637a6f764c324e6c636e52705a6d6c6a5958526c63793530636e567a6447566b63325679646d6c6a5a584d75615735300a5a577775593239744c306c756447567355306459556d397664454e424c6d526c636a416442674e564851344546675155496d554d316c71644e496e7a673753560a55723951477a6b6e4271777744675944565230504151482f42415144416745474d42494741315564457745422f7751494d4159424166384341514577436759490a4b6f5a497a6a3045417749445351417752674968414f572f35516b522b533943695344634e6f6f774c7550524c735747662f59693747535839344267775477670a41694541344a306c72486f4d732b586f356f2f7358364f39515778485241765a55474f6452513763767152586171493d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    let quote = decode(quote_hex).unwrap();

    // test against bin
    // let quote = std::fs::read("../samples/4.bin").expect("quote is not found");

    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("Failed to get current time")
        .as_secs() as u64;

    let result = verify::verify(&quote, &collateral, now).unwrap();

    // let test = String::from_utf8(result.report.as_td10().unwrap().report_data.to_vec()).unwrap();
    println!("{:?}", result);
}
