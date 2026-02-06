// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ProvenanceRegistryV2
 * @notice Registry for tracking provenance relationships and attestations
 * @dev Events are the source of truth - no onchain storage of the graph
 */
contract ProvenanceRegistryV2 {
    /// @notice Attestation kinds
    uint8 public constant KIND_SOURCE = 1;    // Origin/created
    uint8 public constant KIND_QUALITY = 2;   // Quality attestation
    uint8 public constant KIND_REVIEW = 3;    // Review attestation
    uint8 public constant KIND_LICENSE = 4;   // License attestation

    /// @notice Emitted when a derivative relationship is created (edge in graph)
    /// @param nft Address of the NFT contract
    /// @param parentId Token ID of the parent (source)
    /// @param childId Token ID of the child (derivative)
    /// @param actor Address that created the relationship
    /// @param ref Reference (commit hash, IPFS CID, etc.)
    event Derived(
        address indexed nft,
        uint256 indexed parentId,
        uint256 indexed childId,
        address actor,
        bytes32 ref
    );

    /// @notice Emitted when an attestation is made
    /// @param nft Address of the NFT contract
    /// @param tokenId Token ID being attested
    /// @param attester Address making the attestation
    /// @param kind Type of attestation (SOURCE, QUALITY, REVIEW, LICENSE)
    /// @param ref Reference (tx hash, IPFS CID, etc.)
    /// @param payloadHash Hash of the attestation payload (offchain data)
    event Attested(
        address indexed nft,
        uint256 indexed tokenId,
        address indexed attester,
        uint8 kind,
        bytes32 ref,
        bytes32 payloadHash
    );

    /**
     * @notice Create a derivative relationship between two tokens
     * @param nft Address of the NFT contract
     * @param parentId Token ID of the parent
     * @param childId Token ID of the child (derivative)
     * @param ref Reference for the derivation
     */
    function derive(
        address nft,
        uint256 parentId,
        uint256 childId,
        bytes32 ref
    ) external {
        // Verify both tokens exist
        require(_tokenExists(nft, parentId), "Parent token does not exist");
        require(_tokenExists(nft, childId), "Child token does not exist");
        require(parentId != childId, "Cannot derive from self");

        emit Derived(nft, parentId, childId, msg.sender, ref);
    }

    /**
     * @notice Create an attestation for a token
     * @param nft Address of the NFT contract
     * @param tokenId Token ID to attest
     * @param kind Type of attestation
     * @param ref Reference for the attestation
     * @param payloadHash Hash of the attestation payload
     */
    function attest(
        address nft,
        uint256 tokenId,
        uint8 kind,
        bytes32 ref,
        bytes32 payloadHash
    ) external {
        require(_tokenExists(nft, tokenId), "Token does not exist");
        require(kind >= KIND_SOURCE && kind <= KIND_LICENSE, "Invalid attestation kind");

        emit Attested(nft, tokenId, msg.sender, kind, ref, payloadHash);
    }

    /**
     * @notice Batch derive multiple relationships in one transaction
     * @param nft Address of the NFT contract
     * @param parentIds Array of parent token IDs
     * @param childIds Array of child token IDs
     * @param refs Array of references
     */
    function deriveBatch(
        address nft,
        uint256[] calldata parentIds,
        uint256[] calldata childIds,
        bytes32[] calldata refs
    ) external {
        require(parentIds.length == childIds.length, "Arrays length mismatch");
        require(parentIds.length == refs.length, "Arrays length mismatch");

        for (uint256 i = 0; i < parentIds.length; i++) {
            require(_tokenExists(nft, parentIds[i]), "Parent token does not exist");
            require(_tokenExists(nft, childIds[i]), "Child token does not exist");
            require(parentIds[i] != childIds[i], "Cannot derive from self");

            emit Derived(nft, parentIds[i], childIds[i], msg.sender, refs[i]);
        }
    }

    /**
     * @notice Batch attest multiple tokens in one transaction
     * @param nft Address of the NFT contract
     * @param tokenIds Array of token IDs
     * @param kinds Array of attestation kinds
     * @param refs Array of references
     * @param payloadHashes Array of payload hashes
     */
    function attestBatch(
        address nft,
        uint256[] calldata tokenIds,
        uint8[] calldata kinds,
        bytes32[] calldata refs,
        bytes32[] calldata payloadHashes
    ) external {
        require(tokenIds.length == kinds.length, "Arrays length mismatch");
        require(tokenIds.length == refs.length, "Arrays length mismatch");
        require(tokenIds.length == payloadHashes.length, "Arrays length mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_tokenExists(nft, tokenIds[i]), "Token does not exist");
            require(kinds[i] >= KIND_SOURCE && kinds[i] <= KIND_LICENSE, "Invalid attestation kind");

            emit Attested(nft, tokenIds[i], msg.sender, kinds[i], refs[i], payloadHashes[i]);
        }
    }

    /**
     * @dev Check if a token exists in the NFT contract
     * @param nft Address of the NFT contract
     * @param tokenId Token ID to check
     * @return exists Whether the token exists
     */
    function _tokenExists(address nft, uint256 tokenId) internal view returns (bool exists) {
        try IERC721(nft).ownerOf(tokenId) returns (address owner) {
            exists = owner != address(0);
        } catch {
            exists = false;
        }
    }
}
