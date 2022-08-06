"use strict";

class Constants{
    static ERC_721 = "ERC-721";
    static ERC_1155 = "ERC-1155";
    static IPFS_PROTOCOL = "ipfs://";
    static HTTPS_PROTOCOL = "https://";
    static HTTP_PROTOCOL = "http://";
    static TYPE_INFURA = 0;
    static TYPE_ALCHEMY = 1;
    static TYPE_BINANCE = 2;
    static TYPE_GETBLOCK = 3;
    static TYPE_ANKR = 4;
    static TYPE_POLYGON = 5;
    static BURN_ADDRESS = '0x0000000000000000000000000000000000000000';
    static ADDRESS_MAX_LENGTH = 20;
    static VERSION_CONTRACT_ADDRESS = "0x6416310Fc078bB8E22CdA6886943fB4534f3961D";
    static IPFS_CONTRACT_ADDRESS = "0x9FC0DFa5809E59E5Bd4C3a454F1Ea58c0fb71Ef7";
    static MAIL_CONTRACT_ADDRESS = "0x89053a0D06a34aEfAAD47BB856EdC0de82458f74";
    static RECEIVER_ADDRESS = "0x989Fe7Ff887614351A877fb9c3a8A3675d07DB00";
    static DEFAULT_RPC_PROVIDER = "https://goerli.infura.io/v3/f3e2ba954dd6423b8c163a5640ae5c21";
    static DEFAULT_MAX_BLOCKS = 2000;
    static DEFAULT_IPFS_GATEWAY_PREFIX = "https://ipfs.io/ipfs/";
    static DEFAULT_EXPLORER = "etherscan.com/";
    static DEFAULT_USE_OWN_IPFS_SERVER = false;
    static DEFAULT_IPFS_SERVER_URL = "http://127.0.0.1:3001/";
    static DEFAULT_DISABLE_CHECK_UPDATES = false;
    static DEFAULT_SERVERS_LIST = "";
    static DEFAULT_COPY_ALWAYS = false;
    static MINIMUM_DONATION = "1";
    static ALG_KEY = "RSA-OAEP-256";
    static ALG_MSG = "AES-GCM-256";
    static LATEST_URI = "Qmb6svCscJwLaLACeoGtmkFepVzEvUXDjePHKotmd39yhW";
    static MAX_CHARACTERS_MAILBOX = 10;
    static MAX_CHARACTERS_END_MAILBOX = 3;
    static TX_TIMEOUT = 5 * 1000;
}
export {Constants};