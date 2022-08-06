// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "./Ownable.sol";

contract NFTViewer is Ownable {
	string private versionURI;

	function setVersionURI(string calldata _versionURI) onlyOwner external {
		require(bytes(_versionURI).length > 0,"invalid version uri");
		versionURI = _versionURI;
	}

	function getVersionURI() external view returns (string memory) {
		return versionURI;
	}
}