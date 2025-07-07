import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import { getGroupCalendar } from "../../src/group/getGroupCalendar";
import { addMemberToGroupCalendar } from "../../src/group/addMemberToGroupCalendar";
import { getUserProfile } from "../../src/user/getUserProfile";
import { GroupCalendar } from "../../src/group/groupCalendar";
import { v4 as uuidv4 } from "uuid";
import {
  createTestContext,
  cleanupTestData,
  MyTestContext,
  setupTestUsers,
} from "../utils/testSetup";
import { addUserProfile, UserProfile } from "../../src";

describe("addMemberToGroupCalendar Integration Tests", () => {
  let testContext: MyTestContext;
  let testGroupId: string;
  let testUserIndex = 0;
  let testUsers: string[] = [];

  beforeAll(async () => {
    testContext = createTestContext();
    // Setup test users that will be used across tests
    testUsers = await setupTestUsers(testContext, [
      "user-1" + uuidv4(),
      "user-2" + uuidv4(),
      "user-3" + uuidv4(),
      "user-4" + uuidv4(),
      "user-5" + uuidv4(),
      "user-6" + uuidv4(),
      "user-7" + uuidv4(),
      "user-8" + uuidv4(),
      "user-9" + uuidv4(),
      "user-10" + uuidv4(),
      "user-11" + uuidv4(),
    ]);
  });

  beforeEach(() => {
    testGroupId = "test-add-member-group-" + uuidv4();
  });

  afterAll(async () => {
    await cleanupTestData(testContext);
  });

  it("should successfully add member to group calendar and update user profile", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const groupMember = testUsers[testUserIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Test Group",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(testGroupId);

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Add member to group
    const result = await addMemberToGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify member was added to group
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      { consistentRead: true },
    );
    expect(updatedGroup.members).toContain(groupOwner);
    expect(updatedGroup.members).toContain(groupMember);

    // Verify group was added to user profile
    const updatedMemberProfile = await getUserProfile(
      testContext.client,
      groupMember,
      { consistentRead: true },
    );
    expect(updatedMemberProfile.groups).toContain(testGroupId);
  });

  it("should handle adding member who already belongs to other groups", async () => {
    // TODO: add test
  });

  it("should throw error when groupId is empty", async () => {
    const groupMember = testUsers[testUserIndex++];
    await expect(
      addMemberToGroupCalendar(testContext.client, "", groupMember),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is null", async () => {
    const groupMember = testUsers[testUserIndex++];
    await expect(
      addMemberToGroupCalendar(testContext.client, null as any, groupMember),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is undefined", async () => {
    const groupMember = testUsers[testUserIndex++];
    await expect(
      addMemberToGroupCalendar(
        testContext.client,
        undefined as any,
        groupMember,
      ),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when memberAuthSub is empty", async () => {
    await expect(
      addMemberToGroupCalendar(testContext.client, testGroupId, ""),
    ).rejects.toThrow("memberAuthSub is required");
  });

  it("should throw error when memberAuthSub is null", async () => {
    await expect(
      addMemberToGroupCalendar(testContext.client, testGroupId, null as any),
    ).rejects.toThrow("memberAuthSub is required");
  });

  it("should throw error when memberAuthSub is undefined", async () => {
    await expect(
      addMemberToGroupCalendar(
        testContext.client,
        testGroupId,
        undefined as any,
      ),
    ).rejects.toThrow("memberAuthSub is required");
  });

  it("should throw error when group does not exist", async () => {
    const groupMember = testUsers[testUserIndex++];
    const nonExistentGroupId = "non-existent-group-" + Date.now();

    await expect(
      addMemberToGroupCalendar(
        testContext.client,
        nonExistentGroupId,
        groupMember,
      ),
    ).rejects.toThrow();
  });

  it("should throw error when to be added user does not exist", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Test Group",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };
    await addGroupCalendar(testContext.client, groupCalendar);

    await expect(
      addMemberToGroupCalendar(
        testContext.client,
        testGroupId,
        "non-existent-user-" + uuidv4(),
      ),
    ).rejects.toThrow();
  });

  it("should handle adding same member multiple times (idempotent)", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const groupMember = testUsers[testUserIndex++];

    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Test Group",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Add member first time
    await addMemberToGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    // Add same member second time - should succeed (DynamoDB SET operations are idempotent)
    const result = await addMemberToGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify member is still in group (no duplicates)
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      {
        consistentRead: true,
      },
    );
    expect(updatedGroup.members).toContain(groupMember);
    expect(updatedGroup.members).toContain(groupOwner);

    // Verify user profile is correct
    const updatedMemberProfile = await getUserProfile(
      testContext.client,
      groupMember,
    );
    expect(updatedMemberProfile.groups).toContain(testGroupId);
  });
});
