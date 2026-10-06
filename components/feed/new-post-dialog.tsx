"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Child } from "@/lib/child-types";
import type { PostType } from "@/lib/data/posts";
import { createPost } from "@/lib/actions/posts";
import { POST_TYPE_META, POST_TYPE_ORDER } from "@/lib/post-types";

interface Room {
  id: string;
  name: string;
}

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  kids: Child[];
  rooms: Room[];
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;

interface PhotoEntry {
  file: File;
  preview: string;
}

export default function NewPostDialog({
  open,
  onClose,
  kids,
  rooms,
}: NewPostDialogProps) {
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [isClassroom, setIsClassroom] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<PostType>("food");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [errors, setErrors] = useState<{
    para?: string;
    description?: string;
    photos?: string;
    submit?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setSelectedChildIds([]);
    setIsClassroom(false);
    setSelectedRoomId("");
    setSelectedType("food");
    setDescription("");
    setPhotos([]);
    setErrors({});
    setIsSubmitting(false);
  }, [photos]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, handleClose]);

  if (!open) return null;

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setErrors((prev) => ({ ...prev, photos: undefined }));

    const total = photos.length + files.length;
    if (total > MAX_PHOTOS) {
      setErrors((prev) => ({
        ...prev,
        photos: `Podés subir hasta ${MAX_PHOTOS} imágenes.`,
      }));
      return;
    }

    const invalid = files.find((file) => file.size > MAX_PHOTO_SIZE || !file.type.startsWith("image/"));
    if (invalid) {
      setErrors((prev) => ({
        ...prev,
        photos: `Cada imagen debe ser menor a ${formatFileSize(MAX_PHOTO_SIZE)}.`,
      }));
      return;
    }

    const newEntries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newEntries].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {};

    if (!selectedRoomId) {
      nextErrors.para = "Seleccioná una sala.";
    } else if (!isClassroom && selectedChildIds.length === 0) {
      nextErrors.para = "Seleccioná al menos un niño.";
    }

    if (description.trim() === "") {
      nextErrors.description = "Escribí una descripción.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handlePublish() {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: undefined }));

    try {
      const formData = new FormData();
      formData.append("type", selectedType);
      formData.append("body", description.trim());

      if (isClassroom) {
        formData.append("childIds", "classroom");
      } else {
        selectedChildIds.forEach((id) => formData.append("childIds", id));
      }

      if (selectedRoomId) {
        formData.append("roomId", selectedRoomId);
      }

      photos.forEach((entry) => formData.append("photos", entry.file));

      const result = await createPost(formData);

      if (result.error) {
        setErrors((prev) => ({ ...prev, submit: result.error }));
        return;
      }

      handleClose();
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: "No se pudo publicar. Intentá de nuevo.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-6 py-10"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]">
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={handleClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-[#3F362E]">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            className="text-[15px] font-extrabold text-[#D9583C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Publicando..." : "Publicar"}
          </button>
        </div>

        <div className="px-[26px] py-6 max-h-[80vh] overflow-y-auto">
          {errors.submit && (
            <div className="mb-4 rounded-[12px] bg-[#FBD8CC] px-4 py-3 text-[13px] font-semibold text-[#D9583C]">
              {errors.submit}
            </div>
          )}

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            PARA
          </div>

          {rooms.length > 0 && (
            <div className="mb-[14px] flex flex-wrap gap-[9px]">
              {rooms.map((room) => {
                const selected = selectedRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setSelectedRoomId("");
                        setIsClassroom(false);
                      } else {
                        setSelectedRoomId(room.id);
                      }
                    }}
                    className={`rounded-full px-4 py-1.5 text-[14px] font-bold cursor-pointer ${
                      selected
                        ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                        : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                    }`}
                  >
                    Sala {room.name}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={!selectedRoomId}
                onClick={() => {
                  if (!selectedRoomId) return;
                  const next = !isClassroom;
                  setIsClassroom(next);
                  if (next) {
                    setSelectedChildIds([]);
                  }
                }}
                className={`rounded-full px-4 py-1.5 text-[14px] font-bold cursor-pointer ${
                  isClassroom
                    ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                    : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                } ${
                  !selectedRoomId
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Toda la sala
              </button>
            </div>
          )}

          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {kids.map((child) => {
              const selected = selectedChildIds.includes(child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    setIsClassroom(false);
                    setSelectedChildIds((prev) =>
                      prev.includes(child.id)
                        ? prev.filter((id) => id !== child.id)
                        : [...prev, child.id]
                    );
                  }}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14px] font-bold cursor-pointer ${
                    selected
                      ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                      : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{
                      backgroundColor: child.avatar.bg,
                      color: child.avatar.color,
                    }}
                  >
                    {child.avatar.initial}
                  </span>
                  {firstName(child.name)}
                </button>
              );
            })}
          </div>
          {errors.para && (
            <div className="mb-3 text-[13px] font-semibold text-[#D9583C]">
              {errors.para}
            </div>
          )}

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            TIPO
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {POST_TYPE_ORDER.map((type) => {
              const meta = POST_TYPE_META[type];
              const selected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className="rounded-full px-4 py-2 text-[13.5px] font-extrabold cursor-pointer"
                  style={
                    selected
                      ? {
                          backgroundColor: meta.accent,
                          color: "#fff",
                        }
                      : {
                          backgroundColor: meta.pastel,
                          color: meta.accent,
                        }
                  }
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            DESCRIPCIÓN
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contá cómo le fue hoy…"
            className="mb-[22px] w-full min-h-[120px] resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
          />
          {errors.description && (
            <div className="mb-3 -mt-[14px] text-[13px] font-semibold text-[#D9583C]">
              {errors.description}
            </div>
          )}

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            FOTOS
          </div>
          <div className="flex flex-wrap gap-3">
            {photos.map((entry, index) => (
              <div
                key={entry.preview}
                className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-[#ECE0D0]"
              >
                <Image
                  src={entry.preview}
                  alt={`Foto ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C5503A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[12px]">Agregar</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {errors.photos && (
            <div className="mt-2 text-[13px] font-semibold text-[#D9583C]">
              {errors.photos}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
