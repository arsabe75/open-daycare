"use client";

import { useState } from "react";
import NewPostDialog from "@/components/feed/new-post-dialog";
import Sidebar from "@/components/sidebar";
import type { CurrentUserProfile } from "@/lib/current-user";

interface SidebarWithDialogProps {
  activeHref?: string;
  user?: CurrentUserProfile | null;
}

export default function SidebarWithDialog({
  activeHref,
  user,
}: SidebarWithDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sidebar
        activeHref={activeHref}
        onNewPost={() => setOpen(true)}
        user={user}
      />
      <NewPostDialog
        open={open}
        onClose={() => setOpen(false)}
        onPublish={() => setOpen(false)}
      />
    </>
  );
}
