export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType;
  childName?: string;
  audience: string;
  time: string;
  authorNote: string;
  text: string;
  photoLabel?: string;
  likes: number;
  comments: number;
}

export const posts: Post[] = [
  {
    id: "1",
    type: "achievement",
    childName: "Mateo",
    audience: "familia de Mateo",
    time: "14:20",
    authorNote: "publicado por vos",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "2",
    type: "activity",
    childName: "Mateo",
    audience: "familia de Mateo",
    time: "09:40",
    authorNote: "publicado por vos",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoLabel: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "3",
    type: "announcement",
    audience: "toda la sala",
    time: "07:50",
    authorNote: "publicado por vos",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
