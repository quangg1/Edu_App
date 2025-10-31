export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 p-4">
      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]"></div>
      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]"></div>
    </div>
  );
}
