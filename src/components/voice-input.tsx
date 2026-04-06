"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface VoiceInputProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onResult, disabled }: VoiceInputProps) {
  const { t, locale } = useI18n();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const LOCALE_MAP: Record<string, string> = {
    nl: "nl-NL",
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = LOCALE_MAP[locale] || "nl-NL";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [locale, onResult]);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening]);

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      className={`flex items-center justify-center rounded-full transition-all disabled:opacity-50 ${
        listening
          ? "w-16 h-16 bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
          : "w-16 h-16 bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105"
      }`}
      aria-label={listening ? t.plannerVoiceListening : t.plannerVoiceStart}
    >
      {listening ? <MicOff size={28} /> : <Mic size={28} />}
    </button>
  );
}
