# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import easyocr
# from PIL import Image
# import io
# import os
# import sys
# import json
# import google.generativeai as genai
# from dotenv import load_dotenv

# # Load environment variables (if any)
# load_dotenv()

# # Configure the API (you may also choose to load the API key from the environment)
# # genai.configure(api_key='AIzaSyB0zxlzaUXGX_En1vCLspnZXFq9waUL4a8') 
# # backuo api

# genai.configure(api_key='AIzaSyB0zxlzaUXGX_En1vCLspnZXFq9waUL4a8')

# # genai.configure(api_key='AIzaSyD4DvfGt1M_gok61Jo3AQELmxZ8QIUGcYw')

# # Generation configuration for the Gemini model
# generation_config = {
#     "temperature": 1,
#     "top_p": 0.95,
#     "top_k": 64,
#     "max_output_tokens": 8192,
#     "response_mime_type": "text/plain",
# }

# # Create the Gemini model with your desired settings
# model = genai.GenerativeModel(
#     model_name="gemini-2.0-flash",
#     generation_config=generation_config,
# )

# app = Flask(__name__)
# CORS(app)  # allow cross-origin requests from React

# # Initialize EasyOCR once
# reader = easyocr.Reader(['en'])

# # @app.route('/extract-text', methods=['POST'])

# @app.route('/extract-text', methods=['POST'])
# def extract_text():
#     if 'image' not in request.files:
#         return jsonify({'error': 'No image uploaded'}), 400

#     image = request.files['image']
#     image_bytes = image.read()
#     img = Image.open(io.BytesIO(image_bytes))

#     # OCR extraction
#     result = reader.readtext(image_bytes, detail=0)
#     text_output = " ".join(result) if result else "No text detected"

#     # Get the summary from the Gemini model
#     summary = summarize_text(text_output)
#     print(summary)

    

#     return jsonify({'text': summary})



# # Function to summarize text using the Gemini API
# def summarize_text(text):
#     chat_session = model.start_chat(
#         history=[
#             {
#                 "role": "user",
#                 "parts": [
   
#            "Explain the following text in a long, detailed, and dyslexia-friendly way for school students. "
#                 "Provide a separate explanation in Tamil first, followed by English. "
#                 "Do not include greetings, intros, or summaries. "
#                 "Focus entirely on the topic and give thorough explanations with examples, step-by-step reasoning, and clear language. "
#                 "Make the content long enough to fill approximately one page. "
#                 "Use simple words, short sentences, and easy formatting suitable for dyslexia-friendly reading. "
#                 "Avoid asterisks, symbols, or any extra distracting elements. "
#                 "Ensure Tamil and English explanations are comprehensive and fully cover the topic."
#                 "Note the appearance of content should   be easy to read by dyslexia people of age 3 to 20 yrs"
#                 "sentences formation need to be simple and clear ,it should be  easy  for  reading and understanding  dyslexia affected people"
#                 "If any resources link is available then provide that also"
#                 "If any youtube resources link is available then provide that also"
                
#    ],},]
 

# )
#     response = chat_session.send_message(text)
#     return response.text
# # def extract_text():
# #     if 'image' not in request.files:
# #         return jsonify({'error': 'No image uploaded'}), 400

# #     image = request.files['image']
# #     image_bytes = image.read()
# #     img = Image.open(io.BytesIO(image_bytes))

# #     # OCR extraction
# #     result = reader.readtext(image_bytes, detail=0)
# #     text_output = " ".join(result) if result else "No text detected"
# #   # Get the summary from the Gemini model
# #     summary = summarize_text(text_output)

# #     # return jsonify({'text': text_output})
# #     return jsonify({'text': summary})

# if __name__ == '__main__':
#     app.run(port=5001)








from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
from PIL import Image
import io
import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables (if any)
load_dotenv()

# Configure the API (you may also choose to load the API key from the environment)
# genai.configure(api_key='AIzaSyB0zxlzaUXGX_En1vCLspnZXFq9waUL4a8') 
# backuo api

genai.configure(api_key='AIzaSyB0zxlzaUXGX_En1vCLspnZXFq9waUL4a8')

# genai.configure(api_key='AIzaSyD4DvfGt1M_gok61Jo3AQELmxZ8QIUGcYw')

# Generation configuration for the Gemini model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Create the Gemini model with your desired settings
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=generation_config,
)

app = Flask(__name__)
CORS(app)  # allow cross-origin requests from React

# Initialize EasyOCR once
reader = easyocr.Reader(['en'])

# @app.route('/extract-text', methods=['POST'])

@app.route('/capture-text', methods=['POST'])
def extract_text():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    image = request.files['image']
    image_bytes = image.read()
    
    # Open with PIL and ensure RGB
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    # Convert PIL Image to NumPy array for EasyOCR
    import numpy as np
    img_np = np.array(img)

    # OCR extraction
    result = reader.readtext(img_np, detail=0)
    text_output = " ".join(result) if result else "No text detected"

    # Get the summary from the Gemini model
    summary = summarize_text(text_output)

    return jsonify({'text': summary})



# Function to summarize text using the Gemini API
def summarize_text(text):
    chat_session = model.start_chat(
        history=[
            {
                "role": "user",
                "parts": [
   
           "Explain the following text in a long, detailed, and dyslexia-friendly way for school students. "
                "Provide a separate explanation in must English first, followed by Tamil. "
                "Do not include greetings, intros, or summaries. "
                "Focus entirely on the topic and give thorough explanations with examples, step-by-step reasoning, and clear language. "
                "Make the content long enough to fill approximately one page. "
                "Use simple words, short sentences, and easy formatting suitable for dyslexia-friendly reading. "
                "Avoid asterisks, symbols, or any extra distracting elements. "
                "Ensure English and Tamil explanations are comprehensive and fully cover the topic."
                "sentences formation need to be simple and clear , it should be  easy  for  reading and understanding  dyslexia affected people"
                "If any resources link is available then provide that also"
                "Note the appearance of content should   be easy to read by dyslexia people of age 3 to 20 yrs"
                "Only text content matched only you give the answer otherwise not give"
                "Not provide paragraph intro only give content only"
                
   ],},]
 

)
    response = chat_session.send_message(text)
    return response.text


if __name__ == '__main__':
    app.run(port=5001)

