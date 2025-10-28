import { Schema, model } from "mongoose";

const userSchema = new Schema({
  companyName: { type: String, required: true },
  postId: { type: String, required: true },
  postLink: { type: String, required: true },
  addedAt: { type: Date, default: Date.now() },
  expiresAt: { type: Date, default: () => Date.now() + 12 * 1000 * 60 * 60 }, //expires after 12 hours.........
});

// // TTL index -> deletes the document automatically when `expiresAt` < now
// userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const User = model("User", userSchema);

export { User };
