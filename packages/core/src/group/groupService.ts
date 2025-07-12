import { Logger } from "@aws-lambda-powertools/logger";
import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  TransactWriteCommandOutput,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type { GroupCalendar } from "./groupCalendar";
import { v4 as uuidv4 } from "uuid";
import { UserService } from "../user";

export class GroupCalendarService {
  logger?: Logger;
  dbClient: DynamoDBDocumentClient;
  userService: UserService;
  static readonly MAX_GROUP_SIZE = 20;

  constructor(args: {
    dbClient: DynamoDBDocumentClient;
    userService: UserService;
    logger?: Logger;
  }) {
    this.dbClient = args.dbClient;
    this.userService = args.userService;
    this.logger = args.logger;
  }

  async getGroupCalendar(args: {
    groupId: string;
    consistentRead?: boolean;
  }): Promise<GroupCalendar | undefined> {
    const { groupId, consistentRead = false } = args;

    const result = await this.dbClient.send(
      new GetCommand({
        TableName: Resource.GroupCalendarsTable.name,
        Key: { groupId: groupId },
        ConsistentRead: consistentRead,
      }),
    );

    if (!result.Item) {
      throw new Error("Group calendar not found");
    }

    return result.Item as GroupCalendar;
  }

  async getGroupCalendarByInviteCode(
    inviteCode: string,
  ): Promise<GroupCalendar> {
    const result = await this.dbClient.send(
      new QueryCommand({
        TableName: Resource.GroupCalendarsTable.name,
        IndexName: "inviteCodeIndex",
        KeyConditionExpression: "inviteCode = :inviteCode",
        ExpressionAttributeValues: {
          ":inviteCode": inviteCode,
        },
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      throw new Error("Group calendar not found");
    }

    return result.Items[0] as GroupCalendar;
  }

  async addGroupCalendar(args: {
    groupId: string;
    ownerAuthSub: string;
  }): Promise<{
    result: TransactWriteCommandOutput;
    groupCalendar: GroupCalendar;
  }> {
    const { groupId, ownerAuthSub } = args;

    const groupCalendar: GroupCalendar = {
      groupId: groupId,
      owner: ownerAuthSub,
      inviteCode: uuidv4(),
      members: new Set([ownerAuthSub]),
    };

    if (groupCalendar.groupId.length === 0) {
      throw new Error("groupId is required");
    }

    if (groupCalendar.owner.length === 0) {
      throw new Error("owner is required");
    }

    if (groupCalendar.inviteCode.length === 0) {
      throw new Error("inviteCode is required");
    }

    if (!(groupCalendar.members instanceof Set)) {
      throw new Error(
        "members must be a set, passed as: " + groupCalendar.members,
      );
    }

    if (!groupCalendar.members) {
      throw new Error("members is required with owner's authSub");
    }

    if (!groupCalendar.members.has(groupCalendar.owner)) {
      throw new Error("owner must be in members list");
    }

    // It should only be the owner in the members list during creation
    if (groupCalendar.members.size > 1) {
      throw new Error(
        "members list should only contain the owner during creation",
      );
    }

    const result = await this.dbClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: Resource.GroupCalendarsTable.name,
              Item: groupCalendar,
              ConditionExpression: "attribute_not_exists(groupId)",
            },
          },
          {
            Update: {
              TableName: Resource.UserProfilesTable.name,
              Key: { authSub: groupCalendar.owner },
              UpdateExpression:
                "ADD #groupsMember :groupId, #groupsOwner :groupId",
              ExpressionAttributeNames: {
                "#groupsMember": "groupsMember",
                "#groupsOwner": "groupsOwner",
              },
              ExpressionAttributeValues: {
                ":groupId": new Set([groupCalendar.groupId]),
              },
              ConditionExpression: "attribute_exists(authSub)",
            },
          },
        ],
      }),
    );

    return { result, groupCalendar };
  }

  async addMemberToGroupCalendar(
    groupId: string,
    memberAuthSub: string,
  ): Promise<TransactWriteCommandOutput> {
    if (!groupId || groupId.length === 0) {
      throw new Error("groupId is required");
    }

    if (!memberAuthSub || memberAuthSub.length === 0) {
      throw new Error("memberAuthSub is required");
    }

    // Check current group size before adding
    const groupCalendar = await this.getGroupCalendar({
      groupId,
      consistentRead: true,
    });

    if (!groupCalendar) {
      throw new Error("Group calendar not found");
    }

    if (groupCalendar.members.size >= GroupCalendarService.MAX_GROUP_SIZE) {
      throw new Error(
        `Group cannot exceed ${GroupCalendarService.MAX_GROUP_SIZE} members`,
      );
    }

    // Check if member is already in the group
    if (groupCalendar.members.has(memberAuthSub)) {
      throw new Error("User is already a member of this group");
    }

    const result = await this.dbClient.send(
      new TransactWriteCommand({
        TransactItems: [
          // Add member to group's members array
          {
            Update: {
              TableName: Resource.GroupCalendarsTable.name,
              Key: { groupId: groupId },
              UpdateExpression: "ADD members :memberSet",
              ExpressionAttributeValues: {
                ":memberSet": new Set([memberAuthSub]),
              },
              ConditionExpression: "attribute_exists(groupId)",
            },
          },
          // Add groupId to user's groupsMember array
          {
            Update: {
              TableName: Resource.UserProfilesTable.name,
              Key: { authSub: memberAuthSub },
              UpdateExpression: "ADD groupsMember :groupSet",
              ExpressionAttributeValues: {
                ":groupSet": new Set([groupId]),
              },
              ConditionExpression: "attribute_exists(authSub)",
            },
          },
        ],
      }),
    );

    return result;
  }

  // returns null when the group calendar does not exist
  async removeGroupCalendar(
    groupId: string,
  ): Promise<TransactWriteCommandOutput | null> {
    if (!groupId || groupId.length === 0) {
      throw new Error("groupId is required");
    }

    // First get the group to know which users to update (use consistent read)
    const groupCalendar = await this.getGroupCalendar({
      groupId,
      consistentRead: true,
    });

    if (!groupCalendar) {
      this.logger?.warn("Group calendar not found", { groupId });
      return null; // Group calendar does not exist
    }

    const groupMembers = groupCalendar.members.values();

    // Create transaction items to remove group from all members' profiles
    const transactItems = [
      // Delete the group calendar
      {
        Delete: {
          TableName: Resource.GroupCalendarsTable.name,
          Key: { groupId: groupId },
        },
      },
      // Remove groupId from each member's groupsMember and groupsOwner arrays
      ...groupMembers.map((authSub) => ({
        Update: {
          TableName: Resource.UserProfilesTable.name,
          Key: { authSub },
          UpdateExpression:
            "DELETE groupsMember :groupSet, groupsOwner :groupSet",
          ExpressionAttributeValues: {
            ":groupSet": new Set([groupId]),
          },
        },
      })),
    ];

    const result = await this.dbClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );

    return result;
  }

  // return successfully removed member or returns null if the user is not a member
  async removeMemberFromGroupCalendar(args: {
    groupId: string;
    memberAuthSub: string;
  }): Promise<TransactWriteCommandOutput | null> {
    const { groupId, memberAuthSub } = args;
    if (!groupId || groupId.length === 0) {
      throw new Error("groupId is required");
    }

    if (!memberAuthSub || memberAuthSub.length === 0) {
      throw new Error("memberAuthSub is required");
    }

    // Get the group to check if member is the owner
    const groupCalendar = await this.getGroupCalendar({
      groupId,
      consistentRead: true,
    });

    if (!groupCalendar) {
      return null;
    }

    if (groupCalendar.owner === memberAuthSub) {
      throw new Error("Cannot remove the group owner");
    }

    const result = await this.dbClient.send(
      new TransactWriteCommand({
        TransactItems: [
          // Remove member from group's members array
          {
            Update: {
              TableName: Resource.GroupCalendarsTable.name,
              Key: { groupId: groupId },
              UpdateExpression: "DELETE members :memberSet",
              ExpressionAttributeValues: {
                ":memberSet": new Set([memberAuthSub]),
              },
              ConditionExpression: "attribute_exists(groupId)",
            },
          },
          // Remove groupId from user's groupsMember array
          {
            Update: {
              TableName: Resource.UserProfilesTable.name,
              Key: { authSub: memberAuthSub },
              UpdateExpression: "DELETE groupsMember :groupSet",
              ExpressionAttributeValues: {
                ":groupSet": new Set([groupId]),
              },
              ConditionExpression: "attribute_exists(authSub)",
            },
          },
        ],
      }),
    );

    return result;
  }

  async updateGroupCalendar(args: {
    groupId: string;
    updates: {
      name?: string;
    };
  }): Promise<UpdateCommandOutput | null> {
    const { groupId, updates } = args;
    if (!groupId || groupId.length === 0) {
      throw new Error("groupId is required");
    }

    if (!updates.name) {
      throw new Error("At least one field must be updated");
    }

    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (updates.name) {
      updateExpressions.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = updates.name;
    }

    const result = await this.dbClient.send(
      new UpdateCommand({
        TableName: Resource.GroupCalendarsTable.name,
        Key: { groupId: groupId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(groupId)",
        ReturnValues: "ALL_NEW",
      }),
    );

    return result;
  }
}
