import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import { getGroupCalendar } from "../../src/group/getGroupCalendar";
import { removeGroupCalendar } from "../../src/group/removeGroupCalendar";
import { getUserProfile } from "../../src/user/getUserProfile";
import { GroupCalendar } from "../../src/group/groupCalendar";
import { v4 as uuidv4 } from "uuid";
import {
  cleanupTestData,
  createTestContext,
  MyTestContext,
  setupTestUsers,
} from "../utils/testSetup";
import { addMemberToGroupCalendar } from "../../src/group";

describe("removeGroupCalendar Integration Tests", () => {
  let testContext: MyTestContext;
  let testGroupId: string;
  let testUserIndex = 0;
  let testUsers: string[] = [];

  beforeAll(async () => {
    testContext = createTestContext();
    testUsers = await setupTestUsers(testContext, [
      "user-1" + uuidv4(),
      "user-2" + uuidv4(),
      "user-3" + uuidv4(),
      "user-4" + uuidv4(),
      "user-5" + uuidv4(),
      "user-6" + uuidv4(),
      "user-7" + uuidv4(),
      "user-8" + uuidv4(),
    ]);
  });

  beforeEach(() => {
    testGroupId = "test-group-" + uuidv4();
  });

  afterAll(async () => {
    await cleanupTestData(testContext);
  });

  it("should successfully remove existing group calendar and update member profiles", async () => {
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

    await addGroupCalendar(testContext.client, groupCalendar);
    await addMemberToGroupCalendar(
      testContext.client,
      testGroupId,
      groupMember,
    );

    // Verify it exists
    const existingGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      {
        consistentRead: true,
      },
    );
    expect(existingGroup).toBeDefined();

    // Remove the group calendar
    const result = await removeGroupCalendar(testContext.client, testGroupId);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify the group has been removed
    await expect(
      getGroupCalendar(testContext.client, testGroupId),
    ).rejects.toThrow("Group calendar not found");

    // Verify that the group was removed from user profiles
    const updatedOwnerProfile = await getUserProfile(
      testContext.client,
      groupOwner,
      { consistentRead: true },
    );
    if (updatedOwnerProfile.groups !== undefined) {
      expect(updatedOwnerProfile.groups).not.toContain(testGroupId);
    }

    const updatedMemberProfile = await getUserProfile(
      testContext.client,
      groupMember,
      { consistentRead: true },
    );
    if (updatedMemberProfile.groups !== undefined) {
      expect(updatedMemberProfile.groups).not.toContain(testGroupId);
    }
  });

  it("should successfully remove group calendar with multiple members", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const member1 = testUsers[testUserIndex++];
    const member2 = testUsers[testUserIndex++];

    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now() + "-2",
      name: "Multi Member Group",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(testGroupId);

    await addGroupCalendar(testContext.client, groupCalendar);
    await addMemberToGroupCalendar(testContext.client, testGroupId, member1);
    await addMemberToGroupCalendar(testContext.client, testGroupId, member2);

    // Verify it exists
    const existingGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      {
        consistentRead: true,
      },
    );
    expect(existingGroup).toBeDefined();
    expect(existingGroup.members).toContain(groupOwner);
    expect(existingGroup.members).toContain(member1);
    expect(existingGroup.members).toContain(member2);

    // Remove the group calendar
    const result = await removeGroupCalendar(testContext.client, testGroupId);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify the group has been removed
    await expect(
      getGroupCalendar(testContext.client, testGroupId),
    ).rejects.toThrow("Group calendar not found");

    // Verify that the group was removed from all user profiles
    const updatedOwnerProfile = await getUserProfile(
      testContext.client,
      groupOwner,
    );
    if (updatedOwnerProfile.groups !== undefined) {
      expect(updatedOwnerProfile.groups).not.toContain(testGroupId);
    }

    const updatedMember1Profile = await getUserProfile(
      testContext.client,
      member1,
    );
    if (updatedMember1Profile.groups !== undefined) {
      expect(updatedMember1Profile.groups).not.toContain(testGroupId);
    }

    const updatedMember2Profile = await getUserProfile(
      testContext.client,
      member2,
    );
    if (updatedMember2Profile.groups !== undefined) {
      expect(updatedMember2Profile.groups).not.toContain(testGroupId);
    }
  });

  it("should throw error when groupId is empty", async () => {
    await expect(removeGroupCalendar(testContext.client, "")).rejects.toThrow(
      "groupId is required",
    );
  });

  it("should throw error when groupId is null", async () => {
    await expect(
      removeGroupCalendar(testContext.client, null as any),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is undefined", async () => {
    await expect(
      removeGroupCalendar(testContext.client, undefined as any),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when trying to remove non-existent group", async () => {
    const nonExistentGroupId = "non-existent-group-" + uuidv4();

    // Should throw error because group doesn't exist
    await expect(
      removeGroupCalendar(testContext.client, nonExistentGroupId),
    ).rejects.toThrow("Group calendar not found");
  });

  it("should handle users with multiple groups correctly", async () => {
    const anotherGroupId = "another-group-" + uuidv4();
    const groupOwner = testUsers[testUserIndex++];

    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now() + "-3",
      name: "Multiple Groups Test",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    const anotherGroup: GroupCalendar = {
      groupId: anotherGroupId,
      inviteCode: "invite-" + Date.now() + "-4",
      name: "Another Multiple Groups Test",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(testGroupId);
    testContext.testGroups.push(anotherGroupId);

    await addGroupCalendar(testContext.client, groupCalendar);
    await addGroupCalendar(testContext.client, anotherGroup);

    // Remove the first group calendar
    const result = await removeGroupCalendar(testContext.client, testGroupId);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify that only the removed group was removed from user profile
    const updatedOwnerProfile = await getUserProfile(
      testContext.client,
      groupOwner,
    );
    if (updatedOwnerProfile.groups !== undefined) {
      expect(updatedOwnerProfile.groups).not.toContain(testGroupId);
      expect(updatedOwnerProfile.groups).toContain(anotherGroupId);
    }
  });
});
