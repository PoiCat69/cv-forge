import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { PersonalInfo } from '../types/cv';
import { Field, Toggle } from './ui';

export function AvatarUploader({
  personal,
  onChange,
}: {
  personal: PersonalInfo;
  onChange: (patch: Partial<PersonalInfo>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.size > 4_000_000) {
      alert('Please choose an image under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      onChange({ avatar: String(reader.result), avatarZoom: 1, avatarOffsetX: 0, avatarOffsetY: 0 });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold app-muted">Show avatar on CV</span>
        <Toggle
          checked={personal.showAvatar}
          onChange={(v) => onChange({ showAvatar: v })}
          srLabel="Show avatar on CV"
        />
      </div>

      <div className="flex items-start gap-4">
        {/* Circular crop preview */}
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
        >
          {personal.avatar ? (
            <img
              src={personal.avatar}
              alt="avatar preview"
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${personal.avatarZoom}) translate(${personal.avatarOffsetX}%, ${personal.avatarOffsetY}%)`,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs app-muted">No image</div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button type="button" className="btn btn-outline w-full" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> {personal.avatar ? 'Replace image' : 'Upload image'}
          </button>
          {personal.avatar && (
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => onChange({ avatar: '' })}
              style={{ color: '#ef4444' }}
            >
              <Trash2 size={15} /> Remove
            </button>
          )}
        </div>
      </div>

      {personal.avatar && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Zoom">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={personal.avatarZoom}
              onChange={(e) => onChange({ avatarZoom: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </Field>
          <Field label="Offset X">
            <input
              type="range"
              min={-50}
              max={50}
              value={personal.avatarOffsetX}
              onChange={(e) => onChange({ avatarOffsetX: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </Field>
          <Field label="Offset Y">
            <input
              type="range"
              min={-50}
              max={50}
              value={personal.avatarOffsetY}
              onChange={(e) => onChange({ avatarOffsetY: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
