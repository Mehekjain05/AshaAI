import axios from 'axios';
import React from 'react';
import { useState, useRef, useEffect } from 'react'; // Added useEffect
import { FaPaperclip, FaMicrophone, FaUserCircle, FaRobot, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import CalendarPopup from '../components/CalendarPopup';
import EmailComposer from '../components/EmailComposer';
import AccessDeniedCard from '../components/AccessDeniedCard';
import SummaryCard from '../components/SummaryCard';
import TextToSpeechButton from '../components/TextToSpeechButton';
import JobCard from '../components/JobCard';
// ***** START: Import LearningPathFlow and Flow Styles *****
import LearningPathFlow from '../components/LearningPathFlow';
import '@xyflow/react/dist/style.css'; // Make sure styles are imported
// ***** END: Import LearningPathFlow and Flow Styles *****
// ***** START: Import EventCard *****
import EventCard, { EventData } from '../components/EventCard'; // Import EventCard and its type
// ***** END: Import EventCard *****


const speakText = (text: string) => {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  synth.speak(utterance);
};
interface FeedbackProps {
  messageId: string | number; // Use a unique ID if possible, index as fallback
  onFeedback: (messageId: string | number, feedback: 'up' | 'down') => void;
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
  const [selectedFeedback, setSelectedFeedback] = useState<Record<number, 'up' | 'down' | null>>({}); // Store feedback per message index
  const [showConfidentialityModal, setShowConfidentialityModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling


  const handleFeedbackClick = (messageIndex: number, feedback: 'up' | 'down') => {
    // Basic feedback handling - logs to console for now
    // Replace with actual feedback submission logic if needed
    setSelectedFeedback(prev => ({
      ...prev,
      [messageIndex]: prev[messageIndex] === feedback ? null : feedback,
    }));
    console.log(`Feedback for message ${messageIndex}: ${feedback}`);
    // Example: Send feedback to backend
    // sendFeedbackToApi(messages[messageIndex].id, feedback); // Assuming messages have unique IDs
  };


  // ----- START: Parsing Functions -----
  const parseJobResponseString = (responseString: string): Array<Record<string, any>> | null => {
    // --- Existing parseJobResponseString logic ---
    if (!responseString.trim().startsWith('[JobResponse(') || !responseString.trim().endsWith(')]')) {
      // console.warn("String doesn't match expected JobResponse format:", responseString); // Less noisy console
      return null;
    }

    const jobs: Array<Record<string, any>> = [];
    const jobRegex = /JobResponse\((.*?)\)/gs; // Added 's' flag for potential newlines
    let match;

    while ((match = jobRegex.exec(responseString)) !== null) {
      const jobData: Record<string, any> = {};
      const content = match[1];
      // More robust regex, handles potential newlines within values
      const pairRegex = /(\w+)\s*=\s*(?:'(.*?)'|"([^"]*?)"|(\[.*?\])|([^,)]+))\s*(?:,|$)/gs;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(content)) !== null) {
        const key = pairMatch[1];
        const value = pairMatch[2] !== undefined ? pairMatch[2] : // single quotes
          pairMatch[3] !== undefined ? pairMatch[3] : // double quotes
            pairMatch[4] !== undefined ? pairMatch[4] : // brackets (for arrays specifically if needed, but handled below too)
              pairMatch[5]; // unquoted or simple values

        // Basic type handling (can be expanded)
        if (value.toLowerCase() === 'true') {
          jobData[key] = true;
        } else if (value.toLowerCase() === 'false') {
          jobData[key] = false;
        } else if (!isNaN(Number(value))) {
          jobData[key] = Number(value);
        } else {
          jobData[key] = value.trim(); // Trim whitespace
        }
      }

      if (Object.keys(jobData).length > 0) {
        jobs.push(jobData);
      }
    }

    return jobs.length > 0 ? jobs : null;
    // --- End of existing parseJobResponseString logic ---
  };

  interface LearningPathStage {
    stage: string;
    topics: string[];
  }

  const parseLearningPathString = (responseString: string): LearningPathStage[] | null => {
    // --- Existing parseLearningPathString logic ---
    if (!responseString.trim().startsWith('[LearningPath(') || !responseString.trim().endsWith(')]')) {
      // console.warn("String doesn't match expected LearningPath format:", responseString); // Less noisy console
      return null;
    }

    const learningPath: LearningPathStage[] = [];
    // Regex to handle potential extra whitespace
    const pathRegex = /LearningPath\(\s*stage\s*=\s*'([^']*)',\s*topics\s*=\s*\[([^\]]*)\]\s*\)/g;
    let match;

    while ((match = pathRegex.exec(responseString)) !== null) {
      const stage = match[1];
      const topicsString = match[2]; // e.g., "'Math', 'Programming', 'Statistics'"

      const topics = topicsString
        .split(/,\s*/)
        .map(topic => topic.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1').trim()) // Remove surrounding single or double quotes
        .filter(topic => topic);

      if (stage && topics.length > 0) {
        learningPath.push({ stage, topics });
      }
    }

    return learningPath.length > 0 ? learningPath : null;
    // --- End of existing parseLearningPathString logic ---
  };

  // ***** START: EventResponse Parsing Function *****
  const parseEventResponseString = (responseString: string): EventData[] | null => {
    if (!responseString.trim().startsWith('[EventResponse(') || !responseString.trim().endsWith(')]')) {
      // console.warn("String doesn't match expected EventResponse format:", responseString); // Less noisy console
      return null;
    }

    const events: EventData[] = [];
    // Use 's' flag in regex to handle potential newlines within the content
    const eventRegex = /EventResponse\((.*?)\)/gs;
    let match;

    while ((match = eventRegex.exec(responseString)) !== null) {
      const eventData: Partial<EventData> = {}; // Use Partial for incremental building
      const content = match[1];

      // Regex to capture key-value pairs. Handles single quotes, double quotes (less likely needed here based on example), bracketed arrays, and unquoted values.
      // Makes values non-greedy (.*?) to avoid over-matching if quotes appear inside values.
      // Handles potential whitespace around '=' and commas.
      const pairRegex = /(\w+)\s*=\s*(?:'(.*?)'|(\[.*?\])|([^,)]+))\s*(?:,|$)/gs;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(content)) !== null) {
        const key = pairMatch[1] as keyof EventData; // Type assertion
        let value: any;

        if (pairMatch[2] !== undefined) { // Single-quoted string
          value = pairMatch[2];
        } else if (pairMatch[3] !== undefined) { // Bracketed array like categories
          const arrayString = pairMatch[3];
          value = arrayString
            .substring(1, arrayString.length - 1) // Remove brackets
            .split(/,\s*/)
            .map(item => item.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1').trim()) // Remove quotes from items
            .filter(item => item); // Remove empty items
        } else if (pairMatch[4] !== undefined) { // Unquoted value or value that wasn't captured by others
          value = pairMatch[4].trim();
          // Handle 'N/A' specifically if needed, though the component does this too
          if (value.toUpperCase() === 'N/A') value = 'N/A';
        }

        if (key && value !== undefined) {
          eventData[key] = value;
        }
      }

      // Basic validation: ensure essential fields are present before casting
      if (eventData.title && eventData.event_url) {
        // Fill missing required fields with defaults if necessary, or keep as partial if component handles undefined
         const completeEventData: EventData = {
          title: eventData.title,
          image: eventData.image,
          categories: eventData.categories || [],
          mode: eventData.mode || 'N/A',
          date: eventData.date || 'N/A',
          time: eventData.time || 'N/A',
          venue: eventData.venue || 'N/A',
          price: eventData.price || 'N/A',
          event_url: eventData.event_url,
          register_url: eventData.register_url || 'N/A',
         };
        events.push(completeEventData);
      } else {
        console.warn("Skipping incomplete event data:", eventData);
      }
    }

    return events.length > 0 ? events : null;
  };
  // ***** END: EventResponse Parsing Function *****

  // ----- END: Parsing Functions -----


  const parseMarkdown = (text: string) => {
    // --- Existing markdown parsing logic ---
    text = text.replace("**", "<strong>").replace("**", "</strong>");
    const lines = text.split('\n');

    return (
      <div className="whitespace-pre-wrap space-y-1">
        {lines.map((line, i) => {
          if (line.trim().startsWith('* ')) {
            const content = line.replace(/^\* /, '');
            // Handle bold within list items
             const parts = content.split(/(\*\*[^*]+\*\*)/g).map((segment, idx) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                return <strong key={idx}>{segment.slice(2, -2)}</strong>;
                }
                return <span key={idx}>{segment}</span>;
            });
            return (
              <div key={i} className="flex items-start">
                 <span className="mr-2 text-blue-500">•</span> {/* Use a styled bullet */}
                 <div className="flex-1">{parts}</div>
              </div>
            );
          }

          const parts = line.split(/(\*\*[^*]+\*\*)/g).map((segment, idx) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return <strong key={idx}>{segment.slice(2, -2)}</strong>;
            }
            return <span key={idx}>{segment}</span>;
          });

          return <div key={i}>{parts}</div>;
        })}
        {/* Removed TextToSpeechButton from here, might add it back per message later if needed */}
      </div>
    );
    // --- End of existing markdown parsing logic ---
  };

   // Scroll to bottom effect
   useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Dependency array ensures this runs when messages update


  const handleSend = async () => {
    if (!query.trim() && pendingFiles.length === 0) return; // Allow sending if files are pending

    const userQuery = query; // Store the query before clearing
    // Display user message immediately
    setMessages(prev => [...prev, { sender: 'user', text: userQuery || "Attached files" }]); // Show placeholder if only files
    setQuery('');
    setAccumulatedCanvasContent(''); // Reset canvas content on new query

    // --- File Upload Logic (Integrated before API call) ---
    let uploadedFileUrls: string[] = []; // To potentially send to backend if needed
    if (pendingFiles.length > 0) {
        setIsUploading(true);
        setUploadNotification("Uploading files...");
        // Assuming you have an upload endpoint '/api/users/upload'
        // This part needs to be implemented based on your backend setup
        // For now, let's simulate success/failure and clear pending files
        try {
            // --- Replace with ACTUAL file upload logic ---
            // const formData = new FormData();
            // pendingFiles.forEach(file => formData.append('files', file));
            // const uploadResponse = await axios.post('/api/users/upload', formData, {
            //     headers: { 'Content-Type': 'multipart/form-data' }
            // });
            // uploadedFileUrls = uploadResponse.data.urls; // Assuming backend returns URLs
            // --- Simulation ---
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time
            console.log("Simulated upload success for:", pendingFiles.map(f => f.name));
            setUploadNotification(`Successfully uploaded ${pendingFiles.length} file(s).`);
            // uploadedFileUrls = pendingFiles.map(f => `simulated_url/${f.name}`); // Simulated URLs
            // --- End Simulation ---

            setPendingFiles([]); // Clear pending files on success
        } catch (error) {
            console.error("File upload failed:", error);
            setUploadNotification("File upload failed. Please try again.");
            setIsUploading(false); // Re-enable send button on failure
            setPendingFiles([]); // Clear files even on failure? Decide based on UX.
            // Optionally remove the user's "Attached files" message or add an error message
            setTimeout(() => setUploadNotification(null), 4000); // Clear notification
            return; // Stop if upload fails
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadNotification(null), 3000); // Clear notification after a delay
        }
    }
    // --- End File Upload Logic ---


    // --- API Call Logic ---
    try {
      const requestBody = {
        query: userQuery,
        // Optionally send uploaded file info if your backend uses it
        // uploaded_files: uploadedFileUrls,
      };
      const response = await fetch('/api/users/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

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
      let isGeneratingReport = false;
      let currentBotMessageIndex = -1; // Track the index of the bot message being updated

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
            let stopProcessingCurrentStream = false; // Flag to break inner loop and potentially outer

            // --- START: Bias Detection Handling ---
            if (dataObj.payload_type === 'validation_error' && dataObj.validator === 'CustomDetectBias') {
              console.warn("Bias detected by backend:", dataObj.details);
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: (
                  <div className="text-red-700 bg-red-100 p-3 rounded-md border border-red-300">
                    <p><strong>⚠️ Biased Language: </strong> {dataObj.details.validatedOutput}</p>
                  </div>
                )
              }]);
              stopProcessingCurrentStream = true;
              done = true; // Stop processing further after bias detected
              reader.cancel(); // Cancel the stream reader
            }
            // --- END: Bias Detection Handling ---

            // --- START: Access Denied/Error Handling ---
            else if (dataObj.payload_type === 'values' && dataObj.error) {
              console.error("Action Denied/Error from backend:", dataObj.error);
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: <AccessDeniedCard
                  resource="Action Denied"
                  reason={dataObj.error}
                  timestamp={new Date().toLocaleString()}
                />
              }]);
              stopProcessingCurrentStream = true;
              done = true; // Stop processing on this error type
              reader.cancel();
            }
            // --- END: Access Denied/Error Handling ---

             // --- START: Report Generation Handling ---
            else if (dataObj.payload_type === 'values' && dataObj.action === 'generate_report') {
              console.log("Received generate_report action");
              setAccumulatedCanvasContent(''); // Clear previous content for the canvas
              isGeneratingReport = true; // Set the flag
              setShowCanvas(true); // Show canvas immediately
              // Add a placeholder message maybe? Or let the canvas handle it.
              // continue; // Don't process this event further as a message chunk
            }
            // --- END: Report Generation Handling ---

            // --- START: Canvas Content Accumulation ---
            if (isGeneratingReport && dataObj.payload_type === 'message' && dataObj.content) {
              console.log("Accumulating canvas content:", dataObj.content);
              setAccumulatedCanvasContent(prev => prev + dataObj.content);
               continue; // Skip normal message processing for canvas chunks
            }
            // --- END: Canvas Content Accumulation ---


            // --- START: Handle Regular Messages, Function Calls, Tool Calls (if NOT generating report) ---
            if (!isGeneratingReport && !stopProcessingCurrentStream) {
                 if (dataObj.payload_type === 'message') {
                    const { content, function_call, function_name, tool_call, tool_name, arguments: func_args } = dataObj;

                    if (function_call) {
                        // --- Existing Function Call Spinner Logic ---
                        console.log('Function Call:', function_name, 'Args:', func_args);
                        let spinnerText = `⚙️ Running ${function_name || 'action'}...`;
                        let shouldShowSpinner = true;
                        let emailArgs: any = {};

                        switch (function_name) {
                            case 'RouteQuery': spinnerText = '🔍 Retrieving documents...'; break;
                            case 'GradeDocuments': spinnerText = '📊 Re-ranking documents...'; break;
                            case 'GenerateEmail':
                                if (func_args && typeof func_args === 'object') {
                                    if (func_args.status === 'incomplete') {
                                        console.log("Incomplete email args:", func_args.raw);
                                        spinnerText = `📧 Generating email (gathering details)...`;
                                    } else {
                                        // Complete email args received
                                        emailArgs = func_args;
                                        setMessages(prev => [...prev, { sender: 'bot', text: <EmailComposer initialTo={emailArgs.to} initialSubject={emailArgs.subject} initialMessage={emailArgs.body} /> }]);
                                        shouldShowSpinner = false; // Don't show spinner, show composer
                                        stopProcessingCurrentStream = true; // Stop stream for this message
                                        done = true; // Assume stream should end here
                                        reader.cancel();
                                    }
                                } else if (func_args && typeof func_args === 'string') {
                                    spinnerText = `📧 Generating email (processing details)...`; // Partial args as string
                                } else {
                                    spinnerText = `📧 Generating email...`; // No args yet
                                }
                                break;
                            default: spinnerText = `⚙️ Running ${function_name || 'action'}...`;
                        }

                        if (shouldShowSpinner) {
                            setMessages(prevMessages => {
                                const updated = [...prevMessages];
                                if (currentBotMessageIndex !== -1 && updated[currentBotMessageIndex]?.sender === 'bot') {
                                     // Update existing spinner/placeholder
                                    updated[currentBotMessageIndex] = { ...updated[currentBotMessageIndex], text: (<div className="flex items-center gap-2 text-gray-600 text-sm italic"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div>) };
                                } else {
                                    // Add new spinner message
                                    updated.push({ sender: 'bot', text: (<div className="flex items-center gap-2 text-gray-600 text-sm italic"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div>) });
                                    currentBotMessageIndex = updated.length - 1; // Track new message index
                                }
                                return updated;
                            });
                        }
                    } else if (tool_call) {
                        // --- Existing Tool Call Spinner Logic ---
                        console.log('Tool Call:', tool_name);
                        const spinnerText = `🛠️ Using tool: ${tool_name || 'Processing'}...`;
                        setMessages(prevMessages => {
                             const updated = [...prevMessages];
                             if (currentBotMessageIndex !== -1 && updated[currentBotMessageIndex]?.sender === 'bot') {
                                 // Update existing spinner/placeholder
                                updated[currentBotMessageIndex] = { ...updated[currentBotMessageIndex], text: (<div className="flex items-center gap-2 text-gray-600 text-sm italic"> <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div>) };
                             } else {
                                 // Add new spinner message
                                updated.push({ sender: 'bot', text: (<div className="flex items-center gap-2 text-gray-600 text-sm italic"> <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div>) });
                                currentBotMessageIndex = updated.length - 1; // Track new message index
                             }
                             return updated;
                        });
                    } else if (content) {
                        // --- Accumulate and Render Regular Content ---
                        accumulatedContent += content;

                        setMessages(prevMessages => {
                            const updated = [...prevMessages];
                             const newContentElement = (
                                <div>
                                    {/* Using basic div for streaming, replace with SummaryCard if needed */}
                                    {parseMarkdown(accumulatedContent)}
                                    {/* Consider adding TextToSpeechButton here if needed per message */}
                                    {/* <TextToSpeechButton text={accumulatedContent} /> */}
                                </div>
                            );


                            if (currentBotMessageIndex !== -1 && updated[currentBotMessageIndex]?.sender === 'bot') {
                                // Update the existing bot message (might replace a spinner)
                                updated[currentBotMessageIndex] = { ...updated[currentBotMessageIndex], text: newContentElement };
                            } else {
                                // Add a new bot message if no current one is being updated
                                updated.push({ sender: 'bot', text: newContentElement });
                                currentBotMessageIndex = updated.length - 1; // Track the index of this new message
                            }
                            return updated;
                        });
                    }
                } // end if (dataObj.payload_type === 'message')
            } // end if (!isGeneratingReport && !stopProcessingCurrentStream)

            if (stopProcessingCurrentStream) {
                break; // Exit inner loop (processing events in the chunk)
            }

          } catch (err) {
            console.error("Error parsing stream chunk", err, "Data string:", dataStr);
          }
        } // end for loop over events in chunk

        if (done) break; // Exit outer loop if done flag was set inside

      } // end while(!done) loop for reader

      // ----- START: Final Response Processing (After Stream Ends) -----
      console.log("Stream finished. Final accumulated content:", accumulatedContent);

      // If generating a report, canvas handles display. No final message needed here unless desired.
      if (isGeneratingReport) {
          console.log("Report generation finished. Canvas content:", accumulatedCanvasContent);
          // Maybe add a confirmation message?
          // setMessages(prev => [...prev, { sender: 'bot', text: "Report generated." }]);
          return; // Stop further processing for report generation case
      }


      // --- Attempt to parse specific formats from the *final* accumulated content ---
      let parsedLearningPath: LearningPathStage[] | null = null;
      let parsedJobs: Array<Record<string, any>> | null = null;
      let parsedEvents: EventData[] | null = null; // <--- Add EventData parsing

      if (typeof accumulatedContent === 'string' && accumulatedContent.trim()) {
          // Try parsing structured formats first
          parsedLearningPath = parseLearningPathString(accumulatedContent);
          if (!parsedLearningPath) {
              parsedJobs = parseJobResponseString(accumulatedContent);
          }
          if (!parsedLearningPath && !parsedJobs) { // <--- Add check for Events
              parsedEvents = parseEventResponseString(accumulatedContent);
          }

           if (parsedLearningPath) console.log("Successfully parsed final content as LearningPath.");
           else if (parsedJobs) console.log("Successfully parsed final content as JobResponse.");
           else if (parsedEvents) console.log("Successfully parsed final content as EventResponse."); // <--- Log event parsing
           else console.log("Final content is not a recognized structured format. Treating as text/keyword.");
      }

      // --- Determine the final message element based on parsing results or keywords ---
      setMessages(prevMessages => {
          const updated = [...prevMessages];
          // Use the tracked index if available and valid, otherwise check the actual last message
          const lastBotMessageIndex = (currentBotMessageIndex !== -1 && updated[currentBotMessageIndex]?.sender === 'bot')
              ? currentBotMessageIndex
              : prevMessages.length - 1;
          const last = updated[lastBotMessageIndex];

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
          } else if (parsedEvents) { // <--- Add EventCard rendering
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
              // This case might be redundant if GenerateEmail function call handles it earlier
              finalContentElement = <EmailComposer />;
          }
          // No final text content needed if structured content was rendered,
          // or if text was already streamed progressively.

          // --- Update or Add Final Message ---
          if (finalContentElement) {
                // Replace the last message (which might be a spinner or partial text)
                updated[lastBotMessageIndex] = { ...last, text: finalContentElement };
          } else if (last && last.sender === 'bot') {
              // If the stream ended, and the last message is a spinner or incomplete,
              // decide whether to remove it or finalize it.
              // Check if it's a spinner element
              const isSpinner = React.isValidElement(last.text) &&
                                typeof last.text.type === 'function' && // Check if it's a functional component or class component
                                (last.text.type.name === '' || (last.text.props && last.text.props.className?.includes('animate-spin'))); // Heuristic check

              if (isSpinner && !accumulatedContent.trim()) {
                  // If it ended with only a spinner and no real content followed, replace spinner.
                  updated[lastBotMessageIndex] = { ...last, text: "(No specific response generated)" };
              } else if (!accumulatedContent.trim() && !parsedLearningPath && !parsedJobs && !parsedEvents) {
                   // If there was no content at all (maybe only function calls happened)
                   // Keep the last message as is, or potentially update it if it was a spinner.
                    if (isSpinner) {
                       updated[lastBotMessageIndex] = { ...last, text: "(Action completed)" };
                    }
              }
              // If text content was streamed, it should already be in updated[lastBotMessageIndex].text
              // No need to add parseMarkdown(accumulatedContent) again unless streaming used placeholders.
          } else if (accumulatedContent.trim()) {
             // Fallback: If somehow no bot message was added/updated during streaming,
             // but we have final text content, add it now. (Less likely with current logic)
             updated.push({ sender: 'bot', text: parseMarkdown(accumulatedContent) });
          }


          return updated;
      });
      // ----- END: Final Response Processing -----


    } catch (err) {
      console.error("Streaming error:", err);
      setMessages(prevMessages => {
        const updated = [...prevMessages];
        // Try to replace the last bot message if it exists, otherwise add new error message
         let foundBotMessage = false;
         for (let i = updated.length - 1; i >= 0; i--) {
             if (updated[i].sender === 'bot') {
                 updated[i] = { ...updated[i], text: 'Error connecting or processing the stream.' };
                 foundBotMessage = true;
                 break;
             }
         }
         if (!foundBotMessage) {
             updated.push({ sender: 'bot', text: 'Error connecting or processing the stream.' });
         }
        return updated;
      });
    } finally {
      // Reset flags if needed
      // isGeneratingReport = false; // Reset if stateful
    }
  };

  // --- handleVoiceInput, handleFileUpload ---
  const handleVoiceInput = () => {
    // --- Existing handleVoiceInput logic ---
    const recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
    if (!recognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      // Optional: Automatically send after voice input
      // handleSend(); // Consider adding this if desired UX
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        alert("No speech detected or microphone issue. Please try again.");
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };
     // --- End of Existing handleVoiceInput logic ---
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     // --- Existing handleFileUpload logic (simplified, remove confidentiality modal for now) ---
    const files = event.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    setPendingFiles(prev => [...prev, ...fileArray]); // Append selected files
     // Optionally, trigger send automatically or show notification
     setUploadNotification(`${fileArray.length} file(s) ready to attach. Type your message or send.`);
     setTimeout(() => setUploadNotification(null), 3000);
     // Reset the file input value so the same file can be selected again
     if (fileInputRef.current) {
       fileInputRef.current.value = "";
     }
      // setShowConfidentialityModal(true); // Removed for simplicity, add back if needed
     // --- End of Existing handleFileUpload logic ---
  };

 // Function to trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };


  // --- JSX Return Structure ---
  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 flex flex-col h-screen relative bg-gray-50">

        {/* Upload Notification */}
        {uploadNotification && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg z-50 text-sm border ${uploadNotification.includes('failed') || uploadNotification.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : uploadNotification.includes('Successfully') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {uploadNotification}
          </div>
        )}


        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28"> {/* Increased pb */}
          {messages.map((msg, idx) => (
            <div
              key={idx} // Using index as key; consider unique IDs if possible
              className={`flex items-start max-w-xl lg:max-w-2xl xl:max-w-3xl gap-3 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`text-2xl mt-1 ${msg.sender === 'user' ? 'text-blue-600' : 'text-indigo-600'}`}>
                {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
              </div>
              <div
                className={`px-4 py-3 rounded-lg shadow-sm text-sm relative group ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'} ${React.isValidElement(msg.text) ? 'w-full' : ''}`} // Allow components to take more width
              >
                {/* Render string or JSX elements */}
                {typeof msg.text === 'string' ? parseMarkdown(msg.text) : msg.text}

                {/* Feedback and TTS Buttons (only for bot messages containing actual content) */}
                 {msg.sender === 'bot' && typeof msg.text !== 'string' && React.isValidElement(msg.text) && !(msg.text.props && msg.text.props.className?.includes('animate-spin')) && (
                    <div className="absolute -bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                       {/* Add TextToSpeechButton here if you want it per message */}
                      {/* <TextToSpeechButton text={extractTextFromJsx(msg.text)} />  // Needs a helper function extractTextFromJsx */}

                       <button
                        onClick={() => handleFeedbackClick(idx, 'up')}
                        title="Good response"
                        className={`p-1 rounded-full text-xs ${selectedFeedback[idx] === 'up' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-500'}`}
                      >
                        <FaThumbsUp />
                      </button>
                      <button
                        onClick={() => handleFeedbackClick(idx, 'down')}
                         title="Bad response"
                         className={`p-1 rounded-full text-xs ${selectedFeedback[idx] === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                      >
                        <FaThumbsDown />
                      </button>
                    </div>
                )}
              </div>
            </div>
          ))}
          {/* Empty div to scroll to */}
          <div ref={messagesEndRef} />
        </div>


        {/* Chat Input Area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gradient-to-t from-white via-gray-50 to-gray-50 px-4 py-3">
          {/* Pending Files Preview (Optional) */}
           {pendingFiles.length > 0 && (
                <div className="max-w-3xl mx-auto mb-2 text-xs text-gray-600">
                    Attaching: {pendingFiles.map(f => f.name).join(', ')}
                    <button onClick={() => setPendingFiles([])} className="ml-2 text-red-500 hover:text-red-700 font-medium">[Clear]</button>
                </div>
            )}

          <div className="flex items-center max-w-3xl mx-auto">
             {/* Attach Button */}
            <button
              onClick={triggerFileInput} // Use the wrapper function
              className="mr-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full text-xl transition-colors duration-150 flex-shrink-0"
              title="Attach file"
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
              accept=".pdf,.doc,.docx,.txt,.csv,.md, image/*" // Specify acceptable file types
            />

            {/* Text Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isUploading ? "Uploading..." : "Ask Asha anything..."}
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isUploading} // Disable input while uploading
            />

            {/* Voice Input Button */}
            <button
              onClick={handleVoiceInput}
              className={`mr-2 p-2 rounded-full text-xl transition-colors duration-150 flex-shrink-0 ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              title={listening ? "Listening..." : "Use voice input"}
              disabled={isUploading}
            >
              <FaMicrophone />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 disabled:opacity-50 text-sm font-medium flex-shrink-0"
              disabled={(!query.trim() && pendingFiles.length === 0) || isUploading || listening} // Disable conditions
            >
              Send
            </button>
          </div>
        </div>
      </main>

       {/* Conditionally render Canvas/Report Viewer */}
       {showCanvas && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full h-3/4 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Generated Report</h2>
                    <div className="flex-grow overflow-auto border rounded p-4 bg-gray-50">
                        {/* Render the accumulated canvas content here */}
                        {/* You might need specific rendering based on the report format */}
                        <pre className="whitespace-pre-wrap text-sm">{accumulatedCanvasContent || "Generating report content..."}</pre>
                    </div>
                    <button
                        onClick={() => setShowCanvas(false)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 self-end"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}

    </div>
  );
};

export default Chat;