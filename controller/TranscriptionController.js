const Transcription = require("../model/Transcription");

exports.createTranscription = async (req, res) => {
  const { audio_url, text } = req.body;
  let userId = req.params.id;
  try {
    const newTranscription = await Transcription.create({
      user: userId,
      text: text,
      audio_url,
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
    res.status(200).json({
      success: true,
      transcription,
    });
  } catch (error) {
    console.error("Error fetching transcription:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTranscriptionsByUser = async (req, res) => {
  let userId = req.params.id;
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
  const { text, audio_url } = req.body;

  try {
    const transcription = await Transcription.findById(id);

    if (!transcription) {
      return res.status(400).json({ message: "Transcription not found" });
    }

    if (text) transcription.text = text;
    if (audio_url) transcription.audio_url = audio_url;

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
