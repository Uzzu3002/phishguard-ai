import aiProvider from '../services/aiProvider.js';

export const handleChat = async (req, res) => {
  try {
    const { message, scanContext } = req.body;
    
    if (!message || !scanContext) {
      return res.status(400).json({ success: false, message: "Missing message or scanContext" });
    }

    const reply = await aiProvider.chat(message, scanContext);

    res.json({ reply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ success: false, message: "Failed to process chat query" });
  }
};
