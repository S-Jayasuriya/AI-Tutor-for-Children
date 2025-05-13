from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from Rag import get_ai_response
from llama import get_llama_response
from Vector import save_vector_from_pdf
from Scrapper import search_youtube_videos
from Scrapper import extract_video_links

from deep_translator import GoogleTranslator
from gtts import gTTS

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins (for development)

@app.route('/qa_chat', methods=['POST'])
def qa_chat():
    try:
        user_question = request.json['keyword']
        chat_history = request.json['chat_history']
        file_id = request.json['file_id']
        print(file_id)

        # Get response from get_ai_response
        ai_response=get_ai_response(file_id, user_question)
        combined_response = ai_response
        # print(combined_response)
        
        return jsonify({'answer': combined_response})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500
@app.route('/llama_chat', methods=['POST'])
def llama_chat():
    try:
        user_question = request.json['keyword']
        chat_history = request.json['chat_history']
        # file_id = request.json['file_id']
        # print(file_id)

        # Get response from get_ai_response
        ai_response=get_llama_response(user_question, chat_history)
        combined_response = ai_response
        # print(combined_response)
        
        return jsonify({'answer': combined_response})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/process-vectors', methods=['POST'])
def get_vectors():
    file_id = request.json['file_id']
    print(file_id)
    results = save_vector_from_pdf(file_id)
    return jsonify({'message': 'Vectors saved successfully'})


@app.route('/search-videos', methods=['POST'])
def search_videos():
    keyword = f"{request.json['keyword']} for Kids"
    results = search_youtube_videos(keyword)
    print(results)
    return jsonify({'youtube_link': results})


@app.route('/extract-videos', methods=['POST'])
def extract_videos():
    keyword = request.json['keyword']
    print(keyword)
    video_links = extract_video_links(keyword)
    print(video_links)
    
    if video_links:
        return jsonify({'video_links': video_links})
    else:
        return jsonify({'error': 'No video links found'}), 404

@app.route('/translate', methods=['POST'])
def translate():
    try:
        # Get the JSON payload from the request
        data = request.json
        text = data.get('text')
        target_language = data.get('target_language')
        source_language = data.get('source_language')

        if not text or not target_language:
            return jsonify({"error": "Missing text or target language"}), 400

        # Use deep-translator's GoogleTranslator for translation
        translated_text = GoogleTranslator(source= source_language, target=target_language).translate(text)

        return jsonify({"translated_text": translated_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/speak', methods=['POST'])
def speak_text():
    data = request.get_json()
    text = data.get('text')
    lang = data.get('lang')
    # print(text,lang)

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Generate speech using gTTS
    tts = gTTS(text=text, lang=lang)
    file_path = "speech.mp3"
    tts.save(file_path)

    # Send the generated speech file
    return send_file(file_path, mimetype='audio/mp3', as_attachment=True, download_name='speech.mp3')


if __name__ == '__main__':
    app.run(debug=True, port=5000)