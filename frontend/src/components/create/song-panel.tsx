"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2, Music, Plus } from "lucide-react";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { generateSongs, type GenerateRequest } from "~/actions/generate";

const inspirationTags = [
  "Chill",
  "Energetic",
  "Melancholic",
  "Uplifting",
  "80s synth-pop",
  "Acoustic ballad",
  "Epic movie score",
  "Funky groove",
  "Summer beach vibes",
  "Driving rock anthem",
];

const stylesTags = [
  "Industrial rave",
  "Heavy bass",
  "Orchestral",
  "Electronic beats",
  "Funky guitar",
  "Soulful vocals",
  "Ambient pads",
  "Jazz fusion",
  "Reggae rhythm",
  "Classical piano",
];

const SongPanel = () => {
  const [mode, setMode] = useState<"simple" | "custom">("simple");
  const [description, setDescription] = useState<string>("");
  const [instrumental, setInstrumental] = useState<boolean>(false);
  const [lyricsMode, setLyricsMode] = useState<"write" | "auto">("write");
  const [lyrics, setLyrics] = useState("");
  const [styleInput, setStyleInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInspirationTagClick = (tag: string) => {
    const currentTags = description
      .split(", ")
      .map((t) => t.trim())
      .filter((t) => t);
    if (!currentTags.includes(tag)) {
      if (description.trim() === "") {
        setDescription(tag);
      } else {
        setDescription(description + ", " + tag);
      }
    }
  };

  const handleStyleTagClick = (tag: string) => {
    const currentTags = styleInput
      .split(", ")
      .map((t) => t.trim())
      .filter((t) => t);
    if (!currentTags.includes(tag)) {
      if (styleInput.trim() === "") {
        setStyleInput(tag);
      } else {
        setStyleInput(styleInput + ", " + tag);
      }
    }
  };
  const handleCreateSong = async () => {
    if (mode === "simple" && !description.trim()) {
      toast.error("Please provide a description for your song.");
      return;
    }
    if (mode === "custom" && !styleInput.trim()) {
      toast.error("Please provide a style description for your song.");
      return;
    }

    // generate song logic here
    let requestBody: GenerateRequest;
    if (mode === "simple") {
      requestBody = {
        fullDescribedSong: description,
        instrumental: instrumental,
      };
    } else {
      const prompt = styleInput;
      if (lyricsMode === "write") {
        requestBody = {
          prompt: prompt,
          lyrics: lyrics,
          instrumental: instrumental,
        };
      } else {
        requestBody = {
          prompt: prompt,
          describedLyrics: lyrics,
          instrumental: instrumental,
        };
      }
    }

    try {
      setLoading(true);
      await generateSongs(requestBody);
      setDescription("");
      setLyrics("");
      setStyleInput("");
    } catch (error:any) {
      toast.error("An error occurred while generating the song.");
      console.error("Song generation error:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-muted/30 flex w-full flex-col border-r lg:w-80">
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "simple" | "custom")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-6 space-y-6" value="simple">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Describe you song</label>
              <Textarea
                className="min-h-[120px] resize-none"
                placeholder="A dreamy lofi hiphop song perfect for studying or relaxing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {/* lyrics button and instrumental toggler */}
            <div className="flex items-center justify-between">
              <Button
                variant={"outline"}
                size={"sm"}
                onClick={() => setMode("custom")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Lyrics
              </Button>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Instrumental</label>
                <Switch
                  checked={instrumental}
                  onCheckedChange={(checked) => setInstrumental(checked)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Inspiration</label>
              <div className="w-full overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {inspirationTags.map((tag) => (
                    <Button
                      variant={"outline"}
                      size={"sm"}
                      className="flex h-7 shrink-0 bg-transparent text-xs"
                      key={tag}
                      onClick={() => handleInspirationTagClick(tag)}
                    >
                      <Plus className="mr-1" /> {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="custom" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Lyrics</label>
                <div className="flex items-center gap-1">
                  <Button
                    variant={lyricsMode === "auto" ? "secondary" : "ghost"}
                    size={"sm"}
                    className="h-7 text-xs"
                    onClick={() => {
                      setLyricsMode("auto");
                      setLyrics("");
                    }}
                  >
                    <Plus className="mr-1" /> Auto
                  </Button>
                  <Button
                    variant={lyricsMode === "auto" ? "secondary" : "ghost"}
                    size={"sm"}
                    className="h-7 text-xs"
                    onClick={() => {
                      setLyricsMode("write");
                      setLyrics("");
                    }}
                  >
                    <Plus className="mr-1" /> Write
                  </Button>
                </div>
              </div>
              <Textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="min-h-[120px] resize-none"
                placeholder={
                  lyricsMode === "write"
                    ? "Write your lyrics here..."
                    : "Description of the lyrics you want (e.g., a sad love song about lost memories)..."
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Instrumental</label>
              <Switch
                checked={instrumental}
                onCheckedChange={(checked) => setInstrumental(checked)}
              />
            </div>
            {/* styles */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Styles</label>
              <Textarea
                placeholder="Enter style tags"
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="w-full overflow-auto whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {stylesTags.map((tag) => (
                    <Badge
                      variant={"secondary"}
                      className="hover:bg-secondary/80 shrink-0 cursor-pointer text-xs"
                      key={tag}
                      onClick={() => handleStyleTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="border-t p-4">
        <Button
          className="w-full cursor-pointer bg-linear-to-r from-purple-500 to-indigo-600 text-white"
          disabled={loading === true}
          onClick={handleCreateSong}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {" "}
              <Music className="mr-2 h-4 w-4" /> Generate Song{" "}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SongPanel;
