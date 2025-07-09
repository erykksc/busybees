import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import { getGroupCalendar } from "../../src/group/getGroupCalendar";
import { updateGroupCalendar } from "../../src/group/updateGroupCalendar";
import { GroupCalendar } from "../../src/group/groupCalendar";
import { v4 as uuidv4 } from "uuid";
import {
  createTestContext,
  cleanupTestData,
  MyTestContext,
  setupTestUsers,
} from "../utils/testSetup";

describe("updateGroupCalendar Integration Tests", () => {
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
      "user-9" + uuidv4(),
      "user-10" + uuidv4(),
      "user-11" + uuidv4(),
    ]);
  });

  beforeEach(() => {
    testGroupId = "test-update-group-" + uuidv4();
  });

  afterAll(async () => {
    await cleanupTestData(testContext);
  });

  it("should successfully update group calendar name", async () => {
    const groupOwner = testUsers[testUserIndex++];
    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Original Name",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(testGroupId);

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Update the name
    const result = await updateGroupCalendar(testContext.client, testGroupId, {
      name: "Updated Name",
    });

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
    expect(result.Attributes?.name).toBe("Updated Name");

    // Verify the update
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      {
        consistentRead: true,
      },
    );
    expect(updatedGroup.name).toBe("Updated Name");
    expect(updatedGroup.owner).toBe(groupOwner);
    expect(updatedGroup.members).toContain(groupOwner);
  });

  it("should handle special characters in group name", async () => {
    const groupOwner = testUsers[testUserIndex++];

    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Original Name",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(testGroupId);

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Update with special characters
    const specialName = "Updated Name with Special Characters! @#$%^&*()";
    const result = await updateGroupCalendar(testContext.client, testGroupId, {
      name: specialName,
    });

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
    expect(result.Attributes?.name).toBe(specialName);

    // Verify the update
    const updatedGroup = await getGroupCalendar(
      testContext.client,
      testGroupId,
      {
        consistentRead: true,
      },
    );
    expect(updatedGroup.name).toBe(specialName);
  });

  it("should throw error when groupId is empty", async () => {
    await expect(
      updateGroupCalendar(testContext.client, "", { name: "Test" }),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is null", async () => {
    await expect(
      updateGroupCalendar(testContext.client, null as any, { name: "Test" }),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when groupId is undefined", async () => {
    await expect(
      updateGroupCalendar(testContext.client, undefined as any, {
        name: "Test",
      }),
    ).rejects.toThrow("groupId is required");
  });

  it("should throw error when no fields are provided for update", async () => {
    await expect(
      updateGroupCalendar(testContext.client, testGroupId, {}),
    ).rejects.toThrow("At least one field must be updated");
  });

  it("should throw error when trying to update non-existent group", async () => {
    const nonExistentGroupId = "non-existent-group-" + uuidv4();

    await expect(
      updateGroupCalendar(testContext.client, nonExistentGroupId, {
        name: "Test",
      }),
    ).rejects.toThrow();
  });

  it("should handle empty update", async () => {
    const groupOwner = testUsers[testUserIndex++];

    const groupCalendar: GroupCalendar = {
      groupId: testGroupId,
      inviteCode: "invite-" + Date.now(),
      name: "Empty Members Test",
      owner: groupOwner,
      members: new Set([groupOwner]),
    };

    testContext.testGroups.push(testGroupId);

    // First add the group calendar
    await addGroupCalendar(testContext.client, groupCalendar);

    // Update with empty members array
    await expect(
      updateGroupCalendar(testContext.client, testGroupId, {}),
    ).rejects.toThrow();
  });
});
