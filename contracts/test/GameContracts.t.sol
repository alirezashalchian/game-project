// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import {Test, console} from "forge-std/Test.sol";
import {CharacterNFT} from "../src/CharacterNFT.sol";
import {BlockTypeRegistry} from "../src/BlockTypeRegistry.sol";
import {BlockToken} from "../src/BlockToken.sol";

contract GameContractsTest is Test {
    CharacterNFT public characterNFT;
    BlockTypeRegistry public registry;
    
    address public owner = address(this);
    address public player1 = address(0x1);
    address public player2 = address(0x2);
    
    uint256 public constant MINT_PRICE = 1 ether;
    bytes32 public bricksBlockTypeId;
    
    function setUp() public {
        // Deploy contracts
        characterNFT = new CharacterNFT(
            "Game Characters",
            "CHAR",
            owner,
            MINT_PRICE
        );
        
        registry = new BlockTypeRegistry(
            "Block Types Registry",
            "BLKTYPE",
            owner
        );
        
        // Link contracts
        characterNFT.setBlockRegistry(address(registry));
        registry.setCharacterNFT(address(characterNFT));
        
        // Register a test block type
        bricksBlockTypeId = registry.registerBlockType(
            "Bricks A",
            "BRICK_A",
            false, // not premium
            0,     // free
            "/models/gltf/bricks_A.gltf"
        );
        
        // Set starting quantity
        registry.setStartingBlockQuantity(bricksBlockTypeId, 50);
        
        // Give players some ETH
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
    }
    
    function test_CharacterMint() public {
        vm.prank(player1);
        bytes32 tokenId = characterNFT.mint{value: MINT_PRICE}(
            0,              // Mage
            "MyCharacter",
            "https://example.com/avatar.png",
            4, 4, 4         // Room at center
        );
        
        // Check ownership
        assertEq(characterNFT.tokenOwnerOf(tokenId), player1);
        
        // Check room assignment
        (uint8 x, uint8 y, uint8 z) = characterNFT.getRoomForCharacter(tokenId);
        assertEq(x, 4);
        assertEq(y, 4);
        assertEq(z, 4);
        
        // Check character data
        (
            CharacterNFT.CharacterType charType,
            string memory name,
            ,
            uint8 roomX,
            uint8 roomY,
            uint8 roomZ,
        ) = characterNFT.getCharacter(tokenId);
        
        assertEq(uint8(charType), 0); // Mage
        assertEq(name, "MyCharacter");
        assertEq(roomX, 4);
        assertEq(roomY, 4);
        assertEq(roomZ, 4);
        
        console.log("Character minted successfully!");
        console.log("Token ID:", uint256(tokenId));
    }
    
    function test_RoomCannotBeOccupiedTwice() public {
        // Player 1 mints at room (4,4,4)
        vm.prank(player1);
        characterNFT.mint{value: MINT_PRICE}(
            0, "Player1Char", "url1", 4, 4, 4
        );
        
        // Player 2 tries to mint at same room - should fail
        vm.prank(player2);
        vm.expectRevert(abi.encodeWithSelector(
            CharacterNFT.RoomAlreadyOccupied.selector,
            4, 4, 4
        ));
        characterNFT.mint{value: MINT_PRICE}(
            1, "Player2Char", "url2", 4, 4, 4
        );
        
        console.log("Room protection works correctly!");
    }
    
    function test_RoomAvailability() public {
        // Initially all rooms available
        assertTrue(characterNFT.isRoomAvailable(0, 0, 0));
        assertTrue(characterNFT.isRoomAvailable(4, 4, 4));
        assertTrue(characterNFT.isRoomAvailable(8, 8, 8));
        
        // Invalid coords are not available
        assertFalse(characterNFT.isRoomAvailable(9, 0, 0));
        
        // Mint a character
        vm.prank(player1);
        characterNFT.mint{value: MINT_PRICE}(0, "Test", "url", 4, 4, 4);
        
        // Room is now occupied
        assertFalse(characterNFT.isRoomAvailable(4, 4, 4));
        
        console.log("Room availability tracking works!");
    }
    
    function test_BlockTypeRegistration() public {
        // Get registered block info
        (
            string memory name,
            string memory symbol,
            bool isPremium,
            uint256 price,
            string memory modelPath,
            address tokenContract
        ) = registry.getBlockTypeInfo(bricksBlockTypeId);
        
        assertEq(name, "Bricks A");
        assertEq(symbol, "BRICK_A");
        assertFalse(isPremium);
        assertEq(price, 0);
        assertEq(modelPath, "/models/gltf/bricks_A.gltf");
        assertTrue(tokenContract != address(0));
        
        console.log("Block type registered at:", tokenContract);
    }
    
    function test_BlockTokenMinting() public {
        // Get the block token contract
        address tokenAddr = registry.getBlockContract(bricksBlockTypeId);
        BlockToken blockToken = BlockToken(payable(tokenAddr));
        
        // Admin mints blocks to player
        registry.mintBlocks(bricksBlockTypeId, player1, 100);
        
        // Check balance
        assertEq(blockToken.balanceOf(player1), 100);
        
        console.log("Player1 block balance:", blockToken.balanceOf(player1));
    }
    
    function test_BlockPlacement() public {
        // Get the block token contract
        address tokenAddr = registry.getBlockContract(bricksBlockTypeId);
        BlockToken blockToken = BlockToken(payable(tokenAddr));
        
        // Admin mints blocks to player
        registry.mintBlocks(bricksBlockTypeId, player1, 100);
        
        // Player places 10 blocks (burns them)
        vm.prank(player1);
        blockToken.placeBlocks(10);
        
        // Balance should decrease
        assertEq(blockToken.balanceOf(player1), 90);
        
        console.log("Blocks placed, remaining:", blockToken.balanceOf(player1));
    }
    
    function test_InsufficientPaymentReverts() public {
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(
            CharacterNFT.InsufficientPayment.selector,
            MINT_PRICE,
            0.5 ether
        ));
        characterNFT.mint{value: 0.5 ether}(
            0, "Test", "url", 0, 0, 0
        );
        
        console.log("Payment validation works!");
    }
    
    function test_PremiumBlockPurchase() public {
        // Register a premium block
        bytes32 premiumId = registry.registerBlockType(
            "Gold Block",
            "GOLD",
            true,            // isPremium
            0.01 ether,      // price per block
            "/models/gltf/stone_with_gold.gltf"
        );
        
        address tokenAddr = registry.getBlockContract(premiumId);
        BlockToken goldToken = BlockToken(payable(tokenAddr));
        
        // Player purchases blocks
        vm.prank(player1);
        goldToken.purchase{value: 0.1 ether}(10);
        
        assertEq(goldToken.balanceOf(player1), 10);
        
        console.log("Premium block purchase successful!");
        console.log("Gold blocks owned:", goldToken.balanceOf(player1));
    }
}

