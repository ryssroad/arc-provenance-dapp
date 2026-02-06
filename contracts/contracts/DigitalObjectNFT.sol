// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DigitalObjectNFT
 * @notice ERC-721 NFT with dynamic stats for provenance tracking
 * @dev tokenId is used as assetId in ProvenanceRegistry (no mapping needed)
 */
contract DigitalObjectNFT is ERC721, Ownable {
    /// @notice Stats aggregates for each token
    struct Stats {
        uint32 forksOut;      // Number of derivatives created from this token
        uint32 forksIn;       // Number of parents (1 for derivatives, 0 for roots)
        uint32 attestCount;   // Total attestations received
        uint16 score;         // Quality score (0-10000 basis points)
    }

    /// @notice Token counter for auto-incrementing IDs
    uint256 private _nextTokenId = 1;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Seed URIs for each token (static metadata part)
    mapping(uint256 => string) private _seedURIs;

    /// @notice Stats for each token
    mapping(uint256 => Stats) public stats;

    /// @notice Emitted when stats are updated
    event StatsUpdated(
        uint256 indexed tokenId,
        uint32 forksOut,
        uint32 forksIn,
        uint32 attestCount,
        uint16 score,
        bytes32 ref
    );

    /// @notice Emitted when a new token is minted
    event Minted(
        uint256 indexed tokenId,
        address indexed to,
        string seedURI
    );

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /**
     * @notice Mint a new digital object NFT
     * @param to Address to receive the token
     * @param seedURI URI for the token's static metadata
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string calldata seedURI) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _seedURIs[tokenId] = seedURI;
        
        emit Minted(tokenId, to, seedURI);
    }

    /**
     * @notice Update stats for a token (only owner/scorer)
     * @param tokenId Token to update
     * @param forksOut Number of derivatives
     * @param forksIn Number of parents
     * @param attestCount Total attestations
     * @param score Quality score
     * @param ref Reference (tx hash, IPFS CID, etc.)
     */
    function updateStats(
        uint256 tokenId,
        uint32 forksOut,
        uint32 forksIn,
        uint32 attestCount,
        uint16 score,
        bytes32 ref
    ) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        stats[tokenId] = Stats({
            forksOut: forksOut,
            forksIn: forksIn,
            attestCount: attestCount,
            score: score
        });

        emit StatsUpdated(tokenId, forksOut, forksIn, attestCount, score, ref);
    }

    /**
     * @notice Set the base URI for all tokens
     * @param baseURI New base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @notice Get the seed URI for a token
     * @param tokenId Token ID
     * @return The seed URI
     */
    function seedURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _seedURIs[tokenId];
    }

    /**
     * @notice Get the total number of minted tokens
     * @return Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Returns the base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Get token URI (base + tokenId)
     * @param tokenId Token ID
     * @return Full token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory base = _baseURI();
        string memory seed = _seedURIs[tokenId];
        
        // If seedURI is set, use it; otherwise use base + tokenId
        if (bytes(seed).length > 0) {
            return seed;
        }
        
        return bytes(base).length > 0 
            ? string(abi.encodePacked(base, Strings.toString(tokenId)))
            : "";
    }
}
