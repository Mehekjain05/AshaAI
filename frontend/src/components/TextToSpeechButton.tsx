import React from 'react';

const TextToSpeechButton = ({ text }: { text: string }) => {
  const speakText = () => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    synth.speak(utterance);
  };

  return (
    <button
      onClick={speakText}
      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
    >
      🔊 Speak
    </button>
  );
};

export default TextToSpeechButton;
