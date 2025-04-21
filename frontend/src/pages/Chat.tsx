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
  const parseJobResponseString = (responseString: string): Array<Record<string, any>> | null => {
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
      const pairRegex = /(\w+)\s*=\s*(?:'(.*?)'|"(\[.*?\])")/g;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(content)) !== null) {
        const key = pairMatch[1];
        const value = pairMatch[2] !== undefined ? pairMatch[2] : pairMatch[3];
        jobData[key] = value;
      }

      if (Object.keys(jobData).length > 0) {
        jobs.push(jobData);
      }
    }

    return jobs.length > 0 ? jobs : null;
  };
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
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userQuery = query; // Store the query before clearing
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setQuery('');

    try {
      const response = await fetch('/api/users/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }), // Use stored query
      });

      if (!response.ok) {
          // Handle non-2xx responses specifically if needed
          const errorText = await response.text();
          console.error("Backend error:", response.status, errorText);
          setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${response.status} - ${errorText || 'Failed to get response'}` }]);
          return; // Stop processing on error
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
      let called = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (done) break; // Exit loop if stream is finished

        const chunkValue = decoder.decode(value, { stream: true }); // Use stream: true for potentially multi-byte chars
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
                            <p><strong>Input flagged:</strong> Your message could not be processed because it was flagged for potential bias.</p>
                            {/* Optional: Add more details from dataObj.details if needed */}
                        </div>
                    )
                }]);
                // IMPORTANT: Stop processing further events for this request as the backend terminated.
                return;
            }
            // --- END: Bias Detection Handling ---


            if (dataObj.payload_type === 'values' && dataObj.error) {
              const errorMessage = dataObj.error;
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: <AccessDeniedCard
                  resource="Action Denied" // Make it more generic
                  reason={errorMessage}
                  timestamp={new Date().toLocaleString()}
                />
              }]);
              return; // Stop further processing on this specific error type as well
            }
            else if (dataObj.payload_type === 'values' && dataObj.action === 'generate_report') {
              setAccumulatedCanvasContent('');
              called = true;
            }

            if (called && dataObj.content) {
              setAccumulatedCanvasContent(prev => {
                const updatedContent = prev + dataObj.content;
                setCanvasContent(updatedContent);
                return updatedContent;
              });
              setShowCanvas(true);
            }

            if (dataObj.payload_type === 'message' && called == false) {
              const {
                content,
                function_call,
                function_name,
                tool_call,
                tool_name
              } = dataObj;

              if (function_call) {
                console.log('function_call', function_name);
                let spinnerText = '';
                switch (function_name) {
                  case 'RouteQuery':
                    spinnerText = '🔍 Retrieving relevant documents...';
                    break;
                  case 'GradeDocuments':
                    spinnerText = '📊 Re-ranking the documents...';
                    break;
                  case 'GenerateEmail':
                    // Ensure arguments are correctly parsed if they arrive partially or fully
                    let emailArgs = {};
                    if (dataObj.arguments && typeof dataObj.arguments === 'object') {
                        if (dataObj.arguments.status === 'incomplete') {
                            // Handle incomplete arguments if needed, maybe wait or show partial info
                            console.log("Incomplete email args:", dataObj.arguments.raw);
                             spinnerText = `Generating email (gathering details)...`;
                        } else {
                             // Complete arguments received
                            emailArgs = dataObj.arguments;
                            setMessages(prev => [...prev, { sender: 'bot', text: <EmailComposer initialTo={emailArgs.to} initialSubject={emailArgs.subject} initialMessage={emailArgs.body} /> }]);
                            // Decide if you should return here or let the stream continue if more info might come
                            // For now, assuming email composer means the end of this specific action
                            return;
                        }
                    } else if (dataObj.arguments && typeof dataObj.arguments === 'string') {
                         // Attempt to parse if it's a string that might become valid JSON later (less common now with the backend change)
                        console.log("Received arguments as string, might be partial:", dataObj.arguments);
                        spinnerText = `Generating email (processing details)...`;
                    } else {
                         console.warn("Received function call for GenerateEmail without expected arguments structure:", dataObj.arguments);
                         spinnerText = `Generating email...`;
                    }

                    // Only show spinner if email composer wasn't rendered yet
                    if (!emailArgs.to) { // Check if full args were processed and rendered
                        setMessages(prevMessages => {
                            const last = prevMessages[prevMessages.length - 1];
                            if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' || last.text.type === SummaryCard)) {
                                // Replace last spinner/summary card
                                const updated = [...prevMessages];
                                updated[updated.length - 1] = {
                                    ...last,
                                    text: (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                            <span>{spinnerText}</span>
                                        </div>
                                    ),
                                };
                                return updated;
                            } else {
                                // Add new spinner message
                                return [...prevMessages, {
                                    sender: 'bot',
                                    text: (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                            <span>{spinnerText}</span>
                                        </div>
                                    )
                                }];
                            }
                        });
                    }
                    break; // Break from switch case

                  default:
                    spinnerText = `Running ${function_name}...`;
                }

                // Generic spinner logic (if not handled by specific case like email)
                if(spinnerText && !emailArgs.to) { // Only show generic spinner if not handled above
                   setMessages(prevMessages => {
                      const last = prevMessages[prevMessages.length - 1];
                      if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' || last.text.type === SummaryCard)) {
                          const updated = [...prevMessages];
                          updated[updated.length - 1] = {
                              ...last,
                              text: (
                                  <div className="flex items-center gap-2 text-gray-600">
                                      <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                      <span>{spinnerText}</span>
                                  </div>
                              ),
                          };
                          return updated;
                      } else {
                           return [...prevMessages, {
                              sender: 'bot',
                              text: (
                                  <div className="flex items-center gap-2 text-gray-600">
                                      <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                      <span>{spinnerText}</span>
                                  </div>
                              ),
                          }];
                      }
                  });
                }

              } else if (tool_call) {
                setMessages(prevMessages => {
                    const spinnerText = `Using tool: ${tool_name || 'Processing'}...`;
                    const last = prevMessages[prevMessages.length - 1];
                    if (last && last.sender === 'bot' && React.isValidElement(last.text) && (last.text.type === 'div' || last.text.type === SummaryCard) ) {
                         const updated = [...prevMessages];
                         updated[updated.length - 1] = {
                              ...last,
                              text: (
                                  <div className="flex items-center gap-2 text-gray-600">
                                      <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                      <span>{spinnerText}</span>
                                  </div>
                              ),
                          };
                          return updated;
                    } else {
                         return [...prevMessages, {
                              sender: 'bot',
                              text: (
                                  <div className="flex items-center gap-2 text-gray-600">
                                      <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                      <span>{spinnerText}</span>
                                  </div>
                              ),
                          }];
                    }
                });
              } else if (content) {
                accumulatedContent += content;

                setMessages(prevMessages => {
                    const updated = [...prevMessages];
                    const last = updated.length > 0 ? updated[updated.length - 1] : null;

                    // Logic to update the last bot message if it exists and isn't a special component
                    if (last && last.sender === 'bot') {
                         // Check if the last message is the spinner or a plain text/markdown message
                         let isUpdateable = false;
                         if (typeof last.text === 'string') {
                             isUpdateable = true;
                         } else if (React.isValidElement(last.text)) {
                             // Update if it's the spinner div or the SummaryCard wrapper div
                             if (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
                                 isUpdateable = true;
                             } else if (last.text.type === 'div' && last.text.props?.children?.type === SummaryCard) {
                                 // If it's already a SummaryCard, update its content
                                 isUpdateable = true;
                             } else if (last.text.type === 'div' && !React.isValidElement(last.text.props.children)) {
                                // Handle simple div wrappers around markdown from previous updates
                                 isUpdateable = true;
                             }
                         }

                         if (isUpdateable) {
                            // Update the last message with new accumulated content, wrapped in SummaryCard
                             updated[updated.length - 1] = {
                                 ...last,
                                 text: (
                                     <div> {/* Outer div might be needed if SummaryCard isn't the only thing */}
                                         <SummaryCard
                                             title="Response"
                                             content={parseMarkdown(accumulatedContent)}
                                             timestamp={new Date().toLocaleString()}
                                         />
                                     </div>
                                 ),
                             };
                         } else {
                              // If the last message is not updateable (e.g., EmailComposer, JobCard), add a new message
                              updated.push({
                                 sender: 'bot',
                                 text: (
                                     <div>
                                         <SummaryCard
                                             title="Response"
                                             content={parseMarkdown(accumulatedContent)}
                                             timestamp={new Date().toLocaleString()}
                                         />
                                     </div>
                                 ),
                             });
                         }

                    } else {
                        // If no previous bot message exists, add a new one
                        updated.push({
                            sender: 'bot',
                            text: (
                                <div>
                                    <SummaryCard
                                        title="Response"
                                        content={parseMarkdown(accumulatedContent)}
                                        timestamp={new Date().toLocaleString()}
                                    />
                                </div>
                            ),
                        });
                    }
                    return updated;
                });
              }
            }

          } catch (err) {
            console.error("Error parsing stream chunk", err, "Data string:", dataStr);
             // Optionally display a more subtle error in the chat if chunks fail to parse
             // setMessages(prev => [...prev, { sender: 'bot', text: '(Error processing part of the response)' }]);
          }
        }
      }

      // Final response processing (after stream ends)
      // Check if the last message was a spinner and needs replacement or if specific components need rendering based on keywords.
      // This section might need adjustments based on whether the final content requires special rendering beyond the SummaryCard used during streaming.

       let parsedJobs: Array<Record<string, any>> | null = null;
       if (typeof accumulatedContent === 'string' && accumulatedContent.trim().startsWith('[JobResponse(')) {
            console.log("Attempting to parse JobResponse string:", accumulatedContent);
            parsedJobs = parseJobResponseString(accumulatedContent);
            if (parsedJobs) {
                console.log("Successfully parsed jobs:", parsedJobs);
            } else {
                console.log("Failed to parse JobResponse string.");
                // Keep accumulatedContent as is for potential fallback text display
            }
        }


       // --- Update last message or add new based on final content ---
       setMessages(prevMessages => {
            const updated = [...prevMessages];
            const last = updated.length > 0 ? updated[updated.length - 1] : null;

            let finalContentElement: JSX.Element | string | null = null;

            if (parsedJobs) {
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
                 // This case might be redundant if GenerateEmail function call handles it earlier
                 finalContentElement = <EmailComposer />;
            } else if (accumulatedContent === 'file_preview') {
                 finalContentElement = <FilePreview filename="test.csv" fileSize="10kb" fileType="xlsx" timestamp="April 5, 2025 – 9:42 AM" />;
            } else if (accumulatedContent === 'pdf_preview') {
                 finalContentElement = <PDFPreview filename="test.pdf" fileSize="1.2MB" timestamp="April 5, 2025 – 9:42 AM" />;
            }
             // Add other keyword checks if necessary

             // Fallback to displaying the accumulated text if it wasn't handled above and wasn't a special component trigger
             // Also make sure we don't overwrite component messages like JobCard/EmailComposer if they were the last real output
            else if (typeof accumulatedContent === 'string' && accumulatedContent.trim() && !called) {
                 console.log("Handling final accumulated content as text:", accumulatedContent);
                 // Wrap in SummaryCard similar to streaming updates for consistency
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


            // Update logic: Only update the last message if it was a spinner or a simple text/summary card.
            // Otherwise, add a new message.
            if (finalContentElement) {
                if (last && last.sender === 'bot') {
                    let shouldUpdateLast = false;
                    if (typeof last.text === 'string') {
                         shouldUpdateLast = true;
                    } else if (React.isValidElement(last.text)) {
                        // Check if it's the spinner or the SummaryCard wrapper
                         if (last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
                             shouldUpdateLast = true;
                         } else if (last.text.type === 'div' && last.text.props?.children?.type === SummaryCard) {
                             shouldUpdateLast = true;
                         } else if (last.text.type === 'div' && !React.isValidElement(last.text.props.children)) {
                             shouldUpdateLast = true; // Simple div wrapper from markdown
                         }
                    }

                    if (shouldUpdateLast) {
                         updated[updated.length - 1] = { ...last, text: finalContentElement };
                    } else {
                        // Last message was something specific (Email, JobCard, etc.), so add the new content after it.
                         updated.push({ sender: 'bot', text: finalContentElement });
                    }
                } else {
                     // No previous bot message or last was user message, add new.
                    updated.push({ sender: 'bot', text: finalContentElement });
                }
            } else if (!called && !accumulatedContent && last && last.sender === 'bot' && React.isValidElement(last.text) && last.text.type === 'div' && last.text.props?.className?.includes('animate-spin')) {
                 // If the stream ended with only a spinner and no content, maybe replace spinner with a generic message
                 updated[updated.length - 1] = { ...last, text: "(No further response generated)" };
            }
             else {
                 console.log("Final accumulatedContent didn't match any specific handler or was empty/canvas-related:", accumulatedContent);
             }

            return updated;
        });


    } catch (err) {
      console.error("Streaming error:", err);
      // Update the last message if it was a spinner, otherwise add a new error message
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
    }
  };

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

  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 flex flex-col h-screen relative bg-gray-50">

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
                // Optional: Add a message if closed without selection
                // setMessages(prev => [...prev, { sender: 'bot', text: 'Notion selection closed.' }]);
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
                          // Optional: Add message on close
                          // setMessages(prev => [...prev, { sender: 'bot', text: 'Dropbox selection closed.' }]);
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
                 {/* Icon suggestion (optional) <FaGlobeAmericas className="text-blue-500"/> */}
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
                 {/* Icon suggestion (optional) <FaUserLock className="text-yellow-500"/> */}
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
                 {/* Icon suggestion (optional) <FaLock className="text-red-500"/> */}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24"> {/* Added more padding bottom */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start max-w-xl lg:max-w-2xl xl:max-w-3xl gap-3 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
            >
              <div className={`text-2xl mt-1 ${msg.sender === 'user' ? 'text-blue-600' : 'text-indigo-600'}`}>
                {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
              </div>
              <div
                className={`px-4 py-2 rounded-lg shadow-sm text-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
              >
                {/* Render string or JSX elements */}
                {typeof msg.text === 'string' ? parseMarkdown(msg.text) : msg.text}
              </div>
            </div>
          ))}
           {/* Scroll anchor or observer might be needed here for auto-scrolling */}
        </div>

        {/* Chat Input Area - sticky bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gradient-to-t from-white via-gray-50 to-gray-50 px-4 py-3">
            <div className="flex items-center max-w-3xl mx-auto">
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
                disabled={!query.trim()} // Disable if query is empty
              >
                Send
              </button>
          </div>
        </div>
      </main>
      {showCanvas && (
        <Canvas
          initialTitle={canvasTitle}
          content={accumulatedCanvasContent || canvasContent} // Use accumulated content first
          onClose={handleCanvasClose}
          isVisible={showCanvas}
        />
      )}
    </div>
  );
};

export default Chat;