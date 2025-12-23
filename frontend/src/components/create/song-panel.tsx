"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Switch } from "../ui/switch";

const SongPanel = () => {
  const [mode, setMode] = useState<"simple" | "custom">("simple");
  const [description, setDescription] = useState<string>("");
  const [instrumental, setInstrumental] = useState<boolean>(false);
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
          </TabsContent>
          <TabsContent value="custom"></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SongPanel;
