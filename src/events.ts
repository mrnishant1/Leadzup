import { EventEmitter } from "events";
import type { MatchedPost, ReplyQueueItem, ListenerStatus } from "./types.js";

export type AppEvents = {
  match: MatchedPost;
  reply: ReplyQueueItem;
  status: ListenerStatus;
};

class TypedEmitter extends EventEmitter {
  emitMatch(match: MatchedPost) {
    this.emit("match", match);
  }

  onMatch(handler: (match: MatchedPost) => void) {
    this.on("match", handler);
    return () => this.off("match", handler);
  }

  emitReply(reply: ReplyQueueItem) {
    this.emit("reply", reply);
  }

  onReply(handler: (reply: ReplyQueueItem) => void) {
    this.on("reply", handler);
    return () => this.off("reply", handler);
  }

  emitStatus(status: ListenerStatus) {
    this.emit("status", status);
  }

  onStatus(handler: (status: ListenerStatus) => void) {
    this.on("status", handler);
    return () => this.off("status", handler);
  }
}

export const appEvents = new TypedEmitter();
