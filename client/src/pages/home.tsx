import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";
import { Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login");
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate login process",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-2xl text-center space-y-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8">
          <Headphones className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Analyze Your Podcast Listening Habits
        </h1>
        <p className="text-xl text-muted-foreground">
          Connect your Spotify account to discover insights about your podcast listening patterns
          and track your favorite shows.
        </p>
        <Button
          onClick={handleLogin}
          size="lg"
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
        >
          <SiSpotify className="mr-2 h-5 w-5" />
          Connect with Spotify
        </Button>
      </div>
    </div>
  );
}