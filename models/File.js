import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: { type: String, default: 'Active' },
        fileUrl: String,
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('File', FileSchema);
