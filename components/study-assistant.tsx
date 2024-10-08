'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useChat, Message } from 'ai/react'
import { Mic, StopCircle, Upload, Trash2 } from 'lucide-react'

export function StudyAssistantComponent() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [pdfText, setPdfText] = useState('')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const initialSystemMessage: Message = {
    id: 'system-message-1',
    role: 'system',
    content: `
    You are a helpful study assistant. If the user asks a question, provide a direct, straight-to-the-point answer. 
    If no question is asked, give your insights in concise, easy-to-understand points. Avoid unnecessary details.`
  }

  const { messages, input, handleInputChange, handleSubmit, setMessages, setInput } = useChat({
    api: '/api/chat',
    initialMessages: [initialSystemMessage],
  })

  useEffect(() => {
    handleInputChange({ target: { value: `Transcript: ${transcript}\n\nPDF Context:  ${pdfText}` } } as React.ChangeEvent<HTMLTextAreaElement>)
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
    setIsProcessing(true)
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
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // const file = event.target.files?.[0];
    // if (!file) return;

    // pdfToText(file)
    //   .then((fullText) => {
    //     setPdfText(fullText);
    //   })
    //   .catch((error) => console.error("Failed to extract text from pdf", error));
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit(e, {
      options: {
        body: { pdfContext: pdfText, transcript }
      }
    })
  }

  const clearInput = () => {
    setInput('')
    setTranscript('')
    setPdfText('')
  }

  const clearOutput = () => {
    setMessages([initialSystemMessage])
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
              {/* <label htmlFor="pdf-upload">
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
              /> */}
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <StopCircle className="mr-2" /> : <Mic className="mr-2" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <Button onClick={clearInput} variant="outline">
                <Trash2 className="mr-2" />
                Clear Input
              </Button>
            </div>
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Transcript and PDF content will appear here..."
              className="h-40"
            />
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Conversation</h3>
              <Button onClick={clearOutput} variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Output
              </Button>
            </div>
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
            <Button
              type="submit"
              className={`w-full ${isProcessing ? 'bg-yellow-500' : 'bg-green-500'}`}
              disabled={isRecording || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Get Answer'}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}