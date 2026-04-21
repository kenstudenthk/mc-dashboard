import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

export interface RichTextEditorHandle {
  insertText: (text: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

const TOOLBAR_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#cc0000" },
  { label: "Blue", value: "#0047AB" },
  { label: "Green", value: "#078a52" },
  { label: "Orange", value: "#d08a11" },
];

const ToolbarBtn = ({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded text-sm font-medium transition-all"
    style={
      active
        ? { background: "#000", color: "#fff" }
        : { color: "#55534e", background: "transparent" }
    }
  >
    {children}
  </button>
);

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({
  value,
  onChange,
  minHeight = 180,
  placeholder,
}, ref) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, Color],
    content: value,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      editor?.chain().focus().insertContent(text).run();
    },
  }), [editor]);

  if (!editor) return null;

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{ border: "1px solid #717989" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap"
        style={{ borderBottom: "1px solid #dad4c8", background: "#faf9f7" }}
      >
        <ToolbarBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarBtn>

        <div
          className="w-px h-5 mx-1"
          style={{ background: "#dad4c8" }}
        />

        <ToolbarBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          ≡
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1.
        </ToolbarBtn>

        <div
          className="w-px h-5 mx-1"
          style={{ background: "#dad4c8" }}
        />

        {/* Color swatches */}
        {TOOLBAR_COLORS.map(({ label, value: color }) => (
          <button
            key={color}
            type="button"
            title={`Text color: ${label}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setColor(color).run();
            }}
            className="w-5 h-5 rounded-full border-2 transition-all"
            style={{
              background: color,
              borderColor: editor.isActive("textStyle", { color })
                ? "#000"
                : "transparent",
            }}
          />
        ))}

        <button
          type="button"
          title="Remove color"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().unsetColor().run();
          }}
          className="text-xs px-1.5 h-6 rounded transition-all"
          style={{ color: "#9f9b93", border: "1px solid #dad4c8" }}
        >
          Reset
        </button>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="px-3 py-2.5 text-sm focus:outline-none"
        style={{
          minHeight,
          color: "#000",
          background: "#fff",
        }}
      />

      {editor.isEmpty && placeholder && (
        <div
          className="absolute top-0 left-0 px-3 py-2.5 text-sm pointer-events-none"
          style={{ color: "#9f9b93" }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
});

export default RichTextEditor;
