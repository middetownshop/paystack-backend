import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function QuickSell() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bundles, setBundles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch bundles from backend (NOT firestore directly)
    fetch("/api/bundles")
      .then((r) => r.json())
      .then(setBundles);
  }, []);

  const buy = async () => {
    if (!selected || !phone) return;

    setLoading(true);

    try {
      const token = await user.getIdToken();

      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bundleId: selected.id,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Success ⚡",
        description: "Bundle sent successfully",
      });

      setSelected(null);
      setPhone("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err.message,
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Telecom SaaS</h2>

      <div>
        {bundles.map((b) => (
          <div key={b.id} style={{ border: "1px solid #ddd", margin: 10, padding: 10 }}>
            <h3>{b.network}</h3>
            <p>{b.size} - GHS {b.price}</p>

            <button onClick={() => setSelected(b)}>
              Buy
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ marginTop: 20 }}>
          <h3>Send to {selected.network}</h3>

          <input
            placeholder="024xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button disabled={loading} onClick={buy}>
            {loading ? "Processing..." : "Confirm Purchase"}
          </button>
        </div>
      )}
    </div>
  );
}