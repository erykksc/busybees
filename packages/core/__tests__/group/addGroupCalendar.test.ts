import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import { GroupCalendar } from "../../src/group/groupCalendar";
import { v4 as uuidv4 } from "uuid";
import {
  createTestContext,
  cleanupTestData,
  MyTestContext,
  setupTestUsers,
} from "../utils/testSetup";

describe("addGroupCalendar Integration Tests", () => {
  let testContext: MyTestContext;
  let testGroupId: string;
  let ownerIndex = 0;
  let testOwners: string[] = [];

  beforeAll(async () => {
    testContext = createTestContext();
    testOwners = await setupTestUsers(testContext, [
      "addGroupCalendar-owner-1-" + uuidv4(),
      "addGroupCalendar-owner-2-" + uuidv4(),
      "addGroupCalendar-owner-3-" + uuidv4(),
      "addGroupCalendar-owner-4-" + uuidv4(),
      "addGroupCalendar-owner-5-" + uuidv4(),
      "addGroupCalendar-owner-6-" + uuidv4(),
    ]);
  });

  beforeEach(() => {
    testGroupId = "test-group-" + uuidv4();
  });

  afterAll(async () => {
    await cleanupTestData(testContext);
  });

  it("should successfully add a basic group calendar", async () => {
    const testOwner = testOwners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Test Group",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    testContext.testGroups.push(testGroupId);

    const result = await addGroupCalendar(testContext.client, groupCalendar);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
  });

  it("should throw error when groupId is empty", async () => {
    const testOwner = testOwners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: "",
      inviteCode: "invite-code",
      name: "Test Group",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    // In case the calendar is created
    testContext.testGroups.push(testGroupId);

    await expect(
      addGroupCalendar(testContext.client, groupCalendar),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when owner is empty", async () => {
    const testOwner = testOwners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-code",
      name: "Test Group",
      owner: "",
      members: new Set([testOwner]),
    };

    // In case the calendar is created
    testContext.testGroups.push(testGroupId);

    await expect(
      addGroupCalendar(testContext.client, groupCalendar),
    ).rejects.toThrow("owner is required");
  });

  it("should throw error when owner is not in members list", async () => {
    const testOwner = testOwners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-code",
      name: "Test Group",
      owner: testOwner,
      members: new Set(["member-456"]),
    };

    // In case the calendar is created
    testContext.testGroups.push(testGroupId);

    await expect(
      addGroupCalendar(testContext.client, groupCalendar),
    ).rejects.toThrow("owner must be in members list");
  });

  it("should fail when trying to add duplicate group calendar", async () => {
    const testOwner = testOwners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now() + "-3",
      name: "Duplicate Test Group",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    testContext.testGroups.push(testGroupId);

    // Add first time - should succeed
    const result = await addGroupCalendar(testContext.client, groupCalendar);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Try to add again - should fail due to ConditionExpression
    await expect(
      addGroupCalendar(testContext.client, groupCalendar),
    ).rejects.toThrow();
  });

  it("should handle special characters in group name", async () => {
    const testOwner = testOwners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Test Group with Special Characters! @#$%",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    testContext.testGroups.push(testGroupId);

    const result = await addGroupCalendar(testContext.client, groupCalendar);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
  });
});
