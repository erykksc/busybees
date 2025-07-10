import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import {
  getGroupCalendar,
  getGroupCalendarByInviteCode,
} from "../../src/group/getGroupCalendar";
import { GroupCalendar } from "../../src/group/groupCalendar";
import {
  createTestContext,
  setupTestUsers,
  MyTestContext,
  cleanupTestData,
} from "../utils/testSetup";
import { v4 as uuidv4 } from "uuid";

describe("getGroupCalendar Integration Tests", () => {
  let testContext: MyTestContext;
  let testGroupId: string;
  let ownerIndex = 0;
  let owners: string[] = [];

  beforeAll(async () => {
    testContext = createTestContext();
    owners = await setupTestUsers(testContext, [
      "getGroupCalendar-owner-1-" + uuidv4(),
      "getGroupCalendar-owner-2-" + uuidv4(),
      "getGroupCalendar-owner-3-" + uuidv4(),
    ]);
  });

  beforeEach(() => {
    testGroupId = "test-group-" + uuidv4();
  });

  afterAll(async () => {
    await cleanupTestData(testContext);
  });

  it("should successfully retrieve existing group calendar", async () => {
    const testOwner = owners[ownerIndex++];

    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Test Group",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Then retrieve it
    const result = await getGroupCalendar(testContext.client, testGroupId, {
      consistentRead: true,
    });

    expect(result).toBeDefined();
    expect(result.groupId).toBe(testGroupId);
    expect(result.name).toBe("Test Group");
    expect(result.owner).toBe(testOwner);
    expect(result.members).toEqual(new Set([testOwner]));
  });

  it("should successfully retrieve group calendar by invite code", async () => {
    const testOwner = owners[ownerIndex++];
    const inviteCode = "invite-" + Date.now() + "-bycode";
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode,
      name: "Invite Code Group",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Then retrieve it by invite code
    const result = await getGroupCalendarByInviteCode(
      testContext.client,
      inviteCode,
    );

    expect(result).toBeDefined();
    expect(result.groupId).toBe(testGroupId);
    expect(result.inviteCode).toBe(inviteCode);
    expect(result.name).toBe("Invite Code Group");
    expect(result.owner).toBe(testOwner);
    expect(result.members).toEqual(new Set([testOwner]));
  });

  it("should throw error when group calendar does not exist", async () => {
    const nonExistentGroupId = "non-existent-group-" + Date.now();

    await expect(
      getGroupCalendar(testContext.client, nonExistentGroupId),
    ).rejects.toThrow("Group calendar not found");
  });

  it("should throw error when invite code does not exist", async () => {
    const nonExistentInviteCode = "non-existent-invite-" + Date.now();

    await expect(
      getGroupCalendarByInviteCode(testContext.client, nonExistentInviteCode),
    ).rejects.toThrow("Group calendar not found");
  });

  it("should handle undefined consistentRead parameter", async () => {
    const testOwner = owners[ownerIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Undefined Consistent Read Group",
      owner: testOwner,
      members: new Set([testOwner]),
    };

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Then retrieve it with undefined consistentRead
    await expect(
      getGroupCalendar(testContext.client, testGroupId, undefined),
    ).resolves.not.toThrow();
  });
});
