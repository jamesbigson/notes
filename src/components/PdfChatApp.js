// import React, { useState, useRef } from "react";
// import axios from "axios";
// import "../styles/PdfChatApp.css";

// function PdfChatApp() {
//   const [file, setFile] = useState();
//   const [uploading, setUploading] = useState(false);
//   const [uploaded, setUploaded] = useState(false);
//   const [question, setQuestion] = useState("");
//   const [chatHistory, setChatHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const fileInputRef = useRef(null); // ✅ safer than document.getElementById

//   // Handle file upload
//   const handleUpload = async () => {
//     if (!file) return alert("Please select a PDF first!");
//     setUploading(true);

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const res = await axios.post(
//         "http://127.0.0.1:8000/upload_pdf/",
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );
//       alert("✅ PDF uploaded successfully!");
//       setUploaded(true);
//     } catch (err) {
//       console.error(err);
//       alert("❌ Upload failed. Please check backend connection.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   // Ask question about uploaded PDF
//   const handleAsk = async () => {
//     if (!question.trim()) return;
//     setLoading(true);

//     try {
//       const res = await axios.post("http://127.0.0.1:8000/ask_question/", {
//         query: question,
//       });
//       setChatHistory((prev) => [
//         ...prev,
//         { question, answer: res.data.answer },
//       ]);
//       setQuestion("");
//     } catch (err) {
//       console.error(err);
//       setChatHistory((prev) => [
//         ...prev,
//         { question, answer: "Error connecting to backend." },
//       ]);
//       setQuestion("");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clear chat
//   const handleClear = () => {
//     setChatHistory([]);
//     setQuestion("");
//   };

//   const handleAddNewFile = async () => {
//     try {
//       await axios.post("http://127.0.0.1:8000/reset_db/");
//     } catch (err) {
//       console.error("Failed to reset DB:", err);
//     }

//     setFile(null);
//     setUploaded(false);
//     setChatHistory([]);
//     setQuestion("");

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }

//     // Optional: refresh the page
//     window.location.reload();
//   };

//   return (
//     <div className="pdf-chat-root">
//       <div className="pdf-card">
//         <h2 className="pdf-title">📄 PDF Chat Assistant</h2>

//         {!uploaded ? (
//           <div className="upload-area">
//             <input
//               ref={fileInputRef}
//               className="file-input"
//               type="file"
//               accept="application/pdf"
//               onChange={(e) => setFile(e.target.files[0])}
//             />

//             <label
//               className="file-choose"
//               htmlFor="file-input-legacy"
//               onClick={() =>
//                 fileInputRef.current && fileInputRef.current.click()
//               }
//             >
//               Choose PDF
//             </label>

//             <div className="file-name">
//               {file ? file.name : "No file selected"}
//             </div>

//             <div className="actions">
//               <button
//                 className="btn primary"
//                 onClick={handleUpload}
//                 disabled={uploading}
//               >
//                 {uploading ? "Uploading..." : "Upload PDF"}
//               </button>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="chat-area">
//               <textarea
//                 className="pdf-input"
//                 rows="3"
//                 value={question}
//                 onChange={(e) => setQuestion(e.target.value)}
//                 placeholder="Ask something about your uploaded PDF..."
//               />

//               <div className="actions" style={{ justifyContent: "flex-start" }}>
//                 <button
//                   className="btn primary"
//                   onClick={handleAsk}
//                   disabled={loading}
//                 >
//                   {loading ? "Thinking..." : "Ask"}
//                 </button>
//                 <button className="btn ghost" onClick={handleClear}>
//                   Clear Chat
//                 </button>
//                 {/* <button className="btn ghost" onClick={handleAddNewFile}>
//                   Add New File
//                 </button> */}
//               </div>

//               <div className="chat-list">
//                 {chatHistory.length === 0 ? (
//                   <p className="muted">No questions yet.</p>
//                 ) : (
//                   chatHistory.map((chat, index) => (
//                     <div className="chat-bubble" key={index}>
//                       <div className="chat-q">
//                         <strong>Qns:</strong> {chat.question}
//                       </div>
//                       <div className="chat-a">
//                         <strong>Ans:</strong> {chat.answer}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default PdfChatApp;

import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/PdfChatApp.css";

