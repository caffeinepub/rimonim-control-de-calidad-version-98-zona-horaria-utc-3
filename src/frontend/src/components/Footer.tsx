import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-6">
      <div className="container text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          © 2025. Built with <Heart className="h-4 w-4 fill-pomegranate text-pomegranate" /> using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
