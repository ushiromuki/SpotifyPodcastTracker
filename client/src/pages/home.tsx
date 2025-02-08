import { useQuery } from "@tanstack/react-query";
import { PodcastCard } from "@/components/ui/podcast-card";
import { getShows } from "@/lib/spotify";

export default function Home() {
  const { data: shows, isLoading } = useQuery({
    queryKey: ["/api/spotify/shows"],
    queryFn: getShows,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Podcasts</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shows?.map((show) => (
          <PodcastCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}
