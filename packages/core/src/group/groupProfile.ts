export interface GroupProfileDto {
  groupId: string;
  name: string;
  members: string[];
  makeEventsPublic?: boolean;
}
