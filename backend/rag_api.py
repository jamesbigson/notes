# from fastapi import FastAPI, UploadFile, Form
# from fastapi.middleware.cors import CORSMiddleware
# import shutil, os,time
# from pydantic import BaseModel

# from rag_core import setup_rag_pipeline, ask_question

# app = FastAPI(title="RAG API", description="Ask questions from uploaded PDFs", version="1.0")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# PDF_PATH = "uploaded.pdf"
# collection = None
# embedding_model = None

# # Define the request model (matches frontend JSON)
# class QuestionRequest(BaseModel):
#     query: str



# @app.post("/upload_pdf/")
# async def upload_pdf(file: UploadFile):
#     """Upload and process a PDF."""
#     global collection, embedding_model
#     with open(PDF_PATH, "wb") as f:
#         f.write(await file.read())
#     try:
#         if collection and hasattr(collection, "_client"):
#             collection._client._db.reset()  # closes SQLite/FAISS connections
#             print("🧹 Closed old Chroma connection.")
#     except Exception as e:
#         print("⚠️ Could not fully close Chroma:", e)

#     # --- Safe delete of old DB ---
#     db_path = "./rag_chroma_db"
#     if os.path.exists(db_path):
#         for attempt in range(10):
#             try:
#                 shutil.rmtree(db_path)
#                 print(f"✅ Deleted old DB (attempt {attempt + 1})")
#                 break
#             except PermissionError as e:
#                 print(f"⚠️ DB locked (attempt {attempt + 1}), retrying...")
#                 time.sleep(1)
#         else:
#             print("⚠️ Could not fully delete DB, continuing with existing folder.")


#     if os.path.exists("./rag_chroma_db"):
#         shutil.rmtree("./rag_chroma_db")

#     collection, embedding_model = setup_rag_pipeline(PDF_PATH)
#     return {"message": "PDF uploaded and processed successfully"}


# # Define the /ask_question/ endpoint
# @app.post("/ask_question/")
# async def ask_question_api(request: QuestionRequest):
#     question = request.query
#     global collection, embedding_model
#     if not collection or not embedding_model:
#                 return {"error": "Please upload a PDF first"}

#     answer = ask_question(question, collection, embedding_model)
#     return {"answer": answer}



# @app.post("/reset_db/")
# async def reset_db():
#     global collection, embedding_model
#     try:
#         if collection and hasattr(collection, "_client"):
#             collection._client._db.reset()  # close SQLite/FAISS connections
#         db_path = "./rag_chroma_db"
#         if os.path.exists(db_path):
#             shutil.rmtree(db_path)
#         collection, embedding_model = None, None
#         return {"message": "Chroma DB reset successfully."}
#     except Exception as e:
#         return {"error": f"Failed to reset DB: {e}"}



from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os,time
from pydantic import BaseModel

from rag_core import setup_rag_pipeline, ask_question

app = FastAPI(title="RAG API", description="Ask questions from uploaded PDFs", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PDF_PATH = "uploaded.pdf"
collection = None
embedding_model = None
chroma_client = None

# Define the request model (matches frontend JSON)
class QuestionRequest(BaseModel):
    query: str



@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile):
    """Upload and process a PDF."""
    global collection, embedding_model
    with open(PDF_PATH, "wb") as f:
        f.write(await file.read())
    # Try to cleanly shutdown any existing Chroma client to release file locks.
    try:
        global chroma_client
        if chroma_client is not None:
            # Try the public shutdown/persist APIs if available
            try:
                if hasattr(chroma_client, "shutdown"):
                    chroma_client.shutdown()
                    print("🧹 chroma_client.shutdown() called")
            except Exception:
                pass
            try:
                if hasattr(chroma_client, "persist"):
                    chroma_client.persist()
                    print("🧹 chroma_client.persist() called")
            except Exception:
                pass
            try:
                if hasattr(chroma_client, "close"):
                    chroma_client.close()
                    print("🧹 chroma_client.close() called")
            except Exception:
                pass
            chroma_client = None

        # Fallback: attempt to reset internals if collection exposes them
        if collection and hasattr(collection, "_client"):
            try:
                client = collection._client
                if hasattr(client, "_db") and hasattr(client._db, "reset"):
                    client._db.reset()
                    print("🧹 collection._client._db.reset() called")
            except Exception:
                pass
    except Exception as e:
        print("⚠ Could not fully close Chroma:", e)

    # --- Safe delete of old DB ---
    db_path = "./rag_chroma_db"
    if os.path.exists(db_path):
        for attempt in range(10):
            try:
                shutil.rmtree(db_path)
                print(f"✅ Deleted old DB (attempt {attempt + 1})")
                break
            except PermissionError as e:
                print(f"⚠ DB locked (attempt {attempt + 1}), retrying...")
                time.sleep(1)
        else:
            print("⚠ Could not fully delete DB, continuing with existing folder.")


    if os.path.exists("./rag_chroma_db"):
        shutil.rmtree("./rag_chroma_db")

    # Setup RAG and store chroma_client so we can shutdown later
    chroma_client, collection, embedding_model = setup_rag_pipeline(PDF_PATH)
    return {"message": "PDF uploaded and processed successfully"}









