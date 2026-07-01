import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { EntityFormationMessage, FundMovementMessage } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FundMovementMessage", function () {
  let efm: EntityFormationMessage;
  let fmm: FundMovementMessage;
  let admin: SignerWithAddress;
  let reporter: SignerWithAddress;
  let workflowAdmin: SignerWithAddress;
  let pauser: SignerWithAddress;
  let participant: SignerWithAddress;
  let corrector: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const REPORTING_ROLE      = ethers.keccak256(ethers.toUtf8Bytes("REPORTING_ROLE"));
  const WORKFLOW_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WORKFLOW_ADMIN_ROLE"));
  const PAUSER_ROLE         = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  const PROJECT_ID      = "TCN-2025-001";
  const WORKFLOW_ID     = "WF-001";
  const ESCROW_REF      = "ESCROW-ACCT-7829-XR";
  const SOURCE_REF      = "ipfs://QmFundAck...";
  const INST_ACK_HASH   = ethers.keccak256(ethers.toUtf8Bytes("MSB-ACK-DOC-2025-001"));
  const ACKNOWLEDGED_AT = BigInt(Math.floor(Date.now() / 1000) - 3600);
  const FORMED_AT       = BigInt(Math.floor(Date.now() / 1000) - 86400);

  beforeEach(async function () {
    [admin, reporter, workflowAdmin, pauser, participant, corrector, unauthorized] =
      await ethers.getSigners();

    // Deploy EntityFormationMessage first
    const EFMFactory = await ethers.getContractFactory("EntityFormationMessage");
    efm = await EFMFactory.deploy(admin.address);
    await efm.waitForDeployment();

    await efm.connect(admin).grantRole(REPORTING_ROLE, reporter.address);

    // Deploy FundMovementMessage with reference to EFM
    const FMMFactory = await ethers.getContractFactory("FundMovementMessage");
    fmm = await FMMFactory.deploy(admin.address, await efm.getAddress());
    await fmm.waitForDeployment();

    await fmm.connect(admin).grantRole(REPORTING_ROLE,      reporter.address);
    await fmm.connect(admin).grantRole(WORKFLOW_ADMIN_ROLE, workflowAdmin.address);
    await fmm.connect(admin).grantRole(PAUSER_ROLE,         pauser.address);

    // corrector holds both roles for dual-auth tests
    await fmm.connect(admin).grantRole(REPORTING_ROLE,      corrector.address);
    await fmm.connect(admin).grantRole(WORKFLOW_ADMIN_ROLE, corrector.address);
  });

  // Helper: record entity formation so FMM prerequisite is satisfied
  async function seedFormation() {
    await efm.connect(reporter).recordFormation(
      PROJECT_ID, WORKFLOW_ID, "DE-LLC-2025-001",
      reporter.address, "ipfs://QmFormation...", FORMED_AT
    );
  }

  // ─── recordAcknowledgment ───────────────────────────────────────────────

  describe("recordAcknowledgment", function () {
    beforeEach(seedFormation);

    it("records acknowledgment and emits FundMovementAcknowledged", async function () {
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, participant.address,
          ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.emit(fmm, "FundMovementAcknowledged")
       .withArgs(
         anyValue, PROJECT_ID, WORKFLOW_ID,
         participant.address, ESCROW_REF, INST_ACK_HASH,
         SOURCE_REF, ACKNOWLEDGED_AT, anyValue
       );
    });

    it("stores the record with correct fields", async function () {
      const tx = await fmm.connect(reporter).recordAcknowledgment(
        PROJECT_ID, WORKFLOW_ID, participant.address,
        ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (l: any) => l.fragment?.name === "FundMovementAcknowledged"
      ) as any;
      const recordId = event.args.recordId;

      const rec = await fmm.getRecord(recordId);
      expect(rec.projectId).to.equal(PROJECT_ID);
      expect(rec.workflowId).to.equal(WORKFLOW_ID);
      expect(rec.participantAddress).to.equal(participant.address);
      expect(rec.escrowRef).to.equal(ESCROW_REF);
      expect(rec.institutionAckHash).to.equal(INST_ACK_HASH);
      expect(rec.superseded).to.be.false;
    });

    it("sets the active record for participant", async function () {
      await fmm.connect(reporter).recordAcknowledgment(
        PROJECT_ID, WORKFLOW_ID, participant.address,
        ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
      );
      const active = await fmm.getActiveRecord(PROJECT_ID, WORKFLOW_ID, participant.address);
      expect(active.participantAddress).to.equal(participant.address);
    });

    it("increments recordCount", async function () {
      expect(await fmm.recordCount()).to.equal(0n);
      await fmm.connect(reporter).recordAcknowledgment(
        PROJECT_ID, WORKFLOW_ID, participant.address,
        ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
      );
      expect(await fmm.recordCount()).to.equal(1n);
    });

    it("allows different participants in the same workflow", async function () {
      const [,,,,, , , p2] = await ethers.getSigners();
      await fmm.connect(reporter).recordAcknowledgment(
        PROJECT_ID, WORKFLOW_ID, participant.address,
        ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
      );
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, p2.address,
          "ESCROW-ACCT-9999", INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.not.be.reverted;
      expect(await fmm.recordCount()).to.equal(2n);
    });

    it("reverts if entity formation not confirmed", async function () {
      // Use a workflow that has no formation record
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          "TCN-9999", "WF-999", participant.address,
          ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: entity formation not confirmed for this workflow");
    });

    it("reverts if caller lacks REPORTING_ROLE", async function () {
      await expect(
        fmm.connect(unauthorized).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, participant.address,
          ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.be.revertedWithCustomError(fmm, "AccessControlUnauthorizedAccount");
    });

    it("reverts if participantAddress is zero", async function () {
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, ethers.ZeroAddress,
          ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: participantAddress required");
    });

    it("reverts if sourceRef is empty", async function () {
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, participant.address,
          ESCROW_REF, INST_ACK_HASH, "", ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: sourceRef required");
    });

    it("reverts if institutionAckHash is zero", async function () {
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, participant.address,
          ESCROW_REF, ethers.ZeroHash, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: institutionAckHash required");
    });

    it("reverts when paused", async function () {
      await fmm.connect(pauser).pause();
      await expect(
        fmm.connect(reporter).recordAcknowledgment(
          PROJECT_ID, WORKFLOW_ID, participant.address,
          ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
        )
      ).to.be.revertedWithCustomError(fmm, "EnforcedPause");
    });
  });

  // ─── supersede ──────────────────────────────────────────────────────────

  describe("supersede", function () {
    let recordId: string;

    beforeEach(async function () {
      await seedFormation();
      const tx = await fmm.connect(reporter).recordAcknowledgment(
        PROJECT_ID, WORKFLOW_ID, participant.address,
        ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (l: any) => l.fragment?.name === "FundMovementAcknowledged"
      ) as any;
      recordId = event.args.recordId;
    });

    it("supersedes original and emits both events", async function () {
      const newEscrowRef  = "ESCROW-ACCT-CORRECTED";
      const correctionRef = "ipfs://QmCorrection...";
      const newAckHash    = ethers.keccak256(ethers.toUtf8Bytes("CORRECTED-ACK-DOC"));

      const tx = await fmm.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
        newEscrowRef, newAckHash, correctionRef, ACKNOWLEDGED_AT
      );
      await expect(tx).to.emit(fmm, "RecordSuperseded");
      await expect(tx).to.emit(fmm, "CorrectionReported");
    });

    it("marks original record as superseded", async function () {
      const newAckHash = ethers.keccak256(ethers.toUtf8Bytes("CORRECTED-ACK-DOC"));
      await fmm.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
        "ESCROW-CORRECTED", newAckHash, "ipfs://QmCorrection", ACKNOWLEDGED_AT
      );
      const original = await fmm.getRecord(recordId);
      expect(original.superseded).to.be.true;
    });

    it("makes correction the active record", async function () {
      const newEscrowRef = "ESCROW-ACCT-CORRECTED";
      const newAckHash   = ethers.keccak256(ethers.toUtf8Bytes("CORRECTED-ACK-DOC"));
      await fmm.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
        newEscrowRef, newAckHash, "ipfs://QmCorrection", ACKNOWLEDGED_AT
      );
      const active = await fmm.getActiveRecord(PROJECT_ID, WORKFLOW_ID, participant.address);
      expect(active.escrowRef).to.equal(newEscrowRef);
    });

    it("reverts if only REPORTING_ROLE (missing WORKFLOW_ADMIN)", async function () {
      const newAckHash = ethers.keccak256(ethers.toUtf8Bytes("CORRECTED"));
      await expect(
        fmm.connect(reporter).supersede(
          recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
          "ESCROW-X", newAckHash, "ipfs://QmCorrection", ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: dual authorization required");
    });

    it("reverts if only WORKFLOW_ADMIN_ROLE (missing REPORTING)", async function () {
      const newAckHash = ethers.keccak256(ethers.toUtf8Bytes("CORRECTED"));
      await expect(
        fmm.connect(workflowAdmin).supersede(
          recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
          "ESCROW-X", newAckHash, "ipfs://QmCorrection", ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: dual authorization required");
    });

    it("reverts on double-supersede", async function () {
      const newAckHash = ethers.keccak256(ethers.toUtf8Bytes("CORRECTED"));
      await fmm.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
        "ESCROW-CORRECTED", newAckHash, "ipfs://QmCorrection", ACKNOWLEDGED_AT
      );
      await expect(
        fmm.connect(corrector).supersede(
          recordId, PROJECT_ID, WORKFLOW_ID, participant.address,
          "ESCROW-CORRECTED-2", newAckHash, "ipfs://QmCorrection2", ACKNOWLEDGED_AT
        )
      ).to.be.revertedWith("FMM: already superseded");
    });
  });

  // ─── No economic values on-chain ────────────────────────────────────────

  describe("economic value exclusion", function () {
    it("has no amount, value, or balance field in AcknowledgmentRecord", async function () {
      await seedFormation();
      const tx = await fmm.connect(reporter).recordAcknowledgment(
        PROJECT_ID, WORKFLOW_ID, participant.address,
        ESCROW_REF, INST_ACK_HASH, SOURCE_REF, ACKNOWLEDGED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (l: any) => l.fragment?.name === "FundMovementAcknowledged"
      ) as any;
      const rec = await fmm.getRecord(event.args.recordId);

      // Verify the struct has no numeric value fields
      // (only opaque string ref + hash + timestamps)
      expect(typeof rec.escrowRef).to.equal("string");       // opaque ref, not a number
      expect(typeof rec.institutionAckHash).to.equal("string"); // hash, not a value
      const recKeys = Object.keys(rec).filter(k => isNaN(Number(k)));
      const numericValueFields = recKeys.filter(
        k => k.toLowerCase().includes("amount") ||
             k.toLowerCase().includes("value")  ||
             k.toLowerCase().includes("balance")
      );
      expect(numericValueFields).to.have.length(0);
    });
  });

  // ─── pause/unpause ──────────────────────────────────────────────────────

  describe("pause / unpause", function () {
    it("pauses and unpauses", async function () {
      await fmm.connect(pauser).pause();
      expect(await fmm.paused()).to.be.true;
      await fmm.connect(pauser).unpause();
      expect(await fmm.paused()).to.be.false;
    });

    it("reverts pause if not PAUSER_ROLE", async function () {
      await expect(
        fmm.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(fmm, "AccessControlUnauthorizedAccount");
    });
  });
});
