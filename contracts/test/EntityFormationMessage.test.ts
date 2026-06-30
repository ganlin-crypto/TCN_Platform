import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { EntityFormationMessage } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EntityFormationMessage", function () {
  let contract: EntityFormationMessage;
  let admin: SignerWithAddress;
  let reporter: SignerWithAddress;
  let workflowAdmin: SignerWithAddress;
  let pauser: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const REPORTING_ROLE      = ethers.keccak256(ethers.toUtf8Bytes("REPORTING_ROLE"));
  const WORKFLOW_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WORKFLOW_ADMIN_ROLE"));
  const PAUSER_ROLE         = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  const PROJECT_ID   = "TCN-2025-001";
  const WORKFLOW_ID  = "WF-001";
  const ENTITY_REF   = "DE-LLC-2025-123456";
  const SOURCE_REF   = "ipfs://QmXxx...formation-docs";
  const FORMED_AT    = BigInt(Math.floor(Date.now() / 1000) - 86400); // yesterday

  beforeEach(async function () {
    [admin, reporter, workflowAdmin, pauser, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EntityFormationMessage");
    contract = await Factory.deploy(admin.address);
    await contract.waitForDeployment();

    await contract.connect(admin).grantRole(REPORTING_ROLE,      reporter.address);
    await contract.connect(admin).grantRole(WORKFLOW_ADMIN_ROLE, workflowAdmin.address);
    await contract.connect(admin).grantRole(PAUSER_ROLE,         pauser.address);
  });

  // ─── recordFormation ────────────────────────────────────────────────────

  describe("recordFormation", function () {
    it("records formation and emits EntityFormationReported", async function () {
      const tx = await contract.connect(reporter).recordFormation(
        PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
        reporter.address, SOURCE_REF, FORMED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (l: any) => l.fragment?.name === "EntityFormationReported"
      ) as any;
      expect(event).to.not.be.undefined;
      expect(event.args.projectId).to.equal(PROJECT_ID);
      expect(event.args.workflowId).to.equal(WORKFLOW_ID);
      expect(event.args.sourceRef).to.equal(SOURCE_REF);
    });

    it("stores the record and makes it retrievable", async function () {
      const tx = await contract.connect(reporter).recordFormation(
        PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
        reporter.address, SOURCE_REF, FORMED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find((l: any) => l.fragment?.name === "EntityFormationReported") as any;
      const recordId = event.args.recordId;

      const rec = await contract.getRecord(recordId);
      expect(rec.projectId).to.equal(PROJECT_ID);
      expect(rec.entityRef).to.equal(ENTITY_REF);
      expect(rec.revoked).to.be.false;
      expect(rec.superseded).to.be.false;
    });

    it("sets the active record for the workflow", async function () {
      await contract.connect(reporter).recordFormation(
        PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
        reporter.address, SOURCE_REF, FORMED_AT
      );
      const active = await contract.getActiveRecord(PROJECT_ID, WORKFLOW_ID);
      expect(active.projectId).to.equal(PROJECT_ID);
    });

    it("increments recordCount", async function () {
      expect(await contract.recordCount()).to.equal(0n);
      await contract.connect(reporter).recordFormation(
        PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
        reporter.address, SOURCE_REF, FORMED_AT
      );
      expect(await contract.recordCount()).to.equal(1n);
    });

    it("reverts if caller lacks REPORTING_ROLE", async function () {
      await expect(
        contract.connect(unauthorized).recordFormation(
          PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
          reporter.address, SOURCE_REF, FORMED_AT
        )
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });

    it("reverts if sourceRef is empty", async function () {
      await expect(
        contract.connect(reporter).recordFormation(
          PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
          reporter.address, "", FORMED_AT
        )
      ).to.be.revertedWith("EFM: sourceRef required");
    });

    it("reverts if projectId is empty", async function () {
      await expect(
        contract.connect(reporter).recordFormation(
          "", WORKFLOW_ID, ENTITY_REF,
          reporter.address, SOURCE_REF, FORMED_AT
        )
      ).to.be.revertedWith("EFM: projectId required");
    });

    it("reverts if organizerAddress is zero address", async function () {
      await expect(
        contract.connect(reporter).recordFormation(
          PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
          ethers.ZeroAddress, SOURCE_REF, FORMED_AT
        )
      ).to.be.revertedWith("EFM: organizerAddress required");
    });

    it("reverts when paused", async function () {
      await contract.connect(pauser).pause();
      await expect(
        contract.connect(reporter).recordFormation(
          PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
          reporter.address, SOURCE_REF, FORMED_AT
        )
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });
  });

  // ─── revokeFormation ────────────────────────────────────────────────────

  describe("revokeFormation", function () {
    let recordId: string;

    beforeEach(async function () {
      const tx = await contract.connect(reporter).recordFormation(
        PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
        reporter.address, SOURCE_REF, FORMED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find((l: any) => l.fragment?.name === "EntityFormationReported") as any;
      recordId = event.args.recordId;
    });

    it("revokes and emits EntityFormationRevoked", async function () {
      await expect(
        contract.connect(reporter).revokeFormation(recordId, "ipfs://Qmrevocation-doc")
      ).to.emit(contract, "EntityFormationRevoked")
       .withArgs(recordId, PROJECT_ID, WORKFLOW_ID, "ipfs://Qmrevocation-doc", anyValue);
    });

    it("clears the active record after revocation", async function () {
      await contract.connect(reporter).revokeFormation(recordId, "ipfs://Qmrevocation-doc");
      await expect(
        contract.getActiveRecord(PROJECT_ID, WORKFLOW_ID)
      ).to.be.revertedWith("EFM: no active record");
    });

    it("reverts if record not found", async function () {
      await expect(
        contract.connect(reporter).revokeFormation(ethers.ZeroHash, "ipfs://Qmrevocation-doc")
      ).to.be.revertedWith("EFM: record not found");
    });

    it("reverts on double-revoke", async function () {
      await contract.connect(reporter).revokeFormation(recordId, "ipfs://Qmrevocation-doc");
      await expect(
        contract.connect(reporter).revokeFormation(recordId, "ipfs://Qmrevocation-doc")
      ).to.be.revertedWith("EFM: already revoked");
    });

    it("reverts if unauthorized", async function () {
      await expect(
        contract.connect(unauthorized).revokeFormation(recordId, "ipfs://Qmrevocation-doc")
      ).to.be.revertedWith("EFM: missing role");
    });
  });

  // ─── supersede (dual auth correction) ──────────────────────────────────

  describe("supersede", function () {
    let recordId: string;
    let corrector: SignerWithAddress;

    beforeEach(async function () {
      // corrector holds both REPORTING_ROLE and WORKFLOW_ADMIN_ROLE (dual auth executor)
      corrector = (await ethers.getSigners())[5];
      await contract.connect(admin).grantRole(REPORTING_ROLE,      corrector.address);
      await contract.connect(admin).grantRole(WORKFLOW_ADMIN_ROLE, corrector.address);

      const tx = await contract.connect(reporter).recordFormation(
        PROJECT_ID, WORKFLOW_ID, ENTITY_REF,
        reporter.address, SOURCE_REF, FORMED_AT
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find((l: any) => l.fragment?.name === "EntityFormationReported") as any;
      recordId = event.args.recordId;
    });

    it("supersedes original and emits both events", async function () {
      const newEntityRef  = "DE-LLC-2025-CORRECTED";
      const correctionRef = "ipfs://Qmcorrection-source";

      const tx = await contract.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, newEntityRef,
        reporter.address, correctionRef, FORMED_AT
      );

      await expect(tx).to.emit(contract, "RecordSuperseded");
      await expect(tx).to.emit(contract, "CorrectionReported");
    });

    it("marks original as superseded", async function () {
      await contract.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, "DE-LLC-CORRECTED",
        reporter.address, "ipfs://Qmcorrection", FORMED_AT
      );
      const original = await contract.getRecord(recordId);
      expect(original.superseded).to.be.true;
    });

    it("makes the correction record the active record", async function () {
      await contract.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, "DE-LLC-CORRECTED",
        reporter.address, "ipfs://Qmcorrection", FORMED_AT
      );
      const active = await contract.getActiveRecord(PROJECT_ID, WORKFLOW_ID);
      expect(active.entityRef).to.equal("DE-LLC-CORRECTED");
    });

    it("reverts if caller only has REPORTING_ROLE (not WORKFLOW_ADMIN)", async function () {
      await expect(
        contract.connect(reporter).supersede(
          recordId, PROJECT_ID, WORKFLOW_ID, "DE-LLC-CORRECTED",
          reporter.address, "ipfs://Qmcorrection", FORMED_AT
        )
      ).to.be.revertedWith("EFM: dual authorization required");
    });

    it("reverts if caller only has WORKFLOW_ADMIN_ROLE (not REPORTING)", async function () {
      await expect(
        contract.connect(workflowAdmin).supersede(
          recordId, PROJECT_ID, WORKFLOW_ID, "DE-LLC-CORRECTED",
          reporter.address, "ipfs://Qmcorrection", FORMED_AT
        )
      ).to.be.revertedWith("EFM: dual authorization required");
    });

    it("reverts on double-supersede", async function () {
      await contract.connect(corrector).supersede(
        recordId, PROJECT_ID, WORKFLOW_ID, "DE-LLC-CORRECTED",
        reporter.address, "ipfs://Qmcorrection", FORMED_AT
      );
      await expect(
        contract.connect(corrector).supersede(
          recordId, PROJECT_ID, WORKFLOW_ID, "DE-LLC-CORRECTED",
          reporter.address, "ipfs://Qmcorrection2", FORMED_AT
        )
      ).to.be.revertedWith("EFM: already superseded");
    });
  });

  // ─── pause/unpause ──────────────────────────────────────────────────────

  describe("pause / unpause", function () {
    it("pauses and unpauses", async function () {
      await contract.connect(pauser).pause();
      expect(await contract.paused()).to.be.true;
      await contract.connect(pauser).unpause();
      expect(await contract.paused()).to.be.false;
    });

    it("reverts pause if not PAUSER_ROLE", async function () {
      await expect(
        contract.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });
  });
});

// Helper — matcher that accepts any uint timestamp
async function anyTimestamp() {
  return new Promise<bigint>((resolve) => {
    resolve(BigInt(Math.floor(Date.now() / 1000)));
  });
}
