export type ParentRelation = "mom" | "dad" | "guardian";
export type ParentStatus = "active" | "pending";

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
  room: string;
  avatar: Avatar;
  allergyBadge?: string;
  allergyNotes?: string;
  birthDate: string;
  admission: string;
  linkedParents: LinkedParent[];
}
