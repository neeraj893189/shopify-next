"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import ChatMessage from "./ChatMessage";


type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};


export default function ChatWindow() {

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);


  // ------------------------------------------------
  // Automatically scroll when new messages arrive
  // ------------------------------------------------

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);


  // ------------------------------------------------
  // Send Message
  // ------------------------------------------------

  const sendMessage = async () => {

    const message = input.trim();

    if (!message || loading) {
      return;
    }


    // ----------------------------------------------
    // Create user's message
    // ----------------------------------------------

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };


    // Immediately display user's message
    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);


    // Clear input
    setInput("");


    // Show loading indicator
    setLoading(true);


    try {

      // --------------------------------------------
      // Create conversation history
      // --------------------------------------------

      const conversation = [
        ...messages,
        userMessage,
      ].map((message) => ({
        role: message.role,
        content: message.content,
      }));


      // --------------------------------------------
      // Call FastAPI
      // --------------------------------------------

      const response = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            messages: conversation,
          }),
        }
      );


      if (!response.ok) {
        throw new Error(
          `Chat request failed: ${response.status}`
        );
      }


      // --------------------------------------------
      // Read AI response
      // --------------------------------------------

      const data = await response.json();


      // --------------------------------------------
      // Create assistant message
      // --------------------------------------------

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
      };


      // --------------------------------------------
      // Display AI response
      // --------------------------------------------

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);

    } catch (error) {

      console.error(
        "Chat request failed:",
        error
      );


      // --------------------------------------------
      // Show error inside chat
      // --------------------------------------------

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I couldn't process your request. Please try again.",
      };


      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);

    } finally {

      setLoading(false);

    }
  };


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <div
      className="
        flex
        h-[500px]
        w-[360px]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-2xl
      "
    >

      {/* ------------------------------------------
          Header
      ------------------------------------------- */}

      <div
        className="
          border-b
          bg-black
          px-5 py-4
          text-white
        "
      >
        <h2 className="font-semibold">
          AI Store Assistant
        </h2>

        <p className="text-xs text-gray-300">
          Ask about products, shipping and returns
        </p>
      </div>


      {/* ------------------------------------------
          Messages
      ------------------------------------------- */}

      <div
        className="
          flex-1
          space-y-3
          overflow-y-auto
          p-4
        "
      >

        {/* Welcome message */}

        {messages.length === 0 && (
          <ChatMessage
            role="assistant"
            content="Hi! How can I help you today?"
          />
        )}


        {/* Conversation */}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}


        {/* AI Loading */}

        {loading && (
          <div className="flex justify-start">

            <div
              className="
                rounded-2xl
                bg-gray-100
                px-4 py-2
                text-sm
                text-gray-500
              "
            >
              Thinking...
            </div>

          </div>
        )}


        {/* Used for automatic scrolling */}

        <div ref={messagesEndRef} />

      </div>


      {/* ------------------------------------------
          Input
      ------------------------------------------- */}

      <div className="border-t p-3">

        <div className="flex items-center gap-2">

          <input
            value={input}

            onChange={(event) =>
              setInput(event.target.value)
            }

            onKeyDown={(event) => {

              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                sendMessage();
              }

            }}

            disabled={loading}

            placeholder="Ask something..."

            className="
              flex-1
              rounded-xl
              border
              border-gray-300
              px-4 py-2
              text-sm
              text-black
              outline-none
              focus:border-black
              disabled:bg-gray-100
            "
          />


          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="
              flex
              h-10 w-10
              items-center justify-center
              rounded-xl
              bg-black
              text-white
              transition
              hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Send size={18} />
          </button>

        </div>

      </div>

    </div>
  );
}