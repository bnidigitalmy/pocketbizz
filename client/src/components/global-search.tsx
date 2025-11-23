import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Search, 
  Store, 
  Package, 
  DollarSign, 
  Truck,
  Clock
} from "lucide-react";
import { PocketBizzIcon } from "@/components/pocketbizz-logo";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  icon: string;
}

const iconMap: Record<string, any> = {
  Product: PocketBizzIcon,
  Store,
  Package,
  DollarSign,
  Truck,
};

const typeColors: Record<string, string> = {
  product: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  vendor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  stock: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  sale: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  delivery: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const typeLabels: Record<string, string> = {
  product: "Produk",
  vendor: "Vendor",
  stock: "Stok",
  sale: "Jualan",
  delivery: "Hantar",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search API call (only when query length >= 2)
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return { results: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const results = searchData?.results || [];

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    navigate(result.url);
    setOpen(false);
    setSearchQuery("");
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      {/* Search Button - visible on mobile and desktop */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover-elevate active-elevate-2 rounded-md border bg-background"
        data-testid="button-global-search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Cari...</span>
        <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100">
          <span className="text-xs">⌘K</span>
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Cari produk, vendor, stok, jualan..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
          data-testid="input-global-search"
        />
        <CommandList>
          {searchQuery.length < 2 && recentSearches.length > 0 && (
            <CommandGroup heading="Carian Terkini">
              {recentSearches.map((query, idx) => (
                <CommandItem
                  key={idx}
                  onSelect={() => handleRecentSearch(query)}
                  data-testid={`recent-search-${idx}`}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{query}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchQuery.length >= 2 && (
            <>
              {isLoading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
                </div>
              )}

              {!isLoading && results.length === 0 && (
                <CommandEmpty data-testid="search-no-results">
                  Tiada hasil untuk "{searchQuery}"
                </CommandEmpty>
              )}

              {!isLoading && results.length > 0 && (
                <CommandGroup heading={`${results.length} Hasil Ditemui`}>
                  {results.map((result: SearchResult) => {
                    const Icon = iconMap[result.icon] || Package;
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        data-testid={`search-result-${result.type}-${result.id}`}
                      >
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title}</span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${typeColors[result.type]}`}
                            >
                              {typeLabels[result.type]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {result.subtitle}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
