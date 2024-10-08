'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useChat } from 'ai/react'
import { Mic, StopCircle, Upload } from 'lucide-react'
import pdfToText from "react-pdftotext";


export function StudyAssistantComponent() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [pdfText, setPdfText] = useState('')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        role: 'system',
        content: `
        You are a helpful study assistant. If the user asks a question, provide the answer in clear bullet points. 
        If no question is asked, give your insights in easily understood bullet points. Keep the explanation concise and simple.`
      }
    ],
  })


  useEffect(() => {
    handleInputChange({ target: { value: `Transcript: ${transcript}\n\nPDF Context: ${pdfText}` } } as React.ChangeEvent<HTMLTextAreaElement>)
  }, [transcript, pdfText, handleInputChange])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        sendAudioToTranscriptionService(audioBlob)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToTranscriptionService = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { text } = await response.json()
        setTranscript(text)
      } else {
        console.error('Transcription failed', response)
      }
    } catch (error) {
      console.error('Error sending audio for transcription:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    pdfToText(file)
      .then((fullText) => {
        setPdfText(fullText);  // Set the extracted text to the pdfText state
      })
      .catch((error) => console.error("Failed to extract text from pdf", error));
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit(e, {
      options: {
        body: { pdfContext: pdfText, transcript }
      }
    })
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Study Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <StopCircle className="mr-2" /> : <Mic className="mr-2" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <label htmlFor="pdf-upload">
                <Button asChild>
                  <span>
                    <Upload className="mr-2" />
                    Upload PDF
                  </span>
                </Button>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Transcript and PDF content will appear here..."
              className="h-40"
            />
            <div className="border p-4 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                  <strong>{message.role === 'user' ? 'You: ' : 'Assistant: '}</strong>
                  {message.content}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleChatSubmit} className="w-full">
            <Button type="submit" className="w-full">
              Get Answer
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}