# @app.post("/upload_pdf/")
# async def upload_pdf(file: UploadFile):
#     """Upload and process a PDF safely (handles locked Chroma DB files)."""
#     global collection, embedding_model
#     with open(PDF_PATH, "wb") as f:
#         f.write(await file.read())

#     # ---- Safe delete for old RAG DB ----
#     db_path = "./rag_chroma_db"
#     if os.path.exists(db_path):
#         shutil.rmtree(db_path)
#         # for attempt in range(3):
#         #     try:
#         #         shutil.rmtree(db_path)
#         #         print(f"✅ Deleted old DB on attempt {attempt + 1}")
#         #         break
#         #     except PermissionError as e:
#         #         print(f"⚠ DB folder locked (attempt {attempt + 1}), retrying...")
#         #         import time
#         #         time.sleep(1)
#         # else:
#         #     print("⚠ Could not fully delete old DB, will reuse existing directory.")

#     # ---- Setup RAG pipeline ----
#     print("\n🚀 Setting up RAG pipeline...")
#     collection, embedding_model = setup_rag_pipeline(PDF_PATH)
#     print("✅ RAG setup complete.")

#     return {"message": "PDF uploaded and processed successfully"}







# @app.post("/ask_question/")
# async def ask(request: QuestionRequest):
#     """Ask a question about the uploaded PDF."""
#     global collection, embedding_model
#     if not collection or not embedding_model:
#         return {"error": "Please upload a PDF first"}
#     answer = ask_question(question, collection, embedding_model)
#     return {"answer": answer}


# Define the /ask_question/ endpoint
@app.post("/ask_question/")
async def ask_question_api(request: QuestionRequest):
    question = request.query
    global collection, embedding_model
    if not collection or not embedding_model:
                return {"error": "Please upload a PDF first"}

    answer = ask_question(question, collection, embedding_model)
    return {"answer": answer}

    
    # print("Received question:", question)



    # # Example response (replace with your RAG pipeline)
    # answer = f"The backend received your question: '{question}'. Here’s a dummy answer."

    # return {"answer": answer}




@app.post("/reset_db/")
async def reset_db():
    global collection, embedding_model, chroma_client
    try:
        # Try to shutdown chroma_client if present
        if chroma_client is not None:
            try:
                if hasattr(chroma_client, "shutdown"):
                    chroma_client.shutdown()
                elif hasattr(chroma_client, "persist"):
                    chroma_client.persist()
                elif hasattr(chroma_client, "close"):
                    chroma_client.close()
            except Exception:
                pass
            chroma_client = None

        db_path = "./rag_chroma_db"
        if os.path.exists(db_path):
            shutil.rmtree(db_path)
        collection, embedding_model = None, None
        return {"message": "Chroma DB reset successfully."}
    except Exception as e:
        return {"error": f"Failed to reset DB: {e}"}



@app.post("/generate_questions/")
async def generate_questions():
    """Generate MCQs directly from the uploaded PDF content."""
    global collection, embedding_model
    if not collection or not embedding_model:
        return {"error": "Please upload a PDF first."}

    # Retrieve all document chunks from Chroma
    try:
        results = collection.get()
        docs = results.get("documents", [])
        if not docs:
            return {"error": "No content found in the collection."}

        # Combine all text for LLM
        context = "\n---\n".join([d for sub in docs for d in sub])
    except Exception as e:
        return {"error": f"Failed to fetch document content: {e}"}

    from rag_core import get_llm_response

    prompt = f"""
You are an expert question generator.

Use the following context from a document to create *10 multiple-choice questions* (MCQs).
the questions should be technical and relevant to the content.and create standard questions in intermediate level.

Each question should:
- Be clear, concise, and relevant to the text.
- Have 4 choices (A, B, C, D).
- Identify the correct answer.
- Be formatted cleanly in JSON format (no markdown, no symbols).

Output format example:
[
  {{
    "question": "What is the capital of France?",
    "options": ["Paris", "Rome", "Berlin", "Madrid"],
    "answer": "Paris"
  }}
]

Context:
{context}
"""

    try:
        questions_json = get_llm_response(prompt)
        return {"mcqs": questions_json}
    except Exception as e:
        return {"error": f"Failed to generate questions: {e}"}