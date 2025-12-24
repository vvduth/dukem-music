"use server"

import { auth } from "~/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
export async function setPublishStatus(songId: string, published: boolean) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) redirect("/auth/login");
    await db.song.update({
        where: {
            id: songId,
            userId: session.user.id,
        },
        data: { 
            published: published,
        }
    })
    revalidatePath("/create");
}

export const renameSong = async (songId: string, newTitle: string) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) redirect("/auth/login");
    await db.song.update({
        where: {
            id: songId,
            userId: session.user.id,
        },
        data: { 
            title: newTitle,
        }
    })
    revalidatePath("/create");  
}

export async function toggleLikeSong(songId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/login");

  const existingLike = await db.like.findUnique({
    where: {
      userId_songId: {
        userId: session.user.id,
        songId,
      },
    },
  });

  if (existingLike) {
    await db.like.delete({
      where: {
        userId_songId: {
          userId: session.user.id,
          songId,
        },
      },
    });
  } else {
    await db.like.create({
      data: {
        userId: session.user.id,
        songId,
      },
    });
  }

  revalidatePath("/");
}