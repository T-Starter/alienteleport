pragma solidity ^0.8.7;
/*
 * SPDX-License-Identifier: MIT
 */
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "./TeleportToken.sol";

contract TeleportTokenFactory {
    TeleportToken[] public teleporttokens;

    function create(string memory _symbol, string memory _name, uint8 _decimals, uint __totalSupply, uint8 _threshold, uint8 _thisChainId) public {
        TeleportToken tt = new TeleportToken( _symbol, _name, _decimals, __totalSupply, _threshold, _thisChainId);
        teleporttokens.push(tt);
    }

    function createAndSendEther(string memory _symbol, string memory _name, uint8 _decimals, uint __totalSupply, uint8 _threshold, uint8 _thisChainId) public payable {
        TeleportToken tt = (new TeleportToken){value: msg.value}( _symbol, _name, _decimals, __totalSupply, _threshold, _thisChainId);
        teleporttokens.push(tt);
    }

    function getToken(uint _index)
        public
        view
        returns (
            address owner,
            uint balance,
            string memory symbol,
            string memory name,
            uint8 decimals,
            uint totalSupply,
            uint8 threshold,
            uint8 thisChainId
        )
    {
        TeleportToken tt = teleporttokens[_index];

        return (tt.owner(), address(tt).balance, tt.symbol(), tt.name(), tt.decimals(), tt.totalSupply(), tt.threshold(), tt.thisChainId());
    }
}