import { Schema, model } from "mongoose";
import argon2 from "argon2";

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }

}, { timestamps: true });

userSchema.pre("save", async () => {
    if (this.isModified("password")) {
        try {
            //eslint-disable-next-line
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error);
        }
    }
});

userSchema.methods.comparePassword = async (password) => {
    try{
        return await argon2.verify(this.password,password);
    }catch(error){
        throw new Error(error);
    }
}

userSchema.index({userName:'text'});

const User = model("User", userSchema);

export default User;