import { useState, useCallback, useRef } from "react";
import uploadService from "../../../services/uploadService";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ACCEPT_ATTR = ".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,.gif,image/*";

export const useUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [ocrRunning, setOcrRunning] = useState(false);

  // Keep a ref to the extract function so handleFilePick can call it
  const extractRef = useRef(null);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError("");
    setResult(null);
    setEditedText("");
    setOcrRunning(false);
  }, []);

  const _runOCR = useCallback(async (base64, mimeType) => {
    setOcrRunning(true);
    try {
      if (!window.Tesseract)
        throw new Error(
          "OCR library not available. Please type the text manually.",
        );
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const r = await window.Tesseract.recognize(dataUrl, "eng");
      const text = r.data.text.trim();
      if (!text) throw new Error("No text detected. Please type manually.");
      return text;
    } finally {
      setOcrRunning(false);
    }
  }, []);

  // Extract is defined with useCallback and stored in ref so it's callable from handleFilePick
  const extract = useCallback(
    async (pickedFile) => {
      const target = pickedFile || null;
      if (!target) return;

      setUploading(true);
      setError("");
      try {
        const res = await uploadService.extractText(target);
        const data = res.data;

        if (data.requiresClientOCR) {
          try {
            const ocrText = await _runOCR(data.imageBase64, data.mimeType);
            const sentences = ocrText
              .split(/(?<=[.!?])\s+/)
              .map((s) => s.trim())
              .filter(Boolean);
            const wordCount = ocrText.split(/\s+/).filter(Boolean).length;
            setResult({
              type: "text",
              text: ocrText,
              sentences,
              wordCount,
              fileName: data.fileName,
            });
            setEditedText(ocrText);
          } catch (ocrErr) {
            setResult({
              type: "image_manual",
              imageBase64: data.imageBase64,
              mimeType: data.mimeType,
              fileName: data.fileName,
              sentences: [],
              wordCount: 0,
            });
            setEditedText("");
            setError(ocrErr.message);
          }
        } else {
          setResult(data);
          setEditedText(data.text || "");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Extraction failed. Please try again.",
        );
      } finally {
        setUploading(false);
      }
    },
    [_runOCR],
  );

  // Auto-extract immediately when a file is picked
  const handleFilePick = useCallback(
    (picked) => {
      if (!picked) return;
      if (!ACCEPTED_TYPES.includes(picked.type)) {
        setError(
          "Unsupported file type. Please upload PDF, DOCX, TXT or an image.",
        );
        return;
      }
      setError("");
      setResult(null);
      setEditedText("");
      setFile(picked);
      setPreview(
        picked.type.startsWith("image/") ? URL.createObjectURL(picked) : null,
      );

      // Auto-extract immediately — no manual button needed
      extract(picked);
    },
    [extract],
  );

  const finaliseText = useCallback(() => {
    const text = editedText.trim();
    if (!text) return null;
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return {
      title: result?.fileName?.replace(/\.[^.]+$/, "") || "Uploaded Passage",
      text,
      sentences: sentences.length > 0 ? sentences : [text],
      wordCount,
      level: "beginner",
      _id: `upload_${Date.now()}`,
      isUploaded: true,
    };
  }, [editedText, result]);

  return {
    file,
    preview,
    uploading,
    error,
    result,
    editedText,
    ocrRunning,
    acceptAttr: ACCEPT_ATTR,
    setEditedText,
    handleFilePick,
    extract,
    finaliseText,
    reset,
    hasResult: !!result,
    canProceed: editedText.trim().length > 5,
    isProcessing: uploading || ocrRunning,
  };
};
