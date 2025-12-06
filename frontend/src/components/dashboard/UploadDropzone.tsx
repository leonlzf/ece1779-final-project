import React, { useCallback, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function UploadDropzone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = useCallback(
    async (f?: File) => {
      if (!f) return;
      await onUpload(f);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUpload]
  );

  return (
    <Card
      className={cn("upload-zone", drag && "upload-zone--drag")}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        void handleFile(f);
      }}
    >
      <CardHeader>
        <div className="upload-zone__title">Upload</div>
        <div className="upload-zone__subtitle">
          Drag & drop a file here or choose from your device.
        </div>
      </CardHeader>

      <CardBody className="upload-zone__body">
        <Button onClick={pick} loading={uploading}>
          {uploading ? "Uploading" : "Select file"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => void handleFile(e.currentTarget.files?.[0])}
        />
      </CardBody>
    </Card>
  );
}
