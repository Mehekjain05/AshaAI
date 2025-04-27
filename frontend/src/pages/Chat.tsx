// src/pages/Chat.tsx
import axios from 'axios';
import React from 'react';
import { useState, useRef } from 'react';
import { FaPaperclip, FaMicrophone, FaUserCircle, FaRobot, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { SiNotion } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import GDrivePicker from '../components/GdrivePicker';
import DropboxPicker from '../components/DropboxPicker';
import NotionPicker from '../components/NotionPicker';
import { Calendar } from 'lucide-react';
import CalendarPopup from '../components/CalendarPopup';
import EmailComposer from '../components/EmailComposer';
import AccessDeniedCard from '../components/AccessDeniedCard';
import FilePreview from '../components/FilePreview';
import PDFPreview from '../components/PDFPreview';
import SummaryCard from '../components/SummaryCard';
import TextToSpeechButton from '../components/TextToSpeechButton';
import Canvas from "../components/Canvas";
import JobCard from '../components/JobCard';
import EventCard from '../components/Event'; // Import EventCard
import LearningPathFlow from '../components/LearningPathFlow';
import '@xyflow/react/dist/style.css'; // Make sure styles are imported for LearningPathFlow

// Utility function for Text-to-Speech (if not already globally available)
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;
    // Cancel any previous speech
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    synth.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported in this browser.');
  }
};

interface FeedbackProps {
  messageId: string | number; // Use a unique ID if possible, index as fallback
  onFeedback: (messageId: string | number, feedback: 'up' | 'down') => void;
}

// Define LearningPathStage interface (used in parsing)
interface LearningPathStage {
  stage: string;
  topics: string[];
}

