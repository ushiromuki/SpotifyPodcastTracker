import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";
import { Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Home() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Initiating Spotify login...');

      const response = await fetch("/api/auth/login");
      const data = await response.json();

      console.log('Received auth URL:', data);

      if (data.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('認証URLの取得に失敗しました');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "エラー",
        description: "認証プロセスの開始に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        >
          <SiSpotify className="mr-2 h-5 w-5" />
          {isLoading ? "接続中..." : "Connect with Spotify"}
        </Button>
      </div>
    </div>
  );
}