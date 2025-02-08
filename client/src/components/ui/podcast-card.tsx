import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Show } from "@/lib/spotify";

interface PodcastCardProps {
  show: Show;
}

export function PodcastCard({ show }: PodcastCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="w-full aspect-square rounded-lg overflow-hidden mb-4">
          <img 
            src={show.images[0]?.url} 
            alt={show.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardTitle className="line-clamp-1">{show.name}</CardTitle>
        <CardDescription className="line-clamp-1">{show.publisher}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {show.description}
        </p>
      </CardContent>
    </Card>
  );
}
