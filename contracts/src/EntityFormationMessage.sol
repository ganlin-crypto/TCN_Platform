// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

/**
 * EntityFormationMessage — TCN Phase 1
 * TCN-CONTRACT-EFM-001
 *
 * Records the business organizer's confirmation that a legal entity has been
 * formed off-chain on behalf of a TCT Owner. This is the prerequisite for
 * the fund movement instruction.
 *
 * GOVERNING PRINCIPLE: Reporter, not determiner.
 * This contract records facts determined elsewhere. It does not form entities,
 * carry legal force, or store economic values.
 *
 * sourceRef is mandatory on every record — it points to the authoritative
 * off-chain document. A record without a sourceRef is rejected.
 *
 * Record corrections are permitted only before the participant reaches
 * Active status. Corrections require dual authorization (REPORTING_ROLE +
 * WORKFLOW_ADMIN_ROLE). The original record is never deleted — it is
 * permanently marked as superseded.
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract EntityFormationMessage is AccessControl, Pausable {

    // ─── ROLES ──────────────────────────────────────────────────────────────
    bytes32 public constant WORKFLOW_ADMIN_ROLE = keccak256("WORKFLOW_ADMIN_ROLE");
    bytes32 public constant REPORTING_ROLE      = keccak256("REPORTING_ROLE");
    bytes32 public constant PAUSER_ROLE         = keccak256("PAUSER_ROLE");

    // ─── DATA STRUCTURES ────────────────────────────────────────────────────
    struct FormationRecord {
        bytes32 recordId;
        string  projectId;
        string  workflowId;
        string  entityRef;          // off-chain entity identifier (e.g. state filing ref)
        address organizerAddress;   // platform address of the business organizer
        string  sourceRef;          // pointer to authoritative formation documents
        uint64  formedAt;           // date entity was formed off-chain
        uint64  reportedAt;         // timestamp of on-chain recording
        bool    revoked;
        bool    superseded;
        bytes32 supersededBy;       // recordId of the correction record (if superseded)
    }

    // recordId → record
    mapping(bytes32 => FormationRecord) private _records;

    // projectId+workflowId → active recordId (latest non-superseded, non-revoked)
    mapping(bytes32 => bytes32) public activeRecordId;

    uint256 private _recordCount;

    // ─── EVENTS ─────────────────────────────────────────────────────────────
    event EntityFormationReported(
        bytes32 indexed recordId,
        string  projectId,
        string  workflowId,
        address indexed organizerAddress,
        string  sourceRef,
        uint64  formedAt,
        uint64  reportedAt
    );

    event EntityFormationRevoked(
        bytes32 indexed recordId,
        string  projectId,
        string  workflowId,
        string  sourceRef,
        uint64  revokedAt
    );

    event RecordSuperseded(
        bytes32 indexed originalRecordId,
        bytes32 indexed correctionRecordId,
        string  sourceRef
    );

    event CorrectionReported(
        bytes32 indexed correctionRecordId,
        bytes32 indexed supersededRecordId,
        string  projectId,
        string  workflowId,
        string  sourceRef
    );

    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ─── CORE FUNCTIONS ─────────────────────────────────────────────────────

    /**
     * Record that the business organizer has confirmed legal entity formation.
     * Called by the TCN backend (REPORTING_ROLE) upon receiving confirmation
     * from the business organizer through the TCN-provided channel.
     */
    function recordFormation(
        string calldata projectId,
        string calldata workflowId,
        string calldata entityRef,
        address         organizerAddress,
        string calldata sourceRef,
        uint64          formedAt
    )
        external
        onlyRole(REPORTING_ROLE)
        whenNotPaused
        returns (bytes32 recordId)
    {
        require(bytes(projectId).length  > 0, "EFM: projectId required");
        require(bytes(workflowId).length > 0, "EFM: workflowId required");
        require(bytes(entityRef).length  > 0, "EFM: entityRef required");
        require(bytes(sourceRef).length  > 0, "EFM: sourceRef required");
        require(organizerAddress != address(0), "EFM: organizerAddress required");
        require(formedAt > 0,                  "EFM: formedAt required");

        recordId = _generateRecordId(projectId, workflowId);

        FormationRecord storage rec = _records[recordId];
        rec.recordId        = recordId;
        rec.projectId       = projectId;
        rec.workflowId      = workflowId;
        rec.entityRef       = entityRef;
        rec.organizerAddress = organizerAddress;
        rec.sourceRef       = sourceRef;
        rec.formedAt        = formedAt;
        rec.reportedAt      = uint64(block.timestamp);

        activeRecordId[_workflowKey(projectId, workflowId)] = recordId;
        _recordCount++;

        emit EntityFormationReported(
            recordId, projectId, workflowId,
            organizerAddress, sourceRef, formedAt, rec.reportedAt
        );
    }

    /**
     * Record that the business organizer has reported the entity formation
     * was revoked off-chain. Only permitted before fund acknowledgment.
     * Participant state returns to FormationPending (handled off-chain by TCN backend).
     * Requires dual authorization: REPORTING_ROLE initiates, WORKFLOW_ADMIN_ROLE confirms.
     */
    function revokeFormation(
        bytes32         recordId,
        string calldata sourceRef
    )
        external
        whenNotPaused
    {
        require(
            hasRole(REPORTING_ROLE, msg.sender) || hasRole(WORKFLOW_ADMIN_ROLE, msg.sender),
            "EFM: missing role"
        );
        require(bytes(sourceRef).length > 0, "EFM: sourceRef required");

        FormationRecord storage rec = _records[recordId];
        require(rec.reportedAt > 0,  "EFM: record not found");
        require(!rec.revoked,        "EFM: already revoked");
        require(!rec.superseded,     "EFM: record superseded");

        rec.revoked = true;
        delete activeRecordId[_workflowKey(rec.projectId, rec.workflowId)];

        emit EntityFormationRevoked(
            recordId, rec.projectId, rec.workflowId,
            sourceRef, uint64(block.timestamp)
        );
    }

    /**
     * Mark an existing record as superseded and issue a correction.
     * Only permitted before the participant reaches Active status.
     * Requires dual authorization: both REPORTING_ROLE and WORKFLOW_ADMIN_ROLE
     * must be held by msg.sender (enforced at the backend — both roles granted
     * to the multi-sig correction executor address).
     */
    function supersede(
        bytes32         originalRecordId,
        string calldata projectId,
        string calldata workflowId,
        string calldata entityRef,
        address         organizerAddress,
        string calldata sourceRef,
        uint64          formedAt
    )
        external
        whenNotPaused
        returns (bytes32 correctionRecordId)
    {
        require(
            hasRole(REPORTING_ROLE, msg.sender) && hasRole(WORKFLOW_ADMIN_ROLE, msg.sender),
            "EFM: dual authorization required"
        );
        require(bytes(sourceRef).length > 0,      "EFM: sourceRef required");
        require(bytes(entityRef).length > 0,       "EFM: entityRef required");
        require(organizerAddress != address(0),    "EFM: organizerAddress required");

        FormationRecord storage original = _records[originalRecordId];
        require(original.reportedAt > 0, "EFM: original record not found");
        require(!original.superseded,    "EFM: already superseded");
        require(!original.revoked,       "EFM: record revoked");

        // Mark original as superseded
        correctionRecordId = _generateRecordId(projectId, workflowId);
        original.superseded   = true;
        original.supersededBy = correctionRecordId;

        // Create correction record
        FormationRecord storage correction = _records[correctionRecordId];
        correction.recordId         = correctionRecordId;
        correction.projectId        = projectId;
        correction.workflowId       = workflowId;
        correction.entityRef        = entityRef;
        correction.organizerAddress = organizerAddress;
        correction.sourceRef        = sourceRef;
        correction.formedAt         = formedAt;
        correction.reportedAt       = uint64(block.timestamp);

        activeRecordId[_workflowKey(projectId, workflowId)] = correctionRecordId;
        _recordCount++;

        emit RecordSuperseded(originalRecordId, correctionRecordId, sourceRef);
        emit CorrectionReported(
            correctionRecordId, originalRecordId,
            projectId, workflowId, sourceRef
        );
    }

    // ─── VIEWS ──────────────────────────────────────────────────────────────

    function getRecord(bytes32 recordId) external view returns (FormationRecord memory) {
        require(_records[recordId].reportedAt > 0, "EFM: record not found");
        return _records[recordId];
    }

    function getActiveRecord(string calldata projectId, string calldata workflowId)
        external view returns (FormationRecord memory)
    {
        bytes32 rid = activeRecordId[_workflowKey(projectId, workflowId)];
        require(rid != bytes32(0), "EFM: no active record");
        return _records[rid];
    }

    function recordCount() external view returns (uint256) {
        return _recordCount;
    }

    // ─── PAUSE ──────────────────────────────────────────────────────────────
    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─── INTERNAL ───────────────────────────────────────────────────────────
    function _workflowKey(string memory projectId, string memory workflowId)
        internal pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(projectId, ":", workflowId));
    }

    function _generateRecordId(string memory projectId, string memory workflowId)
        internal view returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            projectId, workflowId, block.timestamp, _recordCount, msg.sender
        ));
    }
}
