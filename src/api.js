import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return await axios.post(`${API_URL}/upload_pdf/`, formData);
};

export const askQuestion = async (question) => {
  const formData = new FormData();
  formData.append("question", question);
  return await axios.post(`${API_URL}/ask/`, formData);
};
