import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Search, 
  MapPin, 
  Clock, 
  Phone,
  Instagram,
  Facebook,
  Truck,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  sellingPrice: string;
  costPerUnit: string;
  unitsPerBatch: number;
}

interface StoreInfo {
  slug: string;
  businessName: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  whatsappNumber: string;
  instagramHandle?: string;
  facebookUrl?: string;
  businessHours?: string;
  address?: string;
  deliveryInfo?: string;
  pickupInfo?: string;
  theme: string;
  accentColor: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PublicStore() {
  const [, params] = useRoute("/store/:slug");
  const slug = params?.slug;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Generate visitor ID for analytics
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem('visitor_id');
    if (stored) return stored;
    const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', newId);
    return newId;
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/public/store/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/public/store/${slug}`, {
        headers: {
          'X-Visitor-Id': visitorId,
        },
      });
      if (!response.ok) {
        throw new Error('Store not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const store: StoreInfo = data?.store;
  const products: Product[] = data?.products || [];
  const categories: Category[] = data?.categories || [];

  // Track product click
  const trackEvent = async (eventType: string, productId?: string) => {
    try {
      await fetch(`/api/public/store/${slug}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': visitorId,
        },
        body: JSON.stringify({ eventType, productId }),
      });
    } catch (err) {
      // Silent fail - analytics shouldn't break user experience
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    trackEvent('add_to_cart', product.id);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => {
      return sum + (parseFloat(item.product.sellingPrice) * item.quantity);
    }, 0);
  };

  const sendWhatsAppOrder = () => {
    if (!store?.whatsappNumber || cart.length === 0) return;

    trackEvent('whatsapp_click');

    // Build order message
    let message = `Halo ${store.businessName}! Saya nak order:\n\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   Kuantiti: ${item.quantity}\n`;
      message += `   Harga: RM ${parseFloat(item.product.sellingPrice).toFixed(2)}\n`;
      message += `   Subtotal: RM ${(parseFloat(item.product.sellingPrice) * item.quantity).toFixed(2)}\n\n`;
    });

    message += `*Jumlah: RM ${getTotalAmount().toFixed(2)}*\n\n`;
    message += `Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${store.whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">The store you're looking for doesn't exist or is currently inactive.</p>
        </div>
      </div>
    );
  }

  const accentColor = store.accentColor || '#f97316';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {store.logoUrl && (
                <img
                  src={store.logoUrl}
                  alt={store.businessName}
                  className="h-12 w-12 object-contain rounded-full"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store.businessName}</h1>
                {store.description && (
                  <p className="text-sm text-gray-600">{store.description}</p>
                )}
              </div>
            </div>
            
            {/* Cart Badge */}
            {cart.length > 0 && (
              <Button
                onClick={() => setShowCart(!showCart)}
                className="relative"
                style={{ backgroundColor: accentColor }}
              >
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {cart.length}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {store.coverImageUrl && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img
            src={store.coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Business Info */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {store.businessHours && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4" style={{ color: accentColor }} />
                <span>{store.businessHours}</span>
              </div>
            )}
            {store.address && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                <span>{store.address}</span>
              </div>
            )}
            {store.whatsappNumber && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4" style={{ color: accentColor }} />
                <span>{store.whatsappNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              {store.instagramHandle && (
                <a
                  href={`https://instagram.com/${store.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70"
                >
                  <Instagram className="h-5 w-5" style={{ color: accentColor }} />
                </a>
              )}
              {store.facebookUrl && (
                <a
                  href={store.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70"
                >
                  <Facebook className="h-5 w-5" style={{ color: accentColor }} />
                </a>
              )}
            </div>
          </div>

          {/* Delivery & Pickup Info */}
          {(store.deliveryInfo || store.pickupInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              {store.deliveryInfo && (
                <div className="flex gap-2">
                  <Truck className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="font-semibold text-sm">Delivery</p>
                    <p className="text-sm text-gray-600">{store.deliveryInfo}</p>
                  </div>
                </div>
              )}
              {store.pickupInfo && (
                <div className="flex gap-2">
                  <Package className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="font-semibold text-sm">Pickup</p>
                    <p className="text-sm text-gray-600">{store.pickupInfo}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                style={selectedCategory === null ? { backgroundColor: accentColor } : {}}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  style={selectedCategory === category.name ? { backgroundColor: accentColor } : {}}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-20">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onClick={() => trackEvent('product_click', product.id)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-16 w-16" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-white text-gray-900">
                  {product.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: accentColor }}>
                      RM {parseFloat(product.sellingPrice).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product)}
                    style={{ backgroundColor: accentColor }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        )}
      </div>

      {/* Shopping Cart Sidebar */}
      {showCart && cart.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Order</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 pb-4 border-b">
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm" style={{ color: accentColor }}>
                      RM {parseFloat(item.product.sellingPrice).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-auto text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                  RM {getTotalAmount().toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={sendWhatsAppOrder}
                style={{ backgroundColor: accentColor }}
              >
                <MessageCircle className="h-5 w-5" />
                Order via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button (when cart is empty) */}
      {cart.length === 0 && (
        <Button
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
          style={{ backgroundColor: accentColor }}
          onClick={() => {
            trackEvent('whatsapp_click');
            window.open(`https://wa.me/${store.whatsappNumber}`, '_blank');
          }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
