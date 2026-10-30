import "server-only";
import { Binary, ObjectId, type Collection, type Document } from "mongodb";
import { getAuthCollections } from "@/lib/auth/collections";
import { applyValidator, getDb } from "@/lib/mongodb";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, type AvatarType } from "@/lib/profile/shared";

// One picture per user, keyed by the user's own id.
export type AvatarDoc = {
  _id: ObjectId;
  data: Binary;
  contentType: AvatarType;
  updatedAt: Date;
};

const AVATAR_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "data", "contentType", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      data: { bsonType: "binData" },
      contentType: { enum: [...AVATAR_TYPES] },
      updatedAt: { bsonType: "date" },
    },
  },
};

declare global {
  var _avatarSetupPromise: Promise<void> | undefined;
}

async function getAvatars(): Promise<Collection<AvatarDoc>> {
  const db = await getDb();
  if (!global._avatarSetupPromise) {
    global._avatarSetupPromise = applyValidator(db, "avatars", AVATAR_VALIDATOR).catch(
      (error) => {
        global._avatarSetupPromise = undefined;
        throw error;
      }
    );
  }
  await global._avatarSetupPromise;
  return db.collection<AvatarDoc>("avatars");
}

// What the file's first bytes say it is, whatever the browser claimed.
// Null if it's neither a WebP nor a JPEG.
export function sniffAvatarType(bytes: Uint8Array): AvatarType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

export async function getAvatar(userId: string) {
  if (!ObjectId.isValid(userId)) return null;
  const avatars = await getAvatars();
  return avatars.findOne({ _id: new ObjectId(userId) });
}

export async function setAvatar(userId: string, bytes: Uint8Array, contentType: AvatarType) {
  if (bytes.length > AVATAR_MAX_BYTES) throw new Error("Avatar too large");
  const _id = new ObjectId(userId);
  const updatedAt = new Date();

  const avatars = await getAvatars();
  await avatars.updateOne(
    { _id },
    { $set: { data: new Binary(bytes), contentType, updatedAt } },
    { upsert: true }
  );
  const { users } = await getAuthCollections();
  await users.updateOne({ _id }, { $set: { avatarUpdatedAt: updatedAt } });
}

export async function removeAvatar(userId: string) {
  const _id = new ObjectId(userId);
  const { users } = await getAuthCollections();
  // The user first, so nothing points at the picture once it's gone.
  await users.updateOne({ _id }, { $unset: { avatarUpdatedAt: "" } });
  const avatars = await getAvatars();
  await avatars.deleteOne({ _id });
}