function PdfChatApp() {
  const [file, setFile] = useState();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [mcqs, setMcqs] = useState([]); // ✅ store generated MCQs
  const [showQA, setShowQA] = useState(true); // control visibility of Q/A sections
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Upload PDF
  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF first!");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://127.0.0.1:8000/upload_pdf/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ PDF uploaded successfully!");
      setUploaded(true);
    } catch (err) {
      console.error(err);
      alert("❌ Upload failed. Please check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  // Ask a question
  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    // hide Q/A sections while processing
    setShowQA(false);
    try {
      const res = await axios.post("http://127.0.0.1:8000/ask_question/", {
        query: question,
      });
      setChatHistory((prev) => [
        ...prev,
        { question, answer: res.data.answer },
      ]);
      setQuestion("");
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { question, answer: "Error connecting to backend." },
      ]);
    } finally {
      setLoading(false);
      // show Q/A sections again after response
      setShowQA(true);
    }
  };

  // Clear chat
  const handleClear = () => {
    setChatHistory([]);
    setQuestion("");
    setMcqs([]); // ✅ also clear MCQs
  };

  // Add new file (reset)
  const handleAddNewFile = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/reset_db/");
    } catch (err) {
      console.error("Failed to reset DB:", err);
    }
    setFile(null);
    setUploaded(false);
    setChatHistory([]);
    setMcqs([]);
    setQuestion("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.location.reload();
  };

  // ✅ Generate MCQs from document
  const handleGenerateQuestions = async () => {
    setLoading(true);
    setShowQA(false);
    try {
      const res = await axios.post("http://127.0.0.1:8000/generate_questions/");
      let data = res.data.mcqs;

      // Try parsing JSON if it's a string
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          console.error("Invalid JSON from backend.");
          data = [];
        }
      }

      setMcqs(data);
    } catch (err) {
      console.error(err);
      alert("❌ Error generating MCQs.");
    } finally {
      setLoading(false);
      setShowQA(true);
    }
  };

  // ✅ Handle answer selection
  const handleSelectOption = (qIndex, option) => {
    setMcqs((prevMcqs) =>
      prevMcqs.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              selected: option,
              correct: option === q.answer,
            }
          : q
      )
    );
  };

  return (
    <div className="pdf-chat-root">
      <div className="pdf-card">
        <h2 className="pdf-title">📄 PDF Chat Assistant</h2>

        {!uploaded ? (
          <div className="upload-area">
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label
              className="file-choose"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
            >
              Choose PDF
            </label>
            <div className="file-name">
              {file ? file.name : "No file selected"}
            </div>
            <div className="actions">
              <button
                className="btn primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-area">
              <textarea
                className="pdf-input"
                rows="3"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask something about your uploaded PDF..."
              />

              <div className="actions">
                <button
                  className="btn primary"
                  onClick={handleAsk}
                  disabled={loading}
                >
                  {loading ? "Thinking..." : "Ask"}
                </button>
                <button className="btn ghost" onClick={handleClear}>
                  Clear Chat
                </button>
                {/* <button className="btn ghost" onClick={handleAddNewFile}>
                  Add New File
                </button> */}
                {/* <button
                  className="btn primary"
                  onClick={handleGenerateQuestions}
                >
                  Ask Questions
                </button> */}
              </div>

              {/* Chat History */}
              <div className={`chat-list ${!showQA ? "hidden" : ""}`}>
                {chatHistory.map((chat, i) => (
                  <div className="chat-bubble" key={i}>
                    <strong>Q:</strong> {chat.question}
                    <br />
                    <strong>A:</strong> {chat.answer}
                  </div>
                ))}
              </div>

              {/* MCQs */}
              <div className={`mcq-list ${!showQA ? "hidden" : ""}`}>
                {mcqs.length > 0 && (
                  <div className="mcq-block">
                    <h3>🧠 Generated MCQs</h3>
                    {mcqs.map((q, index) => (
                      <div className="mcq-item" key={index}>
                        <p className="mcq-question">
                          {index + 1}. {q.question}
                        </p>
                        {q.options?.map((opt, i) => (
                          <div key={i} className="mcq-option">
                            <label>
                              <input
                                type="radio"
                                name={`q-${index}`}
                                value={opt}
                                checked={q.selected === opt}
                                onChange={() => handleSelectOption(index, opt)}
                              />{" "}
                              {opt}
                            </label>
                          </div>
                        ))}
                        {q.selected && (
                          <p
                            className={`mcq-result ${
                              q.correct ? "correct" : "wrong"
                            }`}
                          >
                            {q.correct
                              ? "✅ Correct!"
                              : `❌ Wrong! Correct answer: ${q.answer}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PdfChatApp;
