// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import {LSP7DigitalAsset} from "@lukso/lsp-smart-contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

/**
 * @title BlockToken
 * @notice LSP7 fungible token representing individual blocks in the game.
 * @dev Each block type (bricks, glass, etc.) has its own BlockToken contract.
 *      Players can own multiple units of each block type.
 *      Blocks are consumable - they get burned when placed and minted when removed (premium only).
 */
contract BlockToken is LSP7DigitalAsset {
    // Block type metadata
    string public blockName;
    bool public isPremium;
    uint256 public pricePerUnit;
    string public modelPath;
    
    // Registry that deployed this token
    address public registry;
    
    // Events
    event BlockPlaced(address indexed player, uint256 amount);
    event BlockRemoved(address indexed player, uint256 amount);
    event BlockPurchased(address indexed player, uint256 amount, uint256 totalCost);
    
    // Errors
    error OnlyRegistry();
    error InsufficientPayment(uint256 required, uint256 provided);
    error NotPremiumBlock();
    error InsufficientBlocks(uint256 required, uint256 available);
    
    modifier onlyRegistry() {
        if (msg.sender != registry) revert OnlyRegistry();
        _;
    }
    
    /**
     * @notice Deploy a new BlockToken for a specific block type.
     * @param name_ The display name of the block (e.g., "Bricks A")
     * @param symbol_ The token symbol (e.g., "BRICK_A")
     * @param registryAddress The BlockTypeRegistry that deployed this contract
     * @param isPremium_ Whether this is a premium block that costs LYX to purchase
     * @param pricePerUnit_ Price in wei per block unit (0 for basic blocks)
     * @param modelPath_ Path to the 3D model file
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address registryAddress,
        bool isPremium_,
        uint256 pricePerUnit_,
        string memory modelPath_
    ) LSP7DigitalAsset(
        name_,
        symbol_,
        registryAddress, // Registry is initial owner
        true // isNonDivisible - blocks are whole units
    ) {
        blockName = name_;
        registry = registryAddress;
        isPremium = isPremium_;
        pricePerUnit = pricePerUnit_;
        modelPath = modelPath_;
    }
    
    /**
     * @notice Mint blocks to a player. Called by registry when giving starting blocks
     *         or when admin grants blocks.
     * @param to The player address to receive blocks
     * @param amount Number of blocks to mint
     */
    function mint(address to, uint256 amount) external onlyRegistry {
        _mint(to, amount, true, "");
    }
    
    /**
     * @notice Purchase premium blocks with LYX.
     * @param amount Number of blocks to purchase
     */
    function purchase(uint256 amount) external payable {
        if (!isPremium) revert NotPremiumBlock();
        
        uint256 totalCost = pricePerUnit * amount;
        if (msg.value < totalCost) {
            revert InsufficientPayment(totalCost, msg.value);
        }
        
        _mint(msg.sender, amount, true, "");
        
        // Refund excess payment
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(success, "Refund failed");
        }
        
        emit BlockPurchased(msg.sender, amount, totalCost);
    }
    
    /**
     * @notice Consume blocks when placing them in the game world.
     * @dev Burns the tokens from the player's balance.
     * @param amount Number of blocks being placed
     */
    function placeBlocks(uint256 amount) external {
        uint256 balance = balanceOf(msg.sender);
        if (balance < amount) {
            revert InsufficientBlocks(amount, balance);
        }
        
        _burn(msg.sender, amount, "");
        emit BlockPlaced(msg.sender, amount);
    }
    
    /**
     * @notice Return premium blocks to inventory when removed from game world.
     * @dev Only works for premium blocks. Basic blocks are consumed permanently.
     * @param player The player removing the blocks
     * @param amount Number of blocks being removed
     */
    function removeBlocks(address player, uint256 amount) external onlyRegistry {
        if (!isPremium) revert NotPremiumBlock();
        
        _mint(player, amount, true, "");
        emit BlockRemoved(player, amount);
    }
    
    /**
     * @notice Withdraw collected LYX from premium block sales.
     * @dev Only callable by registry (owner).
     */
    function withdrawFunds() external onlyRegistry {
        uint256 balance = address(this).balance;
        (bool success, ) = registry.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get block metadata for frontend display.
     * @return name Block display name
     * @return premium Whether block is premium
     * @return price Price per unit in wei
     * @return path Model file path
     */
    function getBlockInfo() external view returns (
        string memory name,
        bool premium,
        uint256 price,
        string memory path
    ) {
        return (blockName, isPremium, pricePerUnit, modelPath);
    }
}

