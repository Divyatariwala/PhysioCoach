from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import re

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
_tokenizer = None
_model = None
_device = None

def load_model():
    global _tokenizer, _model, _model_device, _system_ids

    if _model is None:
        print("Loading TinyLlama model...", flush=True)

        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            device_map="auto",
            dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )
        _model.eval()
        _model_device = next(_model.parameters()).device

        # Optional: pre-tokenize system prompt
        system_prompt = """
You are TheraBot, a friendly and professional health assistant specializing in posture, exercises, and Theratrack guidance. 

Your rules:

1. ALWAYS provide clear, direct, and actionable answers to user questions.
2. NEVER ask questions back to the user under any circumstances.
3. ONLY give health, posture, exercise, or Theratrack guidance when relevant.
4. For questions about Theratrack usage:
   - Explain step-by-step instructions if needed.
   - Give the recommended frequency for using Theratrack.
5. For questions about exercises or general health:
   - Provide the optimal exercise frequency and type.
   - Include posture, stretching, and ergonomic advice when relevant.
6. For anything outside of these topics:
   - Give helpful, friendly responses without asking questions.
7. Always assume the user wants concise, practical answers.
8. Never generate vague or generic responses like “It depends” or “You should consult a professional.”
9. Your tone is friendly, professional, and encouraging, but always informative.
10. If a user asks something you don’t know, respond with:
    - “I’m here to help with posture, exercises, and Theratrack guidance. Could you ask about one of these topics?”

Instructions to follow in conversation:

- Include any numbers, reps, duration, or frequency when relevant.
- Include step-by-step instructions if applicable.
- NEVER suggest the user do something without telling them how.
- Do not say “How can I help you?” or similar phrases.
"""
        _system_ids = _tokenizer(system_prompt, return_tensors="pt").input_ids.to(_model_device)

    return _tokenizer, _model, _model_device, _system_ids

# Call this when Django starts
load_model()

# -------------------------------
# Generate response from LLM
# -------------------------------
def generate_response(user_message, conversation_history=None):
    tokenizer, model, device, system_ids = load_model()

    # Start with system prompt
    input_ids = system_ids.clone()

    # Include last 1–2 conversation turns for context
    if conversation_history:
        for msg in conversation_history[-2:]:
            role = "User" if msg["role"] == "user" else "TheraBot"
            text = f"{role}: {msg['content']}\n"
            ids = tokenizer(text, return_tensors="pt").input_ids.to(device)
            input_ids = torch.cat([input_ids, ids], dim=-1)

    # Append current user message
    user_ids = tokenizer(f"User: {user_message}\nTheraBot:", return_tensors="pt").input_ids.to(device)
    input_ids = torch.cat([input_ids, user_ids], dim=-1)

    # Generate response from model
    with torch.no_grad():
        output = model.generate(
            input_ids,
            max_new_tokens=150,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)
    # Extract only TheraBot's reply
    match = re.search(r"TheraBot:(.*?)(?:User:|$)", decoded, re.DOTALL)
    response = match.group(1).strip() if match else decoded.strip()

    return response

# -------------------------------
# Example usage
# -------------------------------
if __name__ == "__main__":
    conversation_history = []
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        reply = generate_response(user_input, conversation_history)
        print(f"TheraBot: {reply}\n")
        # Save conversation history
        conversation_history.append({"role": "user", "content": user_input})
        conversation_history.append({"role": "bot", "content": reply})