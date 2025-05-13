import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function ChatApp({file_id}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [voices, setVoices] = useState([]);
    const [recognition, setRecognition] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audio, setAudio] = useState(null);
    const [translatedTexts, setTranslatedTexts] = useState({});
    const [selectedLanguage, setSelectedLanguage] = useState('en'); // State for selected language


    useEffect(() => {
        // Voice recognition setup
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                const result = event.results[0][0].transcript;
                setInput(result);
                recognitionInstance.stop();
            };

            recognitionInstance.onerror = (event) => {
                console.error('Error occurred in recognition: ', event.error);
            };

            setRecognition(recognitionInstance);
        } else {
            alert('Speech recognition not supported in this browser.');
        }

        // Voices setup
        const handleVoicesChanged = () => {
            setVoices(speechSynthesis.getVoices());
        };

        speechSynthesis.onvoiceschanged = handleVoicesChanged;
        handleVoicesChanged();

        return () => {
            speechSynthesis.onvoiceschanged = null;
        };
    }, [selectedLanguage]);
    // Function to update the language and trigger translation for all messages
        useEffect(() => {
            if (messages.length > 0) {
                messages.forEach((msg, index) => {
                    if (msg.role === 'ai' && !msg.isVideo) {
                        translateMessage(replaceAsterisksWithBold(msg.content), index);
                    }
                });
            }
        }, [selectedLanguage]); // Trigger translation when language or messages change
    

        const speech = async (text) => {
            if (!text) return;
        
            try {
                // If audio is already playing, stop it
                if (audio && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0; // Reset the audio to the beginning
                    setIsSpeaking(false);
                    return;
                }
        
                // Make POST request to Flask backend to synthesize speech using gTTS
                const response = await fetch('http://localhost:5000/speak', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text,
                        lang: selectedLanguage, // Pass selected language
                    }),
                });
        
                if (response.ok) {
                    const data = await response.blob();
                    const audioUrl = URL.createObjectURL(data);
                    const newAudio = new Audio(audioUrl);
                    newAudio.play();
                    setAudio(newAudio); // Store the new Audio object in the state
                    setIsSpeaking(true);
                    newAudio.onended = () => {
                        setIsSpeaking(false); // Reset speaking state when audio ends
                    };
                } else {
                    throw new Error('Error: ' + response.statusText);
                }
            } catch (error) {
                console.error('Error speaking text:', error);
                alert('There was an error processing your request.');
            }
        };

    const sendMessage = async () => {
        if (!input.trim()) return;
    
        const userMessage = { role: 'user', content: input };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setLoading(true);
        // setInput("");
    
        let endpoint = '';
        var keyword = input.split('-')[1]; // Extract keyword after the first dash
        console.log(keyword);
    
        if (input.startsWith("video-") ) {
            endpoint = 'http://localhost:5000/extract-videos';
        } else if (input.startsWith("youtube-")) {
            endpoint = 'http://localhost:5000/search-videos';
        } else {
            endpoint = 'http://localhost:5000/qa_chat';
            if (selectedLanguage!=='en')
                {
                    var translated = await translateText(input,selectedLanguage,"en");
                    console.log("Input :",input);
                    console.log("Translated :",translated);
                    keyword = translated;
                }
                else {
                    console.log(input);
                    keyword = input;
                }
        }
        // Prepare the chat history for the request
        const chatHistory = messages.map(msg => ({ role: msg.role, content: msg.content }));
        console.log(file_id.url);
    
    try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({keyword,"chat_history":chatHistory, "file_id":file_id.url}),
                // body: JSON.stringify({'keyword': keyword}),
            });
            // console.log("reponse sent to backend");
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
    
            // Check if we are dealing with video links
            if (input.startsWith("video-") || input.startsWith("youtube-")) {
                if (data.video_links && data.video_links.length > 0) {
                    const videoMessages = data.video_links.map(link => ({
                        role: 'ai',
                        content: link,
                        isVideo: true
                    }));
                    setMessages(prevMessages => [...prevMessages, ...videoMessages]);
                } else if (data.youtube_link && data.youtube_link.length > 0) {
                    const youtubeMessage = data.youtube_link.map(link =>({
                        role: 'ai',
                        content: link,
                        isVideo: true
                    }));
                    console.log(youtubeMessage);
                    setMessages((prevMessages) => [...prevMessages, ...youtubeMessage]);
                    console.log(messages);
                } else {
                    alert('No video links found. Please try a different keyword.');
                }
            } else {
                var answer = "";
                if(selectedLanguage!=='en'){
                    answer =await translateText(data.answer,"en",selectedLanguage);
                }
                else{
                    answer = data.answer;
                }
                console.log(answer);
                var aiMessage = { role: 'ai', content: data.answer };
                setMessages((prevMessages) => [...prevMessages, aiMessage]);
                simulateTypingEffect(aiMessage);
            }
        } catch (error) {
            console.error('Error fetching response from server:', error);
        } finally {
            setLoading(false);
        }
    };

    // Typing effect function for AI messages
