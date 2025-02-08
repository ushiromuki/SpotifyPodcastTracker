import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Login() {
  const { toast } = useToast();
  const [location] = useLocation();

  // Parse URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");

  if (error) {
    toast({
      title: "Authentication Failed",
      description: "There was an error logging in with Spotify",
      variant: "destructive",
    });
  }

  const handleLogin = () => {
    try {
      window.location.href = "/api/auth/login";
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Podcast Stats</CardTitle>
          <CardDescription>
            View your Spotify podcast listening statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleLogin}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
          >
            Login with Spotify
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}