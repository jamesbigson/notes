
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const OCR_URL = process.env.OCR_API_URL || "http://127.0.0.1:5001/extract-text";
const HF_KEY = process.env.HF_API_KEY;
const TOPIC_MODEL = process.env.TOPIC_MODEL || "joeddav/xlm-roberta-large-xnli";
const EXPLAIN_MODEL = process.env.EXPLAIN_MODEL || "google/flan-t5-large";

if (!HF_KEY) {
  console.warn("Warning: HF_API_KEY not set in .env. Calls to Hugging Face will fail.");
}

async function callOCR(buffer) {
  const form = new FormData();
  form.append("image", buffer, { filename: "image.jpg" });

  const res = await axios.post(OCR_URL, form, { headers: form.getHeaders(), timeout: 120000 });
  // Flask returns { text: "..." } or { extracted_text: "..."}
  return res.data.text || res.data.extracted_text || "";
}

// Zero-shot topic detection using HF Inference API
// candidateLabels is an array of topic labels you want to check
async function detectTopic(text, candidateLabels = null) {
  // default candidate labels — customize to your course subjects
  if (!candidateLabels) {
    candidateLabels = [
      "Physics", "Chemistry", "Biology", "Mathematics", "Computer Science",
      "History", "Geography", "English", "Tamil", "Economics", "Accountancy"
    ];
  }

  const payload = {
    inputs: text,
    parameters: { candidate_labels: candidateLabels, multi_label: false }
  };

  const res = await axios.post(
    `https://api-inference.huggingface.co/models/${TOPIC_MODEL}`,
    payload,
    { headers: { Authorization: `Bearer ${HF_KEY}`, "Content-Type": "application/json" }, timeout: 120000 }
  );

  // Response is an object with "labels" and "scores"
  if (res.data && res.data.labels && res.data.labels.length) {
    return { label: res.data.labels[0], scores: res.data.scores };
  }
  // fallback: pick a keyword-based guess
  return { label: candidateLabels[0], scores: [] };
}

// Ask the explain model to expand the topic
async function expandTopic(topicLabel, extractedText) {
  // Construct a helpful prompt for FLAN-style models
  const prompt = `You are a patient teacher. The student has very short notes: "${extractedText}". The topic appears to be "${topicLabel}". 
Please provide:
1) A clear, structured explanation of the topic (definitions + subtopics).
2) Important formulas/keywords (if applicable).
3) 2 short examples or diagrams explained in words.
4) A 3-question quick quiz with answers.
Write in student-friendly language.`;

  const payload = { inputs: prompt, parameters: { max_new_tokens: 400 } };

  const res = await axios.post(
    `https://api-inference.huggingface.co/models/${EXPLAIN_MODEL}`,
    payload,
    { headers: { Authorization: `Bearer ${HF_KEY}`, "Content-Type": "application/json" }, timeout: 180000 }
  );

  // The HF Inference API can return different shapes: either array with generated_text or text
  let text = "";
  if (Array.isArray(res.data) && res.data[0]?.generated_text) {
    text = res.data[0].generated_text;
  } else if (res.data?.generated_text) {
    text = res.data.generated_text;
  } else if (typeof res.data === "string") {
    text = res.data;
  } else {
    text = JSON.stringify(res.data);
  }

  return text;
}

// Combined pipeline
export async function processImage(buffer) {
  // 1. OCR
  const extractedText = await callOCR(buffer);
  if (!extractedText || extractedText.trim().length === 0) {
    return { extracted_text: "", ai_response: "No text detected from image." };
  }


  return { extracted_text: extractedText};


}
