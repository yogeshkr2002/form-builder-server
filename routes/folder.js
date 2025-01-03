import express from "express";
import Folder from "../models/Folder.js";
import Typebot from "../models/Typebot.js";

const router = express.Router();

// Get all folders
router.get("/folders", async (req, res) => {
  try {
    const folders = await Folder.find().populate("typebots");
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create folder
router.post("/folders", async (req, res) => {
  try {
    const { name } = req.body;

    // Check if folder with same name exists
    const existingFolder = await Folder.findOne({ name });
    if (existingFolder) {
      return res
        .status(400)
        .json({ message: "Folder with this name already exists" });
    }

    const folder = new Folder({ name });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update folder
router.put("/folders/:id", async (req, res) => {
  try {
    const { name } = req.body;

    // Check if another folder with same name exists
    const existingFolder = await Folder.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (existingFolder) {
      return res
        .status(400)
        .json({ message: "Folder with this name already exists" });
    }

    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete folder
router.delete("/folders/:id", async (req, res) => {
  try {
    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: "Folder deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add typebot to folder
router.post("/folders/:folderId/typebots", async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findById(req.params.folderId);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Check if typebot with same name exists in this folder
    const existingTypebot = await Typebot.findOne({
      name,
      folderId: req.params.folderId,
    });

    if (existingTypebot) {
      return res.status(400).json({
        message: "A typebot with this name already exists in this folder",
      });
    }

    const typebot = new Typebot({
      name,
      folderId: folder._id,
      fields: [],
    });
    await typebot.save();

    folder.typebots.push(typebot._id);
    await folder.save();

    res.status(201).json(typebot);
  } catch (error) {
    console.error("Error creating typebot in folder:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a single folder
router.get("/folders/:id", async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get typebots in a folder
router.get("/folders/:folderId/typebots", async (req, res) => {
  try {
    const typebots = await Typebot.find({ folderId: req.params.folderId });
    res.json(typebots);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
