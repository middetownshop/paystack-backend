import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

/* ================= SAFE NUMBER ================= */

const num = (v: any) => Number(v || 0);

/* ================= EMPTY STATES ================= */

const EMPTY_BUNDLE = {
  network: "MTN",
  size: "",
  price: "",
  agentPrice: "",
  validity: "",
  active: true,
};

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  image: "",
  description: "",

  discountType: "none",
  discountValue: 0,

  flashSale: false,
  promoEnd: "",

  active: true,
};

/* ================= ADMIN PANEL ================= */

export default function AdminPanel() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [productForm, setProductForm] =
    useState(EMPTY_PRODUCT);

  const [bundleForm, setBundleForm] =
    useState(EMPTY_BUNDLE);

  const [editingProduct, setEditingProduct] =
    useState<string | null>(null);

  const [editingBundle, setEditingBundle] =
    useState<string | null>(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;

    const unsubBundles = onSnapshot(
      collection(db, "bundles"),
      (snap) => {
        setBundles(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    return () => {
      unsubBundles();
      unsubProducts();
      unsubUsers();
    };
  }, [profile]);

  /* ================= ACCESS ================= */

  if (!profile) return null;

  if (profile.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  /* ================= PRODUCT EDIT ================= */

  const startEditProduct = (p: any) => {
    setEditingProduct(p.id);

    setProductForm({
      name: p.name || "",
      price: p.price || "",
      image: p.image || "",
      description: p.description || "",

      discountType:
        p.discountType || "none",

      discountValue:
        p.discountValue || 0,

      flashSale:
        p.flashSale || false,

      promoEnd:
        p.promoEnd || "",

      active:
        p.active ?? true,
    });
  };

  /* ================= BUNDLE EDIT ================= */

  const startEditBundle = (b: any) => {
    setEditingBundle(b.id);

    setBundleForm({
      network:
        b.network || "MTN",

      size:
        b.size || "",

      price:
        b.price || "",

      agentPrice:
        b.agentPrice || "",

      validity:
        b.validity || "",

      active:
        b.active ?? true,
    });
  };

  /* ================= SAVE PRODUCT ================= */

  const saveProduct = async (e: any) => {
    e.preventDefault();

    try {
      const payload = {
        ...productForm,

        price: num(productForm.price),

        discountValue: num(
          productForm.discountValue
        ),

        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(
          doc(
            db,
            "products",
            editingProduct
          ),
          payload
        );

        toast({
          title: "Product updated",
        });
      } else {
        await addDoc(
          collection(db, "products"),
          {
            ...payload,
            createdAt: serverTimestamp(),
          }
        );

        toast({
          title: "Product created",
        });
      }

      setProductForm(EMPTY_PRODUCT);
      setEditingProduct(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ================= SAVE BUNDLE ================= */

  const saveBundle = async (e: any) => {
    e.preventDefault();

    try {
      const payload = {
        ...bundleForm,

        price: num(bundleForm.price),

        /* IMPORTANT */
        /* CUSTOM AGENT PRICE ONLY */
        agentPrice: bundleForm.agentPrice
          ? num(bundleForm.agentPrice)
          : null,

        updatedAt: serverTimestamp(),
      };

      if (editingBundle) {
        await updateDoc(
          doc(
            db,
            "bundles",
            editingBundle
          ),
          payload
        );

        toast({
          title: "Bundle updated",
        });
      } else {
        await addDoc(
          collection(db, "bundles"),
          {
            ...payload,
            createdAt: serverTimestamp(),
          }
        );

        toast({
          title: "Bundle created",
        });
      }

      setBundleForm(EMPTY_BUNDLE);
      setEditingBundle(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">
        🔥 Admin Panel
      </h1>

      <Tabs defaultValue="products">

        <TabsList>
          <TabsTrigger value="products">
            Products
          </TabsTrigger>

          <TabsTrigger value="bundles">
            Bundles
          </TabsTrigger>

          <TabsTrigger value="users">
            Users
          </TabsTrigger>
        </TabsList>

        {/* ================= PRODUCTS ================= */}

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProduct
                  ? "Edit Product"
                  : "Add Product"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={saveProduct}
                className="space-y-3"
              >
                <Input
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      name: e.target.value,
                    })
                  }
                />

                <Input
                  type="number"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      price: e.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Image URL"
                  value={productForm.image}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      image: e.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description:
                        e.target.value,
                    })
                  }
                />

                {/* DISCOUNT TYPE */}

                <Select
                  value={
                    productForm.discountType
                  }
                  onValueChange={(v) =>
                    setProductForm({
                      ...productForm,
                      discountType: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Discount Type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">
                      No Discount
                    </SelectItem>

                    <SelectItem value="percent">
                      Percent %
                    </SelectItem>

                    <SelectItem value="fixed">
                      Fixed Amount
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Discount Value"
                  value={
                    productForm.discountValue
                  }
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      discountValue:
                        Number(e.target.value),
                    })
                  }
                />

                <Input
                  type="datetime-local"
                  value={productForm.promoEnd}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      promoEnd:
                        e.target.value,
                    })
                  }
                />

                <Button
                  type="submit"
                  className="w-full"
                >
                  {editingProduct
                    ? "Update Product"
                    : "Save Product"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* PRODUCT LIST */}

          <div className="space-y-3 mt-5">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">
                        {p.name}
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        {p.description}
                      </p>

                      <div className="mt-2 space-y-1">
                        <p className="font-semibold">
                          GHS{" "}
                          {num(p.price).toFixed(2)}
                        </p>

                        {p.discountType !==
                          "none" && (
                          <p className="text-red-500 text-sm">
                            Discount:{" "}
                            {p.discountValue}
                            {p.discountType ===
                            "percent"
                              ? "%"
                              : " GHS"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          startEditProduct(p)
                        }
                      >
                        Edit
                      </Button>

                      {!p.active && (
                        <Badge variant="destructive">
                          Disabled
                        </Badge>
                      )}

                      {p.flashSale && (
                        <Badge>
                          🔥 Flash Sale
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ================= BUNDLES ================= */}

        <TabsContent value="bundles">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingBundle
                  ? "Edit Bundle"
                  : "Add Bundle"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={saveBundle}
                className="space-y-3"
              >
                <Select
                  value={bundleForm.network}
                  onValueChange={(v) =>
                    setBundleForm({
                      ...bundleForm,
                      network: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="MTN">
                      MTN
                    </SelectItem>

                    <SelectItem value="Telecel">
                      Telecel
                    </SelectItem>

                    <SelectItem value="AirtelTigo">
                      AirtelTigo
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Bundle Size"
                  value={bundleForm.size}
                  onChange={(e) =>
                    setBundleForm({
                      ...bundleForm,
                      size: e.target.value,
                    })
                  }
                />

                <Input
                  type="number"
                  placeholder="Normal Price"
                  value={bundleForm.price}
                  onChange={(e) =>
                    setBundleForm({
                      ...bundleForm,
                      price: e.target.value,
                    })
                  }
                />

                <Input
                  type="number"
                  placeholder="Custom Agent Price"
                  value={bundleForm.agentPrice}
                  onChange={(e) =>
                    setBundleForm({
                      ...bundleForm,
                      agentPrice:
                        e.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Validity"
                  value={bundleForm.validity}
                  onChange={(e) =>
                    setBundleForm({
                      ...bundleForm,
                      validity:
                        e.target.value,
                    })
                  }
                />

                <Button
                  type="submit"
                  className="w-full"
                >
                  {editingBundle
                    ? "Update Bundle"
                    : "Save Bundle"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* BUNDLE LIST */}

          <div className="space-y-3 mt-5">
            {bundles.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">
                        {b.network} {b.size}
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        {b.validity}
                      </p>

                      <div className="mt-2 space-y-1">
                        <p className="font-semibold">
                          User Price:
                          <span className="ml-2">
                            GHS{" "}
                            {num(
                              b.price
                            ).toFixed(2)}
                          </span>
                        </p>

                        <p className="font-semibold text-green-600">
                          Agent Price:
                          <span className="ml-2">
                            GHS{" "}
                            {num(
                              b.agentPrice ||
                                b.price
                            ).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          startEditBundle(b)
                        }
                      >
                        Edit
                      </Button>

                      {!b.active && (
                        <Badge variant="destructive">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ================= USERS ================= */}

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>
                Users ({users.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {u.name || "No name"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge>
                      {u.role}
                    </Badge>

                    <p className="text-sm mt-1">
                      GHS{" "}
                      {num(
                        u.walletBalance
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}