import type { Child } from "@/lib/child-types";

const childrenData: Child[] = [
  {
    id: "1",
    name: "Mateo Fernández",
    age: 3,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "M", bg: "#A9D9E8", color: "#1F7A93" },
    allergyBadge: "MANÍ",
    allergyNotes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    birthDate: "12 mar 2022",
    admission: "feb 2025",
    linkedParents: [
      {
        id: "p1",
        name: "Lucía Fernández",
        relation: "mom",
        status: "active",
        avatar: { initial: "L", bg: "#C9B6E8", color: "#FFFFFF" },
      },
      {
        id: "p2",
        name: "Diego Fernández",
        relation: "dad",
        status: "pending",
        avatar: { initial: "D", bg: "#A9C7E8", color: "#FFFFFF" },
      },
    ],
  },
  {
    id: "2",
    name: "Sofía Méndez",
    age: 2,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "S", bg: "#F4B8CC", color: "#C44A7A" },
    birthDate: "8 ago 2022",
    admission: "mar 2025",
    linkedParents: [
      {
        id: "p3",
        name: "Camila Méndez",
        relation: "mom",
        status: "active",
        avatar: { initial: "C", bg: "#F4B8CC", color: "#FFFFFF" },
      },
    ],
  },
  {
    id: "3",
    name: "Benjamín Ruiz",
    age: 3,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "B", bg: "#B9DEC4", color: "#3E8B62" },
    birthDate: "15 ene 2022",
    admission: "ene 2025",
    linkedParents: [
      {
        id: "p4",
        name: "Laura Ruiz",
        relation: "mom",
        status: "active",
        avatar: { initial: "L", bg: "#B9DEC4", color: "#FFFFFF" },
      },
      {
        id: "p5",
        name: "Martín Ruiz",
        relation: "dad",
        status: "active",
        avatar: { initial: "M", bg: "#C9B6E8", color: "#FFFFFF" },
      },
    ],
  },
  {
    id: "4",
    name: "Valentina Soto",
    age: 2,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "V", bg: "#F4DC8E", color: "#9A7B1E" },
    birthDate: "22 abr 2023",
    admission: "abr 2025",
    linkedParents: [],
  },
  {
    id: "5",
    name: "Tomás Díaz",
    age: 3,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "T", bg: "#C9B6E8", color: "#7B5FC0" },
    allergyBadge: "LACTOSA",
    allergyNotes:
      "Intolerancia a la lactosa. Evitar lácteos y derivados. Menú sin queso asignado.",
    birthDate: "3 may 2022",
    admission: "feb 2025",
    linkedParents: [
      {
        id: "p6",
        name: "Paula Díaz",
        relation: "mom",
        status: "active",
        avatar: { initial: "P", bg: "#F4DC8E", color: "#FFFFFF" },
      },
    ],
  },
  {
    id: "6",
    name: "Emma Castro",
    age: 2,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "E", bg: "#F4B8CC", color: "#C44A7A" },
    birthDate: "12 jul 2022",
    admission: "mar 2025",
    linkedParents: [
      {
        id: "p7",
        name: "Ana Castro",
        relation: "mom",
        status: "active",
        avatar: { initial: "A", bg: "#A9D9E8", color: "#FFFFFF" },
      },
    ],
  },
  {
    id: "7",
    name: "Lucas Romero",
    age: 3,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "L", bg: "#A9D9E8", color: "#1F7A93" },
    birthDate: "30 nov 2021",
    admission: "ene 2025",
    linkedParents: [
      {
        id: "p8",
        name: "Javier Romero",
        relation: "dad",
        status: "active",
        avatar: { initial: "J", bg: "#B9DEC4", color: "#FFFFFF" },
      },
    ],
  },
  {
    id: "8",
    name: "Olivia Vega",
    age: 2,
    roomId: "soles",
    room: "Soles",
    avatar: { initial: "O", bg: "#B9DEC4", color: "#3E8B62" },
    birthDate: "5 sep 2022",
    admission: "may 2025",
    linkedParents: [
      {
        id: "p9",
        name: "María Vega",
        relation: "mom",
        status: "active",
        avatar: { initial: "M", bg: "#F4B8CC", color: "#FFFFFF" },
      },
    ],
  },
];

export const children = childrenData;

export function getChildById(id: string): Child | undefined {
  return childrenData.find((child) => child.id === id);
}
