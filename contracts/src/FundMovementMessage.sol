// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

/**
 * FundMovementMessage — TCN Phase 1
 * TCN-CONTRACT-FMM-001
 *
 * Records the MSB's acknowledgment that a participant's capital has arrived
 * in the regulated escrow account. This acknowledgment — received after entity
 * formation is already confirmed — completes the transition from TCT Owner to
 * TCT Participant.
 *
 * GOVERNING PRINCIPLE: Reporter, not determiner.
 * This contract records a fact determined elsewhere (the MSB's acknowledgment).
 * It does not touch, authorize, or direct any funds.
 * No capital amounts are ever written on-chain — only opaque references.
 *
 * Prerequisites:
 * - An active EntityFormationRecord must exist for the projectId + workflowId
 *   before a fund acknowledgment can be recorded.
 * - participantAddress must match the TCT wallet address established in TCM.
 *
 * Corrections use the same Supersession model as EntityFormationMessage:
 * dual authorization (REPORTING_ROLE + WORKFLOW_ADMIN_ROLE), only permitted
 * before the participant reaches Active status.
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IEntityFormationMessage {
    function activeRecordId(bytes32 workflowKey) external view returns (bytes32);
}

contract FundMovementMessage is AccessControl, Pausable {

    // ─── ROLES ──────────────────────────────────────────────────────────────
    bytes32 public constant WORKFLOW_ADMIN_ROLE = keccak256("WORKFLOW_ADMIN_ROLE");
    bytes32 public constant REPORTING_ROLE      = keccak256("REPORTING_ROLE");
    bytes32 public constant PAUSER_ROLE         = keccak256("PAUSER_ROLE");

    // ─── STATE ──────────────────────────────────────────────────────────────

    // Reference to EntityFormationMessage for prerequisite check
    IEntityFormationMessage public immutable entityFormation;

    struct AcknowledgmentRecord {
        bytes32 recordId;
        string  projectId;
        string  workflowId;
        address participantAddress;    // TCT wallet address — identifies the participant on-chain
        string  escrowRef;             // opaque escrow account identifier — NOT an amount
        bytes32 institutionAckHash;    // keccak256 of the MSB's acknowledgment document
        string  sourceRef;             // pointer to authoritative off-chain acknowledgment
        uint64  acknowledgedAt;        // timestamp of MSB's acknowledgment (off-chain)
        uint64  recordedAt;            // timestamp of on-chain recording
        bool    superseded;
        bytes32 supersededBy;
    }

    // recordId → record
    mapping(bytes32 => AcknowledgmentRecord) private _records;

    // projectId+workflowId+participant → active recordId
    mapping(bytes32 => bytes32) public activeRecordId;

    uint256 private _recordCount;

    // ─── EVENTS ─────────────────────────────────────────────────────────────
    event FundMovementAcknowledged(
        bytes32 indexed recordId,
        string  projectId,
        string  workflowId,
        address indexed participantAddress,
        string  escrowRef,
        bytes32 institutionAckHash,
        string  sourceRef,
        uint64  acknowledgedAt,
        uint64  recordedAt
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
        address participantAddress,
        string  sourceRef
    );

    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────
    constructor(address admin, address entityFormationAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        entityFormation = IEntityFormationMessage(entityFormationAddress);
    }

    // ─── CORE FUNCTIONS ─────────────────────────────────────────────────────

    /**
     * Record the MSB's acknowledgment that funds have arrived in escrow.
     * Called by the TCN backend (REPORTING_ROLE) upon receiving confirmation
     * from the MSB through the TCN-provided channel.
     *
     * Prerequisite: an active EntityFormationRecord must exist for this
     * projectId + workflowId. Entity formation must precede fund acknowledgment.
     */
    function recordAcknowledgment(
        string calldata projectId,
        string calldata workflowId,
        address         participantAddress,
        string calldata escrowRef,
        bytes32         institutionAckHash,
        string calldata sourceRef,
        uint64          acknowledgedAt
    )
        external
        onlyRole(REPORTING_ROLE)
        whenNotPaused
        returns (bytes32 recordId)
    {
        require(bytes(projectId).length   > 0, "FMM: projectId required");
        require(bytes(workflowId).length  > 0, "FMM: workflowId required");
        require(participantAddress != address(0), "FMM: participantAddress required");
        require(bytes(escrowRef).length   > 0, "FMM: escrowRef required");
        require(institutionAckHash != bytes32(0), "FMM: institutionAckHash required");
        require(bytes(sourceRef).length   > 0, "FMM: sourceRef required");
        require(acknowledgedAt > 0,             "FMM: acknowledgedAt required");

        // Prerequisite: entity formation must be confirmed before fund acknowledgment
        bytes32 formationKey = _workflowKey(projectId, workflowId);
        require(
            entityFormation.activeRecordId(formationKey) != bytes32(0),
            "FMM: entity formation not confirmed for this workflow"
        );

        recordId = _generateRecordId(projectId, workflowId, participantAddress);

        AcknowledgmentRecord storage rec = _records[recordId];
        rec.recordId            = recordId;
        rec.projectId           = projectId;
        rec.workflowId          = workflowId;
        rec.participantAddress  = participantAddress;
        rec.escrowRef           = escrowRef;
        rec.institutionAckHash  = institutionAckHash;
        rec.sourceRef           = sourceRef;
        rec.acknowledgedAt      = acknowledgedAt;
        rec.recordedAt          = uint64(block.timestamp);

        activeRecordId[_participantKey(projectId, workflowId, participantAddress)] = recordId;
        _recordCount++;

        emit FundMovementAcknowledged(
            recordId, projectId, workflowId,
            participantAddress, escrowRef, institutionAckHash,
            sourceRef, acknowledgedAt, rec.recordedAt
        );
    }

    /**
     * Mark an existing record as superseded and issue a correction.
     * Only permitted before the participant reaches Active status.
     * Dual authorization: msg.sender must hold BOTH REPORTING_ROLE and
     * WORKFLOW_ADMIN_ROLE (enforced by granting both to the correction executor address).
     */
    function supersede(
        bytes32         originalRecordId,
        string calldata projectId,
        string calldata workflowId,
        address         participantAddress,
        string calldata escrowRef,
        bytes32         institutionAckHash,
        string calldata sourceRef,
        uint64          acknowledgedAt
    )
        external
        whenNotPaused
        returns (bytes32 correctionRecordId)
    {
        require(
            hasRole(REPORTING_ROLE, msg.sender) && hasRole(WORKFLOW_ADMIN_ROLE, msg.sender),
            "FMM: dual authorization required"
        );
        require(bytes(escrowRef).length   > 0, "FMM: escrowRef required");
        require(institutionAckHash != bytes32(0), "FMM: institutionAckHash required");
        require(bytes(sourceRef).length   > 0, "FMM: sourceRef required");
        require(participantAddress != address(0), "FMM: participantAddress required");

        AcknowledgmentRecord storage original = _records[originalRecordId];
        require(original.recordedAt > 0,  "FMM: record not found");
        require(!original.superseded,     "FMM: already superseded");

        correctionRecordId = _generateRecordId(projectId, workflowId, participantAddress);

        original.superseded   = true;
        original.supersededBy = correctionRecordId;

        AcknowledgmentRecord storage correction = _records[correctionRecordId];
        correction.recordId           = correctionRecordId;
        correction.projectId          = projectId;
        correction.workflowId         = workflowId;
        correction.participantAddress = participantAddress;
        correction.escrowRef          = escrowRef;
        correction.institutionAckHash = institutionAckHash;
        correction.sourceRef          = sourceRef;
        correction.acknowledgedAt     = acknowledgedAt;
        correction.recordedAt         = uint64(block.timestamp);

        activeRecordId[_participantKey(projectId, workflowId, participantAddress)] = correctionRecordId;
        _recordCount++;

        emit RecordSuperseded(originalRecordId, correctionRecordId, sourceRef);
        emit CorrectionReported(
            correctionRecordId, originalRecordId,
            projectId, workflowId, participantAddress, sourceRef
        );
    }

    // ─── VIEWS ──────────────────────────────────────────────────────────────

    function getRecord(bytes32 recordId)
        external view returns (AcknowledgmentRecord memory)
    {
        require(_records[recordId].recordedAt > 0, "FMM: record not found");
        return _records[recordId];
    }

    function getActiveRecord(
        string calldata projectId,
        string calldata workflowId,
        address         participantAddress
    )
        external view returns (AcknowledgmentRecord memory)
    {
        bytes32 rid = activeRecordId[_participantKey(projectId, workflowId, participantAddress)];
        require(rid != bytes32(0), "FMM: no active record");
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

    function _participantKey(
        string memory projectId,
        string memory workflowId,
        address       participant
    )
        internal pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(projectId, ":", workflowId, ":", participant));
    }

    function _generateRecordId(
        string memory projectId,
        string memory workflowId,
        address       participant
    )
        internal view returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            projectId, workflowId, participant,
            block.timestamp, _recordCount, msg.sender
        ));
    }
}
