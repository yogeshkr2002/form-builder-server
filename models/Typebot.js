import mongoose from "mongoose";

const typebotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null, // null means it's not in any folder
  },
  fields: [
    {
      id: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        default: "",
      },
      required: {
        type: Boolean,
        default: false,
      },
      options: [
        {
          type: String,
        },
      ],
      hint: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Typebot", typebotSchema);
