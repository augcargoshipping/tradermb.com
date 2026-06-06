"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import GreetingBanner from "../components/GreetingBanner";
import {
  BarChart2,
  CheckCircle,
  ListOrdered,
  DollarSign,
  Share2,
  MessageCircle,
  Users,
  LogOut,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import OrderInvoiceModal from "../../components/invoice/order-invoice-modal";
import { openSupportWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const dynamic = "force-dynamic";

type DashboardOrder = {
  id?: number;
  fields: {
    Reference_Code: string;
    Submitted_At?: string;
    GHS_Amount: number | string;
    RMB_Amount: number | string;
    Status: string;
    Customer_Name?: string;
    Mobile_Number?: string;
    Referral_Name?: string;
  };
};

function orderStatusStyles(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
    case "Paid":
      return "bg-blue-50 text-blue-700 ring-blue-600/15";
    case "Cancelled":
      return "bg-red-50 text-red-700 ring-red-600/15";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/15";
  }
}

function formatOrderDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset sm:text-[11px]",
        orderStatusStyles(status),
      )}
    >
      {status}
    </span>
  );
}

function OrderAmounts({
  ghs,
  rmb,
  className,
}: {
  ghs: number | string;
  rmb: number | string;
  className?: string;
}) {
  return (
    <span className={cn("whitespace-nowrap tabular-nums text-xs text-slate-600", className)}>
      ₵{ghs}
      <span className="mx-1 text-slate-300">→</span>¥{rmb}
    </span>
  );
}

