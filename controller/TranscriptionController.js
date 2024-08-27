const ImportAudioNote = require("../model/ImportAudioNote");
const Transcription = require("../model/Transcription");

exports.createTranscription = async (req, res) => {
  const { audio_url, text, projectName } = req.body;
  let userId = req.user;
  try {
    const newTranscription = await Transcription.create({
      user: userId,
      text: text,
      audio_url,
      projectName,
    });

    res.status(201).json({
      message: "Transcription created successfully",
      transcription: newTranscription,
    });
  } catch (error) {
    console.error("Error creating transcription:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTranscription = async (req, res) => {
  const { id } = req.params;
  try {
    const transcription = await Transcription.findById(id).populate("user");
    if (!transcription) {
      return res.status(400).json({ message: "Transcription not found" });
    }
    const notes = await ImportAudioNote.find({
      transcription: id,
    }).populate("transcription");
    res.status(200).json({
      success: true,
      transcription,
      notes,
    });
  } catch (error) {
    console.error("Error fetching transcription:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTranscriptionsByUser = async (req, res) => {
  let userId = req.user;
  try {
    const transcriptions = await Transcription.find({ user: userId });
    res.status(200).json({
      success: true,
      transcriptions,
    });
  } catch (error) {
    console.error("Error fetching transcriptions by user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTranscription = async (req, res) => {
  const { id } = req.params;
  const { text, audio_url, projectName } = req.body;

  try {
    const transcription = await Transcription.findById(id);

    if (!transcription) {
      return res.status(400).json({ message: "Transcription not found" });
    }

    if (text) transcription.text = text;
    if (audio_url) transcription.audio_url = audio_url;
    if (projectName) transcription.projectName = projectName;

    await transcription.save();

    res.status(200).json({
      message: "Transcription updated successfully",
      transcription,
    });
  } catch (error) {
    console.error("Error updating transcription:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTranscription = async (req, res) => {
  const { id } = req.params;

  try {
    const transcription = await Transcription.findById(id);

    if (!transcription) {
      return res.status(400).json({ message: "Transcription not found" });
    }
    await Transcription.findByIdAndDelete(id);
    res.status(200).json({ message: "Transcription deleted successfully" });
  } catch (error) {
    console.error("Error deleting transcription:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createNote = async (req, res) => {
  const { note, transcription } = req.body;
  try {
    const newNote = await ImportAudioNote.create({
      note,
      transcription,
    });
    res.status(201).json({
      message: "Note created successfully",
      note: newNote,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllNotes = async (req, res) => {
  const { transcriptionId } = req.params;
  try {
    const notes = await ImportAudioNote.find({
      transcription: transcriptionId,
    }).populate("transcription");
    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a note by ID
exports.updateNote = async (req, res) => {
  const { id } = req.params;
  const { note, transcription } = req.body;

  try {
    const existingNote = await ImportAudioNote.findById(id);
    if (!existingNote) {
      return res.status(400).json({ message: "Note not found" });
    }

    if (note) existingNote.note = note;
    if (transcription) existingNote.transcription = transcription;

    await existingNote.save();

    res.status(200).json({
      message: "Note updated successfully",
      note: existingNote,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a note by ID
exports.deleteNote = async (req, res) => {
  const { id } = req.params;
  try {
    const existingNote = await ImportAudioNote.findById(id);
    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    await ImportAudioNote.findByIdAndDelete(id);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Server error" });
  }
};
