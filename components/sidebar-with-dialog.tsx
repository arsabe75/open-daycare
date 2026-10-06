"use client";

import { useState } from "react";
import type { Child } from "@/lib/child-types";
import NewPostDialog from "@/components/feed/new-post-dialog";
import Sidebar from "@/components/sidebar";
import type { CurrentUserProfile } from "@/lib/current-user";

interface Room {
  id: string;
  name: string;
}

interface SidebarWithDialogProps {
  activeHref?: string;
  kids: Child[];
  rooms: Room[];
  user?: CurrentUserProfile | null;
}

export default function SidebarWithDialog({
  activeHref,
  kids,
  rooms,
  user,
}: SidebarWithDialogProps) {
  const [open, setOpen] = useState(false);
  const isStaff = user?.role === "staff" || user?.role === "admin";

  return (
    <>
      <Sidebar
        activeHref={activeHref}
        onNewPost={isStaff ? () => setOpen(true) : undefined}
        user={user}
      />
      {isStaff && (
        <NewPostDialog
          open={open}
          onClose={() => setOpen(false)}
          kids={kids}
          rooms={rooms}
        />
      )}
    </>
  );
}
