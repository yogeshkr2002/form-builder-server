import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  typebots: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Typebot",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Folder", folderSchema);