const simulateTypingEffect = (aiMessage) => {
    const messageText = aiMessage.content;
    let index = 0;
    
    // Use a timeout to simulate typing effect over time
    const typingInterval = setInterval(() => {
        setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];

            // Update the content progressively
            lastMessage.content = messageText.slice(0, index + 1);
            return updatedMessages;
        });

        index++;
        if (index === messageText.length) {
            clearInterval(typingInterval); // Stop when the text is fully typed
        }
    }, 10); // Adjust typing speed (in ms)
};

const translateMessage = async (text, index) => {
    if (!text) return;
    const maxWords = 20;
    const words = text.split(" ");
    const chunks = [];

    // Split the text into chunks of max 20 words
    for (let i = 0; i < words.length; i += maxWords) {
        const chunk = words.slice(i, i + maxWords).join(" ");
        chunks.push(chunk);
    }

    try {
        const translatedChunks = await Promise.all(
            chunks.map(async (chunk) => {
                const response = await fetch('http://localhost:5000/translate', {  // Flask server URL
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: chunk,
                        source_language: "en",
                        target_language: selectedLanguage,
                    }),
                });

                const data = await response.json();

                if (data.translated_text) {
                    return data.translated_text;
                } else {
                    console.error("Translation error:", data);
                    return "";
                }
            })
        );

        const fullTranslatedText = translatedChunks.join(" ");
        setTranslatedTexts((prev) => ({
            ...prev,
            [index]: fullTranslatedText,
        }));
    } catch (error) {
        console.error("Error fetching translation:", error);
    }
};

const translateText = async (text,selectedLanguage,targetLanguage) => {
    if (!text) return;

    try {
        // Send the translation request to the Flask backend
        const response = await fetch('http://localhost:5000/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                source_language: selectedLanguage,
                target_language: targetLanguage, // Change this based on your desired language
            }),
        });

        const data = await response.json();

        // Check if the translated text is available in the response
        if (data.translated_text) {
            console.log(data.translated_text);
            return data.translated_text;
        } else {
            console.error("Translation error:", data);
            return "";
        }

    } catch (error) {
        console.error("Error fetching translation:", error);
    }
};

