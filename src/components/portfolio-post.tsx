"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface PortfolioPostProps {
  post: {
    url: string;
    type: string;
    caption?: string;
  };
}

export function PortfolioPost({ post }: PortfolioPostProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {post.type === "image" ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={post.url}
              alt={post.caption || "Portfolio"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-neutral-800 flex items-center justify-center">
            <p className="text-white/50">Vidéo</p>
          </div>
        )}
        {post.caption && (
          <div className="p-4">
            <p className="text-sm text-white/70">{post.caption}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

