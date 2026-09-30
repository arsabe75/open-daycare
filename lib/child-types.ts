export type ParentRelation = "mom" | "dad" | "guardian";
export type ParentStatus = "active" | "pending";

export type DbRelationship = "father" | "mother" | "guardian";

export interface InvitationInfo {
  childFullName: string;
  roomName: string;
  daycareId: string;
  fullName: string;
  email: string;
  relationship: DbRelationship;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
}

export interface Avatar {
  initial: string;
  bg: string;
  color: string;
}

export interface LinkedParent {
  id: string;
  name: string;
  relation: ParentRelation;
  status: ParentStatus;
  avatar: Avatar;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  roomId: string;
  room: string;
  avatar: Avatar;
  allergyBadge?: string;
  allergyNotes?: string;
  allergyTags?: string[];
  medicalNotes?: string;
  birthDate: string;
  birthDateIso?: string;
  admission: string;
  linkedParents: LinkedParent[];
}
