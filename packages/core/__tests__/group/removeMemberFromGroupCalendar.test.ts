import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import { getGroupCalendar } from "../../src/group/getGroupCalendar";
import { removeMemberFromGroupCalendar } from "../../src/group/removeMemberFromGroupCalendar";
import { addMemberToGroupCalendar } from "../../src/group/addMemberToGroupCalendar";
import { getUserProfile } from "../../src/user/getUserProfile";
import { GroupCalendar } from "../../src/group/groupCalendar";
import { UserProfile } from "../../src/user/userProfile";
import { v4 as uuidv4 } from "uuid";
import {
  createTestContext,
  cleanupTestData,
  MyTestContext,
  setupTestUsers,
} from "../utils/testSetup";

describe("removeMemberFromGroupCalendar Integration Tests", () => {
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
      "user-12" + uuidv4(),
      "user-13" + uuidv4(),
      "user-14" + uuidv4(),
      "user-15" + uuidv4(),
      "user-16" + uuidv4(),
      "user-17" + uuidv4(),
      "user-18" + uuidv4(),
      "user-19" + uuidv4(),
      "user-20" + uuidv4(),
    ]);
  });

  beforeEach(() => {
    testGroupId = "test-remove-member-group-" + uuidv4();
  });

  afterAll(async () => {
    await cleanupTestData(testContext);
  });

  it("should successfully remove member from group calendar and update user profile", async () => {
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

    // Add member to group first
    await addMemberToGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    // Remove member from group
    const result = await removeMemberFromGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify member was removed from group
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      { consistentRead: true },
    );
    expect(updatedGroup.members).not.toContain(groupMember);
    expect(updatedGroup.members).toContain(groupOwner);

    // Verify group was removed from user profile
    const updatedMemberProfile = await getUserProfile(
      testContext.client,
      groupMember,
    );
    if (updatedMemberProfile.groups !== undefined) {
      expect(updatedMemberProfile.groups).not.toContain(testGroupId);
    }
  });

  it("should successfully remove member while preserving other members", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const member1 = testUsers[testUserIndex++];
    const member2 = testUsers[testUserIndex++];
    const multiMemberGroupId = testGroupId + "-2";

    const groupCalendar: GroupCalendar = {
      groupId: multiMemberGroupId,
      inviteCode: "invite-" + Date.now() + "-2",
      name: "Multi Member Test Group",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(multiMemberGroupId);

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Add both members to group
    await addMemberToGroupCalendar(
      testContext.client,
      multiMemberGroupId,
      member1,
    );
    await addMemberToGroupCalendar(
      testContext.client,
      multiMemberGroupId,
      member2,
    );

    // Remove one member
    const result = await removeMemberFromGroupCalendar(
      testContext.client,
      multiMemberGroupId,
      member1,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify only the specified member was removed
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      multiMemberGroupId,
      { consistentRead: true },
    );
    expect(updatedGroup.members).not.toContain(member1);
    expect(updatedGroup.members).toContain(groupOwner);
    expect(updatedGroup.members).toContain(member2);

    // Verify group was removed from removed member's profile
    const updatedMember1Profile = await getUserProfile(
      testContext.client,
      member1,
    );
    if (updatedMember1Profile.groups !== undefined) {
      expect(updatedMember1Profile.groups).not.toContain(multiMemberGroupId);
    }

    // Verify group remains in other member's profile
    const updatedMember2Profile = await getUserProfile(
      testContext.client,
      member2,
    );
    expect(updatedMember2Profile.groups).toContain(multiMemberGroupId);
  });

  it("should handle removing member who belongs to multiple groups", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const groupMember = testUsers[testUserIndex++];
    const anotherGroupId = "another-group-" + uuidv4();

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

    // Create second group
    const anotherGroupCalendar: GroupCalendar = {
      groupId: anotherGroupId,
      inviteCode: "invite-" + Date.now() + "-2",
      name: "Another Test Group",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(anotherGroupId);

    // Add both group calendars
    await addGroupCalendar(testContext.client, anotherGroupCalendar);

    // Add member to both groups
    await addMemberToGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );
    await addMemberToGroupCalendar(
      testContext.client,
      anotherGroupId,
      groupMember,
    );

    // Remove member from first group
    const result = await removeMemberFromGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify member was removed from first group
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      { consistentRead: true },
    );
    expect(updatedGroup.members).not.toContain(groupMember);

    // Verify member still exists in second group
    const updatedSecondGroup = await getGroupCalendar(
      testContext.client,
      anotherGroupId,
      { consistentRead: true },
    );
    expect(updatedSecondGroup.members).toContain(groupMember);

    // Verify user still belongs to second group
    const updatedMemberProfile = await getUserProfile(
      testContext.client,
      groupMember,
    );
    expect(updatedMemberProfile.groups).not.toContain(testGroupId);
    expect(updatedMemberProfile.groups).toContain(anotherGroupId);
  });

  it("should throw error when trying to remove group owner", async () => {
    const groupOwner = testUsers[testUserIndex++];
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

    // Try to remove owner
    await expect(
      removeMemberFromGroupCalendar(
        testContext.client,
        testGroupId,
        groupOwner,
      ),
    ).rejects.toThrow("Cannot remove the group owner");
  });

  it("should throw error when groupId is empty", async () => {
    const groupMember = testUsers[testUserIndex++];
    await expect(
      removeMemberFromGroupCalendar(testContext.client, "", groupMember),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is null", async () => {
    const groupMember = testUsers[testUserIndex++];
    await expect(
      removeMemberFromGroupCalendar(
        testContext.client,
        null as any,
        groupMember,
      ),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is undefined", async () => {
    const groupMember = testUsers[testUserIndex++];
    await expect(
      removeMemberFromGroupCalendar(
        testContext.client,
        undefined as any,
        groupMember,
      ),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when memberAuthSub is empty", async () => {
    await expect(
      removeMemberFromGroupCalendar(testContext.client, testGroupId, ""),
    ).rejects.toThrow("memberAuthSub is required");
  });

  it("should throw error when memberAuthSub is null", async () => {
    await expect(
      removeMemberFromGroupCalendar(
        testContext.client,
        testGroupId,
        null as any,
      ),
    ).rejects.toThrow("memberAuthSub is required");
  });

  it("should throw error when memberAuthSub is undefined", async () => {
    await expect(
      removeMemberFromGroupCalendar(
        testContext.client,
        testGroupId,
        undefined as any,
      ),
    ).rejects.toThrow("memberAuthSub is required");
  });

  it("should throw error when group does not exist", async () => {
    const groupMember = testUsers[testUserIndex++];
    const nonExistentGroupId = "non-existent-group-" + uuidv4();

    await expect(
      removeMemberFromGroupCalendar(
        testContext.client,
        nonExistentGroupId,
        groupMember,
      ),
    ).rejects.toThrow("Group calendar not found");
  });
});

