import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { removeGroupCalendar } from "../../src/group/removeGroupCalendar";
import { addGroupCalendar } from "../../src/group/addGroupCalendar";
import { removeUser } from "../../src/user/removeUser";
import { addUserProfile } from "../../src/user/addUserProfile";
import { UserProfile } from "../../src/user/userProfile";
import { GroupCalendar } from "../../src/group/groupCalendar";
import { Resource } from "sst";

export interface MyTestContext {
  client: DynamoDBDocumentClient;
  testUsers: string[];
  testGroups: string[];
}

export function createTestContext(): MyTestContext {
  return {
    client: DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: Resource.AwsRegion.value }),
    ),
    testUsers: [],
    testGroups: [],
  };
}

export async function cleanupTestData(context: MyTestContext): Promise<void> {
  const { client, testUsers, testGroups } = context;

  // Clean up test groups
  for (const groupId of testGroups) {
    try {
      await removeGroupCalendar(client, groupId);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clean up test users
  for (const userId of testUsers) {
    try {
      await removeUser(client, userId);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clear tracking arrays
  context.testUsers.length = 0;
  context.testGroups.length = 0;
}

export async function setupTestUsers(
  context: MyTestContext,
  authSubs: string[],
  initialGroups?: Set<string>,
): Promise<string[]> {
  const { client, testUsers } = context;

  for (const authSub of authSubs) {
    // Skip if user already tracked
    if (testUsers.includes(authSub)) {
      continue;
    }

    const userProfile: UserProfile = {
      authSub: authSub,
      groups:
        initialGroups !== undefined && initialGroups.size > 0
          ? initialGroups
          : undefined,
    };

    try {
      await addUserProfile(client, userProfile);
      testUsers.push(authSub);
    } catch (error: any) {
      // If user already exists, just add to tracking
      if (error?.name === "ConditionalCheckFailedException") {
        testUsers.push(authSub);
      } else {
        throw error;
      }
    }
  }
  return authSubs;
}

export async function setupTestGroup(
  context: MyTestContext,
  groupId: string,
  groupCal: GroupCalendar,
): Promise<void> {
  const { client, testGroups } = context;

  await addGroupCalendar(client, groupCal);
  testGroups.push(groupId);
}
