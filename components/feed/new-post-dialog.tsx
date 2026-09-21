"use client";

import { useEffect, useState } from "react";
import type { Child } from "@/lib/data/children";
import { children } from "@/lib/data/children";
import type { Post, PostType } from "@/lib/data/posts";
import { POST_TYPE_META, POST_TYPE_ORDER } from "@/lib/post-types";
import { buildPost } from "@/lib/post-utils";

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  onPublish: (post: Post) => void;
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

export default function NewPostDialog({
  open,
  onClose,
  onPublish,
}: NewPostDialogProps) {
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [isClassroom, setIsClassroom] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType>("food");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{
    para?: string;
    description?: string;
  }>({});

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handlePublish() {
    const nextErrors: { para?: string; description?: string } = {};

    if (!isClassroom && selectedChildIds.length === 0) {
      nextErrors.para = "Seleccioná un destinatario.";
    }

    if (description.trim() === "") {
      nextErrors.description = "Escribí una descripción.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const selectedChildren: Child[] | "classroom" = isClassroom
      ? "classroom"
      : children.filter((child) => selectedChildIds.includes(child.id));

    const post = buildPost({
      type: selectedType,
      children: selectedChildren,
      text: description,
    });

    onPublish(post);
    onClose();
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
            onClick={onClose}
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
            className="text-[15px] font-extrabold text-[#D9583C]"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            PARA
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {children.map((child) => {
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
                        : [...prev, child.id],
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
            <button
              type="button"
              onClick={() => {
                setSelectedChildIds([]);
                setIsClassroom((prev) => !prev);
              }}
              className={`rounded-full px-4 py-1.5 text-[14px] font-bold cursor-pointer ${
                isClassroom
                  ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                  : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
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
          <div className="flex gap-3">
            <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1] text-[#CBB89F]">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </div>
            <button
              type="button"
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
          </div>
        </div>
      </div>
    </div>
  );
}
