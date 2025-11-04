

import os
import shutil
import chromadb
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from openai import OpenAI

# Constants
# EMBEDDING_MODEL_ID = "arvindcreatrix/bge-baes-my-qna-model"
EMBEDDING_MODEL_ID = "arvindcreatrix/bge-baes-my-qna-model"

GENERATOR_MODEL_ID = "llama2"
CHROMA_PATH = "./rag_chroma_db"
COLLECTION_NAME = "rag_collection"
INSTRUCTION_PREFIX = "Represent this sentence for searching relevant passages: "

# ---- Utility: Load + Split PDF ----
def load_and_split_pdf(file_path: str) -> list[str]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF not found: {file_path}")
    reader = PdfReader(file_path)
    text = "\n".join(page.extract_text() for page in reader.pages)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(text)
    print(f"✅ PDF split into {len(chunks)} chunks")
    return chunks

# ---- Core: Setup RAG ----
def setup_rag_pipeline(pdf_path: str):
    print("\n🚀 Setting up RAG pipeline...")
    chunks = load_and_split_pdf(pdf_path)
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_ID)

    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)

    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = chroma_client.get_or_create_collection(COLLECTION_NAME)

    embeddings = embedding_model.encode(chunks, show_progress_bar=False)
    if isinstance(embeddings, np.ndarray):
        embeddings = embeddings.tolist()

    ids = [str(i) for i in range(len(chunks))]
    collection.add(ids=ids, documents=chunks, embeddings=embeddings)



    print("✅ RAG setup complete.")
    # Return the client as well so callers can shutdown/cleanup safely
    return chroma_client, collection, embedding_model

# ---- LLM Integration ----
def get_llm_response(prompt: str) -> str:
    try:
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key="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"
        )
        completion = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct:novita",
            messages=[{"role": "user", "content": prompt}],
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"⚠ LLM Error: {e}")
        return "Error: LLM request failed."

# ---- Question Answering ----
def ask_question(question: str, collection, embedding_model, n_results: int = 3):
    print(f"\n🔍 Question: {question}")
    query_emb = embedding_model.encode([question])[0]
    results = collection.query(query_embeddings=[query_emb], n_results=n_results)

    docs = results.get("documents", [[]])[0]
    if not docs:
        return "No relevant context found."

    context = "\n---\n".join(docs)
    prompt = f"""
Use the following context to answer the question.
If the context doesn't contain the answer, reply based on your own knowledge.
if the answer not present in context try to answer the question from your knowledge completely.
the answer should  to be clearly understand by  the dylexia affected people .
the content should not contain any * and it should be well spaced and content should be correctly formated.
answer in a sentence or a paragraph.

Context:
{context}

Question: {question}
"""
    answer = get_llm_response(prompt)
    return answer
# # uvicorn rag_api:app --reload