const Chat: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string | JSX.Element }[]>([]);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [accumulatedCanvasContent, setAccumulatedCanvasContent] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<'up' | 'down' | null>(null);
  const [canvasContent, setCanvasContent] = useState(''); // Potentially used by Canvas component
  const [showConfidentialityModal, setShowConfidentialityModal] = useState(false); // State for confidentiality modal
  const [selectedConfidentiality, setSelectedConfidentiality] = useState('Public'); // State for selected confidentiality level
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // State for files awaiting confirmation
  const [isUploading, setIsUploading] = useState(false); // State to track upload process

  const handleFeedbackClick = (feedback: 'up' | 'down') => {
    setSelectedFeedback(prev => (prev === feedback ? null : feedback));
    // Add logic here to actually *send* the feedback if needed
    // e.g., call an API: sendFeedback(messageId, feedback);
    console.log(`Feedback received: ${feedback}`);
  };

  // ----- START: Parsing Functions -----

  const parseJobResponseString = (responseString: string): Array<Record<string, any>> | null => {
    if (!responseString.trim().startsWith('[JobResponse(') || !responseString.trim().endsWith(')]')) {
      console.warn("String doesn't match expected JobResponse format:", responseString);
      return null;
    }

    const jobs: Array<Record<string, any>> = [];
    const jobRegex = /JobResponse\((.*?)\)/gs; // Use 's' flag for potential newlines
    let match;

    while ((match = jobRegex.exec(responseString)) !== null) {
      const jobData: Record<string, any> = {};
      const content = match[1];
      // Adjusted regex to handle potential missing quotes or different structures slightly more robustly
      const pairRegex = /(\w+)\s*=\s*(?:'(.*?)'|"([^"]*)"|(\[.*?\])|([^,)]+))\s*,?\s*/g;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(content)) !== null) {
        const key = pairMatch[1];
        let value: string | undefined;
        if (pairMatch[2] !== undefined) { value = pairMatch[2]; } // Single quotes
        else if (pairMatch[3] !== undefined) { value = pairMatch[3]; } // Double quotes
        else if (pairMatch[4] !== undefined) { value = pairMatch[4]; } // Array literal
        else if (pairMatch[5] !== undefined) { value = pairMatch[5].trim(); } // Unquoted

        if (value !== undefined) {
          jobData[key] = value;
        }
      }

      if (Object.keys(jobData).length > 0 && jobData.title) { // Basic validation
        jobs.push(jobData);
      } else {
          console.warn("Parsed JobResponse missing title or empty:", jobData);
      }
    }

    return jobs.length > 0 ? jobs : null;
  };

  const parseLearningPathString = (responseString: string): LearningPathStage[] | null => {
    if (!responseString.trim().startsWith('[LearningPath(') || !responseString.trim().endsWith(')]')) {
      console.warn("String doesn't match expected LearningPath format:", responseString);
      return null;
    }

    const learningPath: LearningPathStage[] = [];
    const pathRegex = /LearningPath\(stage='([^']*)',\s*topics=\[(.*?)\]\)/gs; // Use 's' flag
    let match;

    while ((match = pathRegex.exec(responseString)) !== null) {
      const stage = match[1];
      const topicsString = match[2]; // e.g., "'Math', 'Programming', 'Statistics'" or "'Topic1'"

      // Process the topics string: remove quotes and split
      const topics = topicsString
        .split(/,\s*/) // Split by comma and optional space
        .map(topic => topic.replace(/^['"]|['"]$/g, '').trim()) // Remove surrounding single or double quotes
        .filter(topic => topic); // Remove any empty strings resulting from split

      if (stage && topics.length > 0) {
        learningPath.push({ stage, topics });
      }
    }

    return learningPath.length > 0 ? learningPath : null;
  };

  const parseEventResponseString = (responseString: string): Array<Record<string, any>> | null => {
      if (!responseString.trim().startsWith('[EventResponse(') || !responseString.trim().endsWith(')]')) {
        console.warn("String doesn't match expected EventResponse format:", responseString);
        return null;
      }

      const events: Array<Record<string, any>> = [];
      // Regex to find each EventResponse(...) block
      const eventRegex = /EventResponse\((.*?)\)/gs; // 's' flag to make '.' match newlines if needed
      let match;

      while ((match = eventRegex.exec(responseString)) !== null) {
        const eventData: Record<string, any> = {};
        const content = match[1];

        // Regex to find key=value pairs within the content
        // Handles single quotes, double quotes, arrays, and unquoted values (like N/A)
        const pairRegex = /(\w+)\s*=\s*(?:'(.*?)'|"([^"]*)"|(\[.*?\])|([^,)]+))\s*,?\s*/g;
        let pairMatch;

        while ((pairMatch = pairRegex.exec(content)) !== null) {
          const key = pairMatch[1];
          // Determine the value based on which capture group matched
          let value: string | undefined;
          if (pairMatch[2] !== undefined) { // Single-quoted string
            value = pairMatch[2];
          } else if (pairMatch[3] !== undefined) { // Double-quoted string
            value = pairMatch[3];
          } else if (pairMatch[4] !== undefined) { // Array string like [...]
            value = pairMatch[4];
          } else if (pairMatch[5] !== undefined) { // Unquoted value (N/A, numbers, etc.)
            value = pairMatch[5].trim();
          }

          if (value !== undefined) {
              eventData[key] = value; // Store the raw value, let the component parse specifics like categories
          }
        }

        if (Object.keys(eventData).length > 0) {
          // Basic validation: check if essential field like 'title' exists
          if (eventData.title) {
            events.push(eventData);
          } else {
               console.warn("Parsed EventResponse missing title:", eventData);
          }
        }
      }

      return events.length > 0 ? events : null;
    };

  // ----- END: Parsing Functions -----


  const parseMarkdown = (text: string) => {
    // Basic markdown for bold and lists - enhance as needed
    const boldRegex = /\*\*(.*?)\*\*/g;
    const listRegex = /^\s*[\*\-]\s+(.*)/gm; // Matches lines starting with * or -

    let html = text.replace(boldRegex, '<strong>$1</strong>');

    const lines = html.split('\n');
    let inList = false;
    const processedLines = lines.map((line) => {
      const listMatch = /^\s*([\*\-])\s+(.*)/.exec(line);
      if (listMatch) {
        const listItem = `<li class="ml-4">${listMatch[2]}</li>`;
        if (!inList) {
          inList = true;
          return `<ul class="list-disc pl-5 space-y-1">${listItem}`;
        }
        return listItem;
      } else {
        if (inList) {
          inList = false;
          return `</ul>${line}`;
        }
        return line;
      }
    });

    if (inList) { // Close list if the text ends with a list item
      processedLines.push('</ul>');
    }

    html = processedLines.join('\n'); // Re-join with newlines for spacing

    // Use dangerouslySetInnerHTML carefully. Ensure input is trusted or sanitized.
    // For simple cases like bold/list, this is relatively safe.
    return (
       <div className="whitespace-pre-wrap space-y-1">
         <div dangerouslySetInnerHTML={{ __html: html }} />
         <TextToSpeechButton text={text} /> {/* Add TTS button */}
       </div>
    );
  };


  const handleSend = async () => {
    if (!query.trim() && pendingFiles.length === 0) return; // Don't send if nothing to send

    const userQuery = query; // Store the query before clearing/modifying
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setQuery('');
    setAccumulatedCanvasContent(''); // Reset canvas content on new query

    setIsUploading(false); // Reset upload state in case it was related to a previous action

    try {
      // --- File Upload Logic (if any pending files) ---
      // This example assumes files are sent *with* the query.
      // Adjust if your backend handles file uploads separately.
      let requestBody: any = { query: userQuery };
      let headers: HeadersInit = { 'Content-Type': 'application/json' };

      if (pendingFiles.length > 0) {
         // If sending files, likely use FormData instead of JSON
         const formData = new FormData();
         formData.append('query', userQuery);
         formData.append('confidentiality', selectedConfidentiality); // Send confidentiality level
         pendingFiles.forEach((file) => {
           formData.append('files', file, file.name);
         });
         requestBody = formData;
         headers = {}; // Let the browser set Content-Type for FormData
         setPendingFiles([]); // Clear pending files after preparing request
         setUploadNotification(`Uploading ${pendingFiles.length} file(s) with query...`); // Indicate upload start
         setIsUploading(true); // Set uploading state
      }
      // --- End File Upload Logic ---


      const response = await fetch('/api/users/chat', { // Adjust endpoint if needed
        method: 'POST',
        headers: headers, // Use appropriate headers
        body: requestBody instanceof FormData ? requestBody : JSON.stringify(requestBody),
      });

      setIsUploading(false); // Upload finished or JSON request sent
      setUploadNotification(null); // Clear notification

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", response.status, errorText);
        setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${response.status} - ${errorText || 'Failed to get response'}` }]);
        return;
      }

      if (!response.body) {
        console.error("No response body");
        setMessages(prev => [...prev, { sender: 'bot', text: 'Received an empty response from the server.' }]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedContent = '';
      let isGeneratingReport = false; // Flag for canvas/report generation

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (done) break;

        const chunkValue = decoder.decode(value, { stream: true });
        const events = chunkValue.split("\n\n");

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const dataStr = event.replace("data: ", "").trim();
          if (!dataStr) continue;

          try {
            const dataObj = JSON.parse(dataStr);

            // --- START: Bias Detection Handling ---
            if (dataObj.payload_type === 'validation_error' && dataObj.validator === 'CustomDetectBias') {
              console.warn("Bias detected by backend:", dataObj.details);
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: (
                  <div className="text-red-700 bg-red-100 p-3 rounded-md border border-red-300">
                    <p><strong>⚠️ Biased Language Detected:</strong> The model attempted to generate content that may contain bias. Please be mindful of potentially harmful stereotypes or generalizations.</p>
                    {/* Optionally show the biased output if needed for debugging/context, but consider risks */}
                    {/* <p>Attempted Output: <em>{dataObj.details.validatedOutput}</em></p> */}
                  </div>
                )
              }]);
              done = true; // Stop processing further after bias detected
              reader.cancel(); // Cancel the stream reader
              break; // Exit the inner loop
            }
            // --- END: Bias Detection Handling ---

            if (dataObj.payload_type === 'values' && dataObj.error) {
              const errorMessage = dataObj.error;
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: <AccessDeniedCard
                  resource="Action Denied"
                  reason={errorMessage}
                  timestamp={new Date().toLocaleString()}
                />
              }]);
              done = true; // Stop processing on this error type
              reader.cancel();
              break; // Exit inner loop
            }
            else if (dataObj.payload_type === 'values' && dataObj.action === 'generate_report') {
              console.log("Received generate_report action");
              setAccumulatedCanvasContent(''); // Clear previous content for the canvas
              isGeneratingReport = true; // Set the flag
              setShowCanvas(true); // Show canvas immediately
            }

            // Accumulate content specifically for the canvas if triggered
            if (isGeneratingReport && dataObj.payload_type === 'message' && dataObj.content) {
              console.log("Accumulating canvas content:", dataObj.content);
              setAccumulatedCanvasContent(prev => prev + dataObj.content);
              // Don't add this canvas content to the main chat messages here
              continue; // Skip normal message processing for canvas chunks
            }

            // Handle regular messages, function calls, tool calls (if NOT generating report)
            if (dataObj.payload_type === 'message' && !isGeneratingReport) {
              const {
                content,
                function_call,
                function_name,
                tool_call,
                tool_name
              } = dataObj;

              if (function_call) {
                console.log('Function call:', function_name, 'Args:', dataObj.arguments);
                let spinnerText = '';
                let emailArgs: any = {};
                switch (function_name) {
                  case 'RouteQuery': spinnerText = '🔍 Retrieving relevant documents...'; break;
                  case 'GradeDocuments': spinnerText = '📊 Re-ranking documents...'; break;
                  case 'GenerateEmail':
                    // Handle potential variations in argument structure (string vs object, complete vs incomplete)
                    if (dataObj.arguments && typeof dataObj.arguments === 'object') {
                        if (dataObj.arguments.status === 'incomplete') {
                            spinnerText = `Generating email (gathering details)...`;
                        } else {
                            // Assume complete arguments if status is not 'incomplete'
                            emailArgs = dataObj.arguments;
                            // Immediately render EmailComposer if args are complete
                            setMessages(prev => [...prev, { sender: 'bot', text: <EmailComposer initialTo={emailArgs.to || ''} initialSubject={emailArgs.subject || ''} initialMessage={emailArgs.body || ''} /> }]);
                            done = true; // Stop stream processing for this message branch
                            reader.cancel();
                            break; // Exit the inner loop for events
                        }
                    } else if (dataObj.arguments && typeof dataObj.arguments === 'string') {
                        // Arguments might be streaming in as a string
                         spinnerText = `Generating email (processing details)...`;
                    } else {
                         spinnerText = `Generating email...`; // Fallback
                    }
                    break; // Break from switch case
                  default: spinnerText = `Running ${function_name}...`;
                }

                // Update spinner message only if email composer wasn't shown
                if (spinnerText && !emailArgs.to) {
                   setMessages(prevMessages => {
                    const last = prevMessages[prevMessages.length - 1];
                    const spinnerElement = (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                        <span>{spinnerText}</span>
                      </div>
                    );
                    // Check if the last message is already a spinner or can be updated
                    if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin'))) {
                       const updated = [...prevMessages];
                       updated[updated.length - 1] = { ...last, text: spinnerElement };
                       return updated;
                    } else {
                       // Add new spinner message
                       return [...prevMessages, { sender: 'bot', text: spinnerElement }];
                    }
                  });
                }

              } else if (tool_call) {
                 setMessages(prevMessages => {
                    const spinnerText = `Using tool: ${tool_name || 'Processing'}...`;
                    const last = prevMessages[prevMessages.length - 1];
                    const spinnerElement = (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                        <span>{spinnerText}</span>
                      </div>
                    );
                     if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin'))) {
                       const updated = [...prevMessages];
                       updated[updated.length - 1] = { ...last, text: spinnerElement };
                       return updated;
                    } else {
                       return [...prevMessages, { sender: 'bot', text: spinnerElement }];
                    }
                  });
              } else if (content) {
                // Accumulate regular content
                accumulatedContent += content;

                // Update the UI progressively with SummaryCard for regular text content
                setMessages(prevMessages => {
                  const updated = [...prevMessages];
                  const last = updated.length > 0 ? updated[updated.length - 1] : null;
                  let isUpdateable = false;

                  if (last && last.sender === 'bot') {
                    // Check if last message is suitable for update (spinner or previous summary card)
                     if (typeof last.text === 'string') { isUpdateable = true; } // Plain text bot message
                     else if (React.isValidElement(last.text)) {
                       // Spinner div
                       if (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) { isUpdateable = true; }
                       // Existing SummaryCard wrapped in a div
                       else if (last.text.type === 'div' && last.text.props?.children?.type === SummaryCard) { isUpdateable = true; }
                       // A simple div holding text, potentially from a previous non-streaming response or error
                       else if (last.text.type === 'div' && typeof last.text.props.children === 'string') { isUpdateable = true; }
                     }
                  }

                  // Always wrap SummaryCard in a div to maintain structure consistency
                  const newContentElement = (
                    <div>
                      <SummaryCard
                        title="Response"
                        content={parseMarkdown(accumulatedContent)} // Parse accumulated content
                        timestamp={new Date().toLocaleString()}
                      />
                    </div>
                  );

                  if (isUpdateable && last) {
                    // Update the last message
                    updated[updated.length - 1] = { ...last, text: newContentElement };
                  } else {
                    // Add as a new message if last wasn't updateable or no last message exists
                    updated.push({ sender: 'bot', text: newContentElement });
                  }
                  return updated;
                });
              }
            } // End handling regular messages

          } catch (err) {
            console.error("Error parsing stream chunk", err, "Data string:", dataStr);
            // Optionally display a parsing error message to the user
            // setMessages(prev => [...prev, { sender: 'bot', text: "Error processing response stream." }]);
          }
          if (done) break; // Exit outer loop if done flag was set inside (e.g., by bias detection or email composer)
        } // end for loop over events
      } // end while(!done) loop for reader

      // ----- START: Final Response Processing (After Stream Ends) -----
      console.log("Stream finished. Final accumulated content:", accumulatedContent);

      // Attempt to parse specific formats from the *final* accumulated content
      let parsedLearningPath: LearningPathStage[] | null = null;
      let parsedJobs: Array<Record<string, any>> | null = null;
      let parsedEvents: Array<Record<string, any>> | null = null;

      if (typeof accumulatedContent === 'string' && accumulatedContent.trim()) {
         // Try parsing LearningPath first
         parsedLearningPath = parseLearningPathString(accumulatedContent);
         if (parsedLearningPath) {
           console.log("Successfully parsed final content as LearningPath:", parsedLearningPath);
         } else {
           // If not LearningPath, try parsing JobResponse
           parsedJobs = parseJobResponseString(accumulatedContent);
           if (parsedJobs) {
             console.log("Successfully parsed final content as JobResponse:", parsedJobs);
           } else {
              // If not JobResponse, try parsing EventResponse
              parsedEvents = parseEventResponseString(accumulatedContent);
              if (parsedEvents) {
                  console.log("Successfully parsed final content as EventResponse:", parsedEvents);
              } else {
                  console.log("Final content is not LearningPath, JobResponse, or EventResponse. Treating as text or keyword.");
              }
           }
         }
      }


      // --- Determine the final message element based on parsing results or keywords ---
      setMessages(prevMessages => {
        const updated = [...prevMessages];
        const last = updated.length > 0 ? updated[updated.length - 1] : null;

        let finalContentElement: JSX.Element | string | null = null;

        if (parsedLearningPath) {
          finalContentElement = <LearningPathFlow pathData={parsedLearningPath} />;
        } else if (parsedJobs) {
          finalContentElement = (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-medium mb-2">Here are the job listings I found:</p>
              {parsedJobs.map((job, idx) => (
                <JobCard key={idx} job={job} />
              ))}
            </div>
          );
        } else if (parsedEvents) { // <--- Render Event Cards
           finalContentElement = (
             <div className="space-y-4">
               <p className="text-sm text-gray-600 font-medium mb-2">Here are some events you might be interested in:</p>
               {parsedEvents.map((event, idx) => (
                 <EventCard key={idx} event={event} />
               ))}
             </div>
           );
        } else if (accumulatedContent === 'show_calendar') {
          finalContentElement = <CalendarPopup />;
        } else if (accumulatedContent === 'email_composer') {
          // This case might be preempted by the function call logic above, but keep as fallback
          finalContentElement = <EmailComposer />;
        }
        // Note: The progressive SummaryCard update handles the general text case.
        // We only need to replace the last message if it's one of the specific components above OR
        // if the stream ended with a spinner and *no* content followed.

        if (finalContentElement) {
          let shouldUpdateLast = false;
          if (last && last.sender === 'bot') {
            // Check if last message was a spinner or a progressively updated SummaryCard/div
            if (typeof last.text === 'string') { shouldUpdateLast = true; }
            else if (React.isValidElement(last.text)) {
              if (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) { shouldUpdateLast = true; } // Spinner
              else if (last.text.type === 'div' && last.text.props?.children?.type === SummaryCard) { shouldUpdateLast = true; } // Updated during stream
              else if (last.text.type === 'div' && typeof last.text.props.children === 'string') { shouldUpdateLast = true; } // Simple text div
            }
          }

          if (shouldUpdateLast && last) {
            updated[updated.length - 1] = { ...last, text: finalContentElement };
          } else {
            // Add as a new message if last wasn't updateable or didn't exist
            updated.push({ sender: 'bot', text: finalContentElement });
          }
        } else if (last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin') && !accumulatedContent) {
          // If stream ended with only a spinner and NO content accumulated, replace spinner with a generic message.
          updated[updated.length - 1] = { ...last, text: "(No specific response generated)" };
        } else if (!accumulatedContent && !finalContentElement) {
            // If the stream finished, no content was accumulated (after potential spinners/function calls),
            // and no specific component was rendered, check if the last message is a spinner and remove it.
             if (last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
                updated.pop(); // Remove the lingering spinner
             }
        }

        return updated;
      });
      // ----- END: Final Response Processing -----


    } catch (err) {
      console.error("Error during fetch or streaming:", err);
      setIsUploading(false); // Ensure uploading state is reset on error
      setUploadNotification(null); // Clear notification
      setMessages(prevMessages => {
        const updated = [...prevMessages];
        const last = updated.length > 0 ? updated[updated.length - 1] : null;
        const errorText = 'Sorry, something went wrong while connecting or processing your request.';

        // Replace spinner with error message if it was the last element
        if (last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
          updated[updated.length - 1] = { ...last, text: errorText };
        } else {
          updated.push({ sender: 'bot', text: errorText });
        }
        return updated;
      });
    } finally {
      // Any final cleanup, though most state resets happen within try/catch blocks now
    }
  };


  const handleVoiceInput = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.error("Speech recognition not supported in this browser.");
      alert("Sorry, your browser doesn't support voice input.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      // Optional: Automatically send after voice input
      // setTimeout(handleSend, 100); // Add a small delay if needed
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        alert("Could not hear any speech. Please check your microphone.");
      } else if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        alert(`An error occurred during speech recognition: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log("Files selected:", fileArray.map(f => f.name));
    setPendingFiles(fileArray);
    // Immediately trigger the handleSend function if files are selected,
    // assuming the user wants to send them with the current query (or an empty query).
    // You might want a different UX, like showing a confirmation modal first.
    // For simplicity here, we directly call handleSend. Ensure query state is handled.
    // If you require a confidentiality modal first:
    // setShowConfidentialityModal(true); // Uncomment this and remove handleSend below
    // handleSend(); // Remove this if using a modal

    // Clear the file input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // If using a modal: The modal's submit action should call a function like submitFilesWithConfidentiality
  };

  // Example function if using a confidentiality modal (not fully implemented here)
  const submitFilesWithConfidentiality = () => {
      setShowConfidentialityModal(false);
      // Now call handleSend, which will pick up pendingFiles and selectedConfidentiality
      handleSend();
  };

  // --- JSX Return Structure ---
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar (Optional) */}
      {/* <aside className="w-64 bg-gray-100 border-r border-gray-200 p-4"> ... </aside> */}

      <main className="flex-1 flex flex-col h-screen relative bg-gray-50">

        {/* Upload Notification Area */}
        {uploadNotification && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-md z-50 text-sm ${uploadNotification.includes('failed') || uploadNotification.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {uploadNotification}
          </div>
        )}

        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28"> {/* Increased padding-bottom */}
          {messages.map((msg, idx) => (
            <div
              key={idx} // Using index as key - consider more stable keys if possible
              className={`flex items-start max-w-xl lg:max-w-2xl xl:max-w-3xl gap-3 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 text-2xl mt-1 ${msg.sender === 'user' ? 'text-blue-600' : 'text-indigo-600'}`}>
                {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
              </div>

              {/* Message Bubble */}
              <div
                className={`px-4 py-3 rounded-lg shadow-sm text-sm relative group ${msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                  } ${React.isValidElement(msg.text) ? 'w-full' : ''}`} // Allow components to take full width
              >
                {/* Render string or JSX elements */}
                {typeof msg.text === 'string' ? parseMarkdown(msg.text) : msg.text}

                {/* Feedback Buttons (Show on hover for bot messages) */}
                {msg.sender === 'bot' && !React.isValidElement(msg.text) && // Don't show feedback for complex components initially? Or adjust logic.
                    !(React.isValidElement(msg.text) && (msg.text.type === JobCard || msg.text.type === EventCard || msg.text.type === LearningPathFlow)) && // Exclude for specific cards
                    !(React.isValidElement(msg.text) && msg.text.type === 'div' && msg.text.props?.className?.includes('animate-spin')) && // Exclude for spinners
                    !(React.isValidElement(msg.text) && msg.text.type === AccessDeniedCard) && // Exclude for access denied
                    !(React.isValidElement(msg.text) && msg.text.type === 'div' && msg.text.props?.className?.includes('text-red-700')) && // Exclude for bias warning
                (
                  <div className="absolute -bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                       onClick={() => handleFeedbackClick('up')}
                       className={`p-1 rounded-full text-gray-400 hover:text-green-500 hover:bg-gray-100 ${selectedFeedback === 'up' ? 'text-green-600 bg-green-100' : ''}`}
                       title="Good response"
                    >
                      <FaThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedbackClick('down')}
                      className={`p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 ${selectedFeedback === 'down' ? 'text-red-600 bg-red-100' : ''}`}
                      title="Bad response"
                    >
                      <FaThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Add ref here if needed for scrolling */}
        </div>

        {/* Confidentiality Modal (Example Structure) */}
        {showConfidentialityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                    <h3 className="text-lg font-semibold mb-4">Confirm File Upload</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        You are uploading {pendingFiles.length} file(s): {pendingFiles.map(f => f.name).join(', ')}.
                        Please select the confidentiality level for this information.
                    </p>
                    <select
                        value={selectedConfidentiality}
                        onChange={(e) => setSelectedConfidentiality(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
                    >
                        <option value="Public">Public</option>
                        <option value="Confidential">Confidential</option>
                        <option value="Internal">Internal Only</option>
                    </select>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => { setShowConfidentialityModal(false); setPendingFiles([]); }} // Cancel clears files
                            className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitFilesWithConfidentiality}
                            className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
                        >
                            Confirm & Send
                        </button>
                    </div>
                </div>
            </div>
        )}


        {/* Chat Input Area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gradient-to-t from-white via-gray-50 to-gray-50 px-4 py-3">
          <div className="flex items-center max-w-3xl mx-auto relative">
            {/* Attachment Button */}
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()} // Directly trigger file input
                className="mr-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full text-xl transition-colors duration-150"
                title="Attach file"
                disabled={isUploading} // Disable while uploading
              >
                <FaPaperclip />
              </button>
              {/* Hidden File Input */}
              <input
                type="file"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.csv,.md,image/*" // Specify acceptable file types
              />
            </div>

            {/* Text Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isUploading ? "Uploading files..." : "Ask Asha anything..."}
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm disabled:bg-gray-100"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isUploading) { e.preventDefault(); handleSend(); } }} // Send on Enter
              disabled={isUploading} // Disable input while uploading
            />

            {/* Microphone Button */}
            <button
              onClick={handleVoiceInput}
              className={`mr-2 p-2 rounded-full text-xl transition-colors duration-150 ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={listening ? "Listening..." : "Use voice input"}
              disabled={isUploading || listening} // Disable during upload or listening
            >
              <FaMicrophone />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 disabled:opacity-50 text-sm font-medium"
              disabled={(!query.trim() && pendingFiles.length === 0) || isUploading || listening} // Disable if no query/files, uploading, or listening
            >
              Send
            </button>
          </div>
        </div>

         {/* Canvas Modal/Overlay (if used) */}
         {showCanvas && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                <div className="bg-white p-4 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                    <h3 className="text-lg font-semibold mb-3">Generated Report</h3>
                    <div className="flex-grow overflow-auto border rounded p-3 mb-3">
                        {/* Render accumulatedCanvasContent here */}
                        <Canvas content={accumulatedCanvasContent} /> {/* Pass content to Canvas */}
                    </div>
                    <button
                        onClick={() => setShowCanvas(false)}
                        className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 self-end"
                    >
                        Close
                    </button>
                </div>
            </div>
         )}

      </main>
    </div>
  );
};

export default Chat;
