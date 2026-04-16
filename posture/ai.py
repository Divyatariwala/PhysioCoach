import torch
import faiss
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer
from functools import lru_cache

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# ---------------- Global ----------------
_tokenizer = None
_model = None
_device = None
_embedder = None
_index = None
_documents = None

# ---------------- Load Models ----------------
def load_models():
    global _tokenizer, _model, _device, _embedder
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            device_map="auto",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )
        _model.eval()
        _device = next(_model.parameters()).device
        if not torch.cuda.is_available():
            torch.set_num_threads(4)

    if _embedder is None:
        _embedder = SentenceTransformer(
            EMBED_MODEL_NAME,
            device="cuda" if torch.cuda.is_available() else "cpu"
        )
    return _tokenizer, _model, _device, _embedder

# ---------------- Documents ----------------
def load_documents():
    global _documents
    if _documents is None:
        _documents = [
            # Posture tips
            "Sit upright with shoulders relaxed.",
            "Stretch your neck slowly for 15 seconds.",
            "Keep your screen at eye level.",
            "Take breaks every 30 minutes.",
            "Maintain a neutral spine while sitting.",
            "Relax shoulders to avoid tension.",
            "Avoid slouching while working.",
            "Adjust chair height so feet touch the ground.",

            # TheraTrack info
            "TheraTrack is a posture correction system that helps users improve spinal alignment.",
            "To use TheraTrack, log into the app, start a session, and follow posture guidance.",
            "TheraTrack provides real-time feedback to improve posture habits.",
            "Users can track posture reports and progress in the TheraTrack dashboard.",

            # Motivation / exercise hints
            "Motivation helps you maintain healthy posture and exercise routines.",
            "Daily exercise improves posture and overall health.",
            "Pushups, stretches, and yoga can improve strength and posture."
        ]
    return _documents

# ---------------- Build FAISS Index ----------------
def build_index():
    global _index
    if _index is None:
        _, _, _, embedder = load_models()
        docs = load_documents()
        embeddings = np.array(
            embedder.encode(docs, convert_to_numpy=True)
        ).astype("float32")
        dim = embeddings.shape[1]
        _index = faiss.IndexFlatL2(dim)
        _index.add(embeddings)
    return _index

# ---------------- Retrieve Context ----------------
@lru_cache(maxsize=100)
def retrieve_context(query: str) -> str:
    index = build_index()
    docs = load_documents()
    _, _, _, embedder = load_models()
    q = np.array(embedder.encode([query], convert_to_numpy=True)).astype("float32")
    _, idx = index.search(q, 2)
    return " ".join([docs[i] for i in idx[0]])

# ---------------- Clean Output ----------------
def clean_output(decoded, prompt):
    response = decoded.replace(prompt, "").strip()
    stop_tokens = ["User:", "TheraBot:", "Assistant:", "user:", "bot:"]
    for token in stop_tokens:
        if token in response:
            response = response.split(token)[0]
    return response.strip()

# ---------------- Fallback ----------------
def fallback_response(user_message: str) -> str:
    if "neck" in user_message:
        return "Try stretching your neck gently for 15 seconds on each side."
    if "back" in user_message:
        return "Sit upright, keep your spine neutral, and take breaks every 30 minutes."
    return "Maintain good posture and take short breaks during work."

# ---------------- Generate Response ----------------
def generate_response(user_message: str, conversation_history=None) -> str:
    user_lower = user_message.lower().strip()

    # ---------------- Greetings ----------------
    if user_lower in ["hi", "hello", "hey"]:
        return "Hello 👋 How can I help you with your posture today?"
    if "how are you" in user_lower:
        return "I'm doing great 😊 How can I help you today?"

    # ---------------- Load Model ----------------
    tokenizer, model, device, _ = load_models()

    # ---------------- Context ----------------
    context = retrieve_context(user_lower)
    if not context:
        # Default context for non-posture queries
        context = (
            "TheraBot provides posture advice, TheraTrack guidance, exercise suggestions, "
            "motivation messages, and healthy habit tips."
        )

    # ---------------- History ----------------
    history_text = ""
    if conversation_history:
        last_msgs = conversation_history[-2:]  # only last 2 messages
        for msg in last_msgs:
            role = msg.get("role", "User")
            content = msg.get("content", "")
            history_text += f"{role}: {content}\n"

    # ---------------- Prompt ----------------
    prompt = f"""You are TheraBot, a helpful health and posture assistant.

Answer clearly and naturally in complete sentences.

IMPORTANT:
- Do NOT include 'User:' or 'TheraBot:'
- Do NOT truncate answers
- Include tips if relevant

Conversation:
{history_text}

Context:
{context}

User: {user_message}

Answer:
"""

    inputs = tokenizer(prompt, return_tensors="pt").input_ids.to(device)

    # ---------------- Generate ----------------
    with torch.no_grad():
        output = model.generate(
            inputs,
            max_new_tokens=120,  # allow longer responses
            do_sample=True,      # natural, less repetitive
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)
    response = clean_output(decoded, prompt)

    # ---------------- Fallback if empty ----------------
    if not response:
        return fallback_response(user_lower)

    return response

# ---------------- Initialize ----------------
load_models()
build_index()