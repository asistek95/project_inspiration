export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      <strong className="text-foreground/80">Hinweis:</strong> Klarblick ersetzt keine Steuerberatung.
      Automatisch erkannte Daten müssen geprüft werden.
    </p>
  );
}
