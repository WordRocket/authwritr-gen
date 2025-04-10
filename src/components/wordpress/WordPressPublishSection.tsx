
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WordPressPublishButton from './WordPressPublishButton';
import { useAuth } from '@/context/AuthContext';
import { getWordPressSettings } from '@/services/wordpressService';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WordPressPublishSectionProps {
  title: string;
  content: string;
  metaDescription?: string;
  excerpt?: string;
}

export default function WordPressPublishSection({
  title,
  content,
  metaDescription,
  excerpt
}: WordPressPublishSectionProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      const settings = getWordPressSettings(user.id);
      setIsConnected(!!settings?.isConnected);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Card className="mt-4 border hover:border-primary/10 transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Publish to WordPress</CardTitle>
        <CardDescription>
          Push this content to your WordPress site as a draft
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Your content will be published as a draft post to your WordPress site.
              You can edit and publish it from your WordPress dashboard.
            </p>
            <WordPressPublishButton
              title={title}
              content={content}
              metaDescription={metaDescription}
              excerpt={excerpt}
            />
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your WordPress site in Settings to enable publishing.
            </p>
            <Button 
              variant="outline" 
              asChild 
              className="flex items-center gap-2 w-fit"
            >
              <Link to="/settings">
                <Settings size={16} />
                Connect WordPress
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
