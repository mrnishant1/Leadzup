import { Schema, model } from "mongoose";
const userSchema = new Schema({
    postId: { type: String, required: true },
    postLink: { type: String, required: true },
    addedAt: { type: Date, default: Date.now() },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 1000 * 60 * 60 } //expires after 24 hours.........
});
// TTL index -> deletes the document automatically when `expiresAt` < now
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const User = model("User", userSchema);
export { User };
//# sourceMappingURL=mongoDB.js.map