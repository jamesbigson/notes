
import React, { useState, useRef } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Summarizer.css";
import GeminiResponse from "./GeminiResponse";

export default function UploadBox() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);

  // 📷 Start camera
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Unable to access camera. Please allow permission.");
    }
  };


  const handleCaptureImage = async () => {
  if (!videoRef.current) return;
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  // Draw the current frame to canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to blob and send to backend
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    setLoading(true);

    // 🧹 Immediately stop camera once image is captured
    stopCamera();

    try {
      const res = await axios.post("http://127.0.0.1:5001/capture-text", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });

      // ✅ Show extracted text after processing
      setExtractedText(res.data.text || "No text detected");
    } catch (err) {
      console.error("Error:", err?.response?.data || err.message);
      alert("Error capturing live image. Check backend logs.");
    } finally {
      setLoading(false);
    }
  }, "image/jpeg");
};


  const stopCamera = () => {
  if (videoRef.current && videoRef.current.srcObject) {
    const stream = videoRef.current.srcObject;
    stream.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }
  setShowCamera(false);
};



  // 🖼️ File upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);

  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an image!");
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://127.0.0.1:5001/capture-text", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });
      setExtractedText(res.data.text || "No text detected");

   
      console.log(setExtractedText);
    } catch (err) {
      console.error("Error:", err?.response?.data || err.message);
      alert("Error processing image. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  // 🔊 Speech
  const detectLanguage = (text) => {
    const tamilRegex = /[\u0B80-\u0BFF]/;
    return tamilRegex.test(text) ? "ta" : "en";
  };


  const stopSpeech = () => {
    const synth = speechSynthesisRef.current;
    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (langParam) => {
  const synth = speechSynthesisRef.current;
  if (!extractedText) return;
  if (synth.speaking) synth.cancel();

  // Use selected or passed language
  const lang = langParam || selectedLanguage;
  let textToSpeak = extractedText;

  // Clean up unwanted characters
  if (lang === "ta") {
    textToSpeak = textToSpeak.replace(/[A-Za-z0-9.,!?;:"'(){}[\]]+/g, "");
  } else {
    textToSpeak = textToSpeak.replace(/[\*\-,—]/g, "");
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak.trim());
  utterance.lang = lang === "ta" ? "ta-IN" : "en-US";
  utterance.rate = 1.2;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onend = () => setIsSpeaking(false);
  setIsSpeaking(true);
  synth.speak(utterance);
};


const handleSpeakLanguage = (lang) => {
  setSelectedLanguage(lang);

  // Wait a moment for state to update, then speak
  setTimeout(() => {
    speakText(lang);
  }, 100);
};


  React.useEffect(() => {
  return () => stopCamera();
}, []);


  return (
    <>
      {/* Upload Section */}
      <div className="container summarizer-container">
        <div className="row w-100 mb-4">
          <div className="col-lg-10 mx-auto">
            <div className="summarizer-card">
              <div className="summarizer-top">
                <div>
                  <div className="summarizer-title">🧠 AI Image Learning</div>
                  <div className="summarizer-sub">
                    Upload or capture your handwritten note to extract and explain its content.
                  </div>
                </div>

                <div className="file-row">
                  <button
                    className="summarize-btn"
                    onClick={showCamera ? stopCamera : startCamera}
                    disabled={loading}
                  >
                    {showCamera ? "❌ Close Camera" : "🎥 Open Camera"}
                  </button>

                  <input
                    type="file"
                    id="document"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button className="summarize-btn" onClick={handleUpload} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      "Upload & Explain"
                    )}
                  </button>
                </div>
              </div>

              {/* Camera View */}
              {showCamera && (
                <div className="camera-container mt-3">
                  <video ref={videoRef} autoPlay playsInline className="camera-preview" />
                  <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

                  {/* 📸 Capture Button */}
                  <div className="capture-btn-container mt-3">
                    <button
                      className="summarize-btn capture-btn"
                      onClick={handleCaptureImage}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "📸 Capture Image"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Text Section */}
      <div className="row w-1200 mt-0">
        <div className="col-lg-10 mx-auto">
          {extractedText && (
            <div className="summary-card">
              <div className="summary-heading">
                <span className="pin-icon">📄</span>
                Extracted Text
              </div>

              <GeminiResponse text={extractedText} />

              <div className="divider" />

              {/* Speech Controls */}
              <div className="speech-mode">
                <div>Choose Speech Mode</div>
                {/* <div className="d-flex gap-3 mt-3">
                  <button
                    className={`pill-btn ${selectedLanguage === "en" ? "" : "inactive"}`}
                    onClick={() => setSelectedLanguage("en")}
                  >
                    Speak English Content
                  </button>
                  <button
                    className={`pill-btn ${selectedLanguage === "ta" ? "" : "inactive"}`}
                    onClick={() => setSelectedLanguage("ta")}
                  >
                    Speak Tamil Content
                  </button> 
                </div> */}

                <div className="d-flex gap-3 mt-3">
  <button
    className={`pill-btn ${selectedLanguage === "en" ? "" : "inactive"}`}
    onClick={() => handleSpeakLanguage("en")}
  >
    Speak English Content
  </button>

  <button
    className={`pill-btn ${selectedLanguage === "ta" ? "" : "inactive"}`}
    onClick={() => handleSpeakLanguage("ta")}
  >
    Speak Tamil Content
  </button>
</div>


                <div className="control-row">
                  <button className="btn-start" onClick={speakText}>
                    🔊 Start
                  </button>
                  <button className="btn-stop" onClick={stopSpeech}>
                    ⏹ Stop
                  </button>
                </div>
             
             
             
             
             
             
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
