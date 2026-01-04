// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import {
    LSP8IdentifiableDigitalAsset
} from "@lukso/lsp-smart-contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {
    _LSP8_TOKENID_TYPE_NUMBER
} from "@lukso/lsp-smart-contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";

/**
 * @title IBlockTypeRegistry
 * @notice Interface for the BlockTypeRegistry to grant starting blocks
 */
interface IBlockTypeRegistry {
    function grantStartingBlocks(address player, bytes32 characterTokenId) external;
}

/**
 * @title CharacterNFT
 * @notice LSP8 NFT contract for unique game characters.
 * @dev Each character NFT grants ownership of exactly one room in the 9x9x9 grid.
 *      Players pay LYX to mint characters and select their room at mint time.
 */
contract CharacterNFT is LSP8IdentifiableDigitalAsset {
    // Character types available in the game
    enum CharacterType {
        Mage,
        Barbarian,
        Knight,
        Rogue
    }
    
    // Room coordinates in the 9x9x9 grid
    struct RoomCoords {
        uint8 x;
        uint8 y;
        uint8 z;
    }
    
    // Character metadata stored on-chain
    struct CharacterData {
        CharacterType characterType;
        string name;
        string imageUrl;
        RoomCoords room;
        uint256 mintedAt;
    }
    
    // Grid dimensions (9x9x9 = 729 total rooms)
    uint8 public constant GRID_SIZE = 9;
    uint256 public constant TOTAL_ROOMS = 729;
    
    // Mint price in LYX (wei)
    uint256 public mintPrice;
    
    // Next token ID to mint
    uint256 private _nextTokenId = 1;
    
    // Character data storage
    mapping(bytes32 => CharacterData) public characters;
    
    // Room occupancy: roomId => tokenId (0 means unoccupied)
    mapping(uint256 => bytes32) public roomToCharacter;
    
    // Token to room mapping
    mapping(bytes32 => uint256) public characterToRoom;
    
    // Block registry for granting starting blocks
    address public blockRegistry;
    
    // Events
    event CharacterMinted(
        address indexed owner,
        bytes32 indexed tokenId,
        CharacterType characterType,
        string name,
        uint8 roomX,
        uint8 roomY,
        uint8 roomZ
    );
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BlockRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    
    // Errors
    error InvalidRoomCoordinates(uint8 x, uint8 y, uint8 z);
    error RoomAlreadyOccupied(uint8 x, uint8 y, uint8 z);
    error InsufficientPayment(uint256 required, uint256 provided);
    error InvalidCharacterType(uint8 typeId);
    error EmptyCharacterName();
    
    /**
     * @notice Deploy the CharacterNFT contract.
     * @param name_ Collection name
     * @param symbol_ Collection symbol
     * @param owner_ Contract owner (admin)
     * @param mintPrice_ Price in wei to mint a character
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        uint256 mintPrice_
    ) LSP8IdentifiableDigitalAsset(
        name_,
        symbol_,
        owner_,
        _LSP8_TOKENID_TYPE_NUMBER
    ) {
        mintPrice = mintPrice_;
    }
    
    /**
     * @notice Set the block registry address for granting starting blocks.
     * @param registry_ The BlockTypeRegistry contract address
     */
    function setBlockRegistry(address registry_) external onlyOwner {
        address oldRegistry = blockRegistry;
        blockRegistry = registry_;
        emit BlockRegistryUpdated(oldRegistry, registry_);
    }
    
    /**
     * @notice Update the mint price.
     * @param newPrice New price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @notice Mint a new character NFT with room selection.
     * @param characterType_ Type of character (0=Mage, 1=Barbarian, 2=Knight, 3=Rogue)
     * @param name_ Character name chosen by player
     * @param imageUrl_ URL to character image/avatar
     * @param roomX X coordinate of desired room (0-8)
     * @param roomY Y coordinate of desired room (0-8)
     * @param roomZ Z coordinate of desired room (0-8)
     */
    function mint(
        uint8 characterType_,
        string calldata name_,
        string calldata imageUrl_,
        uint8 roomX,
        uint8 roomY,
        uint8 roomZ
    ) external payable returns (bytes32 tokenId) {
        // Validate payment
        if (msg.value < mintPrice) {
            revert InsufficientPayment(mintPrice, msg.value);
        }
        
        // Validate character type
        if (characterType_ > uint8(CharacterType.Rogue)) {
            revert InvalidCharacterType(characterType_);
        }
        
        // Validate character name
        if (bytes(name_).length == 0) {
            revert EmptyCharacterName();
        }
        
        // Validate room coordinates
        if (roomX >= GRID_SIZE || roomY >= GRID_SIZE || roomZ >= GRID_SIZE) {
            revert InvalidRoomCoordinates(roomX, roomY, roomZ);
        }
        
        // Check room availability
        uint256 roomId = _coordsToRoomId(roomX, roomY, roomZ);
        if (roomToCharacter[roomId] != bytes32(0)) {
            revert RoomAlreadyOccupied(roomX, roomY, roomZ);
        }
        
        // Generate token ID
        tokenId = bytes32(_nextTokenId);
        _nextTokenId++;
        
        // Store character data
        characters[tokenId] = CharacterData({
            characterType: CharacterType(characterType_),
            name: name_,
            imageUrl: imageUrl_,
            room: RoomCoords({x: roomX, y: roomY, z: roomZ}),
            mintedAt: block.timestamp
        });
        
        // Assign room
        roomToCharacter[roomId] = tokenId;
        characterToRoom[tokenId] = roomId;
        
        // Mint the NFT
        _mint(msg.sender, tokenId, true, "");
        
        // Grant starting blocks if registry is set
        if (blockRegistry != address(0)) {
            try IBlockTypeRegistry(blockRegistry).grantStartingBlocks(msg.sender, tokenId) {
                // Starting blocks granted successfully
            } catch {
                // If granting fails, we still want the mint to succeed
                // The admin can manually grant blocks later if needed
            }
        }
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            (bool success, ) = msg.sender.call{value: msg.value - mintPrice}("");
            require(success, "Refund failed");
        }
        
        emit CharacterMinted(
            msg.sender,
            tokenId,
            CharacterType(characterType_),
            name_,
            roomX,
            roomY,
            roomZ
        );
        
        return tokenId;
    }
    
    /**
     * @notice Get character data by token ID.
     * @param tokenId The character's token ID
     * @return characterType The type of character
     * @return name Character name
     * @return imageUrl Character image URL
     * @return roomX Room X coordinate
     * @return roomY Room Y coordinate
     * @return roomZ Room Z coordinate
     * @return mintedAt Timestamp when minted
     */
    function getCharacter(bytes32 tokenId) external view returns (
        CharacterType characterType,
        string memory name,
        string memory imageUrl,
        uint8 roomX,
        uint8 roomY,
        uint8 roomZ,
        uint256 mintedAt
    ) {
        CharacterData storage data = characters[tokenId];
        return (
            data.characterType,
            data.name,
            data.imageUrl,
            data.room.x,
            data.room.y,
            data.room.z,
            data.mintedAt
        );
    }
    
    /**
     * @notice Get the room owned by a character.
     * @param tokenId The character's token ID
     * @return x Room X coordinate
     * @return y Room Y coordinate  
     * @return z Room Z coordinate
     */
    function getRoomForCharacter(bytes32 tokenId) external view returns (
        uint8 x,
        uint8 y,
        uint8 z
    ) {
        CharacterData storage data = characters[tokenId];
        return (data.room.x, data.room.y, data.room.z);
    }
    
    /**
     * @notice Get the character that owns a specific room.
     * @param x Room X coordinate
     * @param y Room Y coordinate
     * @param z Room Z coordinate
     * @return tokenId The character's token ID (0 if unoccupied)
     */
    function getCharacterInRoom(uint8 x, uint8 y, uint8 z) external view returns (bytes32) {
        uint256 roomId = _coordsToRoomId(x, y, z);
        return roomToCharacter[roomId];
    }
    
    /**
     * @notice Check if a room is available for selection.
     * @param x Room X coordinate
     * @param y Room Y coordinate
     * @param z Room Z coordinate
     * @return available True if room is unoccupied
     */
    function isRoomAvailable(uint8 x, uint8 y, uint8 z) external view returns (bool) {
        if (x >= GRID_SIZE || y >= GRID_SIZE || z >= GRID_SIZE) {
            return false;
        }
        uint256 roomId = _coordsToRoomId(x, y, z);
        return roomToCharacter[roomId] == bytes32(0);
    }
    
    /**
     * @notice Get all available rooms in the grid.
     * @return coords Array of available room coordinates
     */
    function getAvailableRooms() external view returns (RoomCoords[] memory) {
        // First, count available rooms
        uint256 availableCount = 0;
        for (uint256 i = 0; i < TOTAL_ROOMS; i++) {
            if (roomToCharacter[i] == bytes32(0)) {
                availableCount++;
            }
        }
        
        // Allocate and fill array
        RoomCoords[] memory coords = new RoomCoords[](availableCount);
        uint256 index = 0;
        for (uint256 i = 0; i < TOTAL_ROOMS && index < availableCount; i++) {
            if (roomToCharacter[i] == bytes32(0)) {
                (uint8 x, uint8 y, uint8 z) = _roomIdToCoords(i);
                coords[index] = RoomCoords({x: x, y: y, z: z});
                index++;
            }
        }
        
        return coords;
    }
    
    /**
     * @notice Get total number of characters minted.
     * @return count Number of characters minted
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @notice Withdraw collected LYX from mints.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Convert room coordinates to a unique room ID.
     */
    function _coordsToRoomId(uint8 x, uint8 y, uint8 z) internal pure returns (uint256) {
        return uint256(x) + uint256(y) * GRID_SIZE + uint256(z) * GRID_SIZE * GRID_SIZE;
    }
    
    /**
     * @dev Convert room ID back to coordinates.
     */
    function _roomIdToCoords(uint256 roomId) internal pure returns (uint8 x, uint8 y, uint8 z) {
        x = uint8(roomId % GRID_SIZE);
        y = uint8((roomId / GRID_SIZE) % GRID_SIZE);
        z = uint8(roomId / (GRID_SIZE * GRID_SIZE));
    }
}

