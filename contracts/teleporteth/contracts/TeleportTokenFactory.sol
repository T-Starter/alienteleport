pragma solidity ^0.8.7;
/*
 * SPDX-License-Identifier: MIT
 */
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "./TeleportToken.sol";

contract TeleportTokenFactory is Owned {
    TeleportToken[] public teleporttokens;
    uint256 public creationFee = 0.1 ether;

    function create(
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        uint256 __totalSupply,
        uint8 _threshold,
        uint8 _thisChainId
    ) public payable {
        // correct fee
        require(msg.value == creationFee, "Wrong fee");
        TeleportToken tt = new TeleportToken(
            _symbol,
            _name,
            _decimals,
            __totalSupply,
            _threshold,
            _thisChainId
        );
        tt.transferOwnership(msg.sender);
        teleporttokens.push(tt);
    }

    function getTokenAddress(uint256 _index)
        public
        view
        returns (
            address ttAddress
        )
    {
        TeleportToken tt = teleporttokens[_index];

        return (
            address(tt)
        );
    }

    function setFee(uint256 _fee) public onlyOwner {
        creationFee = _fee;
    }

}
