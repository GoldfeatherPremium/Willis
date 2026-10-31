/** Shared literal arrays for Zod enums that mirror the DB enums. */

export const HOME_TYPES = ["house", "apartment", "studio", "loft", "townhouse", "other"] as const;

export const ROOM_TYPES = [
  "living_room",
  "kitchen",
  "bedroom",
  "bathroom",
  "study",
  "storage",
  "hallway",
  "garage",
  "balcony",
  "other"
] as const;

export const OBJECT_CATEGORIES = [
  "furniture",
  "electronics",
  "appliance",
  "book",
  "accessory",
  "clothing",
  "collectible",
  "storage_container",
  "document",
  "other"
] as const;

export const DOCUMENT_KINDS = ["receipt", "manual", "warranty", "other"] as const;

export const PLAN_IDS = ["explorer", "personal", "family", "collector"] as const;

export const SCAN_CAPTURE_TYPES = ["photos", "video", "mixed"] as const;
