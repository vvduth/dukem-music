/* eslint-disable jsx-a11y/alt-text */
"use client";
import React from "react";
import {
  Download,
  Loader2,
  MoreHorizontal,
  Music,
  Pencil,
  Play,
  RefreshCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { Input } from "../ui/input";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useRouter } from "next/navigation";
import { getPlayUrl } from "~/actions/generate";

export interface Track {
  id: string;
  title: string;
  createdAt: Date;
  instrumental: boolean;
  prompt: string | null;
  lyrics: string | null;
  describedLyrics: string | null;
  fullDescribedSong: string | null;
  thumbnailUrl: string | null;
  playUrl: null;
  status: string;
  createdByUserName: string;
  published: boolean;
}
const TrackList = ({ tracks }: { tracks: Track[] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [refeshing, setRefreshing] = useState(false);
    const [loadingTrackId, setLoadingTrackId] = useState<string|null>(null)
  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTrackSelect = async (track: Track) => {
    if (loadingTrackId) {
        return;
    }
    setLoadingTrackId(track.id);
    const playUrl = await getPlayUrl(track.id);
    setLoadingTrackId(null);

    console.log("Play URL:", playUrl);
    // play the track using the obtained playUrl
  }
  return (
    <div className="flex flex-1 flex-col overflow-y-scroll">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="w4 text-muted-foreground absolute top-1/2 left-3 h-4 -translate-y-1/2" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            disabled={refeshing}
            variant={"outline"}
            onClick={() => {
              console.log("Refresh clicked");
            }}
          >
            {refeshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2" />
            )}
            Refresh
          </Button>
        </div>
        {/* lists of tracks */}
        <div className="space-y-2">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => {
              switch (track.status) {
                case "failed":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-destructive/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-md">
                        <XCircle className="h-6 w-6 text-rose-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-destructive truncate text-sm font-medium">
                          Generate failed
                        </h3>
                        <p className="text-muted-foreground truncate">
                          Please try again later.
                        </p>
                      </div>
                    </div>
                  );
                case "no-credits":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-destructive/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-md">
                        <XCircle className="h-6 w-6 text-yellow-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-destructive truncate text-sm font-medium">
                          Not enough credits
                        </h3>
                        <p className="text-muted-foreground truncate">
                          Buy more credits to generate songs.
                        </p>
                      </div>
                    </div>
                  );
                case "queued":
                case "processing":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          Processing song...
                        </h3>
                        <p className="text-muted-foreground truncate">
                          Refesh to see the latest status.
                        </p>
                      </div>
                    </div>
                  );
                default:
                  return (
                    <div
                      key={track.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors"
                      onClick={() => handleTrackSelect(track)}
                    >
                      {/* thumbnail */}
                      <div className="group relative flex h-12 w-12 shrink-0 overflow-hidden rounded-md">
                        {track.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                            className="h-full w-full object-cover"
                            src={track.thumbnailUrl}
                          />
                        ) : (
                          <div className="bg-muted flex h-full w-full items-center justify-center">
                            <Music className="text-muted-foreground h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
              }
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Music className="text-muted-foreground h-12 w-12" />
              <p className="text-muted-foreground text-center text-sm">
                No tracks found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackList;
