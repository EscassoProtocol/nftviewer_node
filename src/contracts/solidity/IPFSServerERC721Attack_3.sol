// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "./IPFSServerERC721.sol";
import "./IERC721Receiver.sol";

contract IPFSServerERC721Attack_3 is IERC721Receiver{
    IPFSServerERC721 private _contract;

    constructor(address _ipfsServer721Address) {
        _contract = IPFSServerERC721(_ipfsServer721Address);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external
    override
    pure
    returns(bytes4) {
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    function mintServer() external {
        _contract.mintServer("uri", 1 ether);
    }
}
