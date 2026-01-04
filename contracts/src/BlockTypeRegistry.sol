// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import {
    LSP8IdentifiableDigitalAsset
} from "@lukso/lsp-smart-contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {
    _LSP8_TOKENID_TYPE_HASH
} from "@lukso/lsp-smart-contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";
import {BlockToken} from "./BlockToken.sol";

/**
 * @title BlockTypeRegistry
 * @notice LSP8 registry where each NFT represents a block TYPE (e.g., "bricks_A").
 * @dev For each block type registered, this contract deploys a new LSP7 BlockToken contract.
 *      Players receive LSP7 tokens representing quantities of each block type.
 */
contract BlockTypeRegistry is LSP8IdentifiableDigitalAsset {
    // Block type metadata
    struct BlockTypeInfo {
        string name;
        string symbol;
        bool isPremium;
        uint256 pricePerUnit;
        string modelPath;
        address tokenContract;
        bool exists;
    }
    
    // Mapping from block type ID to info
    mapping(bytes32 => BlockTypeInfo) public blockTypes;
    
    // Array of all registered block type IDs
    bytes32[] public allBlockTypeIds;
    
    // Starting block quantities for new players
    mapping(bytes32 => uint256) public startingBlockQuantities;
    
    // Character NFT contract for verifying ownership
    address public characterNFT;
    
    // Events
    event BlockTypeRegistered(
        bytes32 indexed blockTypeId,
        string name,
        bool isPremium,
        address tokenContract
    );
    event StartingBlocksSet(bytes32 indexed blockTypeId, uint256 quantity);
    event StartingBlocksGranted(address indexed player, bytes32 indexed characterTokenId);
    event CharacterNFTUpdated(address indexed oldAddress, address indexed newAddress);
    
    // Errors
    error BlockTypeAlreadyExists(bytes32 blockTypeId);
    error BlockTypeNotFound(bytes32 blockTypeId);
    error CharacterNFTNotSet();
    error NotCharacterOwner();
    
    /**
     * @notice Deploy the BlockTypeRegistry.
     * @param name_ Collection name
     * @param symbol_ Collection symbol
     * @param owner_ Contract owner (admin)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) LSP8IdentifiableDigitalAsset(
        name_,
        symbol_,
        owner_,
        _LSP8_TOKENID_TYPE_HASH
    ) {}
    
    /**
     * @notice Set the CharacterNFT contract address.
     * @param characterNFT_ The CharacterNFT contract address
     */
    function setCharacterNFT(address characterNFT_) external onlyOwner {
        address oldAddress = characterNFT;
        characterNFT = characterNFT_;
        emit CharacterNFTUpdated(oldAddress, characterNFT_);
    }
    
    /**
     * @notice Register a new block type and deploy its LSP7 token contract.
     * @param name_ Block type display name (e.g., "Bricks A")
     * @param symbol_ Token symbol (e.g., "BRICK_A")
     * @param isPremium_ Whether this is a premium block that costs LYX
     * @param pricePerUnit_ Price in wei per block (0 for basic blocks)
     * @param modelPath_ Path to the 3D model file
     * @return blockTypeId The unique ID for this block type
     */
    function registerBlockType(
        string calldata name_,
        string calldata symbol_,
        bool isPremium_,
        uint256 pricePerUnit_,
        string calldata modelPath_
    ) external onlyOwner returns (bytes32 blockTypeId) {
        // Generate unique block type ID from name
        blockTypeId = keccak256(abi.encodePacked(name_));
        
        // Check if already exists
        if (blockTypes[blockTypeId].exists) {
            revert BlockTypeAlreadyExists(blockTypeId);
        }
        
        // Deploy new BlockToken contract for this type
        BlockToken tokenContract = new BlockToken(
            name_,
            symbol_,
            address(this),
            isPremium_,
            pricePerUnit_,
            modelPath_
        );
        
        // Store block type info
        blockTypes[blockTypeId] = BlockTypeInfo({
            name: name_,
            symbol: symbol_,
            isPremium: isPremium_,
            pricePerUnit: pricePerUnit_,
            modelPath: modelPath_,
            tokenContract: address(tokenContract),
            exists: true
        });
        
        allBlockTypeIds.push(blockTypeId);
        
        // Mint registry NFT (represents ownership of this block type definition)
        _mint(owner(), blockTypeId, true, "");
        
        emit BlockTypeRegistered(blockTypeId, name_, isPremium_, address(tokenContract));
        
        return blockTypeId;
    }
    
    /**
     * @notice Register an externally deployed block token contract (e.g., PhotoFrameBlock).
     * @dev Use this for special block types that need custom contracts.
     * @param name_ Block type display name
     * @param symbol_ Token symbol
     * @param isPremium_ Whether this is a premium block
     * @param pricePerUnit_ Price in wei per block
     * @param modelPath_ Path to the 3D model file
     * @param tokenContract_ Address of the already-deployed token contract
     * @return blockTypeId The unique ID for this block type
     */
    function registerExternalBlockType(
        string calldata name_,
        string calldata symbol_,
        bool isPremium_,
        uint256 pricePerUnit_,
        string calldata modelPath_,
        address tokenContract_
    ) external onlyOwner returns (bytes32 blockTypeId) {
        // Generate unique block type ID from name
        blockTypeId = keccak256(abi.encodePacked(name_));
        
        // Check if already exists
        if (blockTypes[blockTypeId].exists) {
            revert BlockTypeAlreadyExists(blockTypeId);
        }
        
        // Verify token contract is valid (has code)
        require(tokenContract_.code.length > 0, "Invalid token contract");
        
        // Store block type info
        blockTypes[blockTypeId] = BlockTypeInfo({
            name: name_,
            symbol: symbol_,
            isPremium: isPremium_,
            pricePerUnit: pricePerUnit_,
            modelPath: modelPath_,
            tokenContract: tokenContract_,
            exists: true
        });
        
        allBlockTypeIds.push(blockTypeId);
        
        // Mint registry NFT (represents ownership of this block type definition)
        _mint(owner(), blockTypeId, true, "");
        
        emit BlockTypeRegistered(blockTypeId, name_, isPremium_, tokenContract_);
        
        return blockTypeId;
    }

    /**
     * @notice Set the starting quantity for a block type (given to new players).
     * @param blockTypeId The block type ID
     * @param quantity Number of blocks to give new players
     */
    function setStartingBlockQuantity(
        bytes32 blockTypeId,
        uint256 quantity
    ) external onlyOwner {
        if (!blockTypes[blockTypeId].exists) {
            revert BlockTypeNotFound(blockTypeId);
        }
        
        startingBlockQuantities[blockTypeId] = quantity;
        emit StartingBlocksSet(blockTypeId, quantity);
    }
    
    /**
     * @notice Grant starting blocks to a new player when they mint a character.
     * @dev Called by CharacterNFT contract after minting.
     * @param player The player address
     * @param characterTokenId The minted character's token ID
     */
    function grantStartingBlocks(
        address player,
        bytes32 characterTokenId
    ) external {
        if (characterNFT == address(0)) revert CharacterNFTNotSet();
        
        // Only CharacterNFT contract can call this
        require(msg.sender == characterNFT, "Only CharacterNFT");
        
        // Grant starting blocks for each type
        for (uint256 i = 0; i < allBlockTypeIds.length; i++) {
            bytes32 blockTypeId = allBlockTypeIds[i];
            uint256 quantity = startingBlockQuantities[blockTypeId];
            
            if (quantity > 0) {
                BlockToken token = BlockToken(payable(blockTypes[blockTypeId].tokenContract));
                token.mint(player, quantity);
            }
        }
        
        emit StartingBlocksGranted(player, characterTokenId);
    }
    
    /**
     * @notice Mint blocks to a player (admin function).
     * @param blockTypeId The block type to mint
     * @param to Player address
     * @param amount Number of blocks
     */
    function mintBlocks(
        bytes32 blockTypeId,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (!blockTypes[blockTypeId].exists) {
            revert BlockTypeNotFound(blockTypeId);
        }
        
        BlockToken token = BlockToken(payable(blockTypes[blockTypeId].tokenContract));
        token.mint(to, amount);
    }
    
    /**
     * @notice Return premium blocks to player's inventory.
     * @dev Called when player removes a premium block from their room.
     * @param blockTypeId The block type
     * @param player Player address
     * @param amount Number of blocks
     */
    function returnPremiumBlocks(
        bytes32 blockTypeId,
        address player,
        uint256 amount
    ) external onlyOwner {
        if (!blockTypes[blockTypeId].exists) {
            revert BlockTypeNotFound(blockTypeId);
        }
        
        BlockToken token = BlockToken(payable(blockTypes[blockTypeId].tokenContract));
        token.removeBlocks(player, amount);
    }
    
    /**
     * @notice Get the LSP7 token contract for a block type.
     * @param blockTypeId The block type ID
     * @return tokenContract Address of the BlockToken contract
     */
    function getBlockContract(bytes32 blockTypeId) external view returns (address) {
        if (!blockTypes[blockTypeId].exists) {
            revert BlockTypeNotFound(blockTypeId);
        }
        return blockTypes[blockTypeId].tokenContract;
    }
    
    /**
     * @notice Get all registered block types.
     * @return ids Array of block type IDs
     */
    function getAllBlockTypes() external view returns (bytes32[] memory) {
        return allBlockTypeIds;
    }
    
    /**
     * @notice Get the number of registered block types.
     * @return count Number of block types
     */
    function getBlockTypeCount() external view returns (uint256) {
        return allBlockTypeIds.length;
    }
    
    /**
     * @notice Get detailed info about a block type.
     * @param blockTypeId The block type ID
     * @return name Block display name
     * @return symbol Token symbol
     * @return isPremium Whether premium
     * @return pricePerUnit Price in wei
     * @return modelPath 3D model path
     * @return tokenContract LSP7 contract address
     */
    function getBlockTypeInfo(bytes32 blockTypeId) external view returns (
        string memory name,
        string memory symbol,
        bool isPremium,
        uint256 pricePerUnit,
        string memory modelPath,
        address tokenContract
    ) {
        if (!blockTypes[blockTypeId].exists) {
            revert BlockTypeNotFound(blockTypeId);
        }
        
        BlockTypeInfo storage info = blockTypes[blockTypeId];
        return (
            info.name,
            info.symbol,
            info.isPremium,
            info.pricePerUnit,
            info.modelPath,
            info.tokenContract
        );
    }
    
    /**
     * @notice Withdraw all collected LYX from block sales.
     */
    function withdraw() external onlyOwner {
        // Withdraw from registry
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner().call{value: balance}("");
            require(success, "Withdrawal failed");
        }
        
        // Withdraw from all block token contracts
        for (uint256 i = 0; i < allBlockTypeIds.length; i++) {
            BlockToken token = BlockToken(payable(blockTypes[allBlockTypeIds[i]].tokenContract));
            token.withdrawFunds();
        }
    }
    
    /**
     * @notice Receive LYX (from block token withdrawals).
     */
    receive() external payable override {}
}

