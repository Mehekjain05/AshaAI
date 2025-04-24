import axios from 'axios';
import React from 'react';
import { useState, useRef } from 'react';
import { FaPaperclip, FaMicrophone, FaUserCircle, FaRobot, FaDropbox, FaRegFileAlt } from 'react-icons/fa';
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
// ***** START: Import LearningPathFlow and Flow Styles *****
import LearningPathFlow from '../components/LearningPathFlow';
import '@xyflow/react/dist/style.css'; // Make sure styles are imported
// ***** END: Import LearningPathFlow and Flow Styles *****

const speakText = (text: string) => {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  synth.speak(utterance);
};


const Chat: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string | JSX.Element }[]>([]);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showGDrivePicker, setShowGDrivePicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string }[]>([]);
  const [showDropboxPicker, setShowDropboxPicker] = useState(false);
  const [showNotionPicker, setShowNotionPicker] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState("Generated Report");
  const [accumulatedCanvasContent, setAccumulatedCanvasContent] = useState('');

  const [canvasContent, setCanvasContent] = useState(`
## Introduction

In an increasingly competitive and fast-paced world, **design** has emerged as a critical *differentiator*...

## Design Enhances User Experience

At its core, **design** is about *problem-solving*...

## Design Drives Business Success

Investing in **quality design** isn't just beneficial for users...
`);
  const [showConfidentialityModal, setShowConfidentialityModal] = useState(false);
  const [selectedConfidentiality, setSelectedConfidentiality] = useState('Public');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleCanvasClose = (title: string, content: string) => {
    setCanvasTitle(title);
    setCanvasContent(content);
    setShowCanvas(false);
  };

  const handleDocumentClick = () => {
    setShowCanvas(true);
  };

  // ----- START: Parsing Functions -----
  const parseJobResponseString = (responseString: string): Array<Record<string, any>> | null => {
    // --- Existing parseJobResponseString logic ---
    if (!responseString.trim().startsWith('[JobResponse(') || !responseString.trim().endsWith(')]')) {
      console.warn("String doesn't match expected JobResponse format:", responseString);
      return null;
    }

    const jobs: Array<Record<string, any>> = [];
    const jobRegex = /JobResponse\((.*?)\)/g;
    let match;

    while ((match = jobRegex.exec(responseString)) !== null) {
      const jobData: Record<string, any> = {};
      const content = match[1];
      // Adjusted regex to handle potential missing quotes or different structures slightly more robustly
      const pairRegex = /(\w+)\s*=\s*(?:'(.*?)'|"(\[.*?\])"|(\w+))/g;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(content)) !== null) {
        const key = pairMatch[1];
        // Prioritize quoted strings, then bracketed arrays, then unquoted values
        const value = pairMatch[2] !== undefined ? pairMatch[2] :
                      pairMatch[3] !== undefined ? pairMatch[3] :
                      pairMatch[4]; // Handle unquoted values like booleans or numbers if needed
        jobData[key] = value;
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
    if (!responseString.trim().startsWith('[LearningPath(') || !responseString.trim().endsWith(')]')) {
        console.warn("String doesn't match expected LearningPath format:", responseString);
        return null;
    }

    const learningPath: LearningPathStage[] = [];
    const pathRegex = /LearningPath\(stage='([^']*)',\s*topics=\[([^\]]*)\]\)/g;
    let match;

    while ((match = pathRegex.exec(responseString)) !== null) {
        const stage = match[1];
        const topicsString = match[2]; // e.g., "'Math', 'Programming', 'Statistics'"

        // Process the topics string: remove quotes and split
        const topics = topicsString
            .split(/,\s*/) // Split by comma and optional space
            .map(topic => topic.replace(/^'(.*)'$/, '$1').trim()) // Remove surrounding single quotes
            .filter(topic => topic); // Remove any empty strings resulting from split

        if (stage && topics.length > 0) {
            learningPath.push({ stage, topics });
        }
    }

    return learningPath.length > 0 ? learningPath : null;
  };
  // ----- END: Parsing Functions -----


  const handleExternalSource = (source: string) => {
    setShowUploadMenu(false);
    if (source === 'Google Drive') {
      setShowGDrivePicker(true);
      setShowNotionPicker(false);
      setShowDropboxPicker(false);

    }
    if (source === 'Dropbox') {
      setShowDropboxPicker(true);
      setShowGDrivePicker(false);
      setShowNotionPicker(false);
    }
    if (source === 'Notion') {
      setShowNotionPicker(true);
      setShowDropboxPicker(false);
      setShowGDrivePicker(false);
    }
  };

  const parseMarkdown = (text: string) => {
    // --- Existing markdown parsing logic ---
    text = text.replace("**", "<strong>").replace("**", "</strong>");
    const lines = text.split('\n');

    return (
      <div className="whitespace-pre-wrap space-y-1">
        {lines.map((line, i) => {
          if (line.trim().startsWith('* ')) {
            const content = line.replace(/^\* /, '');
            return (
              <div key={i} className="pl-4 list-disc list-inside">
                • {content}
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
        <TextToSpeechButton text={text} />
      </div>
    );
    // --- End of existing markdown parsing logic ---
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userQuery = query; // Store the query before clearing
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setQuery('');
    setAccumulatedCanvasContent(''); // Reset canvas content on new query

    try {
      const response = await fetch('/api/users/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }), // Use stored query
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
      let called = false; // Renamed from 'called' in original to avoid conflict/confusion? Assuming it meant 'canvas_called'
      let isGeneratingReport = false; // More specific flag for canvas/report generation

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
                            <p><strong>⚠️ Biased Language: </strong> {dataObj.details.validatedOutput}</p>
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
              setAccumulatedCanvasContent(prev => {
                const updatedContent = prev + dataObj.content;
                // Update canvas content directly if needed, or let the Canvas component read accumulatedCanvasContent
                // setCanvasContent(updatedContent); // This might cause rapid re-renders, maybe update less frequently or on close
                return updatedContent;
              });
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
                 // --- Existing Function Call Spinner Logic ---
                 console.log('function_call', function_name);
                 let spinnerText = '';
                 let emailArgs: any = {}; // Define emailArgs here
                 switch (function_name) {
                   case 'RouteQuery':
                     spinnerText = '🔍 Retrieving relevant documents...';
                     break;
                   case 'GradeDocuments':
                     spinnerText = '📊 Re-ranking the documents...';
                     break;
                   case 'GenerateEmail':
                     if (dataObj.arguments && typeof dataObj.arguments === 'object') {
                         if (dataObj.arguments.status === 'incomplete') {
                             console.log("Incomplete email args:", dataObj.arguments.raw);
                              spinnerText = `Generating email (gathering details)...`;
                         } else {
                             emailArgs = dataObj.arguments;
                             setMessages(prev => [...prev, { sender: 'bot', text: <EmailComposer initialTo={emailArgs.to} initialSubject={emailArgs.subject} initialMessage={emailArgs.body} /> }]);
                              // Stop stream processing for this message if email composer is shown
                              done = true;
                              reader.cancel();
                              break; // Exit inner loop
                         }
                     } else if (dataObj.arguments && typeof dataObj.arguments === 'string') {
                          console.log("Received arguments as string, might be partial:", dataObj.arguments);
                          spinnerText = `Generating email (processing details)...`;
                     } else {
                          console.warn("Received function call for GenerateEmail without expected arguments structure:", dataObj.arguments);
                          spinnerText = `Generating email...`;
                     }

                     if (!emailArgs.to) {
                         // Update/add spinner message
                         setMessages(prevMessages => {
                             // (Spinner update logic as before)
                            const last = prevMessages[prevMessages.length - 1];
                            if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' || last.text.type === SummaryCard)) {
                                const updated = [...prevMessages];
                                updated[updated.length - 1] = {
                                    ...last,
                                    text: ( <div className="flex items-center gap-2 text-gray-600"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div> ),
                                };
                                return updated;
                            } else {
                                return [...prevMessages, { sender: 'bot', text: ( <div className="flex items-center gap-2 text-gray-600"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div> ) }];
                            }
                         });
                     }
                     break; // Break from switch case

                   default:
                     spinnerText = `Running ${function_name}...`;
                 }

                 if(spinnerText && !emailArgs.to) {
                    setMessages(prevMessages => {
                       // (Generic spinner update/add logic as before)
                      const last = prevMessages[prevMessages.length - 1];
                      if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' || last.text.type === SummaryCard) ) {
                           const updated = [...prevMessages];
                           updated[updated.length - 1] = { ...last, text: ( <div className="flex items-center gap-2 text-gray-600"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div> ), };
                            return updated;
                      } else {
                           return [...prevMessages, { sender: 'bot', text: ( <div className="flex items-center gap-2 text-gray-600"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div> ), }];
                      }
                   });
                 }
                 // --- End of Function Call Spinner Logic ---

              } else if (tool_call) {
                 // --- Existing Tool Call Spinner Logic ---
                 setMessages(prevMessages => {
                     const spinnerText = `Using tool: ${tool_name || 'Processing'}...`;
                     // (Spinner update/add logic as before)
                    const last = prevMessages[prevMessages.length - 1];
                    if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' || last.text.type === SummaryCard) ) {
                         const updated = [...prevMessages];
                         updated[updated.length - 1] = { ...last, text: ( <div className="flex items-center gap-2 text-gray-600"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div> ), };
                          return updated;
                    } else {
                         return [...prevMessages, { sender: 'bot', text: ( <div className="flex items-center gap-2 text-gray-600"> <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> <span>{spinnerText}</span> </div> ), }];
                    }
                 });
                 // --- End of Tool Call Spinner Logic ---
              } else if (content) {
                // Accumulate regular content
                accumulatedContent += content;

                // Update the UI progressively with SummaryCard
                setMessages(prevMessages => {
                    const updated = [...prevMessages];
                    const last = updated.length > 0 ? updated[updated.length - 1] : null;
                    let isUpdateable = false;
                     if (last && last.sender === 'bot') {
                        // Check if last message is suitable for update (spinner or previous summary card)
                         if (typeof last.text === 'string') { isUpdateable = true; }
                         else if (React.isValidElement(last.text)) {
                             if (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) { isUpdateable = true; }
                              else if (last.text.type === 'div' && last.text.props?.children?.type === SummaryCard) { isUpdateable = true; }
                              else if (last.text.type === 'div' && !React.isValidElement(last.text.props.children)) { isUpdateable = true; }
                         }
                     }

                     const newContentElement = (
                         <div>
                             <SummaryCard
                                 title="Response"
                                 content={parseMarkdown(accumulatedContent)}
                                 timestamp={new Date().toLocaleString()}
                             />
                         </div>
                     );

                     if (isUpdateable && last) {
                         updated[updated.length - 1] = { ...last, text: newContentElement };
                     } else {
                         updated.push({ sender: 'bot', text: newContentElement });
                     }
                    return updated;
                });
              }
            }

          } catch (err) {
            console.error("Error parsing stream chunk", err, "Data string:", dataStr);
          }
          if(done) break; // Exit outer loop if done flag was set inside
        } // end for loop over events
      } // end while(!done) loop for reader

      // ----- START: Final Response Processing (After Stream Ends) -----
      console.log("Stream finished. Final accumulated content:", accumulatedContent);
      console.log("Was generating report:", isGeneratingReport);

       // If generating a report, the canvas handles the display based on accumulatedCanvasContent.
       // No need to add a final message here unless explicitly desired (e.g., "Report generated.")
       if (isGeneratingReport) {
           console.log("Final processing skipped as report was generated in canvas.");
           // Optional: Update canvas content one last time if needed, or add a simple "Done" message.
           setCanvasContent(accumulatedCanvasContent); // Ensure final canvas content is set
           return; // Stop further processing in chat messages
       }


       // Attempt to parse specific formats from the *final* accumulated content
       let parsedLearningPath: LearningPathStage[] | null = null;
       let parsedJobs: Array<Record<string, any>> | null = null;

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
                    console.log("Final content is neither LearningPath nor JobResponse. Treating as text or keyword.");
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
            } else if (accumulatedContent === 'show_calendar') {
                finalContentElement = <CalendarPopup />;
            } else if (accumulatedContent === 'email_composer') {
                 finalContentElement = <EmailComposer />;
            } else if (accumulatedContent === 'file_preview') {
                 finalContentElement = <FilePreview filename="test.csv" fileSize="10kb" fileType="xlsx" timestamp="April 5, 2025 – 9:42 AM" />;
            } else if (accumulatedContent === 'pdf_preview') {
                 finalContentElement = <PDFPreview filename="test.pdf" fileSize="1.2MB" timestamp="April 5, 2025 – 9:42 AM" />;
            }
             // Fallback: If content exists but didn't match special formats/keywords, display it using SummaryCard
            else if (typeof accumulatedContent === 'string' && accumulatedContent.trim()) {
                 console.log("Handling final accumulated content as text in SummaryCard:", accumulatedContent);
                 finalContentElement = (
                     <div>
                         <SummaryCard
                             title="Final Response"
                             content={parseMarkdown(accumulatedContent)}
                             timestamp={new Date().toLocaleString()}
                         />
                     </div>
                 );
            }


            // --- Update last message or add new based on final content ---
            if (finalContentElement) {
                let shouldUpdateLast = false;
                if (last && last.sender === 'bot') {
                    // Check if last message was a spinner or a progressively updated SummaryCard
                    if (typeof last.text === 'string') { shouldUpdateLast = true; }
                     else if (React.isValidElement(last.text)) {
                         if (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) { shouldUpdateLast = true; }
                          else if (last.text.type === 'div' && last.text.props?.children?.type === SummaryCard) { shouldUpdateLast = true; } // Updated during stream
                          else if (last.text.type === 'div' && !React.isValidElement(last.text.props.children)) { shouldUpdateLast = true; }
                    }
                }

                if (shouldUpdateLast && last) {
                     updated[updated.length - 1] = { ...last, text: finalContentElement };
                } else {
                    // Add as a new message if last wasn't updateable or didn't exist
                    updated.push({ sender: 'bot', text: finalContentElement });
                }
            } else if (last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin') && !accumulatedContent) {
                 // If stream ended with only a spinner and no content, replace spinner
                 updated[updated.length - 1] = { ...last, text: "(No specific response generated)" };
            } else {
                 console.log("No final content element generated for accumulated content:", accumulatedContent);
                 // Optionally remove a spinner if it's the last message and no content followed
                  if (last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
                      updated.pop(); // Remove the spinner if nothing replaced it
                  }
            }

            return updated;
        });
      // ----- END: Final Response Processing -----


    } catch (err) {
      console.error("Streaming error:", err);
       setMessages(prevMessages => {
           const updated = [...prevMessages];
           const last = updated.length > 0 ? updated[updated.length - 1] : null;
           const errorText = 'Error connecting to the backend or processing the stream.';

           if (last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
                updated[updated.length - 1] = { ...last, text: errorText };
           } else {
                updated.push({ sender: 'bot', text: errorText });
           }
           return updated;
       });
    } finally {
        // Reset flags after processing is complete or errored
        // setIsGeneratingReport(false); // This state isn't used outside handleSend, but good practice if it were
    }
  };

  // --- handleVoiceInput, handleFileUpload, submitFilesWithConfidentiality remain unchanged ---
  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      // Optional: Automatically send after voice input
      // handleSend(); // Consider adding this if desired UX
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
    };
    recognition.onend = () => {
        setListening(false);
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    setPendingFiles(fileArray);
    setShowConfidentialityModal(true);
  };

  const submitFilesWithConfidentiality = async (confidentiality: string) => {
    setShowConfidentialityModal(false);
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setUploadNotification(`Uploading ${pendingFiles.length} file(s)...`); // Immediate feedback

    const formData = new FormData();
    pendingFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('confidentiality', confidentiality);

    try {
      const res = await axios.post('/api/upload-docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 200) {
          const uploaded = pendingFiles.map((file) => ({
              id: file.name + Date.now(), // Add timestamp for potentially unique ID
              name: file.name,
             // confidentiality, // No need to store this locally unless required elsewhere
            }));
            setUploadedFiles((prev) => [...prev, ...uploaded]);
            setUploadNotification(`${pendingFiles.length} file(s) uploaded successfully (${confidentiality}).`);
            setMessages(prev => [...prev, { sender: 'bot', text: `${pendingFiles.length} file(s) (${pendingFiles.map(f => f.name).join(', ')}) uploaded as ${confidentiality}.` }]);
      } else {
           // Handle non-200 success codes if API returns them
            setUploadNotification(`Upload partially failed or returned unexpected status: ${res.status}.`);
      }

      setPendingFiles([]); // Clear pending files only on success or handled failure

    } catch (error: any) {
        console.error("Upload error:", error);
        let errorMsg = 'Upload failed.';
        if (error.response) {
            errorMsg = `Upload failed: ${error.response.data?.error || error.response.statusText}`;
        } else if (error.request) {
            errorMsg = 'Upload failed: No response from server.';
        }
        setUploadNotification(errorMsg);
        // Keep pendingFiles so the user can retry if needed, or clear them based on desired UX
        // setPendingFiles([]);
    } finally {
        setIsUploading(false);
         setTimeout(() => setUploadNotification(null), 5000); // Longer timeout for notifications
    }
  };

  // --- JSX Return Structure remains the same ---
  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 flex flex-col h-screen relative bg-gray-50">

        {/* --- Existing Modals/Pickers (GDrive, Notion, Dropbox, UploadNotification, ConfidentialityModal) --- */}
        {showGDrivePicker && (
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl w-full">
              <GDrivePicker
                onFilesSelected={async (files) => {
                 setShowGDrivePicker(false); // Close picker immediately
                  if (files && files.length > 0) {
                     setMessages(prev => [...prev, { sender: 'bot', text: `Attempting to import ${files.length} file(s) from Google Drive...` }]);
                      try {
                          // Assuming backend handles the actual download/processing via /api/upload-docs or a dedicated endpoint
                          const res = await axios.post('/api/upload-docs', { files: files, source: 'gdrive' }); // Send identifiers to backend
                          if (res.status === 200) {
                              const successfulFiles = res.data.successful_files || files; // Use backend response if available
                              setUploadedFiles(prev => [...prev, ...successfulFiles]); // Update local state if needed
                              setMessages(prev => [...prev, { sender: 'bot', text: `Successfully imported ${successfulFiles.length} file(s) from Google Drive.` }]);
                          } else {
                               setMessages(prev => [...prev, { sender: 'bot', text: `Failed to import data from Google Drive. Status: ${res.status}` }]);
                          }
                      } catch (error: any) {
                           console.error("GDrive import error:", error);
                           setMessages(prev => [...prev, { sender: 'bot', text: `Failed to import data from Google Drive: ${error.message}` }]);
                      }
                  } else {
                      setMessages(prev => [...prev, { sender: 'bot', text: 'Google Drive selection cancelled or no files chosen.' }]);
                  }

                }}
                 onCancel={() => {
                    setShowGDrivePicker(false);
                    setMessages(prev => [...prev, { sender: 'bot', text: 'Google Drive selection cancelled.' }]);
                 }}
              />
            </div>
          </div>
        )}


        {showNotionPicker && (
          <div className="absolute inset-0 bg-white z-40 overflow-auto p-4">
            <NotionPicker
              onPageSelected={async (pages) => {
                setShowNotionPicker(false); // Close picker
                 if (pages && pages.length > 0) {
                    setMessages(prev => [...prev, { sender: 'bot', text: `Attempting to import ${pages.length} page(s) from Notion...` }]);
                    try {
                      // Endpoint might be different or might use the same one with a source indicator
                      const res = await axios.post('/api/upload-docs', { pages: pages, source: 'notion' });
                      if (res.status === 200) {
                           const successfulPages = res.data.successful_pages || pages;
                           setUploadedFiles(prev => [...prev, ...successfulPages.map(p => ({ id: p.id, name: p.title || p.id }))]); // Adapt based on Notion data structure
                           setMessages(prev => [...prev, { sender: 'bot', text: `Successfully imported ${successfulPages.length} page(s) from Notion.` }]);
                      } else {
                        setMessages(prev => [...prev, { sender: 'bot', text: `Failed to import from Notion. Status: ${res.status}` }]);
                      }
                    } catch (error: any) {
                      console.error("Notion import error:", error);
                      setMessages(prev => [...prev, { sender: 'bot', text: `Notion import failed: ${error.message}` }]);
                    }
                 } else {
                     setMessages(prev => [...prev, { sender: 'bot', text: 'Notion selection cancelled or no pages chosen.' }]);
                 }

              }}
              onClose={() => {
                setShowNotionPicker(false);
                }}
            />
          </div>
        )}




        {showDropboxPicker && (
           <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-30 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl w-full">
                   <DropboxPicker
                      onFilesSelected={async (files) => {
                         setShowDropboxPicker(false); // Close picker
                          if (files && files.length > 0) {
                              setMessages(prev => [...prev, { sender: 'bot', text: `Attempting to import ${files.length} file(s) from Dropbox...` }]);
                              try {
                                  // Use the same endpoint or a specific one, indicating the source
                                  const res = await axios.post('/api/upload-docs', { files: files, source: 'dropbox' }); // Send file info to backend
                                  if (res.status === 200) {
                                      const successfulFiles = res.data.successful_files || files;
                                      setUploadedFiles(prev => [...prev, ...successfulFiles]); // Update local state
                                      setMessages(prev => [...prev, { sender: 'bot', text: `Successfully imported ${successfulFiles.length} file(s) from Dropbox.` }]);
                                  } else {
                                      setMessages(prev => [...prev, { sender: 'bot', text: `Failed to import Dropbox data. Status: ${res.status}` }]);
                                  }
                              } catch (error: any) {
                                   console.error("Dropbox import error:", error);
                                   setMessages(prev => [...prev, { sender: 'bot', text: `Dropbox import failed: ${error.message}` }]);
                              }
                          } else {
                              setMessages(prev => [...prev, { sender: 'bot', text: 'Dropbox selection cancelled or no files chosen.' }]);
                          }
                      }}
                      onClose={() => {
                          setShowDropboxPicker(false);
                      }}
                   />
               </div>
           </div>
        )}


        {uploadNotification && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-md z-50 text-sm ${uploadNotification.includes('failed') || uploadNotification.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {uploadNotification}
          </div>
        )}

        {showConfidentialityModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Select Document Confidentiality</h3>
              <p className="text-sm text-gray-600 mb-4">Choose the appropriate level for the file(s): {pendingFiles.map(f => f.name).join(', ')}</p>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => submitFilesWithConfidentiality('Public')}
                  className="w-full text-left p-3 rounded hover:bg-blue-50 bg-gray-50 border border-gray-200 transition-colors duration-150 flex items-center gap-3"
                  disabled={isUploading}
                >
                 <div>
                    <span className='font-medium text-gray-700'>Public</span>
                    <p className="text-xs text-gray-500">Accessible by anyone, no restrictions.</p>
                 </div>
                </button>
                <button
                  onClick={() => submitFilesWithConfidentiality('Restricted')}
                  className="w-full text-left p-3 rounded hover:bg-yellow-50 bg-gray-50 border border-gray-200 transition-colors duration-150 flex items-center gap-3"
                   disabled={isUploading}
               >
                  <div>
                    <span className='font-medium text-gray-700'>Restricted</span>
                    <p className="text-xs text-gray-500">Accessible only by authorized internal users.</p>
                 </div>
                </button>
                <button
                  onClick={() => submitFilesWithConfidentiality('Confidential')}
                  className="w-full text-left p-3 rounded hover:bg-red-50 bg-gray-50 border border-gray-200 transition-colors duration-150 flex items-center gap-3"
                  disabled={isUploading}
                >
                  <div>
                    <span className='font-medium text-gray-700'>Confidential</span>
                    <p className="text-xs text-gray-500">Highly sensitive, requires specific clearance.</p>
                 </div>
                </button>
                 <button
                  onClick={() => { setShowConfidentialityModal(false); setPendingFiles([]); }} // Cancel option
                  className="w-full text-center mt-3 p-2 rounded text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                   disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
              {isUploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <span className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                  <span>Uploading... Please wait.</span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24"> {/* Ensure padding-bottom */}
          {messages.map((msg, idx) => (
            <div
            key={idx} // Consider more stable keys if messages can be reordered/deleted
            className={`flex items-start max-w-xl lg:max-w-2xl xl:max-w-3xl gap-3 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
          >
            <div className={`text-2xl mt-1 ${msg.sender === 'user' ? 'text-blue-600' : 'text-indigo-600'}`}>
              {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
            </div>
            <div
              className={`px-4 py-2 rounded-lg shadow-sm text-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
                } ${React.isValidElement(msg.text) ? 'w-full' : ''}`} // Allow components to take more width if needed
            >
              {/* Render string or JSX elements */}
              {typeof msg.text === 'string' ? parseMarkdown(msg.text) : msg.text}
            </div>
          </div>
          ))}
           {/* Add a ref here if you need manual scroll control */}
        </div>


        {/* Chat Input Area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gradient-to-t from-white via-gray-50 to-gray-50 px-4 py-3">
            <div className="flex items-center max-w-3xl mx-auto">
               {/* --- Existing Input Elements (Attach, Input, Voice, Send) --- */}
                <div className="relative">
                    <button
                    onClick={() => setShowUploadMenu(prev => !prev)}
                    className="mr-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full text-xl transition-colors duration-150"
                    title="Attach file"
                    >
                    <FaPaperclip />
                    </button>

                    {showUploadMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 shadow-lg rounded-md z-20 w-56 text-sm overflow-hidden">
                        <button
                        onClick={() => {
                            fileInputRef.current?.click();
                            setShowUploadMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                        >
                        <FaRegFileAlt className="text-gray-500" /> Upload Document
                        </button>
                        <div className="border-t border-gray-100 px-4 py-1.5 text-xs text-gray-400 font-medium">
                        Use Other Sources
                        </div>
                        <button
                        onClick={() => handleExternalSource('Google Drive')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                        >
                        <FcGoogle /> Google Drive
                        </button>
                        <button
                        onClick={() => handleExternalSource('Dropbox')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                        >
                        <FaDropbox className="text-blue-600" /> Dropbox
                        </button>
                        <button
                        onClick={() => handleExternalSource('Notion')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                        >
                        <SiNotion className="text-black" /> Notion
                        </button>
                    </div>
                    )}

                    <input
                    type="file"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.csv,.md" // Specify acceptable file types
                    />
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask Asha anything..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} // Send on Enter, allow Shift+Enter for newline
                />

                <button
                    onClick={handleVoiceInput}
                    className={`mr-2 p-2 rounded-full text-xl transition-colors duration-150 ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={listening? "Listening..." : "Use voice input"}
                >
                    <FaMicrophone />
                </button>

                <button
                    onClick={handleSend}
                    className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 disabled:opacity-50 text-sm font-medium"
                    disabled={!query.trim() || isUploading} // Also disable send while uploading
                >
                    Send
                </button>
            </div>
        </div>
      </main>
      {/* Canvas - only render if showCanvas is true */}
      {showCanvas && (
        <Canvas
          initialTitle={canvasTitle}
          // Pass the dynamically updated content for the canvas
          content={accumulatedCanvasContent || canvasContent}
          onClose={handleCanvasClose}
          isVisible={showCanvas}
        />
      )}
    </div>
  );
};

export default Chat;