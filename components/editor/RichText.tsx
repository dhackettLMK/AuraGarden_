"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Heading2, Highlighter, Italic, Link2, List, ListChecks, ListOrdered } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Tiptap editor: headings, lists, checkboxes, links, highlight (brief 6.5). */
export function RichText({
  value,
  onChange,
  placeholder = "Write something…",
  className,
  minimal = false,
  autofocus = false,
  label = "Notes",
}: {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
  minimal?: boolean;
  autofocus?: boolean;
  label?: string;
}) {
  const changeRef = useRef(onChange);
  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autofocus ? "end" : false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "prose-garden min-h-[6rem] outline-none", "aria-label": label, role: "textbox", "aria-multiline": "true" },
    },
    onUpdate: ({ editor }) => changeRef.current(editor.getHTML(), editor.getText()),
  });

  if (!editor) return <div className={cn("min-h-[6rem] rounded-[14px] bg-surface-sunk", className)} />;

  const btn = (active: boolean) =>
    cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface hover:text-ink",
      active && "bg-surface text-primary shadow-[var(--shadow-soft)]",
    );
  return (
    <div className={cn("rounded-[14px] bg-surface-sunk", className)}>
      {!minimal && (
        <div className="no-scrollbar flex gap-0.5 overflow-x-auto border-b border-line/70 p-1.5" role="toolbar" aria-label="Formatting">
          <button type="button" aria-label="Heading" className={btn(editor.isActive("heading"))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={18} />
          </button>
          <button type="button" aria-label="Bold" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={18} />
          </button>
          <button type="button" aria-label="Italic" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={18} />
          </button>
          <button type="button" aria-label="Highlight" className={btn(editor.isActive("highlight"))} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <Highlighter size={18} />
          </button>
          <button type="button" aria-label="Bullet list" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={18} />
          </button>
          <button type="button" aria-label="Numbered list" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={18} />
          </button>
          <button type="button" aria-label="Checklist" className={btn(editor.isActive("taskList"))} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <ListChecks size={18} />
          </button>
          <button
            type="button"
            aria-label="Link"
            className={btn(editor.isActive("link"))}
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link address", prev ?? "https://");
              if (url === null) return;
              if (!url) editor.chain().focus().unsetLink().run();
              else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
          >
            <Link2 size={18} />
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="px-4 py-3" />
    </div>
  );
}
