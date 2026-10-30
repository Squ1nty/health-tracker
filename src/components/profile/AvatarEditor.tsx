"use client";

import { useRef, useState, useTransition } from "react";
import { deleteAvatar, uploadAvatar } from "@/app/actions/profile";
import Avatar from "@/components/ui/Avatar";
import { AVATAR_MAX_SIDE, AVATAR_SIZE } from "@/lib/profile/shared";

// Shrinks the picture so its shortest side is AVATAR_SIZE (never enlarging
// it), keeping its shape. WebP where the browser can encode it, else JPEG.
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    AVATAR_SIZE / Math.min(bitmap.width, bitmap.height),
    AVATAR_MAX_SIDE / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await encode("image/webp");
  // Safari can't encode WebP and quietly hands back a PNG instead.
  return webp?.type === "image/webp" ? webp : encode("image/jpeg");
}

// The profile header's large picture. Tapping it opens a small menu to
// upload a new picture or remove the current one.
export default function AvatarEditor({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const choose = () => {
    setIsMenuOpen(false);
    inputRef.current?.click();
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      let blob: Blob | null;
      try {
        blob = await shrink(file);
      } catch {
        blob = null;
      }
      if (!blob) {
        setError("That file couldn't be opened as a picture.");
        return;
      }
      const formData = new FormData();
      formData.append("avatar", blob);
      const result = await uploadAvatar(formData);
      if (!result.ok) setError(result.error);
    });
  };

  const remove = () => {
    setIsMenuOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await deleteAvatar();
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          type="button"
          // Without a picture there's nothing to remove, so go straight to choosing one.
          onClick={() => (image ? setIsMenuOpen((open) => !open) : choose())}
          disabled={isPending}
          aria-label={image ? "Change profile picture" : "Add a profile picture"}
          aria-expanded={image ? isMenuOpen : undefined}
          className="group relative cursor-pointer rounded-full disabled:cursor-wait"
        >
          <Avatar
            name={name}
            seed={email}
            image={image}
            className="h-32 w-32 text-5xl ring-4 ring-surface-raised"
          />
          {/* Darkens with a camera on hover, and while a change is saving. */}
          <span
            className={`absolute inset-0 grid place-items-center rounded-full bg-black/50 transition-opacity duration-200 ${
              isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isPending ? (
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            )}
          </span>
        </button>

        {isMenuOpen && (
          <div className="absolute left-1/2 top-full z-10 mt-2 flex w-44 -translate-x-1/2 flex-col gap-1 rounded-lg border border-line bg-surface p-2">
            <button
              type="button"
              onClick={choose}
              className="cursor-pointer rounded-md px-3 py-2 text-left text-sm transition-colors duration-200 hover:bg-surface-raised"
            >
              Upload new photo
            </button>
            <button
              type="button"
              onClick={remove}
              className="cursor-pointer rounded-md px-3 py-2 text-left text-sm text-danger transition-colors duration-200 hover:bg-surface-raised"
            >
              Remove photo
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          // Lets the same file be picked again after an error.
          event.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
