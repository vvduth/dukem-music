/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import { usePlayerStore } from "~/stores/user-player-store";
import { Card } from "./ui/card";
import { Music } from "lucide-react";
const Soundbar = () => {
  const { track } = usePlayerStore();
  return (
    <div className="px-4 pb-2">
      <Card className="bg-background/60 relative w-full shrink-0 border-t py-0 backdrop-blur">
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
                {track?.artwork ? (
                  <img
                    className="h-full w-full rounded-md object-cover"
                    src={track.artwork}
                  />
                ) : (
                  <Music className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="max-w-24 min-w-0 flex-1 md:max-w-full">
                <p className="truncate text-sm font-medium">{track?.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {track?.createdByUserName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Soundbar;
