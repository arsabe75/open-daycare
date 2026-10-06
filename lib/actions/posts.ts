"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Post, PostPhoto, PostType } from "@/lib/data/posts";

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE_BYTES = 3 * 1024 * 1024;
const PHOTO_BUCKET = "post-photos";

interface CurrentUser {
  id: string;
  daycareId: string;
  role: "staff" | "admin" | "parent";
}

async function getCurrentUser(supabase: ReturnType<typeof createClient>): Promise<CurrentUser | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, daycare_id, role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    daycareId: data.daycare_id as string,
    role: data.role as CurrentUser["role"],
  };
}

function isStaffOrRole(role: string): role is "staff" | "admin" {
  return role === "staff" || role === "admin";
}

function parsePostType(value: FormDataEntryValue | null): PostType | null {
  const type = String(value ?? "");
  const validTypes: PostType[] = [
    "achievement",
    "activity",
    "announcement",
    "food",
    "mood",
    "nap",
    "photo",
  ];
  return validTypes.includes(type as PostType) ? (type as PostType) : null;
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function audienceLabel(childNames: string[]): string {
  if (childNames.length === 0) return "toda la sala";
  if (childNames.length === 1) return `familia de ${childNames[0]}`;
  return `familias de ${childNames.join(", ")}`;
}

export async function createPost(formData: FormData): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user || !isStaffOrRole(user.role)) {
    return { error: "No tenés permiso para publicar." };
  }

  const type = parsePostType(formData.get("type"));
  const body = String(formData.get("body") ?? "").trim();
  const roomIdRaw = formData.get("roomId");
  const roomId = roomIdRaw ? String(roomIdRaw) : null;
  const childIds = formData.getAll("childIds").map(String).filter(Boolean);
  const photos = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);

  if (!type) {
    return { error: "Seleccioná un tipo de publicación." };
  }

  if (body.length === 0) {
    return { error: "Escribí una descripción." };
  }

  if (!roomId) {
    return { error: "Seleccioná una sala." };
  }

  const isClassroom = childIds.length === 1 && childIds[0] === "classroom";

  if (photos.length > MAX_PHOTOS) {
    return { error: `Podés subir hasta ${MAX_PHOTOS} imágenes.` };
  }

  for (const file of photos) {
    if (!file.type.startsWith("image/")) {
      return { error: "Solo se permiten archivos de imagen." };
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { error: "Cada imagen debe pesar menos de 3 MB." };
    }
  }

  // Insert the post first so we have a post_id for the storage path.
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      room_id: roomId,
      type,
      body,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (postError || !post) {
    return { error: postError?.message ?? "No se pudo crear la publicación." };
  }

  const postId = post.id;
  const uploadedPaths: string[] = [];
  let finalError: string | undefined;

  try {
    // Link children if any were selected (not the classroom pseudo-option).
    if (!isClassroom && childIds.length > 0) {
      const rows = childIds.map((childId) => ({ post_id: postId, child_id: childId }));
      const { error: childrenError } = await supabase.from("post_children").insert(rows);
      if (childrenError) {
        throw new Error(childrenError.message);
      }
    }

    // Upload photos.
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.daycareId}/${postId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(path);

      const { error: photoRowError } = await supabase.from("post_photos").insert({
        post_id: postId,
        url: path,
        position: i,
      });

      if (photoRowError) {
        throw new Error(photoRowError.message);
      }
    }
  } catch (err) {
    finalError = err instanceof Error ? err.message : "Error al publicar.";

    // Best-effort cleanup: remove uploaded images and the post row.
    for (const path of uploadedPaths) {
      await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    }
    await supabase.from("post_children").delete().eq("post_id", postId);
    await supabase.from("post_photos").delete().eq("post_id", postId);
    await supabase.from("posts").delete().eq("id", postId);

    return { error: finalError };
  }

  revalidatePath("/");
  return {};
}

interface PostRow {
  id: string;
  type: PostType;
  body: string;
  published_at: string;
  room_id: string | null;
  post_children: { child_id: string; children: { full_name: string }[] }[] | null;
  post_photos: { id: string; url: string; width: number | null; height: number | null; position: number }[] | null;
  reactions: { count: number }[] | null;
  comments: { count: number }[] | null;
  comments_list: { id: string; body: string; created_at: string; users: { full_name: string }[] }[] | null;
  users: { full_name: string }[] | null;
}

function postFromRow(row: PostRow, signedUrls: Record<string, string>, likedPostIds: Set<string>): Post {
  const children = (row.post_children ?? []).map((pc) => pc.children[0]?.full_name ?? "");
  const childName = children.length > 0 ? children.map(firstName).join(", ") : undefined;
  const audience = audienceLabel(children.map(firstName));
  const isAnnouncement = row.type === "announcement";
  const isClassroom = children.length === 0 && (isAnnouncement || !row.room_id);

  const photos: PostPhoto[] = (row.post_photos ?? [])
    .sort((a, b) => a.position - b.position)
    .map((photo) => ({
      id: photo.id,
      url: photo.url,
      width: photo.width ?? undefined,
      height: photo.height ?? undefined,
      position: photo.position,
      signedUrl: signedUrls[photo.url],
    }));

  return {
    id: row.id,
    type: row.type,
    childName,
    audience: isClassroom ? "toda la sala" : audience,
    time: formatTime(row.published_at),
    authorNote: `publicado por ${row.users?.[0]?.full_name ?? "staff"}`,
    text: row.body,
    photos,
    likes: row.reactions?.[0]?.count ?? 0,
    comments: row.comments?.[0]?.count ?? 0,
    commentsList: (row.comments_list ?? []).slice(0, 3).map((c) => ({
      id: c.id,
      authorName: c.users?.[0]?.full_name ?? "",
      body: c.body,
      createdAt: c.created_at,
    })),
    userHasLiked: likedPostIds.has(row.id),
    publishedAt: row.published_at,
  };
}

export async function getFeedPosts(): Promise<Post[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user) return [];

  const [{ data, error }, { data: likedPosts }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `
        id,
        type,
        body,
        published_at,
        room_id,
        post_children(child_id, children(full_name)),
        post_photos(id, url, width, height, position),
        reactions(count),
        comments(count),
        comments_list:comments(id, body, created_at, users(full_name)),
        users(full_name)
      `
      )
      .order("published_at", { ascending: false }),
    supabase.from("reactions").select("post_id").eq("user_id", user.id),
  ]);

  if (error || !data) {
    console.error("getFeedPosts error:", error);
    return [];
  }

  // Collect all unique storage paths to batch-sign them.
  const paths = new Set<string>();
  (data as PostRow[]).forEach((row) => {
    (row.post_photos ?? []).forEach((photo) => paths.add(photo.url));
  });

  let signedUrls: Record<string, string> = {};
  if (paths.size > 0) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(Array.from(paths), 60 * 60);

    if (!signedError && signedData) {
      signedUrls = Object.fromEntries(
        signedData.map((item) => [item.path, item.signedUrl]).filter(([, url]) => url !== undefined)
      ) as Record<string, string>;
    }
  }

  const likedPostIds = new Set((likedPosts ?? []).map((r) => r.post_id as string));

  return (data as PostRow[]).map((row) => postFromRow(row, signedUrls, likedPostIds));
}

export async function addReaction(postId: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("reactions").upsert(
    { post_id: postId, user_id: user.id, type: "love" },
    { onConflict: "post_id, user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return {};
}

export async function removeReaction(postId: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return {};
}

export async function addComment(
  postId: string,
  body: string
): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user) return { error: "No autenticado." };

  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return { error: "El comentario no puede estar vacío." };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return {};
}
