from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import re

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

_tokenizer = None
_model = None
_model_device = None  # keep track of model device

# -------------------------------
# Load model
# -------------------------------
def load_model():
    global _tokenizer, _model, _model_device

    if _model is None:
        print("Loading TinyLlama model...", flush=True)

        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            device_map="auto",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )
        _model.eval()
        _model_device = next(_model.parameters()).device

    return _tokenizer, _model, _model_device

# -------------------------------
# Detect user intent
# -------------------------------
THERATRACK_KEYWORDS = [
    "theratrack", "how to use theratrack", "theratrack doubt",
    "trouble with theratrack", "theratrack question"
]

HEALTH_KEYWORDS = [
    "posture", "back pain", "neck pain", "exercise",
    "stretch", "ergonomics", "therapy", "rehab", "pain"
]

def is_theratrack_question(user_message):
    msg = user_message.lower()
    return any(keyword in msg for keyword in THERATRACK_KEYWORDS)

def is_health_question(user_message):
    msg = user_message.lower()
    return any(keyword in msg for keyword in HEALTH_KEYWORDS)

# -------------------------------
# Theratrack step-by-step guidance
# -------------------------------
def get_theratrack_help(user_message):
    return (
        "It looks like you have a doubt about using Theratrack. Here's how you can use it:\n\n"
        "1. **Sign up:** If you don’t have an account, create one first.\n"
        "2. **Log in:** Use your credentials to access your dashboard.\n"
        "3. **About Page:** If you want to know more about the system, visit the 'About' page.\n"
        "4. **Start Tracking Posture:** Click 'Start Exercises' to begin.\n"
        "   - Select the exercise you want to do.\n"
        "   - Watch the demonstration video.\n"
        "   - Start the camera to track your posture live.\n"
        "   - Reps will be counted automatically with time duration.\n"
        "5. **Visual Reports:** After completing exercises, a visual report will be generated.\n"
        "   - The report includes a therapy plan.\n"
        "   - You can download the report as a PDF.\n"
        "6. **Profile Page:** Visit your profile to see the history of all your reports and progress.\n\n"
        "7. **Need Help?:** If you encounter any issues, please visit the 'Contact' page to reach support.\n\n"
        "Feel free to ask me specific questions about any of these steps!"
    )

# -------------------------------
# Health posture advice
# -------------------------------
def get_health_advice(user_message):
    return (
        "For good posture and health:\n"
        "- Stand and sit upright with your back straight.\n"
        "- Keep your shoulders relaxed.\n"
        "- Feet should be flat on the floor.\n"
        "- Take short breaks to stretch if sitting for long periods.\n"
        "- Exercise regularly to strengthen your back and core muscles."
    )

# -------------------------------
# Generate TheraBot response
# -------------------------------
def generate_response(user_message, conversation_history=None):
    tokenizer, model, device = load_model()

    # -------------------------------
    # System instructions
    # -------------------------------
    system_prompt = (
        "You are TheraBot, a friendly assistant.\n"
        "- Answer the user's questions directly.\n"
        "- Only give health/posture advice if asked.\n"
        "- Give clear guidance if the user has doubts about using Theratrack.\n"
        "- Avoid asking questions back unless clarification is requested.\n\n"
    )

    # -------------------------------
    # Build prompt with recent conversation
    # -------------------------------
    prompt = system_prompt
    if conversation_history:
        for msg in conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "TheraBot"
            prompt += f"{role}: {msg['content']}\n"
    prompt += f"User: {user_message}\nTheraBot:"

    # -------------------------------
    # Tokenize and generate
    # -------------------------------
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=150,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.15,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id
        )
    decoded = tokenizer.decode(output[0], skip_special_tokens=True)
    match = re.search(r"TheraBot:(.*?)(?:User:|Assistant:|$)", decoded, re.DOTALL)
    response = match.group(1).strip() if match else decoded.strip()

    # -------------------------------
    # Override response if intent matches
    # -------------------------------
    if is_theratrack_question(user_message):
        response = get_theratrack_help(user_message)
    elif is_health_question(user_message):
        response = get_health_advice(user_message)

    return response
