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

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { MessageCircle, Star, Clock, Search } from "lucide-react";

/* ================= PRICE ================= */

function getFinalPrice(product: any) {
  const price = Number(product.price || 0);

  if (!product.discountType || product.discountType === "none") return price;

  if (product.discountType === "percent") {
    return price - (price * Number(product.discountValue || 0)) / 100;
  }

  if (product.discountType === "fixed") {
    return Math.max(0, price - Number(product.discountValue || 0));
  }

  return price;
}

/* ================= COUNTDOWN ================= */

function getTimeLeft(end: any) {
  if (!end) return null;

  let endTime: any;

  if (typeof end?.toDate === "function") {
    endTime = end.toDate().getTime();
  } else {
    endTime = new Date(end).getTime();
  }

  const diff = endTime - Date.now();

  if (isNaN(diff)) return null;
  if (diff <= 0) return "Expired";

  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  return `${hrs}h ${mins}m ${secs}s`;
}

/* ================= FORMAT MONEY (FIXED ONLY) ================= */
function formatMoney(value: any) {
  const num = Number(value || 0);
  return num.toLocaleString("en-US");
}

/* ================= MAIN ================= */

export default function ShopProducts() {
  const { profile } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "products"), where("active", "==", true));

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      data.sort((a: any, b: any) => {
        const aTime =
          a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime =
          b.createdAt?.toDate?.() || new Date(b.createdAt || 0);

        return bTime - aTime;
      });

      setProducts(data);
    });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const markOrder = async (product: any) => {
    await updateDoc(doc(db, "products", product.id), {
      sold: !product.sold,
    });
  };

  return (
    <div className="space-y-6">

      {/* ================= SMALL BANNER ================= */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-4 shadow">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>
            <h2 className="text-xl font-bold">Marketplace</h2>
            <p className="text-xs opacity-80">
              Find products, deals & flash sales
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-70" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/90 text-foreground"
            />
          </div>

        </div>
      </div>

      {/* ================= PRODUCTS ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {filtered.map((product) => {
          const finalPrice = getFinalPrice(product);
          const hasDiscount = finalPrice < product.price;
          const whatsapp = product.whatsapp || "233000000000";
          const countdown = getTimeLeft(product.promoEnd);

          return (
            <Card
              key={product.id}
              className="relative overflow-hidden rounded-xl border hover:shadow-xl transition"
            >

              <div className="relative w-full h-62">
                <img
                  src={product.image}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-2 left-2">
                  <Badge className={product.sold ? "bg-gray-700" : "bg-green-500"}>
                    {product.sold ? "Sold" : "Available"}
                  </Badge>
                </div>

                {hasDiscount && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-500 text-white">
                      -{formatMoney(product.discountValue)}
                      {product.discountType === "percent" ? "%" : " GHS"}
                    </Badge>
                  </div>
                )}

                {countdown && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {countdown}
                  </div>
                )}
              </div>

              <CardContent className="space-y-1 pt-2 pb-2">
                <h3 className="font-bold text-lg line-clamp-1">
                  {product.name}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  {product.rating || 4.5}
                </div>

                <div>
                  {hasDiscount && (
                    <p className="text-xs line-through text-muted-foreground">
                      GHS {formatMoney(product.price)}
                    </p>
                  )}

                  <p className="text-xl font-bold text-green-600">
                    GHS {formatMoney(finalPrice)}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">

                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  className="w-full"
                >
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Seller
                  </Button>
                </a>

                {profile?.role === "admin" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => markOrder(product)}
                  >
                    Mark as {product.sold ? "Available" : "Sold"}
                  </Button>
                )}

              </CardFooter>

            </Card>
          );
        })}
      </div>
    </div>
  );
}