import { Loader2 } from "lucide-react";
import React, { Suspense } from "react";
import SongPanel from "~/components/create/song-panel";
import TrackListFetcher from "~/components/create/track-list-fetcher";

const CreatePage = () => {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <SongPanel />
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="text-muted-foreground m-auto mt-20 h-8 w-8 animate-spin" />
          </div>
        }
      >
        <TrackListFetcher />
      </Suspense>
    </div>
  );
};

export default CreatePage;
