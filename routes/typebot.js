import express from "express";
import Typebot from "../models/Typebot.js";
import FormResponse from "../models/FormResponse.js";

const router = express.Router();

// Move the test route to the top
router.get("/typebots/test", async (req, res) => {
  res.json({ message: "Typebot routes are working" });
});

// Get public form - Move this before the generic ID route
router.get("/typebots/:id/public", async (req, res) => {
  try {
    console.log("Fetching public form with ID:", req.params.id);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      console.log("No token provided");
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const typebot = await Typebot.findById(req.params.id);
    if (!typebot) {
      console.log("Form not found for ID:", req.params.id);
      return res.status(404).json({ message: "Form not found" });
    }

    const formData = {
      name: typebot.name,
      fields: typebot.fields.map((field) => ({
        id: field.id,
        type: field.type,
        category: field.category,
        content: field.content || "",
        required: field.required || false,
        hint: field.hint || "",
        options: field.options || [],
        url: field.url || "",
      })),
    };

    console.log("Sending form data:", formData);
    res.json(formData);
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all typebots (only those not in folders)
router.get("/typebots", async (req, res) => {
  try {
    const typebots = await Typebot.find({ folderId: null });
    res.json(typebots);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get a single typebot
router.get("/typebots/:id", async (req, res) => {
  try {
    const typebot = await Typebot.findById(req.params.id);
    if (!typebot) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(typebot);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new typebot (without folder)
router.post("/typebots", async (req, res) => {
  try {
    // Check if typebot with same name exists
    const existingTypebot = await Typebot.findOne({
      name: req.body.name,
      folderId: null,
    });

    if (existingTypebot) {
      return res.status(400).json({
        message: "A typebot with this name already exists",
      });
    }

    const newTypebot = new Typebot({
      name: req.body.name,
      fields: [],
      folderId: null,
    });
    const typebot = await newTypebot.save();
    res.json(typebot);
  } catch (error) {
    console.error("Error creating typebot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update typebot fields
router.put("/typebots/:id/fields", async (req, res) => {
  try {
    // Add validation for req.body.fields
    if (!Array.isArray(req.body.fields)) {
      return res.status(400).json({ message: "Fields must be an array" });
    }

    // Sanitize the fields data
    const sanitizedFields = req.body.fields.map((field) => ({
      id: field.id,
      type: field.type,
      category: field.category,
      content: field.content || "",
      required: Boolean(field.required),
      options: Array.isArray(field.options) ? field.options : [],
      hint: field.hint || "",
      url: field.url || "",
    }));

    const typebot = await Typebot.findById(req.params.id);
    if (!typebot) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Update the fields
    typebot.fields = sanitizedFields;

    // Save with error handling
    try {
      await typebot.save();
      res.json(typebot);
    } catch (saveError) {
      console.error("Save error:", saveError);
      res.status(500).json({
        message: "Error saving form",
        error: saveError.message,
      });
    }
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Delete a typebot
router.delete("/typebots/:id", async (req, res) => {
  try {
    const result = await Typebot.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json({ message: "Form deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update typebot name
router.put("/typebots/:id", async (req, res) => {
  try {
    const typebot = await Typebot.findById(req.params.id);
    if (!typebot) {
      return res.status(404).json({ message: "Form not found" });
    }

    typebot.name = req.body.name;
    await typebot.save();
    res.json(typebot);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Submit form response
router.post("/typebots/:id/responses", async (req, res) => {
  try {
    const formResponse = new FormResponse({
      formId: req.params.id,
      responses: req.body.responses,
    });
    await formResponse.save();
    res.json({ message: "Response submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get form stats
router.get("/typebots/:id/stats", async (req, res) => {
  try {
    const responses = await FormResponse.find({ formId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const totalResponses = await FormResponse.countDocuments({
      formId: req.params.id,
    });
    res.json({
      totalResponses,
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
