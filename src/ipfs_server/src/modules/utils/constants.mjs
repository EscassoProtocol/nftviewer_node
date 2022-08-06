"use strict";

class Constants{
    static RPC_LINK = "https://goerli.infura.io/v3/f3e2ba954dd6423b8c163a5640ae5c21";
    static CONTRACT_ADDRESS = "0x9FC0DFa5809E59E5Bd4C3a454F1Ea58c0fb71Ef7";//for tests (rinkeby) "0x558964077CBc1011650344276E623b1B48F71503"
    static DOWNLOAD_ENDPOINT = "download";
    static BUFFER_SIZE = 1024;
    static FILES_FOLDER = "files";
    static MAX_LAST_IPS = 10;
    static MAX_DIFF_IN_SECS = 0.001;
    static DIFF_TO_UNBLOCK_IN_SECS = 60;
    static MAX_LAST_PROOFS = 10;
    static RAM_PERCENT = 33;
    static IS_LOCALHOST = false;
}
export {Constants};