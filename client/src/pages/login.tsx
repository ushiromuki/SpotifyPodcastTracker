import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SiSpotify } from "react-icons/si";
import { useState } from "react";

export default function Login() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [_location] = useLocation();

  // Parse URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");

  if (error) {
    toast({
      title: "認証エラー",
      description: "Spotifyでのログインに失敗しました。もう一度お試しください。",
      variant: "destructive",
    });
  }

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login");
      const data = await response.json();

      if (data.url) {
        console.log('Redirecting to Spotify auth URL:', data.url);
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Podcast Stats</CardTitle>
          <CardDescription>
            Spotifyアカウントでログインしてポッドキャストの統計を見る
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
          >
            <SiSpotify className="mr-2 h-5 w-5" />
            {isLoading ? "ログイン中..." : "Spotifyでログイン"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}