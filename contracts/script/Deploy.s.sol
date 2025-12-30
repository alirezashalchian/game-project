// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import {Script, console} from "forge-std/Script.sol";
import {CharacterNFT} from "../src/CharacterNFT.sol";
import {BlockTypeRegistry} from "../src/BlockTypeRegistry.sol";
import {PhotoFrameBlock} from "../src/PhotoFrameBlock.sol";

/**
 * @title Deploy
 * @notice Deployment script for the game's NFT contracts.
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
 */
contract DeployScript is Script {
    // Configuration - adjust these before deployment
    uint256 public constant CHARACTER_MINT_PRICE = 1 ether; // 1 LYX to mint a character
    uint256 public constant PHOTO_FRAME_PRICE = 0.1 ether; // 0.1 LYX per photo frame
    
    // Starting block quantities for new players (per block type)
    uint256 public constant STARTING_BASIC_BLOCKS = 50;
    uint256 public constant STARTING_PREMIUM_BLOCKS = 0;
    
    // Block type definitions
    struct BlockTypeDef {
        string name;
        string symbol;
        bool isPremium;
        uint256 price;
        string modelPath;
    }
    
    function run() external {
        // Get deployer address from the broadcaster (set via --private-key flag)
        vm.startBroadcast();
        address deployer = msg.sender;
        
        console.log("Deploying contracts with deployer:", deployer);
        
        // 1. Deploy CharacterNFT
        CharacterNFT characterNFT = new CharacterNFT(
            "Game Characters",
            "CHAR",
            deployer,
            CHARACTER_MINT_PRICE
        );
        console.log("CharacterNFT deployed at:", address(characterNFT));
        
        // 2. Deploy BlockTypeRegistry
        BlockTypeRegistry blockRegistry = new BlockTypeRegistry(
            "Block Types Registry",
            "BLKTYPE",
            deployer
        );
        console.log("BlockTypeRegistry deployed at:", address(blockRegistry));
        
        // 3. Link CharacterNFT and BlockTypeRegistry
        characterNFT.setBlockRegistry(address(blockRegistry));
        blockRegistry.setCharacterNFT(address(characterNFT));
        
        // 4. Register all block types
        _registerBlockTypes(blockRegistry);
        
        // 5. Set starting block quantities
        _setStartingQuantities(blockRegistry);
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("CharacterNFT:", address(characterNFT));
        console.log("BlockTypeRegistry:", address(blockRegistry));
        console.log("Block types registered:", blockRegistry.getBlockTypeCount());
    }
    
    function _registerBlockTypes(BlockTypeRegistry registry) internal {
        // Basic blocks (free, given at start)
        _registerBasicBlocks(registry);
        
        // Premium blocks (paid)
        _registerPremiumBlocks(registry);
        
        // Special: Photo Frame
        _registerPhotoFrame(registry);
    }
    
    function _registerBasicBlocks(BlockTypeRegistry registry) internal {
        BlockTypeDef[20] memory basicBlocks = [
            BlockTypeDef("Bricks A", "BRICK_A", false, 0, "/models/gltf/bricks_A.gltf"),
            BlockTypeDef("Bricks B", "BRICK_B", false, 0, "/models/gltf/bricks_B.gltf"),
            BlockTypeDef("Dirt", "DIRT", false, 0, "/models/gltf/dirt.gltf"),
            BlockTypeDef("Dirt with Grass", "DIRT_GRASS", false, 0, "/models/gltf/dirt_with_grass.gltf"),
            BlockTypeDef("Dirt with Snow", "DIRT_SNOW", false, 0, "/models/gltf/dirt_with_snow.gltf"),
            BlockTypeDef("Glass", "GLASS", false, 0, "/models/gltf/glass.gltf"),
            BlockTypeDef("Grass", "GRASS", false, 0, "/models/gltf/grass.gltf"),
            BlockTypeDef("Grass with Snow", "GRASS_SNOW", false, 0, "/models/gltf/grass_with_snow.gltf"),
            BlockTypeDef("Gravel", "GRAVEL", false, 0, "/models/gltf/gravel.gltf"),
            BlockTypeDef("Gravel with Grass", "GRAVEL_GRASS", false, 0, "/models/gltf/gravel_with_grass.gltf"),
            BlockTypeDef("Gravel with Snow", "GRAVEL_SNOW", false, 0, "/models/gltf/gravel_with_snow.gltf"),
            BlockTypeDef("Sand A", "SAND_A", false, 0, "/models/gltf/sand_A.gltf"),
            BlockTypeDef("Sand B", "SAND_B", false, 0, "/models/gltf/sand_B.gltf"),
            BlockTypeDef("Sand with Grass", "SAND_GRASS", false, 0, "/models/gltf/sand_with_grass.gltf"),
            BlockTypeDef("Sand with Snow", "SAND_SNOW", false, 0, "/models/gltf/sand_with_snow.gltf"),
            BlockTypeDef("Snow", "SNOW", false, 0, "/models/gltf/snow.gltf"),
            BlockTypeDef("Stone", "STONE", false, 0, "/models/gltf/stone.gltf"),
            BlockTypeDef("Stone Dark", "STONE_DARK", false, 0, "/models/gltf/stone_dark.gltf"),
            BlockTypeDef("Water", "WATER", false, 0, "/models/gltf/water.gltf"),
            BlockTypeDef("Wood", "WOOD", false, 0, "/models/gltf/wood.gltf")
        ];
        
        for (uint256 i = 0; i < basicBlocks.length; i++) {
            registry.registerBlockType(
                basicBlocks[i].name,
                basicBlocks[i].symbol,
                basicBlocks[i].isPremium,
                basicBlocks[i].price,
                basicBlocks[i].modelPath
            );
        }
    }
    
    function _registerPremiumBlocks(BlockTypeRegistry registry) internal {
        uint256 premiumPrice = 0.01 ether; // 0.01 LYX per premium block
        
        BlockTypeDef[20] memory premiumBlocks = [
            BlockTypeDef("Colored Block Blue", "COL_BLUE", true, premiumPrice, "/models/gltf/colored_block_blue.gltf"),
            BlockTypeDef("Colored Block Green", "COL_GREEN", true, premiumPrice, "/models/gltf/colored_block_green.gltf"),
            BlockTypeDef("Colored Block Red", "COL_RED", true, premiumPrice, "/models/gltf/colored_block_red.gltf"),
            BlockTypeDef("Colored Block Yellow", "COL_YELLOW", true, premiumPrice, "/models/gltf/colored_block_yellow.gltf"),
            BlockTypeDef("Decorative Blue", "DEC_BLUE", true, premiumPrice, "/models/gltf/decorative_block_blue.gltf"),
            BlockTypeDef("Decorative Green", "DEC_GREEN", true, premiumPrice, "/models/gltf/decorative_block_green.gltf"),
            BlockTypeDef("Decorative Red", "DEC_RED", true, premiumPrice, "/models/gltf/decorative_block_red.gltf"),
            BlockTypeDef("Decorative Yellow", "DEC_YELLOW", true, premiumPrice, "/models/gltf/decorative_block_yellow.gltf"),
            BlockTypeDef("Striped Blue", "STR_BLUE", true, premiumPrice, "/models/gltf/striped_block_blue.gltf"),
            BlockTypeDef("Striped Green", "STR_GREEN", true, premiumPrice, "/models/gltf/striped_block_green.gltf"),
            BlockTypeDef("Striped Red", "STR_RED", true, premiumPrice, "/models/gltf/striped_block_red.gltf"),
            BlockTypeDef("Striped Yellow", "STR_YELLOW", true, premiumPrice, "/models/gltf/striped_block_yellow.gltf"),
            BlockTypeDef("Lava", "LAVA", true, premiumPrice * 2, "/models/gltf/lava.gltf"),
            BlockTypeDef("Metal", "METAL", true, premiumPrice * 2, "/models/gltf/metal.gltf"),
            BlockTypeDef("Prototype", "PROTO", true, premiumPrice, "/models/gltf/prototype.gltf"),
            BlockTypeDef("Stone with Copper", "STONE_COP", true, premiumPrice * 3, "/models/gltf/stone_with_copper.gltf"),
            BlockTypeDef("Stone with Gold", "STONE_GOLD", true, premiumPrice * 5, "/models/gltf/stone_with_gold.gltf"),
            BlockTypeDef("Stone with Silver", "STONE_SILV", true, premiumPrice * 4, "/models/gltf/stone_with_silver.gltf"),
            BlockTypeDef("Tree", "TREE", true, premiumPrice * 2, "/models/gltf/tree.gltf"),
            BlockTypeDef("Tree with Snow", "TREE_SNOW", true, premiumPrice * 2, "/models/gltf/tree_with_snow.gltf")
        ];
        
        for (uint256 i = 0; i < premiumBlocks.length; i++) {
            registry.registerBlockType(
                premiumBlocks[i].name,
                premiumBlocks[i].symbol,
                premiumBlocks[i].isPremium,
                premiumBlocks[i].price,
                premiumBlocks[i].modelPath
            );
        }
    }
    
    function _registerPhotoFrame(BlockTypeRegistry registry) internal {
        // Photo frames are special premium blocks with metadata support
        // Note: PhotoFrameBlock is deployed separately by the registry
        // when we register it as a block type, but we use the standard BlockToken
        // For PhotoFrameBlock, we would need to deploy it separately and register
        // For simplicity, we register it as a premium block here
        registry.registerBlockType(
            "Photo Frame",
            "FRAME",
            true,
            PHOTO_FRAME_PRICE,
            "/models/gltf/photo_frame.gltf" // You'll need to add this model
        );
    }
    
    function _setStartingQuantities(BlockTypeRegistry registry) internal {
        bytes32[] memory blockTypes = registry.getAllBlockTypes();
        
        for (uint256 i = 0; i < blockTypes.length; i++) {
            (,, bool isPremium,,,) = registry.getBlockTypeInfo(blockTypes[i]);
            
            if (!isPremium) {
                // Give starting basic blocks to new players
                registry.setStartingBlockQuantity(blockTypes[i], STARTING_BASIC_BLOCKS);
            }
        }
    }
}