const startVoiceInput = () => {
    if (recognition) {
        recognition.lang = selectedLanguage;  // Use selected language for speech recognition
        recognition.start();
    }
};

    const youtubeLink = () => {
        setInput("youtube-" + input);
        
        // Set a delay of 1 second (1000 milliseconds)
        setTimeout(() => {
            const youtubeButton = document.getElementById('youtubeBtn');
            if (youtubeButton) {
                youtubeButton.click();
            }
        }, 500);
        setTimeout(() => {setInput("");  // Adjust the delay time here (in milliseconds)
        }, 500);
    };
    
    const replaceAsterisksWithBold = (text) =>{
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
    const replaceAsterisksWithBoldForSpeech = (text) =>{
        // Remove <strong></strong> tags
        text = text.replace(/<strong>(.*?)<\/strong>/g, '$1');
        
        // Remove single asterisks (*) and double asterisks (**)
        text = text.replace(/\*/g, ''); // Remove single asterisk
        text = text.replace(/\*\*/g, ''); // Remove double asterisk
        
        return text;
    }

    // const translateMessage = async (text, index) => {
    //     if (!text) return;
    
    //     const maxWords = 50;  // Set your word limit per chunk
    //     const words = text.split(" ");
    //     const chunks = [];
    
    //     // Divide text into chunks of `maxWords` each
    //     for (let i = 0; i < words.length; i += maxWords) {
    //         const chunk = words.slice(i, i + maxWords).join(" ");
    //         chunks.push(chunk);
    //     }
    
    //     try {
    //         const translatedChunks = await Promise.all(
    //             chunks.map(async (chunk) => {
    //                 const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|ta`;
    //                 const response = await fetch(url);
    //                 const data = await response.json();
    
    //                 if (data.responseStatus === 200) {
    //                     return data.responseData.translatedText;
    //                 } else {
    //                     console.error("Translation error:", data);
    //                     return "";  // Handle error by returning an empty string for this chunk
    //                 }
    //             })
    //         );
    
    //         // Combine the translated chunks into a single text
    //         const fullTranslatedText = translatedChunks.join(" ");
            
    //         setTranslatedTexts((prev) => ({
    //             ...prev,
    //             [index]: fullTranslatedText,
    //         }));
    
    //     } catch (error) {
    //         console.error("Error fetching translation:", error);
    //     }
    // };
    

    return (
        <div className="chat-container">
            <strong><h1>AI TUTOR</h1></strong>
            
            {/* Language Selection Dropdown */}
            <div className="language-dropdown">
                <label htmlFor="language">Select Language: </label>
                <select 
                    id="language" 
                    value={selectedLanguage} 
                    onChange={(e) => setSelectedLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                    <option value="ml">Malayalam</option>
                    <option value="kn">Kannada</option>
                    <option value="bn">Bengali</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="es">Spanish</option>

                    {/* Add more languages as needed */}
                </select>
            </div>
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index}>
                        <div className={`message ${msg.role}`}>
                            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                            {msg.isVideo ? (
                                <iframe
                                    width='100%'
                                    height='270px'
                                    src={msg.content}
                                    frameBorder="0"
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <pre dangerouslySetInnerHTML={{ __html: translatedTexts[index] || replaceAsterisksWithBold(msg.content) }} />
                            )}
                        </div>
                        {msg.role === 'ai' && !msg.isVideo && (
                            <>
                                <span className='speech-icon' onClick={() => speech(replaceAsterisksWithBoldForSpeech(translatedTexts[index]))} aria-label="Speak message">
                                    <img width="20" height="16" src="https://img.icons8.com/windows/32/speaker.png" alt="speaker" />
                                </span>
                                <span className='translate-icon' style={{ margin: "2px" }} 
                                    onClick={() => {
                                        if (translatedTexts[index]) {
                                            setTranslatedTexts((prev) => {
                                                const newTexts = { ...prev };
                                                delete newTexts[index];
                                                return newTexts;
                                            });
                                        } else {
                                            translateMessage(replaceAsterisksWithBold(msg.content), index);
                                        }
                                    }}>
                                    <img width="24" height="24" src="https://img.icons8.com/?size=100&id=13647&format=png&color=000000" alt="translation" />
                                </span>
                                <span className='speech-icon' onClick={ youtubeLink} aria-label="Speak message">
                                <img width="24" height="24" src="https://img.icons8.com/?size=100&id=19318&format=png&color=000000" alt="youtube" /></span>
                            </>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="message ai">
                        <strong>AI:</strong>
                        <pre>Loading...</pre>
                    </div>
                )}
            </div>
            <div className="input-area">
                <span onClick={startVoiceInput} aria-label="Voice Input" style={{ marginTop: '5px' }}>
                    <img width="24" height="24" src="https://img.icons8.com/material-sharp/24/microphone--v1.png" alt="microphone--v1" />
                </span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                />
                <button onClick={sendMessage} id='youtubeBtn'>Send</button>
            </div>
        </div>
    );
}

export default ChatApp;
