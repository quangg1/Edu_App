from google import genai
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from a .env file if present

def get_gemini_client() -> genai.Client:
    """
    Create a Gemini client using the GEMINI_API_KEY environment variable.
    Raise a RuntimeError if the key is missing to fail fast.
    Returns:
        genai.Client: Configured Gemini client.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("Missing environment variable GEMINI_API_KEY")
    return genai.Client(api_key=api_key)
