"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import GreetingBanner from "../components/GreetingBanner";
import { BarChart2, CheckCircle, ListOrdered, DollarSign, Share2, MessageCircle } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "../../hooks/use-toast";
import { Dialog } from "../../components/ui/dialog";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();
  const { toast } = useToast ? useToast() : { toast: () => {} };
  const [showReferModal, setShowReferModal] = useState(false);

  // Analytics
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o: any) => o.fields.Status === "Completed").length;
  const totalGHS = orders.reduce((sum: number, o: any) => sum + (Number(o.fields.GHS_Amount) || 0), 0);
  const totalRMB = orders.reduce((sum: number, o: any) => sum + (Number(o.fields.RMB_Amount) || 0), 0);

  // Edit Account State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?referrer=${encodeURIComponent(session.user.name)}`;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
    if (session?.user?.email) {
      fetch(`/api/user/orders?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data.orders || []);
          setLoading(false);
        });
    }
  }, [session, status]);

  useEffect(() => {
    if (session && session.user) {
      setEditName(session.user.name || "");
      setEditEmail(session.user.email || "");
    }
  }, [session]);

  const handleSignOut = async () => {
    router.replace("/"); // Instantly redirect
    await signOut({ redirect: false }); // Clear session in background
  };

  const handleRefer = () => {
    setShowReferModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast && toast({ title: "Referral link copied!", description: "Share it with your friends." });
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleSMS = () => {
    const message = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
    window.open(`sms:?&body=${message}`);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Join me on TRADE RMB!");
    const body = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-purple-600">Loading...</div>;
  }

  if (!session || !session.user) {
    // Optionally, redirect or show nothing (shouldn't happen due to your redirect logic)
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-400 to-purple-600 py-8 px-2 sm:px-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-3xl flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TRADE RMB Logo" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-extrabold text-white tracking-tight">TRADE RMB</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold shadow transition-transform">Return to Home</button>
          <button onClick={handleSignOut} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-500 text-white font-bold shadow hover:scale-105 transition-transform">Sign Out</button>
        </div>
      </header>
      <div className="w-full max-w-3xl flex-1">
        <GreetingBanner fullName={session.user.name} />
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow p-4">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-lg font-bold text-gray-900">₵{totalGHS.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Amount (GHS)</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow p-4">
            <BarChart2 className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-lg font-bold text-gray-900">¥{totalRMB.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Amount (RMB)</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow p-4">
            <ListOrdered className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-lg font-bold text-gray-900">{totalOrders}</div>
              <div className="text-xs text-gray-500">Total Orders</div>
                </div>
              </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow p-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-lg font-bold text-gray-900">{completedOrders}</div>
              <div className="text-xs text-gray-500">Completed Orders</div>
            </div>
          </div>
        </div>
        {/* Buy RMB & Edit Account Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            className="bg-yellow-300 hover:bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl shadow transition-all text-lg"
            onClick={() => router.push("/purchase")}
          >
            Buy RMB
          </button>
          <button
            className="bg-white border border-gray-200 text-gray-900 font-bold px-8 py-3 rounded-xl shadow transition-all text-lg hover:bg-gray-50"
            onClick={() => setShowEdit(true)}
          >
            Edit Account
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">My Orders</h2>
          {loading ? (
            <div>Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="text-gray-700 border-b">
                    <th className="px-4 py-2 text-left">Order Ref</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Amount (GHS)</th>
                    <th className="px-4 py-2 text-left">Amount (RMB)</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4">No orders found.</td></tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.fields.Reference_Code} className="border-b hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-2 font-mono">{order.fields.Reference_Code}</td>
                        <td className="px-4 py-2">{order.fields.Submitted_At ? new Date(order.fields.Submitted_At).toLocaleDateString() : ""}</td>
                        <td className="px-4 py-2">₵{order.fields.GHS_Amount}</td>
                        <td className="px-4 py-2">¥{order.fields.RMB_Amount}</td>
                        <td className="px-4 py-2 font-bold">
                          {order.fields.Status === 'Completed' ? (
                            <span className="text-green-600">Completed</span>
                          ) : (
                            <span className="text-yellow-600">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl shadow transition-all"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
      </div>
          )}
                </div>
        {/* Refer a Friend & WhatsApp Buttons (moved below main content) */}
        <div className="flex gap-4 mb-8 justify-center">
          <button onClick={handleRefer} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-500 text-white font-semibold shadow hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5" /> Refer a Friend
          </button>
                </div>
        {/* Refer a Friend Modal */}
        {showReferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-blue-200 relative flex flex-col items-center">
              <h3 className="text-xl font-bold mb-4 text-blue-800">Share Your Referral Link</h3>
              <div className="flex flex-col gap-3 w-full">
                <button onClick={handleWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" /> WhatsApp</button>
                <button onClick={handleSMS} className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-4.5M21 10.5l-9 6.5-9-6.5"/></svg> SMS</button>
                <button onClick={handleEmail} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-xl flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm8 0a8 8 0 11-16 0 8 8 0 0116 0z"/></svg> Email</button>
                <button onClick={handleCopyLink} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 rounded-xl flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h6v6H9z"/></svg> Copy Link</button>
              </div>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowReferModal(false)}>&times;</button>
                </div>
                </div>
        )}
        {/* Invoice Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div id="invoice-modal" className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-200 relative">
              <div className="flex flex-col items-center mb-4">
                <img src="/logo.png" alt="TRADE RMB Logo" className="w-16 h-16 object-contain mb-2" />
                <span className="text-2xl font-extrabold text-blue-700 tracking-tight mb-2">TRADE RMB</span>
              </div>
              <h3 className="text-2xl font-extrabold mb-6 text-blue-800 text-center tracking-tight">Order Invoice</h3>
              <div className="mb-6 flex flex-col gap-2 text-base text-gray-800">
                <div className="flex justify-between"><span className="font-semibold">Order Ref:</span> <span className="font-mono">{selectedOrder.fields.Reference_Code}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Date:</span> {selectedOrder.fields.Submitted_At ? new Date(selectedOrder.fields.Submitted_At).toLocaleDateString() : ""}</div>
                <div className="flex justify-between"><span className="font-semibold">Status:</span> <span className={selectedOrder.fields.Status === 'Completed' ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>{selectedOrder.fields.Status}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Customer:</span> <span>{selectedOrder.fields.Customer_Name}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Mobile Number:</span> <span>{selectedOrder.fields.Mobile_Number}</span></div>
                {selectedOrder.fields.Referral_Name && (
                  <div className="flex justify-between"><span className="font-semibold">Referred By:</span> <span>{selectedOrder.fields.Referral_Name}</span></div>
                )}
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between"><span className="font-semibold">Amount (GHS):</span> <span className="font-bold text-red-600">₵{selectedOrder.fields.GHS_Amount}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Amount (RMB):</span> <span className="font-bold text-blue-600">¥{selectedOrder.fields.RMB_Amount}</span></div>
                {selectedOrder.fields.Rate && (
                  <div className="flex justify-between"><span className="font-semibold">Rate:</span> <span>{selectedOrder.fields.Rate}</span></div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold" onClick={() => setSelectedOrder(null)}>Close</button>
                <button className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl font-bold" onClick={async () => {
                  const invoice = document.getElementById('invoice-modal');
                  if (invoice) {
                    const canvas = await html2canvas(invoice, { backgroundColor: '#fff', scale: 2 });
                    const link = document.createElement('a');
                    link.download = `invoice-${selectedOrder.fields.Reference_Code}.jpeg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.95);
                    link.click();
                  }
                }}>Download as JPEG</button>
              </div>
                  </div>
                  </div>
                )}
        {/* Edit Account Modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-200">
              <h3 className="text-lg font-bold mb-4 text-blue-800">Edit Account</h3>
              <form className="flex flex-col gap-4" onSubmit={async (e) => {
                e.preventDefault();
                setEditLoading(true);
                try {
                  const res = await fetch("/api/user/update-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: editName, email: editEmail }),
                  });
                  if (res.ok) {
                    toast && toast({ title: "Profile updated!", description: "Your account details have been updated." });
                    setShowEdit(false);
                    // Optionally, refresh session or page
                    router.refresh && router.refresh();
                  } else {
                    toast && toast({ title: "Update failed", description: "Could not update your profile.", variant: "destructive" });
                  }
                } catch {
                  toast && toast({ title: "Update failed", description: "Could not update your profile.", variant: "destructive" });
                }
                setEditLoading(false);
              }}>
                <input type="text" placeholder="Name" className="border rounded px-3 py-2" value={editName} onChange={e => setEditName(e.target.value)} />
                <input type="email" placeholder="Email" className="border rounded px-3 py-2" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                <div className="flex gap-4 mt-2">
                  <button type="button" className="flex-1 bg-white border border-gray-300 text-gray-800 font-bold py-2 rounded-xl hover:bg-gray-50" onClick={() => setShowEdit(false)} disabled={editLoading}>Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl" disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</button>
                </div>
              </form>
              <hr className="my-4" />
              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl mt-2"
                disabled={deleteLoading}
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
                  setDeleteLoading(true);
                  try {
                    const res = await fetch("/api/user/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: session.user.email }) });
                    if (res.ok) {
                      toast && toast({ title: "Account deleted", description: "Your account has been deleted." });
                      setShowEdit(false);
                      await signOut({ callbackUrl: "/" });
                    } else {
                      toast && toast({ title: "Delete failed", description: "Could not delete your account.", variant: "destructive" });
                    }
                  } catch {
                    toast && toast({ title: "Delete failed", description: "Could not delete your account.", variant: "destructive" });
                  }
                  setDeleteLoading(false);
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        )}
                </div>
      {/* Footer */}
      <footer className="w-full max-w-3xl mt-12 py-6 text-center text-sm text-gray-200 border-t border-white/20">
        &copy; {new Date().getFullYear()} TRADE RMB. All rights reserved.
      </footer>
    </div>
  );
} 