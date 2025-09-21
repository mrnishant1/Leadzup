import { Schema } from "mongoose";
declare const User: import("mongoose").Model<{
    postId: string;
    postLink: string;
    addedAt: NativeDate;
    expiresAt: NativeDate;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    postId: string;
    postLink: string;
    addedAt: NativeDate;
    expiresAt: NativeDate;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    postId: string;
    postLink: string;
    addedAt: NativeDate;
    expiresAt: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    postId: string;
    postLink: string;
    addedAt: NativeDate;
    expiresAt: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    postId: string;
    postLink: string;
    addedAt: NativeDate;
    expiresAt: NativeDate;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    postId: string;
    postLink: string;
    addedAt: NativeDate;
    expiresAt: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
export { User };
//# sourceMappingURL=mongoDB.d.ts.map