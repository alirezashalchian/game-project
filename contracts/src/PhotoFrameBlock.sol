// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import {LSP7DigitalAsset} from "@lukso/lsp-smart-contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

/**
 * @title PhotoFrameBlock
 * @notice Special LSP7 block type for photo frames with on-chain metadata.
 * @dev Unlike regular blocks, photo frames can store imageUrl, linkUrl, and description
 *      in their on-chain metadata. This allows players to showcase products/websites.
 */
contract PhotoFrameBlock is LSP7DigitalAsset {
    // Frame metadata structure
    struct FrameMetadata {
        string imageUrl;
        string linkUrl;
        string description;
        bool isSet;
    }
    
    // Registry that deployed this token
    address public registry;
    
    // Price per frame
    uint256 public pricePerUnit;
    
    // Model path for 3D rendering
    string public modelPath;
    
    // Metadata for each frame owned by a player
    // player address => frame index => metadata
    mapping(address => mapping(uint256 => FrameMetadata)) public frameMetadata;
    
    // Count of frames with metadata set per player
    mapping(address => uint256) public metadataCount;
    
    // Events
    event FrameMetadataSet(
        address indexed owner,
        uint256 indexed frameIndex,
        string imageUrl,
        string linkUrl,
        string description
    );
    event FrameMetadataCleared(address indexed owner, uint256 indexed frameIndex);
    event FramePurchased(address indexed player, uint256 amount, uint256 totalCost);
    event FramePlaced(address indexed player, uint256 frameIndex);
    event FrameRemoved(address indexed player, uint256 frameIndex);
    
    // Errors
    error OnlyRegistry();
    error InsufficientPayment(uint256 required, uint256 provided);
    error InsufficientFrames(uint256 required, uint256 available);
    error FrameIndexOutOfBounds(uint256 index, uint256 balance);
    error MetadataNotSet(uint256 frameIndex);
    
    modifier onlyRegistry() {
        if (msg.sender != registry) revert OnlyRegistry();
        _;
    }
    
    /**
     * @notice Deploy a PhotoFrameBlock contract.
     * @param name_ Display name (e.g., "Photo Frame")
     * @param symbol_ Token symbol (e.g., "FRAME")
     * @param registryAddress The BlockTypeRegistry that owns this contract
     * @param pricePerUnit_ Price in wei per frame
     * @param modelPath_ Path to the 3D model file
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address registryAddress,
        uint256 pricePerUnit_,
        string memory modelPath_
    ) LSP7DigitalAsset(
        name_,
        symbol_,
        registryAddress,
        true // isNonDivisible
    ) {
        registry = registryAddress;
        pricePerUnit = pricePerUnit_;
        modelPath = modelPath_;
    }
    
    /**
     * @notice Mint frames to a player. Called by registry.
     * @param to Player address
     * @param amount Number of frames
     */
    function mint(address to, uint256 amount) external onlyRegistry {
        _mint(to, amount, true, "");
    }
    
    /**
     * @notice Purchase photo frames with LYX.
     * @param amount Number of frames to purchase
     */
    function purchase(uint256 amount) external payable {
        uint256 totalCost = pricePerUnit * amount;
        if (msg.value < totalCost) {
            revert InsufficientPayment(totalCost, msg.value);
        }
        
        _mint(msg.sender, amount, true, "");
        
        // Refund excess
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(success, "Refund failed");
        }
        
        emit FramePurchased(msg.sender, amount, totalCost);
    }
    
    /**
     * @notice Set metadata for a specific frame owned by the caller.
     * @param frameIndex Index of the frame (0-based, must be < balance)
     * @param imageUrl URL to the image to display
     * @param linkUrl URL to link when clicked
     * @param description Text description of the content
     */
    function setFrameMetadata(
        uint256 frameIndex,
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata description
    ) external {
        uint256 balance = balanceOf(msg.sender);
        if (frameIndex >= balance) {
            revert FrameIndexOutOfBounds(frameIndex, balance);
        }
        
        frameMetadata[msg.sender][frameIndex] = FrameMetadata({
            imageUrl: imageUrl,
            linkUrl: linkUrl,
            description: description,
            isSet: true
        });
        
        metadataCount[msg.sender]++;
        
        emit FrameMetadataSet(msg.sender, frameIndex, imageUrl, linkUrl, description);
    }
    
    /**
     * @notice Clear metadata for a specific frame.
     * @param frameIndex Index of the frame
     */
    function clearFrameMetadata(uint256 frameIndex) external {
        if (!frameMetadata[msg.sender][frameIndex].isSet) {
            revert MetadataNotSet(frameIndex);
        }
        
        delete frameMetadata[msg.sender][frameIndex];
        metadataCount[msg.sender]--;
        
        emit FrameMetadataCleared(msg.sender, frameIndex);
    }
    
    /**
     * @notice Place a frame in the game world (burn the token).
     * @param frameIndex Index of the frame to place
     */
    function placeFrame(uint256 frameIndex) external {
        uint256 balance = balanceOf(msg.sender);
        if (balance == 0) {
            revert InsufficientFrames(1, 0);
        }
        if (frameIndex >= balance) {
            revert FrameIndexOutOfBounds(frameIndex, balance);
        }
        
        // If placing the last frame, clear its metadata
        if (frameMetadata[msg.sender][frameIndex].isSet) {
            delete frameMetadata[msg.sender][frameIndex];
            metadataCount[msg.sender]--;
        }
        
        _burn(msg.sender, 1, "");
        emit FramePlaced(msg.sender, frameIndex);
    }
    
    /**
     * @notice Remove a frame from the game world (return to inventory).
     * @dev Only registry can call this. Frame returns without metadata.
     * @param player Player removing the frame
     */
    function removeFrame(address player) external onlyRegistry {
        _mint(player, 1, true, "");
        emit FrameRemoved(player, balanceOf(player) - 1);
    }
    
    /**
     * @notice Get metadata for a specific frame.
     * @param owner Frame owner address
     * @param frameIndex Frame index
     * @return imageUrl Image URL
     * @return linkUrl Link URL
     * @return description Description text
     * @return isSet Whether metadata is set
     */
    function getFrameMetadata(
        address owner,
        uint256 frameIndex
    ) external view returns (
        string memory imageUrl,
        string memory linkUrl,
        string memory description,
        bool isSet
    ) {
        FrameMetadata storage meta = frameMetadata[owner][frameIndex];
        return (meta.imageUrl, meta.linkUrl, meta.description, meta.isSet);
    }
    
    /**
     * @notice Get all frames with metadata for a player.
     * @param owner Player address
     * @return indices Array of frame indices with metadata
     * @return imageUrls Array of image URLs
     * @return linkUrls Array of link URLs
     * @return descriptions Array of descriptions
     */
    function getAllFrameMetadata(address owner) external view returns (
        uint256[] memory indices,
        string[] memory imageUrls,
        string[] memory linkUrls,
        string[] memory descriptions
    ) {
        uint256 count = metadataCount[owner];
        uint256 balance = balanceOf(owner);
        
        indices = new uint256[](count);
        imageUrls = new string[](count);
        linkUrls = new string[](count);
        descriptions = new string[](count);
        
        uint256 found = 0;
        for (uint256 i = 0; i < balance && found < count; i++) {
            if (frameMetadata[owner][i].isSet) {
                indices[found] = i;
                imageUrls[found] = frameMetadata[owner][i].imageUrl;
                linkUrls[found] = frameMetadata[owner][i].linkUrl;
                descriptions[found] = frameMetadata[owner][i].description;
                found++;
            }
        }
        
        return (indices, imageUrls, linkUrls, descriptions);
    }
    
    /**
     * @notice Withdraw collected LYX.
     */
    function withdrawFunds() external onlyRegistry {
        uint256 balance = address(this).balance;
        (bool success, ) = registry.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get frame info for frontend.
     * @return price Price per frame
     * @return path Model path
     */
    function getFrameInfo() external view returns (uint256 price, string memory path) {
        return (pricePerUnit, modelPath);
    }
}

