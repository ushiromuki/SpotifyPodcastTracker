import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/ui/stats-card";
import { getPlayedEpisodes } from "@/lib/spotify";

export default function Stats() {
  const { data: episodes, isLoading } = useQuery({
    queryKey: ["/api/spotify/episodes/played"],
    queryFn: getPlayedEpisodes,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const totalTime = episodes?.reduce((acc, ep) => acc + ep.duration_ms, 0) || 0;
  const totalHours = Math.round(totalTime / (1000 * 60 * 60));
  
  const showCounts = episodes?.reduce((acc, ep) => {
    acc[ep.name] = (acc[ep.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostListened = Object.entries(showCounts || {})
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Listening Stats</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Listening Time"
          value={`${totalHours}h`}
          description="Total hours spent listening to podcasts"
        />
        <StatsCard
          title="Episodes Played"
          value={episodes?.length || 0}
          description="Number of podcast episodes played"
        />
        {mostListened && (
          <StatsCard
            title="Most Listened Show"
            value={mostListened[0]}
            description={`Played ${mostListened[1]} times`}
          />
        )}
      </div>
    </div>
  );
}
