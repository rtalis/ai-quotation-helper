import { UploadIcon } from "lucide-react";
import { DragEvent, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const clearFile = (e: any) => (e.target.value = null);

const DropZone = ({
  label = "Drag and drop or browse",
  onFile,
  accept,
  variant,
  className,
}: {
  label?: string;
  onFile: (file: File) => any;
  accept?: string;
  variant?: "row";
  className?: string;
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [noDrop, setNoDrop] = useState(false);
  const acceptTypes = useMemo(() => (accept ? new Set(accept.split(",").map(x => x.trim())) : null), [accept]);

  const unDrag = () => {
    setDragOver(false);
    setNoDrop(false);
  };

  const getFile = (e: any) => {
    let file: File | null = null;
    if (e.target instanceof HTMLInputElement) {
      file = e.target.files?.length ? e.target.files[0] : null;
    } else if (e.dataTransfer instanceof DataTransfer) {
      file = e.dataTransfer.files[0] ?? e.dataTransfer.items[0] ?? null;
    }
    return file;
  };

  const onFileChange = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    unDrag();
    const file = getFile(e);
    if (!file || (acceptTypes && !acceptTypes.has(file.type))) {
      return;
    }
    onFile(file);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <label
      className={cn(
        "relative overflow-hidden w-full flex flex-col justify-center items-center text-center px-2 py-4 gap-2",
        variant === "row" && "flex-row",
        "border-dashed border-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all select-none cursor-pointer",
        dragOver && "bg-accent border-primary",
        noDrop && "border-destructive",
        className,
      )}
      onDragEnter={e => {
        const file = getFile(e);
        if (!file || (acceptTypes && !acceptTypes.has(file.type))) {
          setNoDrop(true);
        } else {
          setDragOver(true);
        }
      }}
      onDragLeave={unDrag}
      onDragOver={(e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDrop={onFileChange}
    >
      <input
        ref={fileInputRef}
        className="absolute z-100 w-[1px] h-[1px] outline-none"
        type="file"
        onClick={clearFile}
        onChange={onFileChange}
        accept={accept}
      />
      <UploadIcon className="pointer-events-none" />
      <span className="pointer-events-none">{label}</span>
    </label>
  );
};

export default DropZone;