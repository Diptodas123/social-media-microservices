import { Schema, model } from "mongoose";

const postSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
    },
    mediaIds: [
        {
            type: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

postSchema.index({ content: "text" });

const Post = model("Post", postSchema);

export default Post;