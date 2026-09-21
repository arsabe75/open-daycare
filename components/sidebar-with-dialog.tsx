"use client";

import { useState } from "react";
import NewPostDialog from "@/components/feed/new-post-dialog";
import Sidebar from "@/components/sidebar";

interface SidebarWithDialogProps {
  activeHref?: string;
}

export default function SidebarWithDialog({
  activeHref,
}: SidebarWithDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sidebar activeHref={activeHref} onNewPost={() => setOpen(true)} />
      <NewPostDialog
        open={open}
        onClose={() => setOpen(false)}
        onPublish={() => setOpen(false)}
      />
    </>
  );
}
