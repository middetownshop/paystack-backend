import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Search,
  ShoppingCart,
  Star,
  Clock,
  Package,
  Heart,
} from "lucide-react";

function getFinalPrice(product: any) {
  const price = Number(product.price || 0);

  if (!product.discountType || product.discountType === "none")
    return price;

  if (product.discountType === "percent") {
    return price - (price * Number(product.discountValue || 0)) / 100;
  }

  if (product.discountType === "fixed") {
    return Math.max(0, price - Number(product.discountValue || 0));
  }

  return price;
}

function getTimeLeft(end: any) {
  if (!end) return null;

  let endTime: any;

  if (typeof end?.toDate === "function") {
    endTime = end.toDate().getTime();
  } else {
    endTime = new Date(end).getTime();
  }

  const diff = endTime - Date.now();

  if (diff <= 0) return "Expired";

  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  return `${hrs}h ${mins}m ${secs}s`;
}

export default function ShopProducts() {
  const { profile } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("active", "==", true)
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setProducts(data);
    });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const toggleSold = async (product: any) => {
    await updateDoc(doc(db, "products", product.id), {
      sold: !product.sold,
    });
  };

  const addToCart = async (product: any) => {
    console.log("cart", product);
  };

  const buyNow = async (product: any) => {
    console.log("checkout", product);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* HEADER */}

      <div className="bg-[#ff6a00] text-white">

        <div className="max-w-7xl mx-auto p-4">

          <div className="flex flex-col lg:flex-row gap-4 items-center">

            <h1 className="text-3xl font-bold">
              Alibaba Mini
            </h1>

            <div className="flex-1 relative w-full">

              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />

              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white text-black"
              />
            </div>

            <Button
              variant="secondary"
              className="bg-white text-[#ff6a00]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
            </Button>

          </div>
        </div>
      </div>

      {/* FLASH SALE */}

      <div className="bg-red-600 text-white py-2">

        <div className="max-w-7xl mx-auto flex items-center gap-2 px-4">

          <Clock className="w-4 h-4" />

          <span className="font-semibold">
            Flash Sale • Best Discounts Today
          </span>

        </div>

      </div>

      {/* CATEGORIES */}

      <div className="max-w-7xl mx-auto px-4 py-4">

        <div className="flex gap-3 overflow-x-auto">

          {[
            "All",
            "Phones",
            "Electronics",
            "Fashion",
            "Computers",
            "Gaming",
            "Accessories",
          ].map((cat) => (
            <Button
              key={cat}
              variant="outline"
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}

        </div>

      </div>

      {/* PRODUCTS */}

      <div className="max-w-7xl mx-auto p-4">

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

          {filtered.map((product) => {
            const finalPrice = getFinalPrice(product);

            const hasDiscount =
              finalPrice < Number(product.price);

            const countdown = getTimeLeft(product.promoEnd);

            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-xl transition bg-white"
              >
                <div className="relative">

                  <img
                    src={product.image}
                    className="w-full h-52 object-cover"
                  />

                  <button className="absolute top-2 right-2 bg-white rounded-full p-2 shadow">
                    <Heart className="w-4 h-4" />
                  </button>

                  {hasDiscount && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      -
                      {product.discountType === "percent"
                        ? `${product.discountValue}%`
                        : `GHS ${product.discountValue}`}
                    </Badge>
                  )}

                </div>

                <CardContent className="p-3">

                  <h3 className="font-semibold line-clamp-2 min-h-[50px]">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 mt-1">

                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />

                    <span className="text-sm">
                      {product.rating || 4.5}
                    </span>

                  </div>

                  <div className="mt-2">

                    {hasDiscount && (
                      <div className="text-xs text-gray-400 line-through">
                        GHS {product.price}
                      </div>
                    )}

                    <div className="text-xl font-bold text-[#ff6a00]">
                      GHS {finalPrice}
                    </div>

                  </div>

                  {countdown && (
                    <div className="text-xs text-red-600 mt-1">
                      Ends in {countdown}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">

                    <Package className="w-3 h-3" />

                    {product.stock || 0} in stock

                  </div>

                  <div className="mt-3 space-y-2">

                    <Button
                      className="w-full bg-[#ff6a00] hover:bg-[#e85f00]"
                      onClick={() => buyNow(product)}
                    >
                      Buy Now
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addToCart(product)}
                    >
                      Add To Cart
                    </Button>

                    {profile?.role === "admin" && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => toggleSold(product)}
                      >
                        {product.sold
                          ? "Mark Available"
                          : "Mark Sold"}
                      </Button>
                    )}

                  </div>

                </CardContent>

              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}