function OrderActions({
  onInvoice,
  onPayment,
  compact,
}: {
  onInvoice: () => void;
  onPayment: () => void;
  compact?: boolean;
}) {
  const btn =
    "font-medium text-emerald-700 transition hover:text-emerald-900 hover:underline underline-offset-2";
  const outline =
    "font-medium text-slate-600 transition hover:text-slate-900 hover:underline underline-offset-2";

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[11px]">
        <button type="button" className={outline} onClick={onInvoice}>
          Invoice
        </button>
        <button type="button" className={btn} onClick={onPayment}>
          Payment
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      <button type="button" className={outline} onClick={onInvoice}>
        Invoice
      </button>
      <span className="text-slate-200" aria-hidden>
        |
      </span>
      <button type="button" className={btn} onClick={onPayment}>
        Payment
      </button>
    </div>
  );
}

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
  
  // Calculate referral count - count orders where this user is the referrer
  const referralCount = orders.filter((o: any) => o.fields.Referral_Name === (session?.user?.name || "")).length;

  // Edit Account State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?referrer=${encodeURIComponent(session && session.user ? session.user.name : "")}`;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/orders", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
      return;
    }
    if (session?.user) {
      void loadOrders();
    }
  }, [session?.user, status, router, loadOrders]);

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
    openSupportWhatsApp({
      name: session?.user?.name || undefined,
      email: session?.user?.email || undefined,
      reason: `I'd like to refer a friend.\n\nReferral link: ${referralLink}`,
    });
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

  const openPaymentDetails = (order: DashboardOrder) => {
    const orderData = {
      fullName: order.fields.Customer_Name,
      mobileNumber: order.fields.Mobile_Number,
      referralName: order.fields.Referral_Name || "",
      ghsAmount: order.fields.GHS_Amount.toString(),
      rmbAmount: order.fields.RMB_Amount.toString(),
      referenceCode: order.fields.Reference_Code,
      submittedAt: order.fields.Submitted_At,
      status: order.fields.Status,
    };
    sessionStorage.setItem("submissionData", JSON.stringify(orderData));
    router.push("/confirmation");
  };

  const sessionReady = !!session?.user;
  const displayName = session?.user?.name || "";
  const displayEmail = session?.user?.email || "";

  const statCards = [
    { label: "Total GHS", value: `₵${totalGHS.toLocaleString()}`, icon: DollarSign, tone: "text-amber-600 bg-amber-50" },
    { label: "Total RMB", value: `¥${totalRMB.toLocaleString()}`, icon: BarChart2, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Orders", value: String(totalOrders), icon: ListOrdered, tone: "text-slate-600 bg-slate-100" },
    { label: "Completed", value: String(completedOrders), icon: CheckCircle, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Referrals", value: String(referralCount), icon: Users, tone: "text-orange-600 bg-orange-50" },
  ];

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      <SiteHeader onBuy={() => router.push("/purchase")} />

      <main className="container-tight section-pad flex-1 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
        {sessionReady ? (
          <GreetingBanner
            fullName={displayName}
            email={displayEmail}
            action={
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            }
          />
        ) : (
          <div className="mb-6 animate-pulse rounded-xl border border-slate-200 bg-white p-6">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-52 rounded bg-slate-100" />
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="mt-3 h-6 w-20 rounded bg-slate-200" />
              </div>
            ))
          ) : (
            statCards.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <span className={cn("rounded-lg p-1.5", tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {value}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/purchase" prefetch className="btn-primary justify-center text-sm sm:min-w-[160px]">
            Buy RMB
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => setShowEdit(true)}
          >
            <Settings className="h-4 w-4" />
            Account settings
          </button>
        </div>
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 sm:px-4">
            <h2 className="text-sm font-semibold text-slate-900">My Orders</h2>
            {!loading && orders.length > 0 && (
              <span className="text-xs text-slate-500">{orders.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 px-3 py-2.5 sm:px-4">
                  <div className="h-3.5 flex-1 max-w-[100px] rounded bg-slate-100" />
                  <div className="hidden h-3 w-16 rounded bg-slate-50 sm:block" />
                  <div className="h-3 w-20 rounded bg-slate-100" />
                  <div className="h-5 w-14 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No orders yet.{" "}
              <Link href="/purchase" className="font-medium text-emerald-700 hover:underline">
                Start a trade
              </Link>
            </p>
          ) : (
            <>
              {/* Mobile: dense rows */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {(orders as DashboardOrder[]).map((order) => (
                  <li
                    key={order.id ?? order.fields.Reference_Code}
                    className="px-3 py-2.5 active:bg-slate-50/80"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate font-mono text-xs font-semibold text-slate-900">
                        {order.fields.Reference_Code}
                      </p>
                      <OrderStatusBadge status={order.fields.Status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="text-[11px] text-slate-500">
                        {formatOrderDate(order.fields.Submitted_At)}
                      </p>
                      <OrderAmounts
                        ghs={order.fields.GHS_Amount}
                        rmb={order.fields.RMB_Amount}
                      />
                    </div>
                    <div className="mt-1.5">
                      <OrderActions
                        compact
                        onInvoice={() => setSelectedOrder(order)}
                        onPayment={() => openPaymentDetails(order)}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: tight table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2 pl-4">Reference</th>
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2">Amount</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-3 py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(orders as DashboardOrder[]).map((order) => (
                      <tr
                        key={order.id ?? order.fields.Reference_Code}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap py-2 pl-4 pr-2 font-mono text-xs font-medium text-slate-900">
                          {order.fields.Reference_Code}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-slate-500">
                          {formatOrderDate(order.fields.Submitted_At)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          <OrderAmounts
                            ghs={order.fields.GHS_Amount}
                            rmb={order.fields.RMB_Amount}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <OrderStatusBadge status={order.fields.Status} />
                        </td>
                        <td className="py-2 pr-4 pl-2">
                          <OrderActions
                            onInvoice={() => setSelectedOrder(order)}
                            onPayment={() => openPaymentDetails(order)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="mb-8 flex justify-center">
          <button
            type="button"
            onClick={handleRefer}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <Share2 className="h-4 w-4" />
            Refer a friend
          </button>
        </div>

        {showReferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <button
                type="button"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                onClick={() => setShowReferModal(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h3 className="pr-6 text-lg font-semibold text-slate-900">Share your referral link</h3>
              <p className="mt-1 text-sm text-slate-500">Invite friends to Trade RMB</p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={handleWhatsApp} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
                <button type="button" onClick={handleSMS} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  SMS
                </button>
                <button type="button" onClick={handleEmail} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Email
                </button>
                <button type="button" onClick={handleCopyLink} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Copy link
                </button>
              </div>
            </div>
          </div>
        )}
        <OrderInvoiceModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
        {/* Edit Account Modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Account settings</h3>
              <p className="mt-1 text-sm text-slate-500">Update your profile details</p>
              <form className="flex flex-col gap-4" onSubmit={async (e) => {
                e.preventDefault();
                setEditLoading(true);
                try {
                  const res = await fetch("/api/user/update-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
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
                <input type="text" placeholder="Name" className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5 text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                <input type="email" placeholder="Email" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                <div className="mt-2 flex gap-3">
                  <button type="button" className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setShowEdit(false)} disabled={editLoading}>Cancel</button>
                  <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700" disabled={editLoading}>{editLoading ? "Saving…" : "Save"}</button>
                </div>
              </form>
              <hr className="my-5 border-slate-100" />
              <button
                className="w-full rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                disabled={deleteLoading}
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
                  setDeleteLoading(true);
                  try {
                    const res = await fetch("/api/user/delete", { method: "POST", credentials: "include" });
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
      </main>

      <SiteFooter />
    </div>
  );
} 