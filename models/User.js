import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    confirmationToken: {
      type: String,
      default: null
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('User', UserSchema);
