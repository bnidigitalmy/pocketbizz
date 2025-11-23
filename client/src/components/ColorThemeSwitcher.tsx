import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, X } from "lucide-react";

const themes = {
  terracotta: {
    name: "Terracotta (Current)",
    color: "hsl(38, 58%, 58%)",
    css: "--primary: 38 58% 58%;",
    description: "Warm & artisan bakery vibe",
  },
  blue: {
    name: "Trust Blue",
    color: "hsl(217, 91%, 60%)",
    css: "--primary: 217 91% 60%;",
    description: "Professional & trustworthy (SaaS standard)",
  },
  green: {
    name: "Growth Green",
    color: "hsl(142, 76%, 48%)",
    css: "--primary: 142 76% 48%;",
    description: "Fresh & prosperous business growth",
  },
  purple: {
    name: "Innovation Purple",
    color: "hsl(262, 83%, 58%)",
    css: "--primary: 262 83% 58%;",
    description: "Premium & tech-forward modern",
  },
  orange: {
    name: "Energy Orange",
    color: "hsl(25, 95%, 58%)",
    css: "--primary: 25 95% 58%;",
    description: "Bold & action-oriented (HubSpot style)",
  },
};

export default function ColorThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>("terracotta");

  const applyTheme = (themeKey: keyof typeof themes) => {
    const theme = themes[themeKey];
    // Apply to root CSS variable
    document.documentElement.style.setProperty(
      "--primary",
      theme.css.replace("--primary: ", "").replace(";", "")
    );
    setCurrentTheme(themeKey);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          title="Test Color Themes"
        >
          <Palette className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-2xl border-2">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm">Theme Preview</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Click to preview different color themes. Changes are temporary - refresh to reset.
          </p>

          <div className="space-y-2">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => applyTheme(key as keyof typeof themes)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                  currentTheme === key
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {theme.name}
                      {currentTheme === key && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {theme.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Scroll page to see theme applied everywhere
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
